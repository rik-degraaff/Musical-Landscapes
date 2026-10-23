// World coordinates are CSS pixels. Both habitat artwork and targets use these
// anchors, so shortening the world for an instrument panel cannot detach them.
import {DAY_PHASES, celestialPosition} from './dayCycle.js';
import {SCENE_VISITORS} from './sceneVisitors.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const SCENE_SKY_RESIDENTS = {dusk:['airplane'],'late-night':['bat']};

// Reserve the largest weather silhouette, so changing genre does not rearrange
// instruments. Keep clouds above the terrain; move them sideways around the
// current scene's sun/moon instead of lowering them into foreground objects.
export function cloudLayouts({width, height}, scene='farm') {
  const scale = Math.min(1, Math.max(.5, width / 1440), height / 300, width / 900);
  const point = celestialPosition(DAY_PHASES[scene]);
  const control = {x:width * point.x / 100, y:Math.max(36, height * point.y / 100)};
  const obstacles = [{left:control.x-32,right:control.x+32,top:control.y-32,bottom:control.y+32},
    ...[...(SCENE_SKY_RESIDENTS[scene]??[]),...SCENE_VISITORS[scene].map(visitor=>visitor.sound)]
    .filter(sound=>OBJECT_PLACEMENT[sound].habitat==='sky').map(sound=>{
      const box=sceneObjectGeometry(sound,{width,height});
      return {left:box.x-box.width/2,right:box.x+box.width/2,top:box.y-box.height/2,bottom:box.y+box.height/2};
    })];
  return [[380,100,1],[980,100,1.08],[720,80,1.02]].map(([sourceX, sourceY, maxScale]) => {
    const factor = scale * maxScale;
    const cloudWidth = 168 * factor, cloudHeight = 80 * factor;
    const original = sourceX / 1440 * width - 24 * factor;
    const y = Math.max(50, cloudHeight + 8, sourceY / 900 * height);
    let left = original;
    const nearby=obstacles.filter(box=>y>box.top-8&&y-cloudHeight<box.bottom+8);
    if(nearby.some(box=>left<box.right+8&&left+cloudWidth>box.left-8)) {
      const candidates = [original,...nearby.flatMap(box=>[box.left-8-cloudWidth,box.right+8])]
        .filter(value=>value>=56&&value+cloudWidth<=width-56)
        .filter(value=>nearby.every(box=>value+cloudWidth<=box.left-8+.001||value>=box.right+8-.001));
      candidates.sort((one,two)=>Math.abs(one-original)-Math.abs(two-original));
      left = candidates[0] ?? original;
    }
    const x = left + 24 * factor;
    return {x, y, scale, left, top:y-cloudHeight, width:cloudWidth, height:cloudHeight};
  });
}
export function landscapeMetrics({width, height}) {
  const unit = Math.min(width / 1150, height / 650, 1.5);
  const tree = (x, y) => ({x: width * x, y: height * y, scale: unit});
  return {
    width, height, unit,
    leftTree: tree(.12, .73), rightTree: tree(.91, .70),
    cottage: {x: width * .75, y: height * .66, scale: unit * .74},
  };
}

const LANDMARKS = {
  farm:{base:154, doorX:0, doorWidth:82},
  garden:{base:178, doorX:55.5, doorWidth:53},
  dawn:{base:155, doorX:59, doorWidth:58},
  dusk:{base:111, doorX:43, doorWidth:34},
  night:{base:159, doorX:56, doorWidth:54},
};

export function landmarkGeometry(scene, size) {
  const shape=LANDMARKS[scene];
  if(!shape)return null;
  const {cottage}=landscapeMetrics(size);
  const x=cottage.x, y=cottage.y-shape.base*cottage.scale;
  const sx=1440/size.width, sy=900/size.height;
  const door={x:x+shape.doorX*cottage.scale,y:cottage.y,width:shape.doorWidth*cottage.scale};
  const dx=door.x*sx,dy=door.y*sy,half=door.width*sx/2;
  return {
    transform:`translate(${x*sx} ${y*sy}) scale(${cottage.scale*sx} ${cottage.scale*sy})`,
    door,
    road:`M${dx-half} ${dy} C${dx-half+20} ${dy+85} 605 657 691 792 Q691 855 778 900 H1037 Q878 846 893 774 C821 693 ${dx+half+40} ${dy+85} ${dx+half} ${dy}Z`,
  };
}

// Contacts are authored SVG points, not the center of unused viewBox space.
// Each object keeps the same size tier when it replaces a regular neighbour.
export const OBJECT_PLACEMENT = Object.freeze({
  moo: {habitat:'ground', x:.28, y:.85, tier:1.12},
  tractor: {habitat:'ground', x:.73, y:.83, tier:1.25},
  water: {habitat:'garden', x:.31, y:.85, tier:1.05, contact:[80,132]},
  bird: {habitat:'perch', tree:'leftTree', tier:.78, contact:[73.5,102]},
  frog: {habitat:'water', x:.76, y:.90, tier:.85, contact:[80,126]},
  windmill: {habitat:'bank', x:.84, y:.55, tier:1.4, contact:[80,132]},
  bell: {habitat:'hanging', tree:'rightTree', tier:.92, contact:[80,20]},
  owl: {habitat:'perch', tree:'leftTree', tier:.85, contact:[78.5,126]},
  rooster: {habitat:'ground', x:.28, y:.85, tier:.94, contact:[80,129]},
  chimes: {habitat:'hanging', tree:'rightTree', tier:.92, contact:[80,18]},
  cricket: {habitat:'ground', x:.28, y:.87, tier:.76},
  hedgehog: {habitat:'ground', x:.28, y:.87, tier:.94},
  sheep: {habitat:'ground', x:.28, y:.85, tier:1.08},
  horse: {habitat:'ground', x:.73, y:.85, tier:1.2},
  bee: {habitat:'flowers', x:.66, y:.78, tier:.72, contact:[80,70]},
  woodpecker: {habitat:'trunk', tree:'rightTree', tier:.84, contact:[115,48]},
  duck: {habitat:'water', x:.34, y:.82, tier:.92},
  otter: {habitat:'water', x:.54, y:.83, tier:.96},
  cicada: {habitat:'perch', tree:'leftTree', tier:.72, contact:[80,117]},
  fox: {habitat:'ground', x:.74, y:.85, tier:1.04},
  badger: {habitat:'ground', x:.28, y:.86, tier:1.04},
  dove: {habitat:'perch', tree:'leftTree', tier:.82, contact:[67,117.5]},
  deer: {habitat:'ground', x:.74, y:.85, tier:1.18},
  airplane: {habitat:'sky', x:.72, y:.22, tier:1.05, contact:[80,70]},
  bat: {habitat:'sky', x:.74, y:.28, tier:.94, contact:[80,70]},
  balloon: {habitat:'sky', x:.60, y:.23, tier:.92, contact:[80,70]},
  moth: {habitat:'sky', x:.82, y:.45, tier:.76, contact:[80,70]},
  shootingStar: {habitat:'sky', x:.46, y:.23, tier:.92, contact:[80,70]},
});

export function habitatAnchor(sound, size) {
  const placement = OBJECT_PLACEMENT[sound];
  if (!placement) throw new Error(`Unknown visual object: ${sound}`);
  const metrics = landscapeMetrics(size);
  if (placement.tree) {
    const tree = metrics[placement.tree];
    return placement.habitat === 'trunk'
      ? {x:tree.x - 2 * tree.scale, y:tree.y - 78 * tree.scale}
      : {x:tree.x + (placement.tree==='rightTree'?-34:34) * tree.scale, y:tree.y - 57 * tree.scale};
  }
  return {x:size.width * placement.x, y:size.height * placement.y};
}

export function sceneObjectGeometry(sound, size) {
  const placement = OBJECT_PLACEMENT[sound];
  const anchor = habitatAnchor(sound, size);
  const basis = Math.min(size.width * .13, size.height * .22);
  const width = clamp(basis * placement.tier, 44 / .875, 144 * placement.tier);
  const height = width * .875;
  const [cx, cy] = placement.contact ?? [80,126];
  // Leave a small edge margin. This only adjusts an anchor at extreme sizes.
  const x = clamp(anchor.x + (80 - cx) / 160 * width, width / 2 + 4, size.width - width / 2 - 4);
  const y = clamp(anchor.y + (70 - cy) / 140 * height, height / 2 + 4, size.height - height / 2 - 4);
  return {x, y, width, height, habitat:placement.habitat};
}

export function sceneObjectStyle(sound, size) {
  const {x, y, width, height} = sceneObjectGeometry(sound, size);
  return {
    '--object-x':`${x / size.width * 100}%`,
    '--object-center':`${y / size.height * 100}%`,
    '--object-size':`${width}px`, '--object-height':`${height}px`,
  };
}
