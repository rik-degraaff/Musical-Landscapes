import {INSTRUMENTS,musicalKey} from './music.js';
import {equippedProfile} from './difficulty.js';
import {STRING_INSTRUMENTS,voiceStringEvent} from './guitar.js';
import {noteMidi,trumpetInput} from './autoplay.js';
import {fluteInput} from './wind.js';
import {midiNote,PIANO_NOTES,MARIMBA_NOTES,PANFLUTE_NOTES} from './performance.js';
import {COMPOSITION_PHRASES,PHRASE_TRANSITIONS,COMPOSITION_PROGRESSIONS} from '../data/compositionPhrases.js';

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

function motifs(role,profile) {
  return COMPOSITION_PHRASES[role].filter(value=>value.tier<=levels.indexOf(profile.level));
}

function render(name,root,role,motif,chord,nextChord,profile,previous) {
  const available=bank(name,profile,chord);
  const chordBank=available.filter(note=>chord.tones.includes(noteMidi(note)%12));
  const nextBank=name==='drums'?[]:bank(name,profile,nextChord).filter(note=>nextChord.tones.includes(noteMidi(note)%12));
  const center=chordBank.length?chordBank.map(noteMidi).reduce((sum,value)=>sum+value,0)/chordBank.length:0;
  const last=previous?.events.at(-1);
  let anchor=name==='drums'?0:last?noteMidi((last.notes??[last.note])[0]):center;
  const interval=toneIndex=>Math.floor(toneIndex/3)*12+(chord.tones[toneIndex%3]-chord.tones[0]+12)%12;
  const steps=motif.instrumentSteps[name]??motif.steps;
  const events=steps.map(([beat,contour,length],index)=>{
    const sustained={2:'2n',1:'4n',.5:'8n',.25:'16n'};
    const breath={2:'4n.',1:'8n.',.5:'16n.',.25:'32n.'};
    const plucked={2:'4n',1:'8n',.5:'16n',.25:'32n'};
    const durations=['flute','melody','panflute'].includes(name)?breath:name==='marimba'||STRING_INSTRUMENTS[name]?plucked:sustained;
    const event={time:`0:${Math.floor(beat)}:${Math.round((beat%1)*4)}`,dur:durations[length],velocity:Math.min(.85,.35+motif.energy*.25+(motif.dynamics[index]??0))};
    if(name==='drums')return {...event,note:contour};
    const maxNotes=name==='piano'?(profile.level==='Simple'?2:3):STRING_INSTRUMENTS[name]?4:1;
    const shape=role==='accompaniment'?contour.slice(0,maxNotes):contour.slice(0,1);
    const previousTone=steps[index-1]?.[1]?.[0]??shape[0];
    const primaryTarget=anchor+interval(shape[0])-interval(previousTone);
    const notes=[];
    for(const toneIndex of shape){
      const tone=chord.tones[toneIndex%3];
      const target=primaryTarget+interval(toneIndex)-interval(shape[0]);
      const remaining=chordBank.filter(note=>!notes.includes(note));
      const exact=remaining.filter(note=>noteMidi(note)%12===tone);
      const candidates=exact.length?exact:remaining;
      const score=note=>Math.abs(noteMidi(note)-target)+Math.abs(noteMidi(note)-center)*.12+(index===steps.length-1&&nextBank.length?Math.min(...nextBank.map(next=>Math.abs(noteMidi(next)-noteMidi(note))))*.7:0);
      candidates.sort((first,second)=>score(first)-score(second)||noteMidi(first)-noteMidi(second));
      if(!candidates.length)throw new Error(`Unplayable composition tone: ${name} ${root} ${chord.name}`);
      notes.push(candidates[0]);
    }
    anchor=noteMidi(notes[0]);
    const voiced={...event,...(role==='accompaniment'?{notes}:{note:notes[0]})};
    if(!STRING_INSTRUMENTS[name])return voiced;
    const canonical=profile.chords.find(value=>value.degree===chord.degree&&value.size===3);
    const result=voiceStringEvent(voiced,canonical);
    if(!result)throw new Error(`Unplayable composition voicing: ${name} ${root} ${chord.name}`);
    return result;
  });
  return freeze({name:motif.name,role,tier:motif.tier,degree:chord.degree,chord:chord.name,energy:motif.energy,complexity:motif.complexity,events});
}

export function compositionProfile(name,root,options={}) {
  if(!INSTRUMENTS[name])throw new Error(`Unknown instrument: ${name}`);
  const profile=equippedProfile(name,root,{...options,complexity:options.complexity??1.5});
  const role=options.role??(name==='drums'?'rhythm':chordInstruments.includes(name)?'accompaniment':'melody');
  if(!COMPOSITION_PHRASES[role]||(name==='drums')!==(role==='rhythm'))throw new Error(`Invalid role for ${name}: ${role}`);
  const degrees=profile.level==='Simple'?[0,3,4]:profile.level==='Standard'?[0,1,2,3,4,5]:[0,1,2,3,4,5,6];
  return freeze((name==='drums'?[0]:degrees).filter(degree=>options.degree===undefined||degree===options.degree).flatMap(degree=>{
    const chord=chordAt(root,degree);
    if(!playable(name,profile,chord))return [];
    return motifs(role,profile).map(motif=>render(name,root,role,motif,chord,chordAt(root,0),profile));
  }));
}

export function phraseMotifs(name,root,options={}) {
  const pool=compositionProfile(name,root,options);
  const allowed=new Set(pool.map(phrase=>phrase.name));
  return freeze(Object.values(COMPOSITION_PHRASES).flat().filter(value=>allowed.has(value.name)));
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
    this.state={root:null,tiers:{},progression:null,offset:0,queued:null,phrases:{},roles:{},membership:''};
  }

  invalidateFrom(bar) {
    if(!Number.isSafeInteger(bar)||bar<0)throw new RangeError('bar must be a nonnegative safe integer');
    if(bar<(this.plans.keys().next().value??this.nextBar))throw new RangeError('bar is outside retained composition history');
    const first=[...this.plans.keys()].find(value=>value>=bar);
    if(first===undefined)return;
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

  planBar(bar,root,{active={},manualInstrument,performanceSettings={},phraseOverrides={}}={}) {
    if(!Number.isSafeInteger(bar)||bar<0)throw new RangeError('bar must be a nonnegative safe integer');
    musicalKey(root);
    if(manualInstrument&&!INSTRUMENTS[manualInstrument])throw new Error(`Unknown instrument: ${manualInstrument}`);
    const activeNames=Object.keys(INSTRUMENTS).filter(name=>Array.isArray(active)?active.includes(name):active instanceof Set?active.has(name):active[name]);
    const names=Object.keys(INSTRUMENTS).filter(name=>activeNames.includes(name)||name===manualInstrument);
    const profiles=Object.fromEntries(names.map(name=>[name,equippedProfile(name,root,{complexity:name===manualInstrument?(performanceSettings[name]?.complexity??1.5):1.5})]));
    const accompaniment=chordInstruments.filter(name=>activeNames.includes(name)).slice(0,2);
    const roles=Object.fromEntries(names.map(name=>[name,name==='drums'?'rhythm':accompaniment.includes(name)?'accompaniment':'melody']));
    const overrides={};
    for(const [name,value] of Object.entries(phraseOverrides)){
      if(!names.includes(name))throw new Error(`Override instrument is not planned: ${name}`);
      const motifName=typeof value==='string'?value:value?.name;
      if(value?.role&&value.role!==roles[name])throw new Error(`Invalid override role for ${name}: ${value.role}`);
      const motif=motifs(roles[name],profiles[name]).find(candidate=>candidate.name===motifName);
      if(!motif)throw new Error(`Invalid override motif for ${name} ${roles[name]} ${profiles[name].level}: ${motifName}`);
      overrides[name]=motif;
    }
    const signature=JSON.stringify([root,activeNames,manualInstrument,names.map(name=>[name,profiles[name].level,overrides[name]?.name,roles[name]])]);
    const cached=this.plans.get(bar);
    if(cached?.signature===signature)return cached.plan;
    if(cached)this.invalidateFrom(bar);
    if(bar<this.nextBar)throw new RangeError('bar is outside retained composition history');
    for(let current=this.nextBar;current<=bar;current++)this.buildBar(current,root,names,activeNames,profiles,signature,overrides);
    return this.plans.get(bar).plan;
  }

  buildBar(bar,root,names,activeNames,profiles,signature,overrides) {
    this.checkpoints.set(bar,{cursor:this.cursor,state:structuredClone(this.state)});
    const state=this.state;
    if(state.root!==root){
      state.root=root;state.progression=null;state.offset=0;state.queued=null;state.phrases={};
    }
    const membership=activeNames.join(',');
    if(state.membership!==membership){
      const accompaniment=chordInstruments.filter(name=>activeNames.includes(name)).slice(0,2);
      state.roles=Object.fromEntries(activeNames.map(name=>[name,name==='drums'?'rhythm':accompaniment.includes(name)?'accompaniment':'melody']));
      state.membership=membership;
    }
    const roles=Object.fromEntries(names.map(name=>[name,state.roles[name]??(name==='drums'?'rhythm':'melody')]));
    const mode=musicalKey(root).minor?'minor':'major';
    const allowed=COMPOSITION_PROGRESSIONS.filter(value=>value.modes.includes(mode)&&value.degrees.every(degree=>names.every(name=>{
      if(profiles[name].level==='Simple'&&![0,3,4].includes(degree))return false;
      if(profiles[name].level==='Standard'&&degree===6)return false;
      return playable(name,profiles[name],chordAt(root,degree));
    })));
    if(!allowed.length)throw new Error(`No playable progression for ${root}`);
    if(!state.progression||!allowed.some(value=>value.name===state.progression.name)){
      state.progression=this.choose(allowed,state.progression?.transitions);
      state.offset=0;state.queued=null;
    }
    const currentChord=chordAt(root,state.progression.degrees[state.offset]);
    const end=state.offset===state.progression.degrees.length-1;
    if(end)state.queued=this.choose(allowed,state.progression.transitions);
    const nextChord=chordAt(root,end?state.queued.degrees[0]:state.progression.degrees[state.offset+1]);
    const phrases={};
    for(const name of names){
      const role=roles[name];
      const previous=state.tiers[name]===profiles[name].level&&state.phrases[name]?.role===role?state.phrases[name]:undefined;
      const motif=overrides[name]??this.choose(motifs(role,profiles[name]),PHRASE_TRANSITIONS[previous?.name]);
      phrases[name]=render(name,root,role,motif,currentChord,nextChord,profiles[name],previous);
    }
    const plan=freeze({bar,root,currentChord,nextChord,roles,phrases,progression:state.progression.name,progressionOffset:state.offset});
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