const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>value*value*(3-2*value);
export const GESTURE_DURATION=3000;

/** Pure timeline shared by guides and live hints. Coordinates can be pixels or percentages.
 * Speed scales the whole gesture; waypoints describe a continuous contact route.
 * Release stays at the destination, then fades before resetting to the start.
 */
export function gestureFrame({gesture='tap',elapsed=0,duration=GESTURE_DURATION,speed=1,from={x:0,y:0},to=from,waypoints=[],reduced=false,iterations=Infinity}) {
  const time=Math.max(0,elapsed)*Math.max(.05,speed)/Math.max(1,duration);
  const finished=time>=iterations;
  const cycle=finished?1:time%1;
  const moving=['drag','swipe','tempo'].includes(gesture);
  // Two 180 ms taps, 360 ms apart at normal speed, fit the app's 450 ms window.
  const contacts=gesture==='double-tap'?[[.2,.26],[.32,.38]]:[[.2,moving||gesture==='hold'?.78:.26]];
  const pressed=reduced||(!finished&&contacts.some(([start,end])=>cycle>=start&&cycle<end));
  const travel=moving&&!reduced?smooth(clamp((cycle-.3)/.4)):0;
  const route=[from,...waypoints,to];
  const position=travel*(route.length-1),index=Math.min(route.length-2,Math.floor(position)),part=position-index;
  const x=route[index].x+(route[index+1].x-route[index].x)*part;
  const y=route[index].y+(route[index+1].y-route[index].y)*part;
  const sincePress=contacts.map(([start])=>cycle-start).find(delta=>delta>=0&&delta<.105);
  const burst=reduced||finished||sincePress===undefined?null:sincePress/.105;
  return {x,y,pressed,travel,burst,opacity:reduced||finished?1:cycle<.9?1:1-clamp((cycle-.9)/.07),finished};
}

/** Contact locations in a guide's percentage coordinate space. */
export function guideGestureRoute({kind,instrument,gesture,secondary=false}) {
  let from={x:55,y:48},to;
  if(kind==='band')from={x:17,y:28};
  if(kind==='equip'){from={x:22,y:48};to={x:76,y:48};}
  if(kind==='sun')from={x:52,y:36};
  if(kind==='weather')from={x:36,y:49};
  if(kind==='profile')from={x:20,y:38};
  if(kind==='settings')from={x:47,y:40};
  if(kind==='metronome'){from={x:50,y:33};to={x:50,y:17};}
  if(kind==='surface'&&gesture==='swipe') {
    if(['guitar','ukulele'].includes(instrument)){from={x:76,y:32};to={x:76,y:68};}
    else {from={x:24,y:48};to={x:77,y:48};}
  }
  if(kind==='surface'&&gesture==='hold'&&['flute','melody'].includes(instrument))from={x:secondary?68:20,y:50};
  return {from,to:to??from};
}
