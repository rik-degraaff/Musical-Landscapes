const authoredMotif=(name,tier,energy,complexity,steps,dynamics=[])=>({name,tier,energy,complexity,steps,dynamics,instrumentSteps:{}});

const jazzPhrases={
  accompaniment:[
    authoredMotif('shellComp',0,.3,.2,[[0,[0,2],1],[2,[1,2],1]],[.02,-.04]),
    authoredMotif('swingComp',1,.62,.58,[[0,[0,2],.5],[1,[1],.5],[2,[0,2],.5],[3,[1,2],.5]],[.04,-.05,.02,-.06]),
    authoredMotif('stride',2,.78,.76,[[0,[0,2],1],[1,[2],.5],[2,[1,3],1],[3,[2],.5]],[.05,-.03,.04,-.05]),
    authoredMotif('latinComp',1,.7,.68,[[0,[0,2],.5],[.5,[1],.5],[1.5,[2],.5],[2.5,[1,2],.5],[3.5,[2],.5]],[.04,-.03,.03,-.04,.02]),
    authoredMotif('lockedHands',2,.82,.88,[[0,[0,2],.5],[.5,[1,2],.5],[1.5,[0,2],.5],[2,[1,2],.5],[3,[0,2],.5],[3.5,[1,2],.5]],[.05,-.04,.03,-.05,.04,-.06]),
  ],
  melody:[
    {...authoredMotif('brassCall',0,.48,.3,[[0,[0],1],[1,[0],1],[2,[0],1],[3,[2],1]],[.1,-.07,.08,-.06]),repeatContour:true,instrumentWeights:{melody:4,flute:.5,panflute:.5}},
    {...authoredMotif('brassRiff',1,.72,.64,[[0,[1],.5],[.5,[1],.5],[1.5,[1],.5],[2,[2],.5],[2.5,[2],.5],[3.5,[0],.5]],[.1,-.08,.08,.06,-.07,-.04]),repeatContour:true,instrumentWeights:{melody:5,flute:.5,panflute:.5}},
    authoredMotif('blueAnswer',0,.28,.22,[[0,[2],2],[2,[1],2]],[.02,-.04]),
    authoredMotif('blueQuestion',1,.58,.54,[[0,[0],1],[1,[2],.5],[1.5,[3],.5],[2,[2],1],[3,[0],1]],[.04,-.02,.03,-.04,.01]),
    authoredMotif('bluesTurn',1,.65,.64,[[0,[2],.5],[.5,[1],.5],[1,[0],1],[2,[2],.5],[2.5,[3],.5],[3,[1],1]],[.03,-.03,.04,-.04,.02,-.05]),
    authoredMotif('bebopRun',2,.86,.91,[[0,[0],.5],[.5,[1],.5],[1,[2],.5],[1.5,[3],.5],[2,[2],.5],[2.5,[1],.5],[3,[0],.5],[3.5,[2],.5]],[.05,-.02,.04,-.03,.05,-.01,.03,-.06]),
    authoredMotif('octaveEcho',1,.57,.51,[[0,[0],1],[1,[2],1],[2,[0],1],[3,[2],1]],[.04,-.03,.03,-.05]),
    authoredMotif('tagEnding',2,.77,.73,[[0,[2],1],[1,[1],.5],[1.5,[0],.5],[2,[1],1],[3,[0],1]],[.04,-.03,.03,-.04,.01]),
  ],
  rhythm:[
    authoredMotif('brushPulse',0,.32,.2,[[0,'kick',1],[2,'snare',1]],[.02,-.04]),
    authoredMotif('rideSwing',2,.58,.56,[[0,'kick',.5],[.5,'ride',.5],[1,'hat',.5],[1.5,'ride',.5],[2,'snare',.5],[2.5,'ride',.5],[3,'hat',.5],[3.5,'ride',.5]],[.03,-.04,.01,-.05,.04,-.04,.01,-.06]),
    authoredMotif('brushShuffle',1,.64,.66,[[0,'kick',.5],[.5,'shaker',.5],[1,'snare',.5],[1.5,'shaker',.5],[2,'kick',.5],[2.5,'shaker',.5],[3,'snare',.5],[3.5,'shaker',.5]],[.04,-.05,.02,-.05,.03,-.05,.04,-.06]),
    authoredMotif('jazzRide',2,.82,.84,[[0,'kick',.5],[.5,'ride',.5],[1,'snare',.5],[1.5,'ride',.5],[2,'kick',.5],[2.5,'ride',.5],[3,'tom',.25],[3.25,'snare',.25],[3.5,'ride',.5]],[.05,-.04,.04,-.05,.03,-.04,.02,.04,-.06]),
    authoredMotif('stopTime',2,.76,.78,[[0,'kick',1],[1.5,'snare',.5],[2.5,'ride',.5],[3.5,'kick',.5]],[.05,-.04,.03,-.06]),
  ],
};

const folkPhrases={
  accompaniment:[
    authoredMotif('drone',0,.16,.08,[[0,[0,2],2],[2,[0,2],2]],[.02,-.03]),
    authoredMotif('strum',1,.48,.42,[[0,[0,2],.5],[1,[1],.5],[2,[0,2],.5],[3,[1,2],.5]],[.04,-.05,.02,-.06]),
    authoredMotif('turnaround',2,.72,.78,[[0,[0,2],1],[1,[1],.5],[1.5,[2],.5],[2,[0,2],1],[3,[1,2],1]],[.05,-.03,.04,-.05,.01]),
  ],
  melody:[
    authoredMotif('refrain',0,.3,.22,[[0,[0],2],[2,[2],2]],[.03,-.04]),
    authoredMotif('skip',1,.58,.54,[[0,[1],1],[1,[2],.5],[1.5,[1],.5],[2,[3],1],[3,[2],1]],[.04,-.03,.02,-.04,.01]),
    authoredMotif('longArc',2,.78,.88,[[0,[0],1],[.75,[1],.25],[1,[2],1],[2,[3],.5],[2.5,[2],.5],[3,[1],1]],[.04,-.03,.05,-.04,.02,-.06]),
  ],
  rhythm:[
    authoredMotif('stomp',0,.28,.16,[[0,'kick',1],[2,'snare',1]],[.04,-.05]),
    authoredMotif('clog',1,.62,.55,[[0,'kick',.5],[.5,'hat',.5],[1,'snare',1],[2,'kick',.5],[2.5,'shaker',.5],[3,'snare',1]],[.04,-.04,.03,-.05,.02,-.06]),
    authoredMotif('rattle',2,.8,.86,[[0,'kick',.5],[.5,'shaker',.25],[.75,'hat',.25],[1,'snare',.5],[1.5,'shaker',.5],[2,'kick',.5],[2.5,'hat',.25],[3,'snare',.5],[3.5,'hat',.5]],[.05,-.04,.03,-.05,.04,-.04,.02,.03,-.06]),
  ],
};

// Acoustic, straight-ahead rock: clear backbeats and little hooks, without extra gain.
const rockPhrases={
  accompaniment:[
    authoredMotif('rockStrum',0,.48,.28,[[0,[0,2],1],[1,[0,2],1],[2,[0,2],1],[3,[0,2],1]],[.04,-.03,.03,-.03]),
    authoredMotif('rockBounce',1,.62,.52,[[0,[0,2],.5],[1,[0,2],.5],[1.5,[1,2],.5],[2,[0,2],.5],[3,[0,2],.5],[3.5,[1,2],.5]],[.04,-.03,-.04,.03,-.03,-.04]),
    authoredMotif('rockLift',2,.72,.72,[[0,[0,2],.5],[.5,[1],.5],[1,[0,2],.5],[1.5,[2],.5],[2,[0,2],.5],[2.5,[1],.5],[3,[0,2],1]],[.04,-.04,-.02,-.04,.03,-.04,-.02]),
  ],
  melody:[
    {...authoredMotif('rockHook',0,.46,.24,[[0,[0],1],[1,[0],1],[2,[2],1],[3,[0],1]],[.04,-.03,.03,-.04]),repeatContour:true},
    {...authoredMotif('rockEcho',1,.6,.5,[[0,[0],.5],[.5,[0],.5],[1,[2],1],[2,[1],.5],[2.5,[1],.5],[3,[0],1]],[.04,-.04,.02,.03,-.04,-.03]),repeatContour:true},
    authoredMotif('rockClimb',2,.7,.7,[[0,[0],.5],[.5,[1],.5],[1,[2],1],[2,[2],.5],[2.5,[1],.5],[3,[0],1]],[.03,-.03,.04,-.03,-.04,-.03]),
  ],
  rhythm:[
    authoredMotif('rockBackbeat',0,.48,.25,[[0,'kick',1],[1,'snare',1],[2,'kick',1],[3,'snare',1]],[.03,.01,.02,.01]),
    authoredMotif('rockHat',1,.6,.5,[[0,'kick',.5],[.5,'hat',.5],[1,'snare',.5],[1.5,'hat',.5],[2,'kick',.5],[2.5,'hat',.5],[3,'snare',.5],[3.5,'hat',.5]],[.03,-.07,.01,-.07,.02,-.07,.01,-.07]),
    authoredMotif('rockTomTurn',2,.68,.72,[[0,'kick',.5],[.5,'hat',.5],[1,'snare',.5],[1.5,'hat',.5],[2,'kick',.5],[2.5,'tom',.5],[3,'snare',.5],[3.5,'tom',.5]],[.03,-.07,.01,-.07,.02,-.04,.01,-.05]),
  ],
};

const rockIdeas={
  littleVerse:{accompaniment:['rockStrum','pulse'],melody:['rockHook','answer'],rhythm:['rockBackbeat','heartbeat']},
  bigChorus:{accompaniment:['rockStrum','rockBounce'],melody:['rockHook','rockEcho'],rhythm:['rockBackbeat','rockHat']},
  playfulBridge:{accompaniment:['rockBounce','rockLift','broken'],melody:['rockEcho','rockClimb','arch'],rhythm:['rockHat','rockTomTurn']},
};

const rockProgressions=[
  {name:'rockHome',degrees:[0,4,3,0],modes:['major','minor'],tension:.35,transitions:{rockHome:4,rockSingalong:3,rockReturn:3}},
  {name:'rockSingalong',degrees:[0,4,5,3],modes:['major','minor'],tension:.5,transitions:{rockHome:4,rockSingalong:3,rockReturn:2}},
  {name:'rockReturn',degrees:[0,0,3,3,0,4,3,0],modes:['major','minor'],tension:.42,transitions:{rockHome:4,rockSingalong:3,rockReturn:2}},
];

const folkIdeas={
  openAir:{accompaniment:['held','pulse','drone'],melody:['answer','refrain'],rhythm:['heartbeat','stomp']},
  walking:{accompaniment:['broken','strum'],melody:['arch','skip'],rhythm:['walking','clog']},
  dance:{accompaniment:['pulse','offbeat','strum'],melody:['question','turn','skip'],rhythm:['backbeat','shuffle','clog']},
  flourish:{accompaniment:['rolling','lift','turnaround'],melody:['cascade','ornament','longArc'],rhythm:['fill','celebrate','rattle']},
};

const jazzIdeas={
  blueNote:{accompaniment:['held','shellComp'],melody:['answer','blueAnswer','blueQuestion','octaveEcho','question','brassCall'],rhythm:['heartbeat','brushPulse','rideSwing']},
  comp:{accompaniment:['pulse','shellComp','swingComp','latinComp'],melody:['arch','blueAnswer','octaveEcho','question','brassCall','brassRiff'],rhythm:['walking','brushPulse','rideSwing']},
  turnaround:{accompaniment:['offbeat','swingComp','latinComp'],melody:['turn','bluesTurn','tagEnding','ornament','brassRiff'],rhythm:['shuffle','brushShuffle','stopTime']},
  bebop:{accompaniment:['broken','rolling','lift','stride','lockedHands'],melody:['cascade','ornament','bebopRun','tagEnding'],rhythm:['backbeat','fill','celebrate','jazzRide','stopTime']},
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
    id:'folk',label:'Folk',phrases:folkPhrases,ideas:folkIdeas,progressions:folkProgressions,
    progressionWeights:{home:1.2,journey:1.1,song:1,minorWalk:.8,majorTurn:.9},harmonyTensionBias:1.1,
    movementShapes:[
      {name:'strophic',length:16,points:[.2,.3,.24,.38,.28],ideaCount:2,sections:['opening','refrain','response','cadence']},
      {name:'arc',length:24,points:[.18,.32,.58,.82,.94,.7,.38,.2],ideaCount:3,sections:['opening','gathering','lift','peak','release']},
      {name:'doubleHill',length:32,points:[.2,.48,.72,.46,.28,.56,.82,.62,.3,.18],ideaCount:4,sections:['opening','first-rise','breather','second-rise','release']},
    ],
    movementNoise:.08,noiseScale:5.5,familyWeights:{openAir:1.2,walking:1,dance:.95,flourish:.8},
    motifTransitions:{
      drone:{drone:5,held:4,pulse:2},strum:{strum:3,pulse:4,offbeat:2,turnaround:1},turnaround:{strum:3,pulse:3,turnaround:2,rolling:2},
      refrain:{refrain:4,answer:4,arch:2,skip:1},skip:{refrain:4,arch:3,skip:3,question:2,longArc:1},longArc:{refrain:5,arch:3,skip:2,longArc:1},
      stomp:{stomp:4,heartbeat:4,walking:2},clog:{stomp:3,walking:3,clog:3,shuffle:2,rattle:1},rattle:{stomp:4,clog:3,rattle:1,fill:2},
    },roleTension:{melody:1.12,accompaniment:.94,rhythm:.94},
    coordination:{sharedIdeaBias:.28,callResponseBias:.18,responseMotifs:['answer']},
    movementControls:{shapeVariation:.09,lengthVariation:2,ideaCountVariation:1,melodicSimilarity:[.36,.58,.82],transitionBars:2,ideaOverlap:.16,ideaPhaseVariation:.035,ideaStickiness:2.7,ideaContinuity:3.6,ideaHoldWeight:.12,anchorStickiness:5},accompanimentStickiness:7,
    swing:0,variation:{maxToneStep:.18,registerSemitones:2},
    performance:{
      piano:{cutoff:12000,gate:1,accent:1},guitar:{cutoff:12000,gate:1,accent:1},ukulele:{cutoff:12000,gate:1,accent:1},
      melody:{cutoff:6200,gate:1,accent:1},marimba:{cutoff:12000,gate:1,accent:1},flute:{cutoff:12000,gate:1,accent:1},panflute:{cutoff:12000,gate:1,accent:1},
    },
  },
  jazz:{
    id:'jazz',label:'Jazz',phrases:jazzPhrases,ideas:jazzIdeas,progressions:jazzProgressions,
    progressionWeights:{jazzBlueCycle:1.1,jazzTwoFive:1.3,jazzTurnaround:1.2,home:.55,journey:.7,song:.8,minorWalk:.7,majorTurn:.8},harmonyTensionBias:1.8,
    movementShapes:[
      {name:'head-solos-head',length:32,points:[.22,.3,.44,.56,.72,.88,.72,.58,.78,.9,.48,.26,.18],ideaCount:4,sections:['head','first-solo','trading','last-solo','head-out']},
      {name:'late-night',length:24,points:[.24,.38,.54,.68,.82,.62,.44,.7,.86,.5,.24],ideaCount:3,sections:['intro','smoke','lift','answer','fade']},
      {name:'small-combo-wave',length:16,points:[.28,.48,.7,.52,.34,.62,.76,.36,.22],ideaCount:2,sections:['head','open','break','head-out']},
    ],
    movementNoise:.055,noiseScale:7.5,familyWeights:{blueNote:1.15,comp:1.2,turnaround:1,bebop:.8},
    motifTransitions:{
      brassCall:{brassCall:5,brassRiff:4,blueAnswer:4,blueQuestion:2},brassRiff:{brassRiff:4,brassCall:3,blueAnswer:4,bluesTurn:3},
      shellComp:{shellComp:5,swingComp:4,stride:1},swingComp:{shellComp:3,swingComp:4,stride:2},stride:{shellComp:5,swingComp:3,stride:1},
      blueAnswer:{blueAnswer:4,blueQuestion:4,bluesTurn:2,bebopRun:1,octaveEcho:3,tagEnding:1},blueQuestion:{blueAnswer:5,blueQuestion:2,bluesTurn:4,bebopRun:2,octaveEcho:2,tagEnding:1},bluesTurn:{blueAnswer:4,blueQuestion:3,bluesTurn:2,bebopRun:3,octaveEcho:1,tagEnding:3},bebopRun:{blueAnswer:5,blueQuestion:2,bluesTurn:3,bebopRun:1,octaveEcho:2,tagEnding:2},
      rideSwing:{rideSwing:5,brushShuffle:3,jazzRide:2},brushShuffle:{rideSwing:4,brushShuffle:4,jazzRide:2},jazzRide:{rideSwing:5,brushShuffle:3,jazzRide:1},
    },
    roleTension:{melody:1.2,accompaniment:.82,rhythm:1.05},
    coordination:{sharedIdeaBias:.42,callResponseBias:.56,responseMotifs:['answer','blueAnswer','blueQuestion']},
    movementControls:{shapeVariation:.15,lengthVariation:2,ideaCountVariation:1,melodicSimilarity:[.12,.38,.66],transitionBars:2,ideaOverlap:.24,ideaPhaseVariation:.07,ideaStickiness:1.8,ideaContinuity:2.4,ideaHoldWeight:.1,anchorStickiness:3},accompanimentStickiness:4.8,
    swing:.16,variation:{maxToneStep:.42,registerSemitones:4},
    performance:{
      piano:{cutoff:6800,gate:.72,accent:1.3},guitar:{cutoff:7200,gate:.8,accent:1.2},ukulele:{cutoff:7600,gate:.8,accent:1.2},
      melody:{cutoff:9500,gate:.7,accent:1.25},marimba:{cutoff:8500,gate:.8,accent:1.2},flute:{cutoff:8000,gate:.82,accent:1.15},panflute:{cutoff:8500,gate:.82,accent:1.15},
    },
  },
  rock:{
    id:'rock',label:'Rock',phrases:rockPhrases,ideas:rockIdeas,progressions:rockProgressions,
    progressionWeights:{rockHome:1.4,rockSingalong:1.2,rockReturn:1.1,home:.5,journey:.5,song:.6},harmonyTensionBias:1.15,
    movementShapes:[
      {name:'verse-chorus',length:16,points:[.3,.38,.62,.72,.4,.48,.76,.38],ideaCount:2,sections:['verse','chorus','verse','chorus-out']},
      {name:'singalong',length:24,points:[.26,.38,.58,.72,.42,.54,.76,.64,.32],ideaCount:3,sections:['intro','verse','chorus','bridge','chorus-out']},
    ],
    movementNoise:.04,noiseScale:7,familyWeights:{littleVerse:1.1,bigChorus:1.3,playfulBridge:.75},
    motifTransitions:{
      rockStrum:{rockStrum:5,rockBounce:3,pulse:1},rockBounce:{rockStrum:4,rockBounce:4,rockLift:2},rockLift:{rockStrum:5,rockBounce:3,rockLift:1},
      rockHook:{rockHook:5,rockEcho:3,answer:1},rockEcho:{rockHook:5,rockEcho:3,rockClimb:2},rockClimb:{rockHook:5,rockEcho:3,rockClimb:1},
      rockBackbeat:{rockBackbeat:5,rockHat:3},rockHat:{rockBackbeat:4,rockHat:5,rockTomTurn:1},rockTomTurn:{rockBackbeat:5,rockHat:4,rockTomTurn:1},
    },
    roleTension:{melody:1,accompaniment:1,rhythm:1.05},
    coordination:{sharedIdeaBias:.65,callResponseBias:.25,responseMotifs:['answer','rockEcho']},
    movementControls:{shapeVariation:.07,lengthVariation:2,ideaCountVariation:1,melodicSimilarity:[.6,.76,.9],transitionBars:2,ideaOverlap:.18,ideaPhaseVariation:.03,ideaStickiness:3.2,ideaContinuity:4,ideaHoldWeight:.15,anchorStickiness:6},accompanimentStickiness:8,
    swing:0,variation:{maxToneStep:.12,registerSemitones:1.5},
    performance:{
      piano:{cutoff:10000,gate:.88,accent:1.12},guitar:{cutoff:10000,gate:.88,accent:1.12},ukulele:{cutoff:10000,gate:.88,accent:1.12},
      melody:{cutoff:7600,gate:.88,accent:1.12},marimba:{cutoff:10000,gate:.9,accent:1.1},flute:{cutoff:10000,gate:.9,accent:1.08},panflute:{cutoff:10000,gate:.9,accent:1.08},
    },
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

export function blendCompositionStyles(fromGenre,toGenre,mix,fromPerformance) {
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
    movementControls:{shapeVariation:lerp(from.movementControls.shapeVariation,to.movementControls.shapeVariation,amount),lengthVariation:Math.round(lerp(from.movementControls.lengthVariation,to.movementControls.lengthVariation,amount)),ideaCountVariation:Math.round(lerp(from.movementControls.ideaCountVariation,to.movementControls.ideaCountVariation,amount)),melodicSimilarity:from.movementControls.melodicSimilarity.map((value,index)=>lerp(value,to.movementControls.melodicSimilarity[index],amount)),transitionBars:Math.max(1,Math.round(lerp(from.movementControls.transitionBars,to.movementControls.transitionBars,amount))),ideaOverlap:lerp(from.movementControls.ideaOverlap,to.movementControls.ideaOverlap,amount),ideaPhaseVariation:lerp(from.movementControls.ideaPhaseVariation,to.movementControls.ideaPhaseVariation,amount),ideaStickiness:lerp(from.movementControls.ideaStickiness,to.movementControls.ideaStickiness,amount),anchorStickiness:lerp(from.movementControls.anchorStickiness,to.movementControls.anchorStickiness,amount)},
    accompanimentStickiness:lerp(from.accompanimentStickiness,to.accompanimentStickiness,amount),
    swing:lerp(from.swing,to.swing,amount),variation:{maxToneStep:lerp(from.variation.maxToneStep,to.variation.maxToneStep,amount),registerSemitones:lerp(from.variation.registerSemitones,to.variation.registerSemitones,amount)},
    performance:Object.fromEntries(Object.keys(from.performance).map(name=>[name,blendMap((fromPerformance??from.performance)[name],to.performance[name],amount)])),
  };
  style.movementControls.ideaContinuity=lerp(from.movementControls.ideaContinuity,to.movementControls.ideaContinuity,amount);
  style.movementControls.ideaHoldWeight=lerp(from.movementControls.ideaHoldWeight,to.movementControls.ideaHoldWeight,amount);
  style.movementControls.anchorStickiness=lerp(from.movementControls.anchorStickiness,to.movementControls.anchorStickiness,amount);
  return style;
}
