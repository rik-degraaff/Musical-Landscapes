export function flashInput(element, hold = 0, id = 'input-hit') {
  if (!element) return;
  element.getAnimations().filter(animation => ['input-hit','autoplay-hit'].includes(animation.id)).forEach(animation => animation.cancel());
  const duration = Math.max(0, hold) + 420;
  const orange=element.classList.contains('note-key');
  const strong=orange?'inset 0 0 0 999px #ff7900':'inset 0 0 0 4px #ff7900';
  const fading=orange?'inset 0 0 0 999px #ff790000':'inset 0 0 0 0px #ff790000';
  const animation = element.animate([
    {boxShadow:strong, filter:'brightness(1.25)'},
    {boxShadow:strong, filter:'brightness(1.15)', offset:Math.max(.3, hold/duration)},
    {boxShadow:fading, filter:'brightness(1)'}
  ], {duration, easing:'ease-out'});
  animation.id = id;
}