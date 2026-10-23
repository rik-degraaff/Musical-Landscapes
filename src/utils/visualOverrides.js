import { boundedFormula, interpolateGeometry, validateResponsiveLayout } from './responsiveVisuals.js';

export const VISUAL_ATTRIBUTES = ['d', 'points', 'viewBox', 'transform', 'fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'stop-color', 'stop-opacity', 'offset', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height'];
export const VISUAL_STYLES = ['left', 'top', 'right', 'bottom', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'translate', 'scale', 'rotate', 'transform', 'transform-origin', 'transform-box', 'opacity', 'fill', 'stroke', 'color', 'background-color', 'animation-duration', 'animation-delay', 'animation-timing-function', 'animation-iteration-count', 'z-index', '--object-x', '--object-base', '--object-center', '--object-size', '--object-height'];

const instrumentPosition = new Set(['left', 'top', 'right', 'bottom', 'translate', 'transform']);
const paintedSources = new WeakMap();
export const visualSource = node => paintedSources.get(node) ?? node;

export function validateVisualOverrides(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.rules) || value.rules.length > 1500) throw new Error('Invalid visual override document.');
  const seen = new Set();
  for (const rule of value.rules) {
    if (!rule || typeof rule.selector !== 'string' || rule.selector.length > 1800 || !/^[.#][a-zA-Z]/.test(rule.selector) || /[{},;\\@]|:has\(|:not\(/.test(rule.selector) || seen.has(rule.selector)) throw new Error('Invalid or duplicate visual selector.');
    seen.add(rule.selector);
    if (rule.layout !== undefined) validateResponsiveLayout(rule.layout);
    if (rule.layer !== undefined && (!Number.isInteger(rule.layer) || Math.abs(rule.layer) > 10000)) throw new Error('Invalid visual layer.');
    if (rule.maxWidth !== undefined && (!Number.isFinite(rule.maxWidth) || rule.maxWidth < 240 || rule.maxWidth > 4000)) throw new Error('Invalid responsive breakpoint.');
    for (const [kind, allowed] of [['attributes', VISUAL_ATTRIBUTES], ['styles', VISUAL_STYLES]]) {
      if (!rule[kind] || typeof rule[kind] !== 'object' || Array.isArray(rule[kind])) throw new Error(`Missing ${kind}.`);
      for (const [key, text] of Object.entries(rule[kind])) {
        if (!allowed.includes(key) || typeof text !== 'string' || text.length > 24000 || /[<>;{}]|url\s*\(|expression\s*\(|@import/i.test(text)) throw new Error(`Invalid visual property: ${key}.`);
      }
    }
  }
  return value;
}

export function visualOverrideCSS(value, { preview = false } = {}) {
  return value.rules.map(rule => {
    const instrument = /^#instrument-[\w-]+$/.test(rule.selector);
    const styles = { ...rule.styles };
    if (rule.layout?.kind === 'box') {
      for (const key of ['left', 'top', 'bottom', 'right', 'translate', 'transform', 'width', 'height', '--object-size', '--object-height']) delete styles[key];
      styles.width = boundedFormula(rule.layout.min.width, rule.layout.max.width);
      styles.height = boundedFormula(rule.layout.min.height, rule.layout.max.height, 'height');
    }
    if (rule.layer !== undefined && (!rule.selector.includes('landscape-art') || /\.landscape-art(?:\.landscape-(?:background|foreground))?$/.test(rule.selector))) styles['z-index'] = String(rule.layer);
    const declarations = Object.entries(styles).filter(([key]) => preview || !instrument || !instrumentPosition.has(key)).map(([key, text]) => `${key}:${text} !important`).join(';');
    const css = `${rule.selector}{${declarations}}`;
    return rule.maxWidth === undefined ? css : `@media(max-width:${rule.maxWidth}px){${css}}`;
  }).join('\n');
}

export function installVisualOverrides(document, initial, { preview = false } = {}) {
  let value = initial;
  let originals = [];
  let styled = [];
  let layers = [];
  const placedInstruments = new WeakSet();
  let observer;
  const style = document.createElement('style');
  style.dataset.visualOverrides = '';
  const observe = () => observer?.observe(document.getElementById('root'), { subtree: true, childList: true, attributes: true, attributeFilter: VISUAL_ATTRIBUTES });
  const rememberStyle = (node, key, text) => {
    if (!styled.some(entry => entry.node === node && entry.key === key)) styled.push({ node, key, text: node.style.getPropertyValue(key), priority: node.style.getPropertyPriority(key) });
    node.style.setProperty(key, text, 'important');
  };
  const clearGeometry = () => {
    for (const { node, key, text, priority } of styled) {
      if (text) node.style.setProperty(key, text, priority);
      else node.style.removeProperty(key);
    }
    styled = [];
    layers.forEach(node => node.remove()); layers = [];
  };
  const apply = () => {
    observer?.disconnect();
    clearGeometry();
    const paintLayers = [];
    for (const rule of value.rules) {
      if (rule.maxWidth !== undefined && document.defaultView.innerWidth > rule.maxWidth) continue;
      for (const node of document.querySelectorAll(rule.selector)) {
        if (node.closest('[data-visual-layer]')) continue;
        for (const [key, text] of Object.entries(rule.attributes)) {
          if (node.getAttribute(key) === text) continue;
          const original = originals.find(entry => entry.node === node && entry.key === key);
          if (original) original.text = node.getAttribute(key);
          else originals.push({ node, key, text: node.getAttribute(key) });
          node.setAttribute(key, text);
        }
        const instrument = node.classList.contains('instrument');
        const world = node.closest('.landscape-world')?.getBoundingClientRect();
        if (rule.layout && world && (!instrument || preview || !placedInstruments.has(node))) {
          const geometry = interpolateGeometry(rule.layout, { width: world.width, height: world.height });
          if (rule.layout.kind === 'box') {
            if (instrument && !preview) {
              node.style.left = `${geometry.x}%`; node.style.top = `${geometry.y}%`;
              placedInstruments.add(node);
            } else {
              rememberStyle(node, 'left', `${geometry.x}%`); rememberStyle(node, 'top', `${geometry.y}%`);
              rememberStyle(node, 'right', 'auto'); rememberStyle(node, 'bottom', 'auto');
              rememberStyle(node, 'transform', 'translate(-50%, -50%)');
            }
          } else {
            const bounds = node.getBoundingClientRect();
            const matrix = node.parentElement.getScreenCTM?.();
            if (matrix && bounds.width && bounds.height) {
              const previous = getComputedStyle(node).translate.split(' ').map(parseFloat);
              const textScale = getComputedStyle(node).scale;
              const baseScale = textScale === 'none' ? [1, 1] : textScale.split(' ').map(Number);
              rememberStyle(node, 'transform-box', 'fill-box'); rememberStyle(node, 'transform-origin', 'center');
              rememberStyle(node, 'scale', `${baseScale[0] * geometry.width / bounds.width} ${(baseScale[1] ?? baseScale[0]) * geometry.height / bounds.height}`);
              const scaled = node.getBoundingClientRect();
              const delta = new DOMPoint(world.left + world.width * geometry.x / 100 - scaled.left - scaled.width / 2, world.top + world.height * geometry.y / 100 - scaled.top - scaled.height / 2);
              const origin = new DOMPoint(0, 0).matrixTransform(matrix.inverse());
              const point = delta.matrixTransform(matrix.inverse());
              rememberStyle(node, 'translate', `${(previous[0] || 0) + point.x - origin.x}px ${(previous[1] || 0) + point.y - origin.y}px`);
            }
          }
        } else if (instrument && !preview && !placedInstruments.has(node) && (rule.styles.left || rule.styles.top)) {
          if (rule.styles.left) node.style.left = rule.styles.left;
          if (rule.styles.top) node.style.top = rule.styles.top;
          placedInstruments.add(node);
        }
        if (rule.layer !== undefined && node.ownerSVGElement?.classList.contains('landscape-art')) {
          paintLayers.push({ node, rule });
        }
      }
    }
    for (const { node, rule } of paintLayers) {
          const svg = node.ownerSVGElement;
          const clone = svg.cloneNode(false);
          clone.dataset.visualLayer = rule.selector;
          clone.style.setProperty('z-index', String(rule.layer), 'important');
          clone.style.pointerEvents = preview ? 'auto' : 'none';
          const definitions = svg.querySelector('defs');
          if (definitions) clone.append(definitions.cloneNode(true));
          let branch = node.cloneNode(true);
          const sourceNodes = [node, ...node.querySelectorAll('*')];
          [branch, ...branch.querySelectorAll('*')].forEach((copy, index) => paintedSources.set(copy, sourceNodes[index]));
          for (const copy of [...branch.querySelectorAll('*')]) {
            if (paintLayers.some(entry => entry.node === paintedSources.get(copy))) copy.remove();
          }
          let parent = node.parentElement;
          while (parent !== svg) { const wrapper = parent.cloneNode(false); wrapper.append(branch); branch = wrapper; parent = parent.parentElement; }
          clone.append(branch); svg.parentElement.append(clone); layers.push(clone);
    }
    paintLayers.forEach(({node}) => rememberStyle(node, 'visibility', 'hidden'));
    originals = originals.filter(entry => entry.node.isConnected);
    observe();
  };
  const restore = () => {
    observer?.disconnect();
    clearGeometry();
    for (const { node, key, text } of originals) {
      if (text === null) node.removeAttribute(key);
      else node.setAttribute(key, text);
    }
    originals = [];
  };
  const update = next => {
    validateVisualOverrides(next);
    restore();
    value = next;
    style.textContent = visualOverrideCSS(value, { preview });
    if (value.rules.length) {
      if (!style.isConnected) document.head.append(style);
      observer ??= new document.defaultView.MutationObserver(apply);
      apply();
    } else style.remove();
  };
  const resize = () => { restore(); apply(); };
  document.defaultView.addEventListener('resize', resize);
  update(initial);
  return { update, setPreview(next) { if (preview !== next) { preview = next; update(value); } }, dispose() { restore(); style.remove(); document.defaultView.removeEventListener('resize', resize); } };
}
