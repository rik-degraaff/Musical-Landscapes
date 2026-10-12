const ZOOM_KEYS = new Set(['+', '=', '-', '_', '0']);
const CAREGIVER_AREAS = '.start-overlay,.parent-guide-backdrop,.settings-backdrop';

function elementTarget(event) {
  const element = event.target;
  return element?.nodeType === 1 ? element : element?.parentElement;
}

function caregiverZoom(event) {
  const element = elementTarget(event);
  if (element?.closest(CAREGIVER_AREAS)) return true;
  if (event.type !== 'keydown') return false;
  const document = element?.ownerDocument;
  if (!document || (element !== document.body && element !== document.documentElement)) return false;
  if (document.activeElement?.closest(CAREGIVER_AREAS)) return true;
  return [...document.querySelectorAll('.parent-guide[role="dialog"],.settings-dialog[role="dialog"],.start-overlay')]
    .some(surface => surface.getClientRects().length > 0 && getComputedStyle(surface).visibility !== 'hidden');
}

function inScrollableArea(event) {
  return Boolean(elementTarget(event)?.closest('.mixer,.parent-guide-content,.child-menu'));
}

function block(event) {
  if (event.cancelable) event.preventDefault();
}

function swallow(event) {
  block(event);
  event.stopPropagation();
}

export function installGestureGuard(target = window) {
  const handlers = {
    contextmenu: swallow,
    selectstart: swallow,
    dragstart: swallow,
    gesturestart: event => { if (!caregiverZoom(event)) swallow(event); },
    gesturechange: event => { if (!caregiverZoom(event)) swallow(event); },
    gestureend: event => { if (!caregiverZoom(event)) swallow(event); },
    dblclick: block,
    wheel: event => {
      if (event.ctrlKey || event.metaKey) { if (!caregiverZoom(event)) block(event); }
      else if (!inScrollableArea(event)) block(event);
    },
    touchmove: event => {
      if (event.touches.length > 1) { if (!caregiverZoom(event)) block(event); }
      else if (!inScrollableArea(event)) block(event);
    },
    mousedown: event => { if (event.button === 1) block(event); },
    auxclick: event => { if (event.button === 1) block(event); },
    keydown: event => { if ((event.ctrlKey || event.metaKey) && ZOOM_KEYS.has(event.key) && !caregiverZoom(event)) block(event); },
  };
  const options = { capture: true, passive: false };
  for (const [type, handler] of Object.entries(handlers)) target.addEventListener(type, handler, options);
  return () => { for (const [type, handler] of Object.entries(handlers)) target.removeEventListener(type, handler, options); };
}
