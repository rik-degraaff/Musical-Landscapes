import { VISUAL_ATTRIBUTES, VISUAL_STYLES } from '../utils/visualOverrides.js';

const roots = '.interactive-object,.instrument,#young-musician,.child-avatar,.landscape-art,.celestial-control,.avatar-designer,.parent-guide,.child-choice,.metronome-mini,.mixer-button';

export function selectorFor(node) {
  const svg = node.closest('.object-art,.instrument-illustration,.child-avatar,.landscape-art');
  let anchor = svg;
  let selector;
  if (svg?.classList.contains('object-art')) selector = `.${[...svg.classList].find(name => name.startsWith('art-'))}`;
  else if (svg?.classList.contains('instrument-illustration')) selector = `.${[...svg.classList].find(name => name.startsWith('illustration-'))}`;
  else if (svg?.classList.contains('child-avatar')) {
    selector = '.child-avatar';
    for (const key of ['hair', 'top', 'bottom']) selector += `[data-avatar-${key}="${svg.getAttribute(`data-avatar-${key}`)}"]`;
  } else if (svg?.classList.contains('landscape-art')) selector = `.${[...svg.closest('.scene').classList].find(name => name.startsWith('scene-'))} .landscape-art`;
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
  if (!node?.closest) return null;
  if (parts) return node.closest('path,ellipse,circle,rect,line,polygon,polyline,stop,g,svg') ?? node.closest(roots);
  const owner = node.closest('.interactive-object,.instrument,#young-musician,.celestial-control,.avatar-designer,.parent-guide,.child-choice,.metronome-mini,.mixer-button');
  if (owner) return owner;
  const art = node.closest('.landscape-art');
  if (art) {
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
  const detail = node.getAttribute('transform') || node.getAttribute('d') || node.getAttribute('fill') || '';
  return {
    selector,
    label: node.getAttribute('aria-label') || node.dataset.sound || node.id || node.getAttribute('class') || `${node.localName}${detail ? `: ${detail.slice(0,64)}` : ''}`,
    tag: node.localName,
    attributes: Object.fromEntries(VISUAL_ATTRIBUTES.filter(key => node.hasAttribute(key)).map(key => [key, node.getAttribute(key)])),
    styles: Object.fromEntries(VISUAL_STYLES.map(key => [key, node.style.getPropertyValue(key) || computed.getPropertyValue(key).trim()])),
  };
}

export function sceneEntities(document) {
  const nodes = [...document.querySelectorAll(roots)].filter(node => !node.closest('label') && !node.closest('.avatar-style-options'));
  const landscape = document.querySelector('.landscape-art');
  if (landscape) nodes.push(...[...landscape.children].filter(node => node.localName !== 'defs'));
  const seen = new Set();
  return nodes.map(describeNode).filter(value => value && !seen.has(value.selector) && seen.add(value.selector));
}