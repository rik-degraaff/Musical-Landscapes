export function flashInput(element, hold = 0, id = 'input-hit') {
  if (!element) return;
  element.getAnimations().filter(animation => ['input-hit','autoplay-hit'].includes(animation.id)).forEach(animation => animation.cancel());
  const duration = Math.max(0, hold) + 420;
  const animation = element.animate([
    {boxShadow:'inset 0 0 0 4px #fff2a0', filter:'brightness(1.5)'},
    {boxShadow:'inset 0 0 0 3px #fff2a0', filter:'brightness(1.35)', offset:Math.max(.3, hold/duration)},
    {boxShadow:'inset 0 0 0 0px #fff2a000', filter:'brightness(1)'}
  ], {duration, easing:'ease-out'});
  animation.id = id;
}