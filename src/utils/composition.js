import {INSTRUMENTS,musicalKey} from './music.js';
import {equippedProfile} from './difficulty.js';
import {STRING_INSTRUMENTS,voiceStringEvent} from './guitar.js';
import {noteMidi,trumpetInput} from './autoplay.js';
import {fluteInput} from './wind.js';
import {midiNote,PIANO_NOTES,MARIMBA_NOTES,PANFLUTE_NOTES} from './performance.js';
import {COMPOSITION_PHRASES,PHRASE_TRANSITIONS,COMPOSITION_PROGRESSIONS} from '../data/compositionPhrases.js';
import {blendCompositionStyles,compositionStyle} from '../data/compositionStyles.js';
import {blendMovementFrames,distributeTension,ideaScheduleWeights,movementFrame,movementPerformance,planIdeaSchedule,smoothNoise,varyMovementShape} from './movementPlanner.js';

const chordInstruments=['piano','guitar','ukulele'];
const levels=['Simple','Standard','Advanced'];
const pitches=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const banks=new WeakMap();

function freeze(value) {
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function chordAt(root,degree) {
  const key=musicalKey(root);
  const tones=[0,2,4].map(offset=>(key.pitch+key.scale[(degree+offset)%7])%12);
  const quality=(tones[1]-tones[0]+12)%12===3?((tones[2]-tones[0]+12)%12===6?'dim':'m'):'';
  const labels=root.includes('b')||root==='Fm'?['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']:pitches;
  return {name:labels[tones[0]]+quality,degree,size:3,tones};
}

function bank(name,profile,chord) {
  if(STRING_INSTRUMENTS[name])return profile.chords.find(value=>value.degree===chord.degree&&value.size===3)?.notes??[];
  if(banks.has(profile))return banks.get(profile);
  const fixed={piano:PIANO_NOTES,marimba:MARIMBA_NOTES,panflute:PANFLUTE_NOTES}[name];
  const fullKeyboard=profile.level==='Advanced'&&['piano','marimba'].includes(name);
  const notes=fullKeyboard?fixed:fixed?profile.keyboardNotes.filter(note=>fixed.includes(note)):Array.from({length:60},(_,index)=>midiNote(48+index)).filter(note=>name==='melody'?(trumpetInput(note)?.partial??99)<profile.registers:(fluteInput(note)?.register??99)<profile.fluteRegisters);
  banks.set(profile,notes);
  return notes;
}

function playable(name,profile,chord) {
  if(name==='drums')return true;
  const available=bank(name,profile,chord);
  return available.some(note=>chord.tones.includes(noteMidi(note)%12));
}

function defaultRole(name,activeNames) {
  if(name==='drums')return 'rhythm';
  return chordInstruments.filter(instrument=>activeNames.includes(instrument)).slice(0,2).includes(name)?'accompaniment':'melody';
}

function motifs(role,profile,style) {
  return [...COMPOSITION_PHRASES[role],...(style.phrases[role]??[])].filter(value=>value.tier<=levels.indexOf(profile.level));
}

function render(name,root,role,motif,chord,nextChord,profile,previous,{tension=motif.energy,style,bar=0,seed=0,performance=style.performance[name]}={}) {
  const available=bank(name,profile,chord);
  const chordBank=available.filter(note=>chord.tones.includes(noteMidi(note)%12));
  const nextBank=name==='drums'?[]:bank(name,profile,nextChord).filter(note=>nextChord.tones.includes(noteMidi(note)%12));
  const center=chordBank.length?chordBank.map(noteMidi).reduce((sum,value)=>sum+value,0)/chordBank.length:0;
  const last=previous?.events.at(-1);
  let anchor=name==='drums'?0:last?noteMidi((last.notes??[last.note])[0]):center;
  const interval=toneIndex=>Math.floor(toneIndex/3)*12+(chord.tones[toneIndex%3]-chord.tones[0]+12)%12;
  const steps=motif.instrumentSteps[name]??motif.steps;
  let previousNotes;
  const events=steps.map(([beat,contour,length],index)=>{
    const sustained={2:'2n',1:'4n',.5:'8n',.25:'16n'};
    const breath={2:'4n.',1:'8n.',.5:'16n.',.25:'32n.'};
    const plucked={2:'4n',1:'8n',.5:'16n',.25:'32n'};
    const durations=['flute','melody','panflute'].includes(name)?breath:name==='marimba'||STRING_INSTRUMENTS[name]?plucked:sustained;
    // Event time is bars:beats:sixteenths; duration is a Tone note value, and pitches are note names.
    const event={time:`0:${Math.floor(beat)}:${Math.round((beat%1)*4)}`,dur:durations[length],gate:performance?.gate??1,velocity:Math.min(.72,.35+motif.energy*.25+(motif.dynamics[index]??0)*(performance?.accent??1)),swingOffset:style.swing&&Math.abs(beat%1-.5)<.001?style.swing:0};
    if(name==='drums')return {...event,note:contour};
    const maxNotes=name==='piano'?(profile.level==='Simple'?2:3):STRING_INSTRUMENTS[name]?4:1;
    const shape=role==='accompaniment'?contour.slice(0,maxNotes):contour.slice(0,1);
    const previousTone=steps[index-1]?.[1]?.[0]??shape[0];
    const primaryTarget=anchor+interval(shape[0])-interval(previousTone)+(tension-.5)*style.variation.registerSemitones;
    const notes=[];
    for(const toneIndex of shape){
      const localNoise=(smoothNoise(bar*.37+index*.61+(toneIndex%3)*.29,seed)-.5)*2;
      const variation=style.variation.maxToneStep*tension;
      const changedTone=toneIndex+(Math.abs(localNoise)<variation?(localNoise<0?-1:1):0);
      const tone=chord.tones[((changedTone%3)+3)%3];
      const target=primaryTarget+interval(changedTone)-interval(shape[0])+localNoise*variation;
      const remaining=chordBank.filter(note=>!notes.includes(note));
      const exact=remaining.filter(note=>noteMidi(note)%12===tone);
      const candidates=exact.length?exact:remaining;
      const score=note=>Math.abs(noteMidi(note)-target)+Math.abs(noteMidi(note)-center)*.12+(index===steps.length-1&&nextBank.length?Math.min(...nextBank.map(next=>Math.abs(noteMidi(next)-noteMidi(note))))*.7:0);
      candidates.sort((first,second)=>score(first)-score(second)||noteMidi(first)-noteMidi(second));
      if(!candidates.length)throw new Error(`Unplayable composition tone: ${name} ${root} ${chord.name}`);
      notes.push(candidates[0]);
    }
    // Repeated authored contours really repeat, even at a cadence or with local variation.
    if(motif.repeatContour&&previousNotes&&JSON.stringify(contour)===JSON.stringify(steps[index-1][1]))notes.splice(0,notes.length,...previousNotes);
    previousNotes=[...notes];
    anchor=noteMidi(notes[0]);
    const voiced={...event,...(role==='accompaniment'?{notes}:{note:notes[0]})};
    if(!STRING_INSTRUMENTS[name])return voiced;
    const canonical=profile.chords.find(value=>value.degree===chord.degree&&value.size===3);
    const result=voiceStringEvent(voiced,canonical);
    if(!result)throw new Error(`Unplayable composition voicing: ${name} ${root} ${chord.name}`);
    return result;
  });
  return freeze({name:motif.name,role,tier:motif.tier,degree:chord.degree,chord:chord.name,energy:motif.energy,complexity:motif.complexity,tension,idea:motif.idea??null,events});
}

export function compositionProfile(name,root,options={}) {
  if(!INSTRUMENTS[name])throw new Error(`Unknown instrument: ${name}`);
  const profile=equippedProfile(name,root,{...options,complexity:options.complexity??1.5});
  const style=compositionStyle(options.genre??'folk');
  const role=options.role??(name==='drums'?'rhythm':chordInstruments.includes(name)?'accompaniment':'melody');
  if(!COMPOSITION_PHRASES[role]||(name==='drums')!==(role==='rhythm'))throw new Error(`Invalid role for ${name}: ${role}`);
  const degrees=profile.level==='Simple'?[0,3,4]:profile.level==='Standard'?[0,1,2,3,4,5]:[0,1,2,3,4,5,6];
  return freeze((name==='drums'?[0]:degrees).filter(degree=>options.degree===undefined||degree===options.degree).flatMap(degree=>{
    const chord=chordAt(root,degree);
    if(!playable(name,profile,chord))return [];
    return motifs(role,profile,style).map(motif=>render(name,root,role,motif,chord,chordAt(root,0),profile,undefined,{style}));
  }));
}

export function phraseMotifs(name,root,options={}) {
  const pool=compositionProfile(name,root,options);
  const allowed=new Set(pool.map(phrase=>phrase.name));
  const style=compositionStyle(options.genre??'folk');
  return freeze([...Object.values(COMPOSITION_PHRASES).flat(),...Object.values(style.phrases).flat()].filter(value=>allowed.has(value.name)));
}

export class Composition {
  constructor({random=Math.random}={}) {
    if(typeof random!=='function')throw new TypeError('random must be a function');
    this.random=random;
    this.reset();
  }

  reset() {
    this.draws=[];
    this.drawBase=0;
    this.cursor=0;
    this.nextBar=0;
    this.plans=new Map();
    this.checkpoints=new Map();
    this.state={root:null,genre:null,tiers:{},progression:null,offset:0,queued:null,phrases:{},roles:{},membership:'',movement:null,queuedMovement:null,previousMovement:null};
  }

  invalidateFrom(bar) {
    if(!Number.isSafeInteger(bar)||bar<0)throw new RangeError('bar must be a nonnegative safe integer');
    if(bar<(this.plans.keys().next().value??this.nextBar))throw new RangeError('bar is outside retained composition history');
    const first=[...this.plans.keys()].find(value=>value>=bar);
    if(first===undefined)return;
    // Restore the saved random/state checkpoint before dropping this bar and all dependent plans.
    const checkpoint=this.checkpoints.get(first);
    this.state=structuredClone(checkpoint.state);
    this.cursor=checkpoint.cursor;
    this.nextBar=first;
    for(const value of [...this.plans.keys()])if(value>=bar){this.plans.delete(value);this.checkpoints.delete(value);}
  }

  choose(values,weights={}) {
    const total=values.reduce((sum,value)=>sum+(weights[value.name]??1),0);
    if(this.cursor===this.drawBase+this.draws.length){
      const draw=this.random();
      if(!Number.isFinite(draw)||draw<0||draw>=1)throw new RangeError('random must return a number in [0, 1)');
      this.draws.push(draw);
    }
    let target=this.draws[this.cursor++-this.drawBase]*total;
    return values.find(value=>(target-=weights[value.name]??1)<0)??values.at(-1);
  }

  planBar(bar,root,{active={},manualInstrument,performanceSettings={},phraseOverrides={},genre='folk',genreTransition}={}) {
    if(!Number.isSafeInteger(bar)||bar<0)throw new RangeError('bar must be a nonnegative safe integer');
    musicalKey(root);
    const mix=genreTransition&&genreTransition.from!==genre?Math.max(0,Math.min(1,(bar-genreTransition.startBar)/Math.max(1,genreTransition.durationBars))):1;
    const style=genreTransition&&genreTransition.from!==genre?blendCompositionStyles(genreTransition.from,genre,mix,genreTransition.fromPerformance):compositionStyle(genre);
    if(manualInstrument&&!INSTRUMENTS[manualInstrument])throw new Error(`Unknown instrument: ${manualInstrument}`);
    const activeNames=Object.keys(INSTRUMENTS).filter(name=>Array.isArray(active)?active.includes(name):active instanceof Set?active.has(name):active[name]);
    const names=Object.keys(INSTRUMENTS).filter(name=>activeNames.includes(name)||name===manualInstrument);
    const profiles=Object.fromEntries(names.map(name=>[name,equippedProfile(name,root,{complexity:name===manualInstrument?(performanceSettings[name]?.complexity??1.5):1.5})]));
    const overrides={};
    for(const [name,value] of Object.entries(phraseOverrides)){
      if(!names.includes(name))throw new Error(`Override instrument is not planned: ${name}`);
      const motifName=typeof value==='string'?value:value?.name;
      const fallbackRole=defaultRole(name,activeNames);
      const candidateRoles=value?.role?[value.role]:name==='drums'?['rhythm']:chordInstruments.includes(name)?[fallbackRole,fallbackRole==='accompaniment'?'melody':'accompaniment']:[fallbackRole];
      if(candidateRoles.some(role=>!['accompaniment','melody','rhythm'].includes(role)))throw new Error(`Invalid override role for ${name}: ${value.role}`);
      const selectedRole=candidateRoles.find(role=>motifs(role,profiles[name],style).some(candidate=>candidate.name===motifName));
      const motif=selectedRole&&motifs(selectedRole,profiles[name],style).find(candidate=>candidate.name===motifName);
      if(!motif)throw new Error(`Invalid override motif for ${name} ${candidateRoles.join('/')} ${profiles[name].level}: ${motifName}`);
      overrides[name]={motif,role:selectedRole};
    }
    // A cached plan is reusable only when every input that shapes its events still matches.
    const signature=JSON.stringify([root,genre,mix,genreTransition?.fromPerformance,activeNames,manualInstrument,names.map(name=>[name,profiles[name].level,overrides[name]?.motif.name,overrides[name]?.role])]);
    const cached=this.plans.get(bar);
    if(cached?.signature===signature)return cached.plan;
    if(cached)this.invalidateFrom(bar);
    if(bar<this.nextBar)throw new RangeError('bar is outside retained composition history');
    for(let current=this.nextBar;current<=bar;current++)this.buildBar(current,root,genre,mix,style,names,activeNames,profiles,signature,overrides);
    return this.plans.get(bar).plan;
  }

  createMovement(bar,style,names,activeNames,profiles,previousRoles={},previousMovement,overrides) {
    const controls=style.movementControls;
    const sourceShape=this.choose(style.movementShapes,style.movementShapeWeights);
    const seedChoice=this.choose(Array.from({length:32},(_,index)=>({name:`seed${index}`,value:(index+1)*7919})));
    const lengthChoices=[-controls.lengthVariation,0,controls.lengthVariation].map((value,index)=>({name:`length${index}`,value}));
    const ideaChoices=[-controls.ideaCountVariation,0,controls.ideaCountVariation].map((value,index)=>({name:`ideas${index}`,value}));
    const lengthOffset=this.choose(lengthChoices,{length0:1,length1:4,length2:1}).value;
    const ideaCountOffset=this.choose(ideaChoices,{ideas0:1,ideas1:4,ideas2:1}).value;
    const shape=varyMovementShape(sourceShape,seedChoice.value,{shapeVariation:controls.shapeVariation,lengthOffset,ideaCountOffset});
    const activeChordal=chordInstruments.filter(name=>activeNames.includes(name));
    const pairs=[];
    if(activeChordal.length<=1)pairs.push(activeChordal);
    else for(let first=0;first<activeChordal.length;first++)for(let second=first+1;second<activeChordal.length;second++)pairs.push([activeChordal[first],activeChordal[second]]);
    const pinnedAccompaniment=Object.entries(overrides).filter(([name,value])=>activeChordal.includes(name)&&value.role==='accompaniment').map(([name])=>name);
    const pinnedMelody=Object.entries(overrides).filter(([name,value])=>activeChordal.includes(name)&&value.role==='melody').map(([name])=>name);
    const validPairs=pairs.filter(pair=>pinnedAccompaniment.every(name=>pair.includes(name))&&pinnedMelody.every(name=>!pair.includes(name)));
    if(!validPairs.length)throw new Error('No accompaniment assignment satisfies the pinned phrase roles');
    let accompanimentPair=validPairs[0];
    if(previousMovement||Object.keys(previousRoles).length){
      const previousPair=chordInstruments.filter(name=>previousRoles[name]==='accompaniment');
      const candidates=validPairs.map(pair=>({name:pair.join('+')||'none',members:pair}));
      const weights=Object.fromEntries(candidates.map(({name,members})=>{
        const shared=members.filter(instrument=>previousPair.includes(instrument)).length;
        return [name,previousPair.length?shared===members.length?style.accompanimentStickiness:shared?1.4:.35:1];
      }));
      accompanimentPair=this.choose(candidates,weights).members;
    }
    const accompanimentSet=new Set(accompanimentPair);
    const roles=Object.fromEntries(names.map(name=>[name,name==='drums'?'rhythm':activeChordal.includes(name)&&accompanimentSet.has(name)?'accompaniment':'melody']));
    const available=Object.entries(style.ideas).filter(([,idea])=>names.every(name=>motifs(roles[name],profiles[name],style).some(motif=>idea[roles[name]]?.includes(motif.name))));
    const families=available.length?available:Object.entries(style.ideas);
    const forced=[...new Set(Object.entries(overrides).map(([name,value])=>families.find(([,idea])=>idea[roles[name]]?.includes(value.motif.name))?.[0]).filter(Boolean))];
    const requested=Math.min(families.length,Math.max(shape.ideaCount,forced.length));
    const ideas=[...forced];
    while(ideas.length<requested){
      const remaining=families.filter(([name])=>!ideas.includes(name));
      const weights=Object.fromEntries(remaining.map(([name])=>[name,(style.familyWeights[name]??1)*(previousMovement?.ideas.includes(name)?(controls.ideaStickiness??3):1)]));
      ideas.push(this.choose(remaining.map(([name])=>({name})),weights).name);
    }
    const melodyMotifs=[...new Set(ideas.flatMap(family=>style.ideas[family]?.melody??[]))].filter(name=>names.some(instrument=>roles[instrument]==='melody'&&motifs('melody',profiles[instrument],style).some(motif=>motif.name===name)));
    const anchorChoices=melodyMotifs.map(name=>({name}));
    const anchorWeights=Object.fromEntries(anchorChoices.map(({name})=>[name,previousMovement?.melodicAnchor===name?controls.anchorStickiness:1]));
    const melodicAnchor=anchorChoices.length?this.choose(anchorChoices,anchorWeights).name:null;
    const similarities=controls.melodicSimilarity.map((value,index)=>({name:`similarity${index}`,value}));
    const melodicSimilarity=similarities.length?this.choose(similarities).value:.4;
    const ideaSchedule=planIdeaSchedule(ideas,shape.length,{
      overlap:controls.ideaOverlap,
      phaseVariation:controls.ideaPhaseVariation,
      seed:seedChoice.value,
    });
    return {shape,startBar:bar,seed:seedChoice.value,ideas,ideaSchedule,roles,melodicAnchor,melodicSimilarity};
  }

  buildBar(bar,root,genre,mix,style,names,activeNames,profiles,signature,overrides) {
    this.checkpoints.set(bar,{cursor:this.cursor,state:structuredClone(this.state)});
    const state=this.state;
    if(state.root!==root||state.genre!==genre){
      state.root=root;state.genre=genre;state.progression=null;state.offset=0;state.queued=null;state.phrases={};state.movement=null;state.queuedMovement=null;state.previousMovement=null;
    }
    const membership=activeNames.join(',');
    if(state.membership!==membership){
      state.membership=membership;
      state.movement=null;state.queuedMovement=null;state.previousMovement=null;
    }
    if(state.movement&&bar>=state.movement.startBar+state.movement.shape.length){
      state.previousMovement=state.movement;
      state.movement=state.queuedMovement;
      state.queuedMovement=null;
    }
    if(!state.movement)state.movement=this.createMovement(bar,style,names,activeNames,profiles,state.roles,state.previousMovement,overrides);
    state.roles=state.movement.roles;
    const movementEnd=state.movement.startBar+state.movement.shape.length;
    const transitionBars=Math.min(style.movementControls.transitionBars,state.movement.shape.length-2);
    if(!state.queuedMovement&&bar>=movementEnd-transitionBars)state.queuedMovement=this.createMovement(movementEnd,style,names,activeNames,profiles,state.movement.roles,state.movement,overrides);
    if(state.previousMovement&&bar>=state.movement.startBar+transitionBars)state.previousMovement=null;
    const roles=Object.fromEntries(names.map(name=>[name,state.movement.roles[name]??(name==='drums'?'rhythm':'melody')]));
    const transitionFrom=state.previousMovement??state.movement;
    const transitionTo=state.queuedMovement??state.movement;
    let transitionProgress=0;
    if(transitionFrom!==transitionTo){
      const boundary=state.queuedMovement?movementEnd:state.movement.startBar;
      transitionProgress=Math.max(0,Math.min(1,(bar-(boundary-transitionBars)+1)/(2*transitionBars)));
    }
    const currentFrame=movementFrame(transitionFrom,transitionFrom===state.movement?bar:transitionFrom.startBar+transitionFrom.shape.length-1,style);
    const nextFrame=movementFrame(transitionTo,transitionTo===state.movement?bar:transitionTo.startBar,style);
    const movement=transitionFrom===transitionTo?currentFrame:blendMovementFrames(currentFrame,nextFrame,transitionProgress);
    const melodicSimilarity=transitionFrom.melodicSimilarity+(transitionTo.melodicSimilarity-transitionFrom.melodicSimilarity)*transitionProgress;
    const performance=movementPerformance(style,transitionFrom.seed,transitionTo.seed,transitionProgress);
    const familyEntries=new Map();
    const fromSchedule=ideaScheduleWeights(transitionFrom.ideaSchedule,currentFrame.position);
    const toSchedule=ideaScheduleWeights(transitionTo.ideaSchedule,nextFrame.position);
    for(const [family,weight] of Object.entries(fromSchedule))familyEntries.set(family,(familyEntries.get(family)??0)+weight*(transitionFrom===transitionTo?1:1-transitionProgress));
    for(const [family,weight] of Object.entries(toSchedule))familyEntries.set(family,(familyEntries.get(family)??0)+weight*(transitionFrom===transitionTo?0:transitionProgress));
    for(const [name,override] of Object.entries(overrides)){
      const family=[...transitionFrom.ideas,...transitionTo.ideas].find(value=>style.ideas[value]?.[roles[name]]?.includes(override.motif.name));
      if(family)familyEntries.set(family,Math.max(1,familyEntries.get(family)??0));
    }
    const movementIdeas=[...new Set([...transitionFrom.ideas,...transitionTo.ideas])];
    const movementIdeaWeight=family=>familyEntries.get(family)??0;
    const tensions=distributeTension(movement.tension,roles,style);
    const mode=musicalKey(root).minor?'minor':'major';
    const progressions=[...COMPOSITION_PROGRESSIONS,...style.progressions.filter(value=>!COMPOSITION_PROGRESSIONS.some(base=>base.name===value.name))];
    const allowed=progressions.filter(value=>value.modes.includes(mode)&&value.degrees.every(degree=>names.every(name=>{
      if(profiles[name].level==='Simple'&&![0,3,4].includes(degree))return false;
      if(profiles[name].level==='Standard'&&degree===6)return false;
      return playable(name,profiles[name],chordAt(root,degree));
    })));
    if(!allowed.length)throw new Error(`No playable progression for ${root}`);
    const progressionWeights=values=>Object.fromEntries(values.map(value=>[value.name,(value.transitions?.[state.progression?.name]??style.progressionWeights[value.name]??1)*Math.exp(-Math.abs((value.tension??.5)-movement.tension)*style.harmonyTensionBias)]));
    if(!state.progression||!allowed.some(value=>value.name===state.progression.name)){
      state.progression=this.choose(allowed,progressionWeights(allowed));
      state.offset=0;state.queued=null;
    }
    const currentChord=chordAt(root,state.progression.degrees[state.offset]);
    const end=state.offset===state.progression.degrees.length-1;
    if(end)state.queued=this.choose(allowed,progressionWeights(allowed));
    const nextChord=chordAt(root,end?state.queued.degrees[0]:state.progression.degrees[state.offset+1]);
    const phrases={};
    for(const name of names){
      const role=roles[name];
      const previous=state.tiers[name]===profiles[name].level&&state.phrases[name]?.role===role?state.phrases[name]:undefined;
      const availableMotifs=motifs(role,profiles[name],style).filter(motif=>movementIdeas.some(family=>movementIdeaWeight(family)>0&&style.ideas[family]?.[role]?.includes(motif.name)));
      const heldMotifs=previous?.idea&&movementIdeaWeight(previous.idea)>=style.movementControls.ideaHoldWeight?availableMotifs.filter(motif=>style.ideas[previous.idea]?.[role]?.includes(motif.name)):[];
      const candidates=heldMotifs.length?heldMotifs:availableMotifs.length?availableMotifs:motifs(role,profiles[name],style);
      const transitionWeights={...(PHRASE_TRANSITIONS[previous?.name]??{}),...(style.motifTransitions[previous?.name]??{})};
      const planned=[...Object.values(phrases)];
      const weights=Object.fromEntries(candidates.map(motif=>{
        const motifFamilies=movementIdeas.filter(family=>movementIdeaWeight(family)>0&&style.ideas[family]?.[role]?.includes(motif.name));
        const sharesIdea=planned.some(phrase=>motifFamilies.includes(phrase.idea));
        const answersAccompaniment=role==='melody'&&planned.some(phrase=>phrase.role==='accompaniment')&&style.coordination.responseMotifs.includes(motif.name);
        const sameMelodicThread=role==='melody'&&planned.some(phrase=>phrase.role==='melody'&&phrase.name===motif.name);
        const continuesIdea=previous?.idea&&motifFamilies.includes(previous.idea);
        const fromAnchor=motif.name===transitionFrom.melodicAnchor?1-transitionProgress:0;
        const toAnchor=motif.name===transitionTo.melodicAnchor?transitionProgress:0;
        const anchorAffinity=Math.max(fromAnchor,toAnchor);
        const coordination=(sharesIdea?1+style.coordination.sharedIdeaBias:1)*(answersAccompaniment?1+style.coordination.callResponseBias:1)*(sameMelodicThread?1+melodicSimilarity:1)*(continuesIdea?1+style.movementControls.ideaContinuity:1)*(role==='melody'?1+anchorAffinity*melodicSimilarity*2:1);
        const familyAffinity=motifFamilies.reduce((maximum,family)=>Math.max(maximum,movementIdeaWeight(family)),0);
        return [motif.name,(motif.instrumentWeights?.[name]??1)*(transitionWeights[motif.name]??1)*(style.motifWeights?.[motif.name]??1)*Math.max(.001,familyAffinity)*Math.exp(-Math.abs(motif.energy-tensions[name])*2.2)*coordination];
      }));
      const motif=overrides[name]?.motif??this.choose(candidates,weights);
      const motifFamilies=movementIdeas.filter(family=>style.ideas[family]?.[role]?.includes(motif.name));
      const idea=previous?.idea&&motifFamilies.includes(previous.idea)&&movementIdeaWeight(previous.idea)>0?previous.idea:motifFamilies.sort((first,second)=>movementIdeaWeight(second)-movementIdeaWeight(first))[0]??null;
      phrases[name]=render(name,root,role,{...motif,idea},currentChord,nextChord,profiles[name],previous,{tension:tensions[name]??movement.tension,style,bar,seed:state.movement.seed,performance:performance[name]});
    }
    const movementPlan={
      name:state.movement.shape.name,startBar:state.movement.startBar,index:bar-state.movement.startBar,length:state.movement.shape.length,performance,
      section:movement.section,position:movement.position,targetTension:movement.targetTension,tension:movement.tension,noise:movement.noise,
      ideas:movementIdeas,currentIdeas:[...state.movement.ideas],nextIdeas:state.queuedMovement?[...state.queuedMovement.ideas]:[],
      ideaSchedule:[...state.movement.ideaSchedule],handoffFromIdeaSchedule:state.previousMovement?[...state.previousMovement.ideaSchedule]:[],nextIdeaSchedule:state.queuedMovement?[...state.queuedMovement.ideaSchedule]:[],
      activeIdeas:movementIdeas.filter(family=>movementIdeaWeight(family)>.05),ideaWeights:Object.fromEntries(familyEntries),
      nextName:state.queuedMovement?.shape.name??null,transitionFrom:transitionFrom===transitionTo?null:transitionFrom.shape.name,
      transitionTo:transitionFrom===transitionTo?null:transitionTo.shape.name,transitionProgress,melodicSimilarity,
      melodicAnchor:transitionProgress<.5?transitionFrom.melodicAnchor:transitionTo.melodicAnchor,
      melodicAnchors:[transitionFrom.melodicAnchor,transitionTo.melodicAnchor],
    };
    const plan=freeze({bar,root,genre,genreBlend:mix,movement:movementPlan,activeNames:[...activeNames],tensions,currentChord,nextChord,roles,phrases,progression:state.progression.name,progressionOffset:state.offset});
    this.plans.set(bar,{signature,plan});
    state.phrases=phrases;
    state.tiers=Object.fromEntries(names.map(name=>[name,profiles[name].level]));
    if(end){state.progression=state.queued;state.queued=null;state.offset=0;}else state.offset++;
    this.nextBar=bar+1;
    while(this.plans.size>8){
      const oldest=this.plans.keys().next().value;
      this.plans.delete(oldest);this.checkpoints.delete(oldest);
    }
    const floor=this.checkpoints.values().next().value.cursor;
    this.draws.splice(0,floor-this.drawBase);this.drawBase=floor;
  }
}
