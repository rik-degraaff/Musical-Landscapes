import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectorFor, targetFor, describeNode, sceneEntities } from '../src/dev/editorSelection.js';
import { validateVisualOverrides } from '../src/utils/visualOverrides.js';
import { SVGPathData } from 'svg-pathdata';
import { SvgPointEditor, installSvgPointEditor, parsePathData, encodePathData, pathHandles, movePathHandle, parsePoints, encodePoints, geometryFor, geometryHandles, moveGeometryHandle } from '../src/dev/SvgPointEditor.js';

function avatarFixture(partName = 'hair-front', style = 'longCurls') {
  const svg = {
    localName: 'svg', dataset: {},
    classList: { contains: name => name === 'child-avatar' },
    getAttribute: key => ({ 'data-avatar-hair': 'longCurls', 'data-avatar-top': 'tee', 'data-avatar-bottom': 'shorts' })[key],
  };
  const group = { dataset: { avatarPart: partName, avatarStyle: style }, children: [], parentElement: svg, localName: 'g' };
  svg.children = [group];
  const path = { dataset: {}, localName: 'path', parentElement: group };
  const otherPath = { ...path };
  group.children.push(otherPath, path);
  for (const node of [svg, group, path]) {
    node.closest = query => {
      if (query.includes('data-svg-')) return null;
      if (query === '[data-avatar-part]') return node === svg ? null : group;
      if (query === '[data-avatar-region]') return null;
      if (query.includes('.child-avatar')) return svg;
      if (query.startsWith('path,')) return node;
      return null;
    };
    node.getAttribute ??= () => null;
    node.hasAttribute = key => node.getAttribute(key) != null;
    node.ownerDocument = { defaultView: { getComputedStyle: () => ({ getPropertyValue: () => '' }) } };
    node.style = { getPropertyValue: () => '' };
  }
  return { svg, group, path };
}

test('avatar parts use only their own style and local shape index', () => {
  for (const [part, style] of [['hair-front', 'longCurls'], ['hair-back', 'bob'], ['top', 'hoodie'], ['bottom', 'skirt']]) {
    const { path } = avatarFixture(part, style);
    const selector = selectorFor(path);
    assert.equal(selector, `.child-avatar [data-avatar-part="${part}"][data-avatar-style="${style}"] > path:nth-of-type(2)`);
    validateVisualOverrides({ version: 1, rules: [{ selector, attributes: {}, styles: {} }] });
  }
});

test('avatar root selector stays compatible and item mode targets semantic groups', () => {
  const { svg, group, path } = avatarFixture();
  assert.equal(selectorFor(svg), '.child-avatar[data-avatar-hair="longCurls"][data-avatar-top="tee"][data-avatar-bottom="shorts"]');
  assert.equal(targetFor(path, false), group);
  assert.equal(targetFor(path, true), path);
  assert.equal(describeNode(group).label, 'Hair Front: Long Curls');
  assert.equal(describeNode(path).label, 'Hair Front: Long Curls / Path 2');
});

test('editor handles cannot become scene selections', () => {
  const handle = { closest: () => ({}) };
  assert.equal(selectorFor(handle), null);
  assert.equal(targetFor(handle, true), null);
});

test('absolute path canonicalization roundtrips relative, HV, smooth, arcs and subpaths', () => {
  for (const source of [
    'm10 20h5v-3l2 4z m30 10q5 8 10 0t10 0',
    'M0 0C10 20 20 20 30 0s20 -20 30 0S80 20 90 0',
    'M3 4a12 8 35 0 1 30 20A9 15 70 1 0 90 30Z',
    'M1e2,-2e1 L.5,+3.25 M10 10Z',
    '',
  ]) {
    const commands = parsePathData(source);
    assert.deepEqual(parsePathData(encodePathData(commands)), commands);
    assert.ok(commands.every(command => !command.relative));
    assert.ok(commands.every(command => ![SVGPathData.HORIZ_LINE_TO, SVGPathData.VERT_LINE_TO, SVGPathData.SMOOTH_CURVE_TO, SVGPathData.SMOOTH_QUAD_TO].includes(command.type)));
  }
});

test('smooth curves expose reflected controls without changing their shape', () => {
  const commands = parsePathData('M0 0C10 20 20 20 30 0S50 -20 60 0Q70 10 80 0T100 0');
  assert.equal(commands[2].x1, 40);
  assert.equal(commands[2].y1, -20);
  assert.equal(commands[4].x1, 90);
  assert.equal(commands[4].y1, -10);
  const handles = pathHandles(commands);
  assert.equal(handles.filter(handle => handle.kind === 'anchor').length, 5);
  assert.equal(handles.filter(handle => handle.kind === 'control').length, 6);
  assert.equal(handles.find(handle => handle.id === '4:control1').label, 'SVG control 6');
});

test('moving anchors translates adjacent cubic controls, moving controls is independent', () => {
  const commands = parsePathData('M0 0C10 20 20 20 30 0S50 -20 60 0');
  const moved = movePathHandle(commands, '1:anchor', 35, 7);
  assert.deepEqual([moved[1].x, moved[1].y, moved[1].x2, moved[1].y2, moved[2].x1, moved[2].y1], [35, 7, 25, 27, 45, -13]);
  assert.deepEqual([commands[1].x, commands[1].y], [30, 0]);
  const control = movePathHandle(commands, '1:control1', -4, 9);
  assert.deepEqual([control[1].x1, control[1].y1, control[1].x, control[1].y], [-4, 9, 30, 0]);
  assert.deepEqual(control[2], commands[2]);
});

test('editing an arc endpoint preserves radius, rotation, flags and close commands', () => {
  const commands = parsePathData('M3 4a12 8 35 0 1 30 20zM90 50l4 3');
  const moved = movePathHandle(commands, '1:anchor', 42, 32);
  assert.deepEqual(moved[1], { ...commands[1], x: 42, y: 32 });
  assert.deepEqual(moved.slice(2), commands.slice(2));
  assert.equal(moved[1].type, SVGPathData.ARC);
  assert.deepEqual(parsePathData(encodePathData(moved)), moved);
});

test('point lists roundtrip commas, whitespace, signed decimals and exponents', () => {
  const points = parsePoints('1,2 3 4\n-5.5,+6.25 1e2 -2e1');
  assert.deepEqual(points, [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: -5.5, y: 6.25 }, { x: 100, y: -20 }]);
  assert.deepEqual(parsePoints(encodePoints(points)), points);
  assert.deepEqual(parsePoints(''), []);
  for (const source of ['1 2 3', '1 2L3 4', 'NaN 2', '1e999 2']) assert.throws(() => parsePoints(source));
});

test('malformed paths and non-finite edits cannot corrupt geometry', () => {
  for (const source of ['M1', 'M0 0LNaN 4', 'M0 0A4 5 0 3 0 8 9', 'M1e999 0']) assert.throws(() => parsePathData(source));
  const commands = parsePathData('M0 0L4 5');
  assert.throws(() => movePathHandle(commands, '1:anchor', Infinity, 5));
  assert.throws(() => movePathHandle(commands, 'missing', 1, 2));
});

function primitive(tag, attributes) {
  return geometryFor({ localName: tag, getAttribute: key => attributes[key] ?? null });
}

test('primitive handles emit finite string patches with nonnegative dimensions', () => {
  for (const [tag, values, id, x, y, expected] of [
    ['circle', { cx: '10', cy: '20', r: '4' }, 'radius-x', 13, 24, { r: '5' }],
    ['ellipse', { cx: '10', cy: '20', rx: '4', ry: '6' }, 'radius-y', 10, 12, { ry: '8' }],
    ['rect', { x: '10', y: '20', width: '30', height: '40' }, 'size', 4, 50, { width: '0', height: '30' }],
    ['line', { x1: '1', y1: '2', x2: '3', y2: '4' }, 'end', 5, 8, { x2: '5', y2: '8' }],
    ['ellipse', { rx: '4', ry: '6' }, 'center', 10, 12, { cx: '10', cy: '12' }],
    ['rect', { width: '30', height: '40' }, 'origin', 10, 12, { x: '10', y: '12' }],
  ]) {
    const geometry = primitive(tag, values);
    assert.ok(geometryHandles(geometry).length >= 2);
    assert.deepEqual(moveGeometryHandle(geometry, id, x, y).attributes, expected);
  }
  assert.throws(() => primitive('circle', { r: '3%' }));
  assert.throws(() => primitive('rect', { width: '-3' }));
});

test('polygon and path geometry patches affect only the intended point', () => {
  const polygon = primitive('polygon', { points: '0,0 10,20 30,40' });
  assert.deepEqual(moveGeometryHandle(polygon, '1:point', 7, 9).attributes, { points: '0,0 7,9 30,40' });
  const path = primitive('path', { d: 'm10 10l5 0' });
  const patch = moveGeometryHandle(path, '1:anchor', 18, 12).attributes;
  assert.deepEqual(parsePathData(patch.d).map(({ x, y }) => [x, y]), [[10, 10], [18, 12]]);
});

test('every authored avatar path survives canonical roundtrip', () => {
  const source = readFileSync(new URL('../src/components/ChildAvatar.jsx', import.meta.url), 'utf8');
  const paths = [...source.matchAll(/\bd="([^"]+)"/g)].map(match => match[1]);
  assert.ok(paths.length > 40);
  for (const path of paths) assert.deepEqual(parsePathData(encodePathData(parsePathData(path))), parsePathData(path));
  for (const part of ['hair-back', 'hair-front', 'top', 'bottom']) assert.ok(source.includes(`data-avatar-part="${part}"`));
});

test('scene outline includes individual semantic groups and shapes without duplicate selectors', () => {
  const { svg, group, path } = avatarFixture();
  svg.querySelectorAll = () => [group, path];
  const document = { querySelectorAll: query => query.startsWith('.landscape-art') ? [svg] : [svg, group] };
  const entries = sceneEntities(document);
  assert.equal(entries.length, 3);
  assert.deepEqual(entries.map(entry => entry.selector), [selectorFor(svg), selectorFor(group), selectorFor(path)]);
  assert.equal(entries.at(-1).label, 'Hair Front: Long Curls / Path 2');
});

test('legacy Browse SVG parts labels coexist with readable hierarchical outline names', () => {
  const svg = { localName: 'svg', children: [], attributes: { class: 'landscape-art' } };
  const group = { localName: 'g', children: [], attributes: { transform: 'translate(20 10)' }, parentElement: svg };
  const path = { localName: 'path', attributes: { d: 'M-118 12H118V154H-118Z' }, parentElement: group };
  svg.children = [group]; group.children = [path];
  const classes = ['landscape-art']; classes.contains = name => classes.includes(name);
  svg.classList = classes;
  for (const node of [svg, group, path]) {
    node.dataset = {};
    node.getAttribute = key => node.attributes[key] ?? null;
    node.hasAttribute = key => node.getAttribute(key) !== null;
    node.closest = query => query === '.scene' ? { classList: ['scene', 'scene-farm'] } : query.includes('.landscape-art') ? svg : null;
    node.style = { getPropertyValue: () => '' };
    node.ownerDocument = { defaultView: { getComputedStyle: () => ({ getPropertyValue: () => '' }) } };
  }
  svg.querySelectorAll = () => [group, path];
  const document = { querySelectorAll: () => [svg] };
  assert.equal(describeNode(svg).label, 'landscape-art');
  assert.equal(describeNode(path).label, 'path: M-118 12H118V154H-118Z');
  const entries = sceneEntities(document);
  assert.equal(entries[1].label, 'Landscape Art / Group 1');
  assert.equal(entries[2].label, 'Landscape Art / Group 1 / Path 1');
});

function editorFixture(callbacks = {}) {
  const listeners = new Map();
  class Element {
    constructor(tag) { this.localName = tag; this.attributes = new Map(); this.children = []; this.style = {}; this.isConnected = true; }
    getAttribute(key) { return this.attributes.get(key) ?? null; }
    setAttribute(key, value) { this.attributes.set(key, String(value)); }
    append(node) { node.parentElement = this; this.children.push(node); }
    insertBefore(node, before) { node.parentElement = this; this.children.splice(Math.max(0, this.children.indexOf(before)), 0, node); }
    get firstChild() { return this.children[0] ?? null; }
    remove() { this.isConnected = false; if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    closest() { return this.attributes.has('data-svg-handle') ? this : this.parentElement?.closest() ?? null; }
    focus() {}
    setPointerCapture(id) { this.captured = id; }
    releasePointerCapture() { this.captured = null; }
  }
  class Observer {
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  class Point {
    constructor(x, y) { this.x = x; this.y = y; }
    matrixTransform(matrix) { return { x: matrix.a * this.x + matrix.c * this.y + matrix.e, y: matrix.b * this.x + matrix.d * this.y + matrix.f }; }
  }
  const matrix = { a: 2, b: 0, c: 0, d: 3, e: 10, f: 20, inverse: () => ({ a: .5, b: 0, c: 0, d: 1 / 3, e: -5, f: -20 / 3 }) };
  const view = {
    DOMPoint: Point, MutationObserver: Observer, ResizeObserver: Observer,
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: type => listeners.delete(type),
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  };
  const document = { body: new Element('body'), defaultView: view, createElementNS: (namespace, tag) => new Element(tag), addEventListener() {}, removeEventListener() {} };
  const node = new Element('path');
  node.ownerDocument = document; node.ownerSVGElement = new Element('svg'); node.getScreenCTM = () => matrix;
  node.setAttribute('d', 'M10 10C20 20 30 20 40 10');
  const editor = new SvgPointEditor(document, callbacks);
  editor.select(node, true);
  const event = (target, values = {}) => ({ target, button: 0, pointerId: 1, clientX: 90, clientY: 50, ...values, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } });
  return { editor, node, document, listeners, event };
}

test('pointer gestures retain handles, map screen coordinates and do not mutate callback-owned artwork', () => {
  const patches = [];
  let ends = 0;
  const { editor, node, event } = editorFixture({ onEdit: patch => patches.push(patch), onGestureEnd: () => ends++ });
  const circle = editor.handles.get('1:anchor').circle;
  const original = node.getAttribute('d');
  const down = event(circle, { clientX: 92, clientY: 53 });
  editor.pointerDown(down);
  assert.equal(down.stopped, true);
  editor.pointerMove(event(circle, { clientX: 112, clientY: 83 }));
  assert.equal(node.getAttribute('d'), original);
  assert.deepEqual([editor.geometry.commands[1].x, editor.geometry.commands[1].y], [50, 20]);
  assert.equal(circle.getAttribute('cx'), '110');
  assert.equal(circle.getAttribute('cy'), '80');
  assert.equal(editor.handles.get('1:anchor').circle, circle);
  editor.pointerMove(event(circle, { clientX: 92, clientY: 53 }));
  assert.equal(patches.at(-1).attributes.d, original);
  assert.equal(patches.length, 2);
  editor.pointerEnd(event(circle)); editor.pointerEnd(event(circle));
  assert.equal(ends, 1);
  assert.equal(circle.captured, null);
  editor.dispose();
});

test('external geometry refresh repositions existing handles and ends only changed gestures', () => {
  let ends = 0;
  const { editor, node, event } = editorFixture({ onGestureEnd: () => ends++ });
  const circle = editor.handles.get('1:anchor').circle;
  editor.pointerDown(event(circle)); editor.pointerEnd(event(circle));
  assert.equal(ends, 0);
  node.setAttribute('d', 'M10 10Q20 50 80 20'); editor.refresh();
  assert.equal(editor.handles.get('1:anchor').circle, circle);
  assert.equal(circle.getAttribute('cx'), '170');
  assert.equal(circle.getAttribute('cy'), '80');
  assert.equal(editor.handles.get('1:control1').circle.getAttribute('aria-label'), 'SVG control 1');
  editor.pointerDown(event(circle, { clientX: 170, clientY: 80 }));
  editor.pointerMove(event(circle, { clientX: 180, clientY: 83 }));
  editor.select(node, false); editor.pointerEnd(event(circle));
  assert.equal(ends, 1);
  assert.equal(editor.overlay.style.display, 'none');
  editor.dispose();
});

test('keyboard repeats coalesce, cancellation and disposal remove observers and listeners', () => {
  const patches = [];
  let ends = 0;
  const { editor, document, node, event, listeners } = editorFixture({ onEdit: patch => patches.push(patch), onGestureEnd: () => ends++ });
  const circle = editor.handles.get('1:anchor').circle;
  for (let index = 0; index < 3; index++) editor.keyDown(event(circle, { key: 'ArrowRight' }));
  assert.equal(ends, 0);
  editor.keyUp(event(circle, { key: 'ArrowRight' }));
  assert.equal(ends, 1);
  assert.equal(parsePathData(patches.at(-1).attributes.d)[1].x, 43);
  editor.keyDown(event(circle, { key: 'ArrowDown', shiftKey: true }));
  editor.keyUp(event(circle, { key: 'ArrowDown' }));
  assert.equal(editor.geometry.commands[1].y, 20);
  assert.equal(ends, 2);
  editor.pointerDown(event(circle)); editor.pointerMove(event(circle, { clientX: 94, clientY: 53 }));
  editor.pointerEnd(event(circle, { type: 'pointercancel' }));
  assert.equal(ends, 3);
  editor.pointerDown(event(circle)); editor.pointerMove(event(circle, { clientX: 99, clientY: 55 }));
  editor.dispose(); editor.dispose();
  assert.equal(ends, 4);
  assert.equal(editor.observer.disconnected, true);
  assert.equal(editor.resizeObserver.disconnected, true);
  assert.equal(document.body.children.length, 0);
  assert.equal(listeners.size, 0);
  const installed = installSvgPointEditor(document);
  assert.deepEqual(Object.keys(installed), ['select', 'refresh', 'dispose']);
  installed.select(node, true); installed.refresh(); installed.dispose();
});