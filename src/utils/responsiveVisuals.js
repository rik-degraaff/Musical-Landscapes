export const MIN_VIEWPORT = Object.freeze({ width: 360, height: 240 });
export const MAX_VIEWPORT = Object.freeze({ width: 1920, height: 1080 });

export function viewportProgress(size, axis) {
  return Math.max(0, Math.min(1, (size[axis] - MIN_VIEWPORT[axis]) / (MAX_VIEWPORT[axis] - MIN_VIEWPORT[axis])));
}

export function interpolateGeometry(layout, size) {
  const horizontal = viewportProgress(size, 'width');
  const vertical = viewportProgress(size, 'height');
  return Object.fromEntries(['x', 'y', 'width', 'height'].map(key => {
    const progress = key === 'y' || key === 'height' ? vertical : horizontal;
    return [key, layout.min[key] + (layout.max[key] - layout.min[key]) * progress];
  }));
}

export function boundedFormula(minimum, maximum, axis = 'width') {
  const slope = (maximum - minimum) / (MAX_VIEWPORT[axis] - MIN_VIEWPORT[axis]);
  const intercept = minimum - slope * MIN_VIEWPORT[axis];
  const unit = axis === 'height' ? 'vh' : 'vw';
  return `clamp(${Math.min(minimum, maximum).toFixed(2)}px, calc(${intercept.toFixed(4)}px + ${(slope * 100).toFixed(4)}${unit}), ${Math.max(minimum, maximum).toFixed(2)}px)`;
}

export function validateResponsiveLayout(layout) {
  if (!layout || !['box', 'svg'].includes(layout.kind)) throw new Error('Invalid responsive layout kind.');
  for (const endpoint of ['min', 'max']) {
    const geometry = layout[endpoint];
    if (!geometry || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(geometry[key]) && Math.abs(geometry[key]) <= 20000) || geometry.width < 1 || geometry.height < 1) throw new Error('Invalid responsive geometry.');
  }
}

export function updateEndpoint(layout, endpoint, geometry) {
  const next = { ...layout, [endpoint]: { ...geometry } };
  validateResponsiveLayout(next);
  return next;
}

export function instrumentHome(document, name, fallback, size) {
  const rule = document.rules.find(item => item.selector === `#instrument-${name}`);
  if (!rule || rule.maxWidth !== undefined && size.width > rule.maxWidth) return fallback;
  if (rule.layout?.kind === 'box') {
    const { x, y } = interpolateGeometry(rule.layout, size);
    return { ...fallback, x, y };
  }
  const next = { ...fallback };
  for (const [property, axis] of [['left', 'x'], ['top', 'y']]) {
    const text = rule.styles[property];
    if (/^-?\d+(\.\d+)?%$/.test(text ?? '')) next[axis] = Number.parseFloat(text);
  }
  return next;
}