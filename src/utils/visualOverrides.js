export const VISUAL_ATTRIBUTES = ['d', 'points', 'viewBox', 'transform', 'fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'stop-color', 'stop-opacity', 'offset', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height'];
export const VISUAL_STYLES = ['left', 'top', 'right', 'bottom', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'translate', 'scale', 'rotate', 'transform', 'transform-origin', 'opacity', 'fill', 'stroke', 'color', 'background-color', 'animation-duration', 'animation-delay', 'animation-timing-function', 'animation-iteration-count', '--object-x', '--object-base', '--object-center', '--object-size', '--object-height'];

export function validateVisualOverrides(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.rules) || value.rules.length > 1500) throw new Error('Invalid visual override document.');
  const seen = new Set();
  for (const rule of value.rules) {
    if (!rule || typeof rule.selector !== 'string' || rule.selector.length > 1800 || !/^[.#][a-zA-Z]/.test(rule.selector) || /[{},;\\@]|:has\(|:not\(/.test(rule.selector) || seen.has(rule.selector)) throw new Error('Invalid or duplicate visual selector.');
    seen.add(rule.selector);
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

export function visualOverrideCSS(value) {
  return value.rules.map(rule => {
    const declarations = Object.entries(rule.styles).map(([key, text]) => `${key}:${text} !important`).join(';');
    const css = `${rule.selector}{${declarations}}`;
    return rule.maxWidth === undefined ? css : `@media(max-width:${rule.maxWidth}px){${css}}`;
  }).join('\n');
}

export function installVisualOverrides(document, initial) {
  let value = initial;
  let originals = [];
  let observer;
  const style = document.createElement('style');
  style.dataset.visualOverrides = '';
  const observe = () => observer?.observe(document.getElementById('root'), { subtree: true, childList: true, attributes: true, attributeFilter: VISUAL_ATTRIBUTES });
  const apply = () => {
    observer?.disconnect();
    for (const rule of value.rules) {
      if (rule.maxWidth !== undefined && document.defaultView.innerWidth > rule.maxWidth) continue;
      for (const node of document.querySelectorAll(rule.selector)) {
        for (const [key, text] of Object.entries(rule.attributes)) {
          if (node.getAttribute(key) === text) continue;
          const original = originals.find(entry => entry.node === node && entry.key === key);
          if (original) original.text = node.getAttribute(key);
          else originals.push({ node, key, text: node.getAttribute(key) });
          node.setAttribute(key, text);
        }
      }
    }
    originals = originals.filter(entry => entry.node.isConnected);
    observe();
  };
  const restore = () => {
    observer?.disconnect();
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
    style.textContent = visualOverrideCSS(value);
    if (value.rules.length) {
      if (!style.isConnected) document.head.append(style);
      observer ??= new document.defaultView.MutationObserver(apply);
      apply();
    } else style.remove();
  };
  const resize = () => { restore(); apply(); };
  document.defaultView.addEventListener('resize', resize);
  update(initial);
  return { update, dispose() { restore(); style.remove(); document.defaultView.removeEventListener('resize', resize); } };
}