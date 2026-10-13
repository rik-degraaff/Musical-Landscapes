const jazzMotif=(name,tier,energy,complexity,steps,dynamics=[])=>({name,tier,energy,complexity,steps,dynamics,instrumentSteps:{}});

const jazzPhrases={
  accompaniment:[
    jazzMotif('shellComp',0,.3,.2,[[0,[0,2],1],[2,[1,2],1]],[.02,-.04]),
    jazzMotif('swingComp',1,.62,.58,[[0,[0,2],.5],[1,[1],.5],[2,[0,2],.5],[3,[1,2],.5]],[.04,-.05,.02,-.06]),
    jazzMotif('stride',2,.78,.76,[[0,[0,2],1],[1,[2],.5],[2,[1,3],1],[3,[2],.5]],[.05,-.03,.04,-.05]),
  ],
  melody:[
    jazzMotif('blueAnswer',0,.28,.22,[[0,[2],2],[2,[1],2]],[.02,-.04]),
    jazzMotif('blueQuestion',1,.58,.54,[[0,[0],1],[1,[2],.5],[1.5,[3],.5],[2,[2],1],[3,[0],1]],[.04,-.02,.03,-.04,.01]),
    jazzMotif('bluesTurn',1,.65,.64,[[0,[2],.5],[.5,[1],.5],[1,[0],1],[2,[2],.5],[2.5,[3],.5],[3,[1],1]],[.03,-.03,.04,-.04,.02,-.05]),
    jazzMotif('bebopRun',2,.86,.91,[[0,[0],.5],[.5,[1],.5],[1,[2],.5],[1.5,[3],.5],[2,[2],.5],[2.5,[1],.5],[3,[0],.5],[3.5,[2],.5]],[.05,-.02,.04,-.03,.05,-.01,.03,-.06]),
  ],
  rhythm:[
    jazzMotif('rideSwing',1,.58,.56,[[0,'kick',.5],[.5,'ride',.5],[1,'hat',.5],[1.5,'ride',.5],[2,'snare',.5],[2.5,'ride',.5],[3,'hat',.5],[3.5,'ride',.5]],[.03,-.04,.01,-.05,.04,-.04,.01,-.06]),
    jazzMotif('brushShuffle',1,.64,.66,[[0,'kick',.5],[.5,'shaker',.5],[1,'snare',.5],[1.5,'shaker',.5],[2,'kick',.5],[2.5,'shaker',.5],[3,'snare',.5],[3.5,'shaker',.5]],[.04,-.05,.02,-.05,.03,-.05,.04,-.06]),
    jazzMotif('jazzRide',2,.82,.84,[[0,'kick',.5],[.5,'ride',.5],[1,'snare',.5],[1.5,'ride',.5],[2,'kick',.5],[2.5,'ride',.5],[3,'tom',.25],[3.25,'snare',.25],[3.5,'ride',.5]],[.05,-.04,.04,-.05,.03,-.04,.02,.04,-.06]),
  ],
};

const folkIdeas={
  openAir:{accompaniment:['held','pulse'],melody:['answer'],rhythm:['heartbeat']},
  walking:{accompaniment:['broken'],melody:['arch'],rhythm:['walking']},
  dance:{accompaniment:['pulse','offbeat'],melody:['question','turn'],rhythm:['backbeat','shuffle']},
  flourish:{accompaniment:['rolling','lift'],melody:['cascade','ornament'],rhythm:['fill','celebrate']},
};

const jazzIdeas={
  blueNote:{accompaniment:['held','shellComp'],melody:['answer','blueAnswer','blueQuestion'],rhythm:['heartbeat','rideSwing']},
  comp:{accompaniment:['pulse','shellComp','swingComp'],melody:['arch','blueAnswer'],rhythm:['walking','rideSwing']},
  turnaround:{accompaniment:['offbeat','swingComp'],melody:['turn','bluesTurn'],rhythm:['shuffle','brushShuffle']},
  bebop:{accompaniment:['broken','stride'],melody:['cascade','bebopRun'],rhythm:['backbeat','jazzRide']},
};

const folkProgressions=[
  {name:'home',degrees:[0,3,4,0],modes:['major','minor'],tension:.25,transitions:{home:4,journey:4,song:2,minorWalk:2,majorTurn:2}},
  {name:'journey',degrees:[0,0,3,3,0,4,3,0],modes:['major','minor'],tension:.42,transitions:{home:5,journey:2,song:3,minorWalk:3,majorTurn:3}},
  {name:'song',degrees:[0,4,5,3],modes:['major','minor'],tension:.5,transitions:{home:4,journey:3,song:3,minorWalk:2,majorTurn:2}},
  {name:'minorWalk',degrees:[0,5,2,6,3,0,4,0],modes:['minor'],tension:.67,transitions:{home:5,journey:3,song:2,minorWalk:2}},
  {name:'majorTurn',degrees:[0,5,1,4,0,3,4,0],modes:['major'],tension:.58,transitions:{home:4,journey:3,song:3,majorTurn:2}},
];

const jazzProgressions=[
  {name:'jazzBlueCycle',degrees:[0,3,4,3,0,4,3,0],modes:['major','minor'],tension:.52,transitions:{jazzBlueCycle:2,jazzTwoFive:4,jazzTurnaround:3,home:2}},
  {name:'jazzTwoFive',degrees:[1,4,0,0],modes:['major','minor'],tension:.62,transitions:{jazzBlueCycle:3,jazzTwoFive:3,jazzTurnaround:4,home:2}},
  {name:'jazzTurnaround',degrees:[0,5,1,4],modes:['major'],tension:.72,transitions:{jazzBlueCycle:2,jazzTwoFive:4,jazzTurnaround:3,home:2}},
];

export const COMPOSITION_STYLES={
  folk:{
    id:'folk',label:'Folk',phrases:{},ideas:folkIdeas,progressions:folkProgressions,
    progressionWeights:{home:1.2,journey:1.1,song:1,minorWalk:.8,majorTurn:.9},harmonyTensionBias:1.1,
    movementShapes:[
      {name:'strophic',length:16,points:[.2,.3,.24,.38,.28],ideaCount:2},
      {name:'arc',length:24,points:[.18,.32,.58,.82,.94,.7,.38,.2],ideaCount:3},
      {name:'doubleHill',length:32,points:[.2,.48,.72,.46,.28,.56,.82,.62,.3,.18],ideaCount:4},
    ],
    movementNoise:.08,noiseScale:5.5,familyWeights:{openAir:1.2,walking:1,dance:.95,flourish:.8},
    motifTransitions:{},roleTension:{melody:1.12,accompaniment:.94,rhythm:.94},
    coordination:{sharedIdeaBias:.28,callResponseBias:.18,responseMotifs:['answer']},
    swing:0,variation:{maxToneStep:.18,registerSemitones:2},
  },
  jazz:{
    id:'jazz',label:'Jazz',phrases:jazzPhrases,ideas:jazzIdeas,progressions:jazzProgressions,
    progressionWeights:{jazzBlueCycle:1.1,jazzTwoFive:1.3,jazzTurnaround:1.2,home:.55,journey:.7,song:.8,minorWalk:.7,majorTurn:.8},harmonyTensionBias:1.8,
    movementShapes:[
      {name:'head-solos-head',length:32,points:[.22,.3,.44,.56,.72,.88,.72,.58,.78,.9,.48,.26,.18],ideaCount:4},
      {name:'late-night',length:24,points:[.24,.38,.54,.68,.82,.62,.44,.7,.86,.5,.24],ideaCount:3},
      {name:'small-combo-wave',length:16,points:[.28,.48,.7,.52,.34,.62,.76,.36,.22],ideaCount:2},
    ],
    movementNoise:.055,noiseScale:7.5,familyWeights:{blueNote:1.15,comp:1.2,turnaround:1,bebop:.8},
    motifTransitions:{
      shellComp:{shellComp:5,swingComp:4,stride:1},swingComp:{shellComp:3,swingComp:4,stride:2},stride:{shellComp:5,swingComp:3,stride:1},
      blueAnswer:{blueAnswer:4,blueQuestion:4,bluesTurn:2,bebopRun:1},blueQuestion:{blueAnswer:5,blueQuestion:2,bluesTurn:4,bebopRun:2},bluesTurn:{blueAnswer:4,blueQuestion:3,bluesTurn:2,bebopRun:3},bebopRun:{blueAnswer:5,blueQuestion:2,bluesTurn:3,bebopRun:1},
      rideSwing:{rideSwing:5,brushShuffle:3,jazzRide:2},brushShuffle:{rideSwing:4,brushShuffle:4,jazzRide:2},jazzRide:{rideSwing:5,brushShuffle:3,jazzRide:1},
    },
    roleTension:{melody:1.2,accompaniment:.82,rhythm:1.05},
    coordination:{sharedIdeaBias:.42,callResponseBias:.56,responseMotifs:['answer','blueAnswer','blueQuestion']},
    swing:.12,variation:{maxToneStep:.42,registerSemitones:4},
  },
};

export const GENRE_OPTIONS=Object.values(COMPOSITION_STYLES).map(({id,label})=>({id,label}));

export function compositionStyle(genre='folk') {
  const style=COMPOSITION_STYLES[genre];
  if(!style)throw new Error(`Unknown composition genre: ${genre}`);
  return style;
}

const lerp=(from,to,mix)=>from+(to-from)*mix;
const blendMap=(from={},to={},mix)=>Object.fromEntries(Array.from(new Set([...Object.keys(from),...Object.keys(to)]),key=>[key,lerp(from[key]??0,to[key]??0,mix)]));

export function blendCompositionStyles(fromGenre,toGenre,mix) {
  const from=compositionStyle(fromGenre),to=compositionStyle(toGenre);
  const amount=Math.max(0,Math.min(1,mix));
  if(fromGenre===toGenre)return from;
  if(amount===1)return to;
  const phrases=Object.fromEntries(['accompaniment','melody','rhythm'].map(role=>[role,[...(from.phrases[role]??[]),...(to.phrases[role]??[]).filter(phrase=>!(from.phrases[role]??[]).some(existing=>existing.name===phrase.name))]]));
  const ideas={};
  for(const [family,idea] of Object.entries({...from.ideas,...to.ideas})){
    const first=from.ideas[family]??{},second=to.ideas[family]??{};
    ideas[family]=Object.fromEntries(['accompaniment','melody','rhythm'].map(role=>[role,[...new Set([...(first[role]??[]),...(second[role]??[])])]]));
  }
  const shapes=[...from.movementShapes.map(shape=>({...shape,name:`${fromGenre}:${shape.name}`,sourceGenre:fromGenre})),...to.movementShapes.map(shape=>({...shape,name:`${toGenre}:${shape.name}`,sourceGenre:toGenre}))];
  const progressionMap=new Map([...from.progressions,...to.progressions].map(value=>[value.name,value]));
  const transitionNames=new Set([...Object.keys(from.motifTransitions),...Object.keys(to.motifTransitions)]);
  const motifTransitions=Object.fromEntries([...transitionNames].map(name=>[name,blendMap(from.motifTransitions[name],to.motifTransitions[name],amount)]));
  const style={
    id:`${fromGenre}-${toGenre}-${amount}`,label:to.label,phrases,ideas,progressions:[...progressionMap.values()],movementShapes:shapes,
    movementShapeWeights:Object.fromEntries(shapes.map(shape=>[shape.name,shape.sourceGenre===fromGenre?1-amount:amount])),
    progressionWeights:blendMap(from.progressionWeights,to.progressionWeights,amount),harmonyTensionBias:lerp(from.harmonyTensionBias,to.harmonyTensionBias,amount),
    movementNoise:lerp(from.movementNoise,to.movementNoise,amount),noiseScale:lerp(from.noiseScale,to.noiseScale,amount),
    familyWeights:Object.fromEntries(Array.from(new Set([...Object.keys(from.familyWeights),...Object.keys(to.familyWeights)]),name=>[name,Math.max(lerp(from.familyWeights[name]??0,to.familyWeights[name]??0,amount),(to.familyWeights[name]??0)*.35*(1-amount))])),motifTransitions,
    motifWeights:Object.fromEntries(Object.entries(phrases).flatMap(([role,pool])=>pool.map(phrase=>[phrase.name,(from.phrases[role]??[]).some(value=>value.name===phrase.name)?1-amount:amount]))),
    roleTension:Object.fromEntries(['melody','accompaniment','rhythm'].map(role=>[role,lerp(from.roleTension[role]??1,to.roleTension[role]??1,amount)])),
    coordination:{sharedIdeaBias:lerp(from.coordination.sharedIdeaBias,to.coordination.sharedIdeaBias,amount),callResponseBias:lerp(from.coordination.callResponseBias,to.coordination.callResponseBias,amount),responseMotifs:[...new Set([...from.coordination.responseMotifs,...to.coordination.responseMotifs])]},
    swing:lerp(from.swing,to.swing,amount),variation:{maxToneStep:lerp(from.variation.maxToneStep,to.variation.maxToneStep,amount),registerSemitones:lerp(from.variation.registerSemitones,to.variation.registerSemitones,amount)},
  };
  return style;
}
