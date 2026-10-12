export function measureGeometry(node, world) {
  const bounds = node.getBoundingClientRect();
  return {
    x: (bounds.left + bounds.width / 2 - world.left) / world.width * 100,
    y: (bounds.top + bounds.height / 2 - world.top) / world.height * 100,
    width: bounds.width,
    height: bounds.height,
  };
}

export function resizeGeometry(bounds, world, grip, dx, dy, ratioLocked) {
  let width = Math.max(8, bounds.width + (grip.includes('w') ? -dx : grip.includes('e') ? dx : 0));
  let height = Math.max(8, bounds.height + (grip.includes('n') ? -dy : grip.includes('s') ? dy : 0));
  if (ratioLocked) {
    if (grip === 'n' || grip === 's') width = height * bounds.width / bounds.height;
    else height = width * bounds.height / bounds.width;
  }
  const left = grip.includes('w') ? bounds.right - width : bounds.left;
  const top = grip.includes('n') ? bounds.bottom - height : bounds.top;
  return { x: (left + width / 2 - world.left) / world.width * 100, y: (top + height / 2 - world.top) / world.height * 100, width, height };
}