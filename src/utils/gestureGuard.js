const ZOOM_KEYS = new Set(['+', '=', '-', '_', '0']);

function inScrollableArea(event) {
  return event.target instanceof Element && Boolean(event.target.closest('.mixer,.parent-guide-content'));
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
    gesturestart: swallow,
    gesturechange: swallow,
    gestureend: swallow,
    dblclick: block,
    wheel: event => { if (event.ctrlKey || !inScrollableArea(event)) block(event); },
    touchmove: event => { if (event.touches.length > 1 || !inScrollableArea(event)) block(event); },
    mousedown: event => { if (event.button === 1) block(event); },
    auxclick: event => { if (event.button === 1) block(event); },
    keydown: event => { if ((event.ctrlKey || event.metaKey) && ZOOM_KEYS.has(event.key)) block(event); },
  };
  const options = { capture: true, passive: false };
  for (const [type, handler] of Object.entries(handlers)) target.addEventListener(type, handler, options);
  return () => { for (const [type, handler] of Object.entries(handlers)) target.removeEventListener(type, handler, options); };
}
