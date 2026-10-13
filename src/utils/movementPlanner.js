const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));

function lattice(seed,index) {
  let value=(seed|0)^Math.imul(index|0,0x45d9f3b);
  value=Math.imul(value^(value>>>16),0x45d9f3b);
  value=Math.imul(value^(value>>>16),0x45d9f3b);
  return ((value^(value>>>16))>>>0)/4294967295;
}

export function smoothNoise(position,seed) {
  const left=Math.floor(position);
  const fraction=position-left;
  const smooth=fraction*fraction*(3-2*fraction);
  return lattice(seed,left)+(lattice(seed,left+1)-lattice(seed,left))*smooth;
}

export function movementFrame(movement,bar,style) {
  const elapsed=Math.max(0,bar-movement.startBar);
  const position=Math.min(1,elapsed/Math.max(1,movement.shape.length-1));
  const point=position*(movement.shape.points.length-1);
  const index=Math.min(movement.shape.points.length-2,Math.floor(point));
  const blend=point-index;
  const target=movement.shape.points[index]+(movement.shape.points[index+1]-movement.shape.points[index])*blend;
  const drift=(smoothNoise(elapsed/style.noiseScale,movement.seed)-.5)*2*style.movementNoise;
  return {position,tension:clamp(target+drift),targetTension:target,noise:drift};
}

export function distributeTension(total,roles,style) {
  const names=Object.keys(roles);
  if(!names.length)return {};
  const weights=names.map(name=>style.roleTension[roles[name]]??1);
  const mean=weights.reduce((sum,value)=>sum+value,0)/weights.length;
  return Object.fromEntries(names.map((name,index)=>[name,clamp(total*weights[index]/mean)]));
}
