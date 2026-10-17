const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));

// One bounded colour per instrument per movement, independent of per-note noise.
export function movementPerformance(style,fromSeed,toSeed=fromSeed,mix=0) {
  return Object.fromEntries(Object.entries(style.performance).map(([name,settings],index)=>{
    const shade=seed=>(smoothNoise(index+.5,seed^0x71e3)-.5)*2;
    const colour=shade(fromSeed)+(shade(toSeed)-shade(fromSeed))*mix;
    return [name,{
      cutoff:settings.cutoff*(1+colour*.035),
      gate:Math.min(1,settings.gate*(1+colour*.025)),
      accent:settings.accent*(1+colour*.025),
    }];
  }));
}

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

export function varyMovementShape(shape,seed,{shapeVariation=0,lengthOffset=0,ideaCountOffset=0}={}) {
  const last=shape.points.length-1;
  const points=shape.points.map((value,index)=>{
    if(index===0||index===last)return value;
    const offset=(smoothNoise(index*.73,seed^0x27d4eb2d)-.5)*2*shapeVariation;
    return clamp(value+offset,.05,.95);
  });
  return {...shape,length:Math.max(8,shape.length+lengthOffset),ideaCount:Math.max(1,shape.ideaCount+ideaCountOffset),points};
}

export function planIdeaSchedule(ideas,length,{overlap=.16,phaseVariation=0,seed=0}={}) {
  if(!ideas.length)return [];
  if(ideas.length===1)return [{family:ideas[0],start:0,end:1,phase:0}];
  const width=Math.min(1,1/ideas.length+Math.max(0,overlap));
  return ideas.map((family,index)=>{
    const center=(index+.5)/ideas.length+(smoothNoise(index+1,seed^0x165667b1)-.5)*2*phaseVariation;
    const start=clamp(center-width/2),end=clamp(center+width/2);
    return {family,start,end,phase:index/Math.max(1,ideas.length-1),length};
  });
}

export function ideaScheduleWeights(schedule,position) {
  return Object.fromEntries(schedule.map(({family,start,end})=>{
    const fade=Math.min(.09,Math.max(.025,(end-start)*.24));
    const enter=start===0?1:clamp((position-start)/fade);
    const leave=end===1?1:clamp((end-position)/fade);
    return [family,Math.min(enter,leave)];
  }));
}

export function blendMovementFrames(current,next,amount) {
  const mix=clamp(amount);
  return {
    position:current.position+(next.position-current.position)*mix,
    tension:current.tension+(next.tension-current.tension)*mix,
    targetTension:current.targetTension+(next.targetTension-current.targetTension)*mix,
    noise:current.noise+(next.noise-current.noise)*mix,
    section:mix<.5?current.section:next.section,
  };
}

export function movementFrame(movement,bar,style) {
  const elapsed=Math.max(0,bar-movement.startBar);
  const position=Math.min(1,elapsed/Math.max(1,movement.shape.length-1));
  const point=position*(movement.shape.points.length-1);
  const index=Math.min(movement.shape.points.length-2,Math.floor(point));
  const blend=point-index;
  const target=movement.shape.points[index]+(movement.shape.points[index+1]-movement.shape.points[index])*blend;
  const drift=(smoothNoise(elapsed/style.noiseScale,movement.seed)-.5)*2*style.movementNoise;
  const sections=movement.shape.sections??['movement'];
  const section=sections[Math.min(sections.length-1,Math.floor(position*sections.length))];
  return {position,tension:clamp(target+drift),targetTension:target,noise:drift,section};
}

export function distributeTension(total,roles,style) {
  const names=Object.keys(roles);
  if(!names.length)return {};
  const weights=names.map(name=>style.roleTension[roles[name]]??1);
  const mean=weights.reduce((sum,value)=>sum+value,0)/weights.length;
  return Object.fromEntries(names.map((name,index)=>[name,clamp(total*weights[index]/mean)]));
}
