import test from 'node:test';
import assert from 'node:assert/strict';
import {Composition,compositionProfile,phraseMotifs} from '../src/utils/composition.js';
import {COMPOSITION_PHRASES,COMPOSITION_PROGRESSIONS,PHRASE_TRANSITIONS} from '../src/data/compositionPhrases.js';
import {COMPOSITION_STYLES} from '../src/data/compositionStyles.js';
import {INSTRUMENTS} from '../src/utils/music.js';
import {equippedProfile} from '../src/utils/difficulty.js';
import {STRING_INSTRUMENTS} from '../src/utils/guitar.js';
import {noteMidi,trumpetInput} from '../src/utils/autoplay.js';
import {fluteInput} from '../src/utils/wind.js';
import {PIANO_NOTES,MARIMBA_NOTES,PANFLUTE_NOTES} from '../src/utils/performance.js';

const roots=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C#m','Am','Fm','Db'];
const names=Object.keys(INSTRUMENTS);
function random(seed=13) {return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function assertPlayable(name,root,complexity,phrase,chord) {
  const profile=equippedProfile(name,root,{complexity});
  assert.ok(phrase.events.length);
  if(complexity<=1)assert.ok(phrase.events.length<=(complexity<=.5?4:8));
  for(const event of phrase.events){
    const subdivision=Number(event.time.split(':')[2]);
    assert.ok(complexity<=.5?subdivision===0:complexity<=1?[0,2].includes(subdivision):[0,1,2,3].includes(subdivision));
    const notes=event.notes??[event.note];
    assert.ok(notes.length<=(name==='piano'?(complexity<=.5?2:3):STRING_INSTRUMENTS[name]?4:1));
    if(name==='drums'){assert.ok(profile.hits.includes(event.note));continue;}
    for(const note of notes){
      if(chord)assert.ok(chord.tones.includes(noteMidi(note)%12));
      if(name==='melody')assert.ok((trumpetInput(note)?.partial??99)<profile.registers);
      else if(name==='flute')assert.ok((fluteInput(note)?.register??99)<profile.fluteRegisters);
      else if(!STRING_INSTRUMENTS[name]){
        if(complexity<=1||name==='panflute')assert.ok(profile.keyboardNotes.includes(note),`${name} ${root} ${note}`);
        assert.ok(({piano:PIANO_NOTES,marimba:MARIMBA_NOTES,panflute:PANFLUTE_NOTES})[name].includes(note));
      }
    }
    if(STRING_INSTRUMENTS[name]){
      const canonical=profile.chords.find(value=>value.name===event.chord);
      assert.ok(canonical);
      if(chord)assert.equal(canonical.degree,chord.degree);
      assert.equal(new Set(event.fingering.map(value=>value.string)).size,notes.length);
      event.fingering.forEach((value,index)=>{
        assert.equal(value.note,notes[index]);assert.equal(value.note,canonical.notes[value.string]);assert.equal(value.fret,canonical.frets[value.string]);
      });
    }
  }
}

for(const root of roots)for(const complexity of [.35,1,1.5])test(`composition pools and plans: ${root} complexity ${complexity}, every instrument role`,()=>{
    for(const name of names)for(const role of name==='drums'?['rhythm']:['melody',...( ['piano','guitar','ukulele'].includes(name)?['accompaniment']:[])]){
      const pool=compositionProfile(name,root,{complexity,role});
      assert.ok(pool.length>=2);
      const states=new Set(pool.map(phrase=>phrase.name));
      const maxTier=complexity<=.5?0:complexity<=1?1:2;
      const authored=[...COMPOSITION_PHRASES[role],...COMPOSITION_STYLES.folk.phrases[role]].filter(phrase=>phrase.tier<=maxTier);
      assert.equal(states.size,new Set(authored.map(phrase=>phrase.name)).size);
      for(let tier=0;tier<=(complexity<=.5?0:complexity<=1?1:2);tier++){
        for(const degree of new Set(pool.map(phrase=>phrase.degree))){
          const signatures=new Set(pool.filter(phrase=>phrase.degree===degree&&phrase.tier===tier).map(phrase=>JSON.stringify(phrase.events.map(event=>[event.time,event.dur,event.notes??event.note]))));
          assert.ok(signatures.size>=2,`${name} ${root} ${role} tier ${tier} degree ${degree} distinct authored motifs`);
        }
      }
      pool.forEach(phrase=>assertPlayable(name,root,complexity,phrase));
    }
    const composer=new Composition({random:random()});
    const options={active:names,manualInstrument:'piano',performanceSettings:Object.fromEntries(names.map(name=>[name,{complexity}]))};
    for(let bar=0;bar<100;bar++){
      const plan=composer.planBar(bar,root,options);
      assert.ok(Object.values(plan.roles).filter(role=>role==='accompaniment').length<=2);
      assert.equal(plan.roles.drums,'rhythm');
      for(const name of names)assertPlayable(name,root,name==='piano'?complexity:1.5,plan.phrases[name],plan.currentChord);
      if(complexity<=.5)assert.ok([0,3,4].includes(plan.currentChord.degree));
      if(complexity<=1)assert.ok(plan.currentChord.degree<6);
    }
});

test('flat scene chord labels match string libraries while pitches stay sharp',()=>{
  for(const root of ['Db','Fm'])for(const name of ['guitar','ukulele']){
    const profile=equippedProfile(name,root,{complexity:1.5});
    const composer=new Composition({random:random()});
    for(let bar=0;bar<20;bar++){
      const plan=composer.planBar(bar,root,{active:[name]});
      for(const chord of [plan.currentChord,plan.nextChord]){
        const canonical=profile.chords.find(value=>value.degree===chord.degree&&value.size===3);
        assert.equal(chord.name,canonical.name);
        assert.deepEqual(chord.tones,canonical.tones);
      }
      assert.ok(plan.phrases[name].events.flatMap(event=>event.notes??[event.note]).every(note=>!note.includes('b')));
    }
  }
});

test('whole progression states and independent named phrase transitions are explicit and tiered',()=>{
  for(const progression of COMPOSITION_PROGRESSIONS){
    assert.ok([4,8].includes(progression.degrees.length));
    assert.ok(Object.values(progression.transitions).every(weight=>weight>0));
  }
  for(const pool of Object.values(COMPOSITION_PHRASES)){
    for(const tier of [0,1,2])assert.ok(pool.filter(value=>value.tier===tier).length>=2);
    for(const state of pool){
      assert.deepEqual(Object.keys(PHRASE_TRANSITIONS[state.name]).sort(),pool.map(value=>value.name).sort());
      assert.ok(Object.values(PHRASE_TRANSITIONS[state.name]).every(weight=>weight>0));
    }
  }
  const composer=new Composition({random:random()});
  let previous;
  for(let bar=0;bar<100;bar++){
    const plan=composer.planBar(bar,'C',{active:names});
    const progression=COMPOSITION_PROGRESSIONS.find(value=>value.name===plan.progression);
    assert.equal(plan.currentChord.degree,progression.degrees[plan.progressionOffset]);
    if(previous){
      assert.deepEqual(previous.nextChord,plan.currentChord);
      for(const name of names){
        const from=previous.phrases[name].name,to=plan.phrases[name].name;
        const weights={...(PHRASE_TRANSITIONS[from]??{}),...(COMPOSITION_STYLES[plan.genre].motifTransitions[from]??{})};
        assert.ok((weights[to]??1)>0);
      }
      if(previous.progressionOffset<COMPOSITION_PROGRESSIONS.find(value=>value.name===previous.progression).degrees.length-1){
        assert.equal(plan.progression,previous.progression);assert.equal(plan.progressionOffset,previous.progressionOffset+1);
      }else assert.ok(COMPOSITION_PROGRESSIONS.find(value=>value.name===previous.progression).transitions[plan.progression]>0);
    }
    previous=plan;
  }
});

test('both genres reuse the original phrase vocabulary and add distinct varied motifs per role',()=>{
  const folk=COMPOSITION_STYLES.folk,jazz=COMPOSITION_STYLES.jazz;
  for(const role of Object.keys(COMPOSITION_PHRASES)){
    const legacyNames=COMPOSITION_PHRASES[role].map(motif=>motif.name);
    for(const style of [folk,jazz]){
      const referenced=new Set(Object.values(style.ideas).flatMap(idea=>idea[role]??[]));
      legacyNames.forEach(name=>assert.ok(referenced.has(name),`${style.id} ${role} retains ${name}`));
      const names=style.phrases[role].map(motif=>motif.name);
      assert.ok(names.length>=3);
      assert.equal(new Set(names).size,names.length);
      assert.ok(new Set(style.phrases[role].map(motif=>motif.tier)).size>=2);
      assert.ok(new Set(style.phrases[role].map(motif=>motif.energy)).size>=3);
    }
    const folkNames=new Set(folk.phrases[role].map(motif=>motif.name));
    assert.ok(jazz.phrases[role].some(motif=>!folkNames.has(motif.name)),`${role} has Jazz-exclusive material`);
  }
});

test('all genre-specific phrase variants remain playable at each instrument tier',()=>{
  for(const genre of ['folk','jazz'])for(const root of ['C','Am'])for(const complexity of [.35,1,1.5]){
    for(const name of names){
      const roles=name==='drums'?['rhythm']:['melody',...( ['piano','guitar','ukulele'].includes(name)?['accompaniment']:[])];
      for(const role of roles){
        const pool=compositionProfile(name,root,{genre,complexity,role});
        assert.ok(pool.length>=2,`${genre} ${name} ${role} ${complexity}`);
        pool.forEach(phrase=>assertPlayable(name,root,complexity,phrase));
      }
    }
  }
});

test('cache and retained rollback replay draws, reset starts a fresh musical session',()=>{
  let calls=0;const generator=random();
  const composer=new Composition({random:()=>{calls++;return generator();}});
  const options={active:names};
  const plans=Array.from({length:12},(_,bar)=>composer.planBar(bar,'C',options));
  const count=calls;
  assert.equal(composer.planBar(4,'C',options),plans[4]);assert.equal(calls,count);
  composer.invalidateFrom(4);
  for(let bar=4;bar<12;bar++)assert.deepEqual(composer.planBar(bar,'C',options),plans[bar]);
  assert.equal(calls,count);
  composer.invalidateFrom(4);
  const changed=composer.planBar(4,'Fm',options);
  assert.equal(changed.root,'Fm');assert.notDeepEqual(changed.currentChord,plans[4].currentChord);
  assert.throws(()=>composer.planBar(3,'C',options),RangeError);
  composer.reset();
  assert.equal(composer.draws.length,0);
  const fresh=composer.planBar(0,'C',options);
  assert.ok(calls>count);assert.notDeepEqual(fresh,plans[0]);
  assert.throws(()=>{plans[0].phrases.piano.events[0].notes.push('C9');},TypeError);
});

test('roles stay stable until membership changes and manual equip does not displace active roles',()=>{
  const composer=new Composition({random:random()});
  const active=['piano','guitar','ukulele','drums'];
  const first=composer.planBar(0,'C',{active});
  assert.deepEqual(first.roles,{piano:'accompaniment',drums:'rhythm',guitar:'accompaniment',ukulele:'melody'});
  for(let bar=1;bar<8;bar++)assert.deepEqual(composer.planBar(bar,'C',{active,manualInstrument:'ukulele'}).roles,first.roles);
  assert.equal(composer.planBar(8,'C',{active:['guitar','ukulele']}).roles.ukulele,'accompaniment');
  const manual=composer.planBar(9,'C',{active:['guitar','ukulele'],manualInstrument:'piano'});
  assert.deepEqual(manual.roles,{piano:'melody',guitar:'accompaniment',ukulele:'accompaniment'});
  assert.ok(manual.phrases.piano.events.length);
});

test('weighted transitions select each instrument from its own previous phrase state',()=>{
  const composer=new Composition({random:()=>.4});
  const options={active:['piano','guitar','drums'],manualInstrument:'guitar',performanceSettings:{piano:{complexity:1.5},guitar:{complexity:.35},drums:{complexity:1}}};
  let previous;
  for(let bar=0;bar<20;bar++){
    const plan=composer.planBar(bar,'C',options);
    for(const name of Object.keys(plan.phrases)){
      const candidates=[...COMPOSITION_PHRASES[plan.roles[name]],...COMPOSITION_STYLES.folk.phrases[plan.roles[name]]].filter(value=>value.tier<=({piano:2,guitar:0,drums:2})[name]&&plan.movement.ideas.some(family=>COMPOSITION_STYLES.folk.ideas[family]?.[plan.roles[name]]?.includes(value.name)));
      const weights={...(PHRASE_TRANSITIONS[previous?.phrases[name].name]??{}),...(COMPOSITION_STYLES.folk.motifTransitions[previous?.phrases[name].name]??{})};
      assert.ok(candidates.some(value=>value.name===plan.phrases[name].name));
      assert.ok((weights[plan.phrases[name].name]??1)>0);
      assertPlayable(name,'C',name==='guitar'?.35:1.5,plan.phrases[name],plan.currentChord);
    }
    previous=plan;
  }
});

test('Jazz adds its own movement shapes, idea families, progressions, swing and bounded playable phrases',()=>{
  const composer=new Composition({random:random(901)});
  const options={active:names,manualInstrument:'piano',performanceSettings:{piano:{complexity:1.5}},genre:'jazz'};
  const seen=new Set();
  for(let bar=0;bar<100;bar++){
    const plan=composer.planBar(bar,'C',options);
    assert.equal(plan.genre,'jazz');
    assert.ok(['head-solos-head','late-night','small-combo-wave'].includes(plan.movement.name));
    assert.ok(plan.movement.ideas.length>=2&&plan.movement.ideas.length<=4);
    assert.ok(plan.movement.tension>=0&&plan.movement.tension<=1);
    for(const [name,phrase] of Object.entries(plan.phrases)){
      assert.ok(plan.movement.ideas.includes(phrase.idea));
      assertPlayable(name,'C',name==='piano'?1.5:1.5,phrase,plan.currentChord);
      phrase.events.forEach(event=>assert.ok(event.swingOffset===0||event.swingOffset===COMPOSITION_STYLES.jazz.swing));
      if((COMPOSITION_STYLES.jazz.phrases[plan.roles[name]]??[]).some(motif=>motif.name===phrase.name))seen.add(phrase.name);
    }
    const tensionValues=Object.values(plan.tensions);
    if(tensionValues.length)assert.ok(tensionValues.every(value=>value>=0&&value<=1));
  }
  assert.ok(['shellComp','blueAnswer','rideSwing','jazzRide'].some(name=>seen.has(name)));
  assert.ok(COMPOSITION_STYLES.jazz.progressions.some(progression=>progression.name.startsWith('jazz')));
});

test('genre constraints blend linearly from the next planned bar and replay from checkpoints',()=>{
  const composer=new Composition({random:random(81)});
  const options={active:['piano','drums'],genre:'jazz',genreTransition:{from:'folk',to:'jazz',startBar:4,durationBars:8}};
  const plans=Array.from({length:13},(_,bar)=>composer.planBar(bar,'C',options));
  assert.equal(plans[3].genreBlend,0);
  assert.equal(plans[4].genreBlend,0);
  assert.equal(plans[8].genreBlend,.5);
  assert.equal(plans[12].genreBlend,1);
  const checkpoint=plans[8];
  composer.invalidateFrom(8);
  assert.deepEqual(composer.planBar(8,'C',options),checkpoint);
  assert.equal(composer.planBar(12,'C',options).genreBlend,1);
  const frames=plans.slice(0,12).map(plan=>plan.movement.tension);
  assert.ok(frames.every(value=>Number.isFinite(value)&&value>=0&&value<=1));
});

test('an explicit Jazz motif pin remains valid at the start of a Folk-to-Jazz blend',()=>{
  const composer=new Composition({random:random(33)});
  const base={active:['ukulele'],manualInstrument:'ukulele',performanceSettings:{ukulele:{complexity:.35}}};
  composer.planBar(0,'C',base);
  const plan=composer.planBar(1,'C',{...base,genre:'jazz',genreTransition:{from:'folk',to:'jazz',startBar:1,durationBars:8},phraseOverrides:{ukulele:'shellComp'}});
  assert.equal(plan.genreBlend,0);
  assert.equal(plan.phrases.ukulele.name,'shellComp');
  assert.ok(plan.movement.ideas.includes(plan.phrases.ukulele.idea));
  assertPlayable('ukulele','C',.35,plan.phrases.ukulele,plan.currentChord);
});

test('movement idea windows persist, handoffs are queued early, and roles rotate only at movement boundaries',()=>{
  const composer=new Composition({random:random(64)});
  const plans=Array.from({length:260},(_,bar)=>composer.planBar(bar,'C',{active:names}));
  const movements=new Map();
  const ideaSequences=new Map();
  let sawQueuedSuccessor=false;
  for(const plan of plans){
    const movement=plan.movement;
    const start=movement.startBar;
    const accompaniment=Object.keys(plan.roles).filter(name=>plan.roles[name]==='accompaniment').sort().join(',');
    const previous=movements.get(start);
    if(previous){
      assert.deepEqual(movement.currentIdeas,previous.ideas);
      assert.deepEqual(movement.ideaSchedule,previous.schedule);
      assert.equal(accompaniment,previous.accompaniment);
      previous.activeIdeaSets.add(movement.activeIdeas.join(','));
    }else movements.set(start,{ideas:movement.currentIdeas,schedule:movement.ideaSchedule,accompaniment,activeIdeaSets:new Set([movement.activeIdeas.join(',')])});
    const sequence=ideaSequences.get(start)??Object.fromEntries(names.map(name=>[name,[]]));
    for(const name of names)sequence[name].push(plan.phrases[name].idea);
    ideaSequences.set(start,sequence);
    assert.ok(movement.melodicSimilarity>=.12&&movement.melodicSimilarity<=.82);
    assert.ok(movement.melodicAnchor);
    for(const phrase of Object.values(plan.phrases))assert.ok((movement.ideaWeights[phrase.idea]??0)>0,`${phrase.name} must be in an active idea window`);
    if(movement.nextName&&plan.bar<start+movement.length&&start+movement.length<plans.length){
      const remaining=start+movement.length-plan.bar;
      assert.ok(remaining<=COMPOSITION_STYLES.folk.movementControls.transitionBars);
      assert.equal(plans[start+movement.length].movement.name,movement.nextName);
      assert.ok(movement.transitionProgress>0&&movement.transitionProgress<1);
      sawQueuedSuccessor=true;
    }
  }
  assert.ok(sawQueuedSuccessor);
  assert.ok(new Set([...movements.values()].map(value=>value.accompaniment)).size>1);
  assert.ok([...movements.values()].some(value=>value.activeIdeaSets.size>1));
  for(const sequence of ideaSequences.values())for(const ideas of Object.values(sequence)){
    let rapidAlternations=0;
    for(let index=2;index<ideas.length;index++)if(ideas[index]===ideas[index-2]&&ideas[index]!==ideas[index-1])rapidAlternations++;
    assert.ok(rapidAlternations<=1,`${ideas.join(' -> ')}`);
  }
  const first=plans[0].movement;
  assert.equal(first.ideaSchedule.length,first.currentIdeas.length);
  assert.ok(first.ideaSchedule.every(phase=>(phase.end-phase.start)*first.length>=4.5));
});

test('mixed active memberships and tiers constrain entire major and minor progression states',()=>{
  for(const root of ['C','Am'])for(const active of [['piano'],['guitar'],['ukulele'],['piano','guitar'],['piano','ukulele'],['guitar','ukulele'],['piano','guitar','ukulele']]){
    const composer=new Composition({random:random(42)});
    const performanceSettings=Object.fromEntries(active.map((name,index)=>[name,{complexity:[.35,1,1.5][index]}]));
    for(let bar=0;bar<16;bar++){
      const plan=composer.planBar(bar,root,{active,manualInstrument:active[0],performanceSettings});
      assert.ok([0,3,4].includes(plan.currentChord.degree));
      assert.ok([0,3,4].includes(plan.nextChord.degree));
      assert.equal(Object.values(plan.roles).filter(role=>role==='accompaniment').length,Math.min(2,active.length));
      for(const name of active)assertPlayable(name,root,name===active[0]?.35:1.5,plan.phrases[name],plan.currentChord);
    }
  }
});

test('default voice leading carries the previous phrase register into the next chord',()=>{
  const composer=new Composition({random:()=>0});
  const options={active:['piano'],performanceSettings:{piano:{complexity:1.5}}};
  const previous=composer.planBar(0,'C',options);
  const next=composer.planBar(1,'C',options);
  const neutral=compositionProfile('piano','C',{complexity:1.5}).find(phrase=>phrase.name===next.phrases.piano.name&&phrase.degree===next.currentChord.degree);
  const ending=noteMidi(previous.phrases.piano.events.at(-1).notes[0]);
  const led=noteMidi(next.phrases.piano.events[0].notes[0]);
  const unconnected=noteMidi(neutral.events[0].notes[0]);
  assert.ok(Math.abs(led-ending)<Math.abs(unconnected-ending));
  assert.deepEqual(previous.nextChord,next.currentChord);
});

test('additional authored major/minor progressions unlock only with suitable control tiers',()=>{
  for(const root of ['C','Am'])for(const complexity of [.35,1,1.5]){
    const composer=new Composition({random:()=>.999});
    const plan=composer.planBar(0,root,{active:names,manualInstrument:'piano',performanceSettings:{piano:{complexity}}});
    assert.equal(plan.progression,complexity<=.5?'journey':root==='C'?'majorTurn':complexity<=1?'song':'minorWalk');
  }
});

test('seeded timelines agree, empty activity works, options are not mutated and bad inputs fail clearly',()=>{
  const options={active:new Set(names),performanceSettings:{piano:{complexity:.35}}};
  const before=structuredClone(options);
  const first=new Composition({random:random(123)}),second=new Composition({random:random(123)});
  assert.deepEqual(first.planBar(20,'Am',options),second.planBar(20,'Am',options));
  assert.deepEqual(options,before);
  assert.deepEqual(new Composition().planBar(0,'C').phrases,{});
  assert.throws(()=>first.planBar(-1,'C'),RangeError);
  assert.throws(()=>first.planBar(1.2,'C'),RangeError);
  assert.throws(()=>first.planBar(0,'invalid'));
  assert.throws(()=>new Composition({random:()=>1}).planBar(0,'C'),RangeError);
  assert.throws(()=>compositionProfile('invalid','C'));
});

test('only equipped saved controls constrain 100-bar timelines for every instrument and level',()=>{
  for(const manualInstrument of names)for(const complexity of [.35,1,1.5])for(const root of ['C','Am','Db','Fm']){
    const composer=new Composition({random:random(42)});
    const options={active:names,manualInstrument,performanceSettings:Object.fromEntries(names.map(name=>[name,{complexity}]))};
    let previous;
    for(let bar=0;bar<100;bar++){
      const plan=composer.planBar(bar,root,options);
      assert.ok(Object.values(plan.roles).filter(role=>role==='accompaniment').length<=2);
      for(const name of names)assertPlayable(name,root,name===manualInstrument?complexity:1.5,plan.phrases[name],plan.currentChord);
      const progression=COMPOSITION_PROGRESSIONS.find(value=>value.name===plan.progression);
      assert.equal(plan.currentChord.degree,progression.degrees[plan.progressionOffset]);
      if(complexity<=.5){assert.ok([0,3,4].includes(plan.currentChord.degree));assert.ok([0,3,4].includes(plan.nextChord.degree));}
      if(previous){
        assert.deepEqual(previous.nextChord,plan.currentChord);
        for(const name of names){
          const from=previous.phrases[name].name,to=plan.phrases[name].name;
          const weights={...(PHRASE_TRANSITIONS[from]??{}),...(COMPOSITION_STYLES[plan.genre].motifTransitions[from]??{})};
          assert.ok((weights[to]??1)>0);
        }
        const prior=COMPOSITION_PROGRESSIONS.find(value=>value.name===previous.progression);
        if(previous.progressionOffset===prior.degrees.length-1)assert.ok(prior.transitions[plan.progression]>0);
        else {assert.equal(plan.progression,previous.progression);assert.equal(plan.progressionOffset,previous.progressionOffset+1);}
      }
      previous=plan;
    }
  }
  const composer=new Composition({random:()=>.999});
  assert.equal(composer.planBar(0,'C',{active:names,performanceSettings:{piano:{complexity:.35}}}).phrases.piano.tier,2);
  assert.equal(composer.planBar(1,'C',{active:names,manualInstrument:'piano'}).phrases.piano.tier,2);
});

test('long sessions retain eight checkpoints and only reachable draws with deterministic future rollback',()=>{
  let calls=0;const generator=random(72);
  const composer=new Composition({random:()=>{calls++;return generator();}});
  const options={active:names};
  for(let bar=0;bar<2000;bar++){
    composer.planBar(bar,'C',options);
    assert.ok(composer.plans.size<=8);assert.equal(composer.checkpoints.size,composer.plans.size);
    assert.ok(composer.draws.length<=8*(names.length+2));
    assert.equal(composer.drawBase,composer.checkpoints.values().next().value.cursor);
  }
  const before=[...composer.plans.values()].map(value=>value.plan);
  const count=calls;
  composer.invalidateFrom(1992);
  for(const plan of before)assert.deepEqual(composer.planBar(plan.bar,'C',options),plan);
  assert.equal(calls,count);
  composer.invalidateFrom(2000);
  const upcoming=composer.planBar(2000,'C',options);
  const after=calls;
  composer.invalidateFrom(2000);
  assert.deepEqual(composer.planBar(2000,'C',options),upcoming);assert.equal(calls,after);
  assert.throws(()=>composer.invalidateFrom(1),RangeError);
});

test('motif pins validate tier and role, rerender under harmony and only replace future cache',()=>{
  const composer=new Composition({random:()=>0});
  const options={active:['piano','flute'],manualInstrument:'flute',performanceSettings:{flute:{complexity:.35}}};
  const current=composer.planBar(0,'C',options);
  const oldFuture=composer.planBar(1,'C',options);
  const pinned={...options,phraseOverrides:{flute:{name:'arch',role:'melody'},piano:'pulse'}};
  const future=composer.planBar(1,'C',pinned);
  assert.notEqual(future,oldFuture);assert.equal(composer.planBar(0,'C',options),current);
  const chords=new Set();
  for(let bar=1;bar<8;bar++){
    const plan=composer.planBar(bar,'C',pinned);
    assert.equal(plan.phrases.flute.name,'arch');assert.equal(plan.phrases.piano.name,'pulse');
    assert.equal(plan.phrases.flute.role,plan.roles.flute);
    assertPlayable('flute','C',.35,plan.phrases.flute,plan.currentChord);
    chords.add(plan.phrases.flute.chord);
  }
  assert.ok(chords.size>1);
  assert.deepEqual(phraseMotifs('flute','C',{complexity:.35,role:'melody',degree:0}).map(value=>value.name),['answer','arch','refrain']);
  assert.ok(compositionProfile('piano','C',{role:'melody',degree:3}).every(value=>value.degree===3&&value.role==='melody'));
  for(const phraseOverrides of [{flute:'ornament'},{flute:'held'},{flute:{name:'arch',role:'accompaniment'}},{invalid:'answer'}]){
    assert.throws(()=>composer.planBar(8,'C',{...options,phraseOverrides}),/override|Override/);
  }
  assert.equal(composer.planBar(8,'C',options).phrases.flute.name,'answer');
});

test('manual-only harmony follows available controls and key changes discard old harmonic anchors',()=>{
  for(const manualInstrument of names)for(const root of ['Db','Fm']){
    const options={manualInstrument,performanceSettings:{[manualInstrument]:{complexity:.35}}};
    const composer=new Composition({random:()=>0});
    for(let bar=0;bar<12;bar++){
      const plan=composer.planBar(bar,root,options);
      assertPlayable(manualInstrument,root,.35,plan.phrases[manualInstrument],plan.currentChord);
      assert.ok([0,3,4].includes(plan.nextChord.degree));
    }
  }
  const options={active:['piano'],phraseOverrides:{piano:'held'}};
  const composer=new Composition({random:()=>0});
  for(let bar=0;bar<3;bar++)composer.planBar(bar,'C',options);
  const changed=composer.planBar(3,'Fm',options);
  const fresh=new Composition({random:()=>0}).planBar(0,'Fm',options);
  assert.deepEqual(changed.currentChord,fresh.currentChord);assert.deepEqual(changed.nextChord,fresh.nextChord);
  assert.deepEqual(changed.phrases,fresh.phrases);assert.equal(changed.progressionOffset,0);
});

test('authored contours use real octave steps, shaped dynamics and instrument-specific breathing and picking',()=>{
  const phrase=(name,motif)=>compositionProfile(name,'C',{complexity:1.5,role:'melody',degree:0}).find(value=>value.name===motif);
  const question=phrase('piano','question').events.map(event=>noteMidi(event.note));
  assert.ok(question[1]>question[0]);assert.ok(question[2]>question[1]);
  assert.equal(question[2]%12,0);
  for(const name of names){
    const pool=compositionProfile(name,'C');
    assert.ok(pool.every(value=>new Set(value.events.map(event=>event.velocity)).size>=2));
    assert.ok(pool.every(value=>value.events.every(event=>event.velocity>0&&event.velocity<=.85)));
  }
  assert.notDeepEqual(phrase('flute','arch').events.map(event=>event.time),phrase('piano','arch').events.map(event=>event.time));
  assert.notDeepEqual(phrase('panflute','arch').events.map(event=>event.time),phrase('flute','arch').events.map(event=>event.time));
  assert.notEqual(phrase('flute','answer').events[0].dur,phrase('marimba','answer').events[0].dur);
});