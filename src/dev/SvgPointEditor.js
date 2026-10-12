import { SVGPathData } from 'svg-pathdata';

const namespace = 'http://www.w3.org/2000/svg';
const geometryAttributes = ['d', 'points', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2'];
const arrowKeys = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const geometrySignature = node => JSON.stringify(geometryAttributes.map(key => node.getAttribute(key)));
const coordinate = value => {
  if (!Number.isFinite(value)) throw new Error('SVG coordinates must be finite numbers.');
  return Number(value.toFixed(5));
};

export function parsePathData(source) {
  const commands = new SVGPathData(source).toAbs().normalizeHVZ(false, true, true, false).normalizeST().commands;
  for (const command of commands) {
    for (const value of Object.values(command)) {
      if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid SVG path coordinate.');
    }
  }
  return commands;
}

export function encodePathData(commands) {
  return SVGPathData.encode(commands);
}

export function pathHandles(commands) {
  const handles = [];
  let previous = { x: 0, y: 0 };
  let start = previous;
  let anchors = 0;
  let controls = 0;
  commands.forEach((command, index) => {
    if (command.type === SVGPathData.CLOSE_PATH) { previous = start; return; }
    const endpoint = { x: command.x, y: command.y };
    if (command.type === SVGPathData.MOVE_TO) start = endpoint;
    handles.push({ id: `${index}:anchor`, kind: 'anchor', index, ...endpoint, label: `SVG anchor ${++anchors}` });
    for (const suffix of ['1', '2']) {
      if (command[`x${suffix}`] === undefined) continue;
      handles.push({
        id: `${index}:control${suffix}`, kind: 'control', index, suffix,
        x: command[`x${suffix}`], y: command[`y${suffix}`],
        link: command.type === SVGPathData.QUAD_TO || suffix === '1' ? previous : endpoint,
        secondLink: command.type === SVGPathData.QUAD_TO ? endpoint : null,
        label: `SVG control ${++controls}`,
      });
    }
    previous = endpoint;
  });
  return handles;
}

export function movePathHandle(commands, id, x, y) {
  const handle = pathHandles(commands).find(value => value.id === id);
  if (!handle) throw new Error('Unknown SVG path handle.');
  const next = commands.map(command => ({ ...command }));
  const command = next[handle.index];
  x = coordinate(x); y = coordinate(y);
  if (handle.kind === 'control') {
    command[`x${handle.suffix}`] = x;
    command[`y${handle.suffix}`] = y;
  } else {
    const dx = x - command.x, dy = y - command.y;
    command.x = x; command.y = y;
    const translateControl = (entry, suffix) => {
      if (entry?.[`x${suffix}`] === undefined) return;
      entry[`x${suffix}`] = coordinate(entry[`x${suffix}`] + dx);
      entry[`y${suffix}`] = coordinate(entry[`y${suffix}`] + dy);
    };
    translateControl(command, command.type === SVGPathData.QUAD_TO ? '1' : '2');
    translateControl(next[handle.index + 1], '1');
  }
  return next;
}

export function parsePoints(source) {
  if (!source.trim()) return [];
  if (!/^[\d\s,+.eE-]+$/.test(source)) throw new Error('Invalid SVG point list.');
  const commands = parsePathData(`M${source}`);
  if (commands.some(command => ![SVGPathData.MOVE_TO, SVGPathData.LINE_TO].includes(command.type))) throw new Error('Invalid SVG point list.');
  return commands.map(({ x, y }) => ({ x, y }));
}

export function encodePoints(points) {
  return points.map(({ x, y }) => `${coordinate(x)},${coordinate(y)}`).join(' ');
}

export function geometryFor(node) {
  const tag = node.localName;
  if (tag === 'path') return { tag, commands: parsePathData(node.getAttribute('d') || '') };
  if (tag === 'polygon' || tag === 'polyline') return { tag, points: parsePoints(node.getAttribute('points') || '') };
  const keys = {
    circle: ['cx', 'cy', 'r'], ellipse: ['cx', 'cy', 'rx', 'ry'],
    rect: ['x', 'y', 'width', 'height'], line: ['x1', 'y1', 'x2', 'y2'],
  }[tag];
  if (!keys) return null;
  const values = Object.fromEntries(keys.map(key => {
    const raw = node.getAttribute(key);
    const value = raw === null ? 0 : Number(raw);
    if (!Number.isFinite(value) || (['r', 'rx', 'ry', 'width', 'height'].includes(key) && value < 0)) throw new Error('Unsupported SVG primitive geometry.');
    return [key, value];
  }));
  return { tag, values };
}

export function geometryHandles(geometry) {
  if (!geometry) return [];
  if (geometry.commands) return pathHandles(geometry.commands);
  if (geometry.points) return geometry.points.map((point, index) => ({ ...point, id: `${index}:point`, index, kind: 'anchor', label: `SVG anchor ${index + 1}` }));
  const value = geometry.values;
  const handle = (id, x, y, label, kind = 'anchor') => ({ id, x, y, label, kind });
  if (geometry.tag === 'line') return [handle('start', value.x1, value.y1, 'SVG anchor 1'), handle('end', value.x2, value.y2, 'SVG anchor 2')];
  if (geometry.tag === 'rect') return [
    handle('origin', value.x, value.y, 'SVG anchor 1'),
    handle('size', value.x + value.width, value.y + value.height, 'SVG size'),
  ];
  return [
    handle('center', value.cx, value.cy, 'SVG center'),
    handle('radius-x', value.cx + (value.r ?? value.rx), value.cy, 'SVG radius X', 'control'),
    ...(geometry.tag === 'ellipse' ? [handle('radius-y', value.cx, value.cy + value.ry, 'SVG radius Y', 'control')] : []),
  ];
}

export function moveGeometryHandle(geometry, id, x, y) {
  const handle = geometryHandles(geometry).find(value => value.id === id);
  if (!handle) throw new Error('Unknown SVG geometry handle.');
  x = coordinate(x); y = coordinate(y);
  if (geometry.commands) {
    const commands = movePathHandle(geometry.commands, id, x, y);
    return { geometry: { ...geometry, commands }, attributes: { d: encodePathData(commands) } };
  }
  if (geometry.points) {
    const points = geometry.points.map((point, index) => index === handle.index ? { x, y } : { ...point });
    return { geometry: { ...geometry, points }, attributes: { points: encodePoints(points) } };
  }
  const values = { ...geometry.values };
  let changes;
  if (id === 'start' || id === 'end') {
    const suffix = id === 'start' ? '1' : '2';
    changes = { [`x${suffix}`]: x, [`y${suffix}`]: y };
  } else if (id === 'origin') changes = { x, y };
  else if (id === 'size') changes = { width: Math.max(0, coordinate(x - values.x)), height: Math.max(0, coordinate(y - values.y)) };
  else if (id === 'center') changes = { cx: x, cy: y };
  else if (geometry.tag === 'circle') changes = { r: coordinate(Math.hypot(x - values.cx, y - values.cy)) };
  else if (id === 'radius-x') changes = { rx: coordinate(Math.abs(x - values.cx)) };
  else changes = { ry: coordinate(Math.abs(y - values.cy)) };
  Object.assign(values, changes);
  return { geometry: { ...geometry, values }, attributes: Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, String(value)])) };
}

export class SvgPointEditor {
  constructor(document, { onEdit = () => {}, onGestureEnd = () => {} } = {}) {
    this.document = document;
    this.view = document.defaultView;
    this.onEdit = onEdit;
    this.onGestureEnd = onGestureEnd;
    this.handles = new Map();
    this.node = null;
    this.enabled = false;
    this.disposed = false;
    this.gesture = null;
    this.overlay = document.createElementNS(namespace, 'svg');
    this.overlay.setAttribute('data-svg-point-editor', '');
    this.overlay.setAttribute('aria-label', 'SVG point editor');
    this.overlay.setAttribute('role', 'group');
    Object.assign(this.overlay.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%', overflow: 'visible',
      zIndex: '2147483647', pointerEvents: 'none', touchAction: 'none',
    });
    document.body.append(this.overlay);
    this.events = {
      pointerdown: event => this.pointerDown(event),
      pointermove: event => this.pointerMove(event),
      pointerup: event => this.pointerEnd(event),
      pointercancel: event => this.pointerEnd(event),
      lostpointercapture: event => this.pointerEnd(event),
      keydown: event => this.keyDown(event),
      keyup: event => this.keyUp(event),
      click: event => { if (this.handleFor(event)) this.consume(event); },
      blur: event => { if (event.target === this.view || this.handleFor(event)) this.endGesture(); },
    };
    for (const [type, listener] of Object.entries(this.events)) this.view.addEventListener(type, listener, true);
    this.schedule = () => {
      if (this.frame || this.disposed) return;
      this.frame = this.view.requestAnimationFrame(() => { this.frame = null; this.refresh(); });
    };
    this.view.addEventListener('resize', this.schedule);
    this.document.addEventListener('scroll', this.schedule, true);
    this.observer = new this.view.MutationObserver(records => {
      if (records.some(record => !this.overlay.contains(record.target))) this.schedule();
    });
    this.observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: [...geometryAttributes, 'transform', 'viewBox', 'style', 'class'] });
    this.resizeObserver = this.view.ResizeObserver ? new this.view.ResizeObserver(this.schedule) : null;
  }

  select(node, enabled = true) {
    if (this.disposed) return;
    if (node !== this.node || !enabled) this.endGesture();
    if (node !== this.node || !enabled) this.pending = null;
    if (node !== this.node) {
      this.resizeObserver?.disconnect();
      if (node?.ownerSVGElement) this.resizeObserver?.observe(node.ownerSVGElement);
    }
    this.node = node;
    this.enabled = Boolean(enabled);
    this.refresh();
  }

  refresh() {
    if (this.disposed) return;
    if (!this.enabled || !this.node?.isConnected || this.node.ownerDocument !== this.document) {
      this.endGesture(); this.overlay.style.display = 'none'; return;
    }
    let geometry;
    let matrix;
    try {
      const signature = geometrySignature(this.node);
      if (this.pending?.node === this.node && this.pending.signature === signature) geometry = this.geometry;
      else { this.pending = null; geometry = geometryFor(this.node); }
      matrix = this.node.getScreenCTM?.();
      if (!matrix) throw new Error('No SVG screen transform.');
      matrix.inverse();
      if (![matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f].every(Number.isFinite) || matrix.a * matrix.d - matrix.b * matrix.c === 0) throw new Error('Invalid SVG screen transform.');
    } catch {
      this.endGesture(); this.overlay.style.display = 'none'; return;
    }
    const descriptors = geometryHandles(geometry);
    if (this.gesture && !descriptors.some(handle => handle.id === this.gesture.id)) this.endGesture();
    this.geometry = geometry;
    this.overlay.style.display = descriptors.length ? 'block' : 'none';
    const activeIds = new Set(descriptors.map(handle => handle.id));
    for (const [id, entry] of this.handles) {
      if (activeIds.has(id)) continue;
      entry.circle.remove(); entry.lines.forEach(line => line.remove()); this.handles.delete(id);
    }
    for (const handle of descriptors) {
      let entry = this.handles.get(handle.id);
      if (!entry) {
        const circle = this.document.createElementNS(namespace, 'circle');
        circle.setAttribute('data-svg-handle', handle.id);
        circle.setAttribute('tabindex', '0'); circle.setAttribute('role', 'button');
        circle.setAttribute('r', '6'); circle.setAttribute('stroke', '#ffffff'); circle.setAttribute('stroke-width', '2');
        Object.assign(circle.style, { pointerEvents: 'all', cursor: 'grab', touchAction: 'none' });
        this.overlay.append(circle);
        entry = { circle, lines: [] }; this.handles.set(handle.id, entry);
      }
      entry.circle.setAttribute('aria-label', handle.label);
      entry.circle.setAttribute('fill', handle.kind === 'control' ? '#d43c62' : '#087f83');
      const point = this.screenPoint(handle, matrix);
      entry.circle.setAttribute('cx', String(point.x)); entry.circle.setAttribute('cy', String(point.y));
      const links = [handle.link, handle.secondLink].filter(Boolean);
      while (entry.lines.length > links.length) entry.lines.pop().remove();
      links.forEach((link, index) => {
        let line = entry.lines[index];
        if (!line) {
          line = this.document.createElementNS(namespace, 'line');
          line.setAttribute('stroke', '#d43c62'); line.setAttribute('stroke-width', '1');
          line.setAttribute('stroke-dasharray', '3 3'); line.setAttribute('aria-hidden', 'true');
          this.overlay.insertBefore(line, this.overlay.firstChild); entry.lines.push(line);
        }
        const origin = this.screenPoint(link, matrix);
        for (const [key, value] of Object.entries({ x1: origin.x, y1: origin.y, x2: point.x, y2: point.y })) line.setAttribute(key, String(value));
      });
    }
  }

  screenPoint(point, matrix) {
    return new this.view.DOMPoint(point.x, point.y).matrixTransform(matrix);
  }

  handleFor(event) {
    const handle = event.target?.closest?.('[data-svg-handle]');
    return handle && this.overlay.contains(handle) ? handle : null;
  }

  consume(event) { event.preventDefault(); event.stopImmediatePropagation(); }

  pointerDown(event) {
    const handle = this.handleFor(event);
    if (!handle) return;
    this.consume(event);
    if (event.button !== 0 || this.gesture || !this.enabled) return;
    this.refresh();
    if (this.overlay.style.display === 'none') return;
    handle.focus({ preventScroll: true });
    const id = handle.getAttribute('data-svg-handle');
    const point = this.screenPoint({ x: event.clientX, y: event.clientY }, this.node.getScreenCTM().inverse());
    const descriptor = geometryHandles(this.geometry).find(value => value.id === id);
    this.gesture = { id, pointerId: event.pointerId, handle, changed: false, offset: { x: descriptor.x - point.x, y: descriptor.y - point.y } };
    try { handle.setPointerCapture(event.pointerId); } catch {}
  }

  pointerMove(event) {
    const gesture = this.gesture;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    this.consume(event);
    try {
      const matrix = this.node.getScreenCTM().inverse();
      const point = this.screenPoint({ x: event.clientX, y: event.clientY }, matrix);
      this.apply(gesture.id, point.x + gesture.offset.x, point.y + gesture.offset.y);
    } catch { this.endGesture(); }
  }

  pointerEnd(event) {
    if (this.handleFor(event)) this.consume(event);
    if (this.gesture?.pointerId !== undefined && this.gesture.pointerId === event.pointerId) {
      this.consume(event); this.endGesture();
    }
  }

  keyDown(event) {
    const handle = this.handleFor(event);
    if (!handle) return;
    if (event.key === 'Escape') { this.consume(event); this.endGesture(); return; }
    const delta = arrowKeys[event.key];
    if (!delta) return;
    this.consume(event);
    if (this.gesture?.pointerId !== undefined) return;
    const id = handle.getAttribute('data-svg-handle');
    if (this.gesture && this.gesture.id !== id) this.endGesture();
    this.refresh();
    const current = geometryHandles(this.geometry).find(value => value.id === id);
    if (!current || this.overlay.style.display === 'none') return;
    this.gesture ??= { id, handle, changed: false };
    const step = event.shiftKey ? 10 : 1;
    this.apply(id, current.x + delta[0] * step, current.y + delta[1] * step);
  }

  keyUp(event) {
    if (!arrowKeys[event.key] || !this.handleFor(event)) return;
    this.consume(event);
    if (this.gesture?.pointerId === undefined) this.endGesture();
  }

  apply(id, x, y) {
    const current = geometryHandles(this.geometry).find(handle => handle.id === id);
    if (current && coordinate(x) === coordinate(current.x) && coordinate(y) === coordinate(current.y)) return;
    const result = moveGeometryHandle(this.geometry, id, x, y);
    if (JSON.stringify(result.geometry) === JSON.stringify(this.geometry)) return;
    this.geometry = result.geometry;
    this.pending = { node: this.node, signature: geometrySignature(this.node) };
    this.gesture.changed = true;
    this.onEdit({ attributes: result.attributes });
    this.refresh();
  }

  endGesture() {
    const gesture = this.gesture;
    if (!gesture) return;
    this.gesture = null;
    if (gesture.pointerId !== undefined) {
      try { gesture.handle.releasePointerCapture(gesture.pointerId); } catch {}
    }
    if (gesture.changed) this.onGestureEnd();
  }

  dispose() {
    if (this.disposed) return;
    this.endGesture(); this.disposed = true;
    this.observer.disconnect(); this.resizeObserver?.disconnect();
    if (this.frame) this.view.cancelAnimationFrame(this.frame);
    for (const [type, listener] of Object.entries(this.events)) this.view.removeEventListener(type, listener, true);
    this.view.removeEventListener('resize', this.schedule);
    this.document.removeEventListener('scroll', this.schedule, true);
    this.overlay.remove(); this.handles.clear(); this.node = null; this.pending = null; this.geometry = null;
  }
}

/**
 * onEdit({ attributes: Record<string, string> }) owns applying/persisting patches;
 * the host supplies its current selector. onGestureEnd() fires once per changed
 * pointer gesture or arrow-key hold, including cancellation, deselection and disposal.
 * select(node, enabled = true) accepts one SVG shape, not a group. refresh() follows
 * geometry/transforms; resize, scroll and DOM mutations also schedule a refresh.
 */
export function installSvgPointEditor(document, callbacks = {}) {
  const editor = new SvgPointEditor(document, callbacks);
  return {
    select: (node, enabled) => editor.select(node, enabled),
    refresh: () => editor.refresh(),
    dispose: () => editor.dispose(),
  };
}