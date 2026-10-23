import { VISUAL_ATTRIBUTES, VISUAL_STYLES } from '../utils/visualOverrides.js';

const roots = '.interactive-object,.instrument,#young-musician,.child-avatar,.landscape-art,.celestial-control,.avatar-designer,.parent-guide,.child-choice,.metronome-mini,.mixer-button';
const shapes = 'g,path,ellipse,circle,rect,line,polygon,polyline';
const title = value => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export function selectorFor(node) {
  if (!node?.closest || node.closest('[data-svg-handle],[data-svg-point-editor]')) return null;
  const svg = node.closest('.object-art,.instrument-illustration,.child-avatar,.landscape-art');
  let anchor = svg;
  let selector;
  if (svg?.classList.contains('object-art')) selector = `.${[...svg.classList].find(name => name.startsWith('art-'))}`;
  else if (svg?.classList.contains('instrument-illustration')) selector = `.${[...svg.classList].find(name => name.startsWith('illustration-'))}`;
  else if (svg?.classList.contains('child-avatar')) {
    selector = '.child-avatar';
    const part = node.closest('[data-avatar-part]');
    const region = node.closest('[data-avatar-region]');
    if (part) {
      anchor = part;
      selector += ` [data-avatar-part="${part.dataset.avatarPart}"][data-avatar-style="${part.dataset.avatarStyle}"]`;
    } else if (region) {
      anchor = region;
      selector += ` > [data-avatar-region="${region.dataset.avatarRegion}"]`;
    } else if (node === svg) {
      for (const key of ['hair', 'top', 'bottom']) selector += `[data-avatar-${key}="${svg.getAttribute(`data-avatar-${key}`)}"]`;
    }
  } else if (svg?.classList.contains('landscape-art')) {
    const layer = svg.classList.contains('landscape-foreground') ? '.landscape-foreground' : svg.classList.contains('landscape-background') ? '.landscape-background' : '';
    selector = `.${[...svg.closest('.scene').classList].find(name => name.startsWith('scene-'))} .landscape-art${layer}`;
  }
  else {
    anchor = node.closest(roots);
    if (!anchor) return null;
    if (anchor.id) selector = `#${anchor.id}`;
    else if (anchor.classList.contains('interactive-object')) selector = `.scene .interactive-object[data-sound="${anchor.dataset.sound}"]`;
    else selector = `.${[...anchor.classList][0]}`;
  }
  const parts = [];
  let current = node;
  while (current !== anchor) {
    if (!current.parentElement) return null;
    const tag = current.localName;
    const peers = [...current.parentElement.children].filter(peer => peer.localName === tag);
    parts.unshift(`${tag}:nth-of-type(${peers.indexOf(current) + 1})`);
    current = current.parentElement;
  }
  return selector + (parts.length ? ` > ${parts.join(' > ')}` : '');
}

export function targetFor(node, parts) {
  if (!node?.closest || node.closest('[data-svg-handle],[data-svg-point-editor]')) return null;
  if (parts) return node.closest('path,ellipse,circle,rect,line,polygon,polyline,stop,g,svg') ?? node.closest(roots);
  const avatarPart = node.closest('[data-avatar-part]');
  if (node.closest('#young-musician')) return node.closest('#young-musician');
  if (avatarPart) return avatarPart;
  const owner = node.closest('.interactive-object,.instrument,#young-musician,.celestial-control,.avatar-designer,.parent-guide,.child-choice,.metronome-mini,.mixer-button');
  if (owner) return owner;
  const art = node.closest('.landscape-art');
  if (art) {
    const named = node.closest('[data-name]');
    if (named && art.contains(named)) return named;
    let current = node;
    while (current.parentElement && current.parentElement !== art) current = current.parentElement;
    return current === art || current.localName === 'defs' ? art : current;
  }
  return node.closest('.child-avatar');
}

export function describeNode(node) {
  const selector = selectorFor(node);
  if (!selector) return null;
  const computed = node.ownerDocument.defaultView.getComputedStyle(node);
  const part = node.closest('[data-avatar-part]');
  const region = node.closest('[data-avatar-region]');
  const peers = node.parentElement ? [...node.parentElement.children].filter(peer => peer.localName === node.localName) : [];
  const scope = part ? `${title(part.dataset.avatarPart)}: ${title(part.dataset.avatarStyle)}` : region ? title(region.dataset.avatarRegion) : '';
  const detail = node.getAttribute('transform') || node.getAttribute('d') || node.getAttribute('fill') || '';
  const label = node.getAttribute('aria-label') || node.getAttribute('data-name') || node.dataset.sound || node.id ||
    (scope ? (node === part || node === region ? scope : `${scope} / ${title(node.localName)} ${peers.indexOf(node) + 1}`) :
      node.getAttribute('class') || `${node.localName}${detail ? `: ${detail.slice(0,64)}` : ''}`);
  return {
    selector,
    label,
    tag: node.localName,
    attributes: Object.fromEntries(VISUAL_ATTRIBUTES.filter(key => node.hasAttribute(key)).map(key => [key, node.getAttribute(key)])),
    styles: Object.fromEntries(VISUAL_STYLES.map(key => [key, node.style.getPropertyValue(key) || computed.getPropertyValue(key).trim()])),
  };
}

export function sceneEntities(document) {
  const nodes = [...document.querySelectorAll(roots)].filter(node => !node.closest('label,[data-visual-layer]') && !node.closest('.avatar-style-options'));
  for (const art of document.querySelectorAll('.landscape-art,.object-art,.instrument-illustration,.child-avatar')) {
    if (art.closest('label,.avatar-style-options,[data-visual-layer]')) continue;
    nodes.push(...[...art.querySelectorAll(shapes)].filter(node => !node.closest('defs,clipPath,mask,[data-svg-point-editor]')));
  }
  const seen = new Set();
  return nodes.map(node => {
    const value = describeNode(node);
    if (!value) return null;
    const art = node.closest('.landscape-art,.object-art,.instrument-illustration');
    if (art && node !== art && !node.getAttribute('aria-label') && !node.getAttribute('data-name') && !node.dataset.sound && !node.id && !node.getAttribute('class')) {
      const owner = art.closest('.interactive-object,.instrument');
      const name = owner?.getAttribute('aria-label') || owner?.dataset.sound || owner?.id || art.getAttribute('class') || 'Artwork';
      const hierarchy = [];
      let current = node;
      while (current !== art && current.parentElement) {
        const siblings = [...current.parentElement.children].filter(peer => peer.localName === current.localName);
        hierarchy.unshift(`${current.localName === 'g' ? 'Group' : title(current.localName)} ${siblings.indexOf(current) + 1}`);
        current = current.parentElement;
      }
      value.label = `${title(name)} / ${hierarchy.join(' / ')}`;
    }
    return value;
  }).filter(value => value && !seen.has(value.selector) && seen.add(value.selector));
}
