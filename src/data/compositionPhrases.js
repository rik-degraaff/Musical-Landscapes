function motif(name,tier,energy,complexity,steps) {
  const dynamics={
    held:[.04,-.03],pulse:[.06,-.05,.02,-.07],offbeat:[.05,-.02,.02,-.06],broken:[.03,-.05,.01,.04,-.03,-.07],
    rolling:[.01,.02,.04,.06,.03,-.01,-.03,-.08],lift:[.02,.01,.03,.07,.04,.02,-.02,-.08],
    answer:[.04,-.07],arch:[-.02,.02,.06,-.06],question:[-.03,.03,.06,.01,-.04],turn:[.04,-.04,.02,.06,-.01,-.07],
    cascade:[.06,.03,.01,-.02,.01,.04,-.03,-.08],ornament:[.02,-.04,.03,-.03,.06,.04,.01,-.04,-.08],
    heartbeat:[.06,.02],walking:[.06,-.08,.04,-.06],backbeat:[.06,-.08,-.02,.05,-.07,-.03],
    shuffle:[.05,-.09,-.04,-.08,.06,-.08,.02,-.06],fill:[.04,-.02,.02,.03,.05,.06,-.02],celebrate:[.06,-.08,.02,.03,-.02,.01,.03,.05,.06],
  };
  const instrumentSteps={
    arch:{flute:[[0,[0],1],[1,[1],1],[2,[2],2]],panflute:[[0,[0],1],[1,[1],2],[3,[2],1]]},
    question:{flute:[[0,[1],1],[1.5,[2],.5],[2,[3],1],[3,[1],1]]},
    turn:{panflute:[[0,[2],1],[1,[1],.5],[1.5,[2],.5],[2,[3],1],[3,[0],1]]},
    cascade:{flute:[[0,[3],1],[1,[2],.5],[1.5,[1],.5],[2,[0],1],[3,[1],.5],[3.5,[0],.5]]},
    ornament:{melody:[[0,[0],1],[1,[1],.5],[1.5,[2],.25],[1.75,[1],.25],[2,[2],1],[3,[3],.5],[3.5,[2],.25],[3.75,[0],.25]]},
    broken:{guitar:[[0,[0],1],[1,[2],.5],[1.5,[1],.5],[2,[0],1],[3,[2],.5],[3.5,[1],.5]]},
    rolling:{ukulele:[[0,[0,2],1],[1,[1],.5],[1.5,[2],.5],[2,[0,2],1],[3,[2],.5],[3.5,[1],.5]]},
  };
  return {name,tier,energy,complexity,steps,dynamics:dynamics[name],instrumentSteps:instrumentSteps[name]??{}};
}

export const COMPOSITION_PHRASES = {
  accompaniment: [
    motif('held',0,.18,.12,[[0,[0,2],2],[2,[1,2],2]]),
    motif('pulse',0,.35,.25,[[0,[0,2],1],[1,[1],1],[2,[0,2],1],[3,[1],1]]),
    motif('offbeat',1,.55,.48,[[0,[0,1,2],1],[1.5,[1,2],.5],[2,[0,2],1],[3.5,[1,2],.5]]),
    motif('broken',1,.42,.6,[[0,[0],.5],[.5,[2],.5],[1,[1],1],[2,[0],.5],[2.5,[2],.5],[3,[1],1]]),
    motif('rolling',2,.7,.8,[[0,[0],.5],[.5,[1],.5],[1,[2],.5],[1.5,[3],.5],[2,[2],.5],[2.5,[1],.5],[3,[0,2],.5],[3.5,[1],.5]]),
    motif('lift',2,.82,.9,[[0,[0,1,2],1],[1,[2],.25],[1.25,[3],.25],[1.5,[4],.5],[2,[1,2],1],[3,[2],.5],[3.5,[1],.25],[3.75,[0],.25]]),
  ],
  melody: [
    motif('answer',0,.2,.15,[[0,[2],2],[2,[1],2]]),
    motif('arch',0,.38,.28,[[0,[0],1],[1,[1],1],[2,[2],1],[3,[1],1]]),
    motif('question',1,.5,.48,[[0,[1],1],[1,[2],.5],[1.5,[3],.5],[2,[2],1],[3,[1],1]]),
    motif('turn',1,.58,.62,[[0,[2],.5],[.5,[1],.5],[1,[2],1],[2,[3],.5],[2.5,[2],.5],[3,[0],1]]),
    motif('cascade',2,.76,.82,[[0,[3],.5],[.5,[2],.5],[1,[1],.5],[1.5,[0],.5],[2,[1],.5],[2.5,[2],.5],[3,[1],.5],[3.5,[0],.5]]),
    motif('ornament',2,.85,.94,[[0,[0],1],[1,[1],.25],[1.25,[2],.25],[1.5,[1],.5],[2,[2],.5],[2.5,[3],.5],[3,[2],.5],[3.5,[1],.25],[3.75,[0],.25]]),
  ],
  rhythm: [
    motif('heartbeat',0,.2,.12,[[0,'kick',2],[2,'snare',2]]),
    motif('walking',0,.36,.28,[[0,'kick',1],[1,'hat',1],[2,'snare',1],[3,'hat',1]]),
    motif('backbeat',1,.56,.5,[[0,'kick',.5],[.5,'hat',.5],[1,'rim',1],[2,'snare',.5],[2.5,'hat',.5],[3,'clap',1]]),
    motif('shuffle',1,.62,.64,[[0,'kick',.5],[.5,'shaker',.5],[1,'hat',.5],[1.5,'shaker',.5],[2,'snare',.5],[2.5,'hat',.5],[3,'tom',.5],[3.5,'hat',.5]]),
    motif('fill',2,.8,.84,[[0,'kick',1],[1,'ride',1],[2,'snare',.5],[2.5,'tom',.5],[3,'floorTom',.25],[3.25,'tom',.25],[3.5,'snare',.5]]),
    motif('celebrate',2,.9,.96,[[0,'crash',.5],[.5,'hat',.5],[1,'snare',.5],[1.5,'kick',.5],[2,'ride',1],[3,'tom',.25],[3.25,'snare',.25],[3.5,'floorTom',.25],[3.75,'kick',.25]]),
  ],
};

export const PHRASE_TRANSITIONS = {
  held:{held:5,pulse:4,offbeat:2,broken:3,rolling:1,lift:1},
  pulse:{held:3,pulse:4,offbeat:3,broken:3,rolling:2,lift:1},
  offbeat:{held:4,pulse:3,offbeat:2,broken:3,rolling:2,lift:2},
  broken:{held:3,pulse:3,offbeat:2,broken:4,rolling:3,lift:1},
  rolling:{held:5,pulse:3,offbeat:2,broken:4,rolling:2,lift:1},
  lift:{held:6,pulse:4,offbeat:2,broken:3,rolling:1,lift:1},
  answer:{answer:5,arch:4,question:3,turn:2,cascade:1,ornament:1},
  arch:{answer:4,arch:3,question:3,turn:3,cascade:2,ornament:1},
  question:{answer:6,arch:3,question:2,turn:4,cascade:2,ornament:1},
  turn:{answer:4,arch:4,question:3,turn:2,cascade:3,ornament:2},
  cascade:{answer:6,arch:4,question:2,turn:3,cascade:1,ornament:1},
  ornament:{answer:7,arch:4,question:2,turn:2,cascade:1,ornament:1},
  heartbeat:{heartbeat:5,walking:4,backbeat:2,shuffle:2,fill:1,celebrate:1},
  walking:{heartbeat:3,walking:5,backbeat:3,shuffle:3,fill:1,celebrate:1},
  backbeat:{heartbeat:3,walking:4,backbeat:4,shuffle:3,fill:2,celebrate:1},
  shuffle:{heartbeat:4,walking:4,backbeat:3,shuffle:3,fill:2,celebrate:1},
  fill:{heartbeat:5,walking:6,backbeat:3,shuffle:2,fill:1,celebrate:1},
  celebrate:{heartbeat:6,walking:5,backbeat:2,shuffle:2,fill:1,celebrate:1},
};

export const COMPOSITION_PROGRESSIONS = [
  {name:'home',degrees:[0,3,4,0],modes:['major','minor'],transitions:{home:4,journey:4,song:2,minorWalk:2,majorTurn:2}},
  {name:'journey',degrees:[0,0,3,3,0,4,3,0],modes:['major','minor'],transitions:{home:5,journey:2,song:3,minorWalk:3,majorTurn:3}},
  {name:'song',degrees:[0,4,5,3],modes:['major','minor'],transitions:{home:4,journey:3,song:3,minorWalk:2,majorTurn:2}},
  {name:'minorWalk',degrees:[0,5,2,6,3,0,4,0],modes:['minor'],transitions:{home:5,journey:3,song:2,minorWalk:2}},
  {name:'majorTurn',degrees:[0,5,1,4,0,3,4,0],modes:['major'],transitions:{home:4,journey:3,song:3,majorTurn:2}},
];