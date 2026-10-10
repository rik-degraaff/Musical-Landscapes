import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_PHASES, SCENE_ROOTS, celestialPosition, nextDayPhase } from '../src/utils/dayCycle.js';
import {transposeEvents} from '../src/utils/music.js';
import {equippedProfile} from '../src/utils/difficulty.js';
import {noteMidi} from '../src/utils/autoplay.js';

test('day cycle follows the requested major and minor tonal journey',()=>{
  const ids=['farm','garden','pond','dusk','night','lateNight','dawn'];
  const roots=ids.map(id=>SCENE_ROOTS[id]);
  assert.deepEqual(roots,['A','E','A','C#m','Am','Fm','Db']);
});

test('minor keys flatten the third, sixth and seventh instead of merely changing the tonic',()=>{
  const events=[{notes:['C4','E4','G4','A4','B4']}];
  assert.deepEqual(transposeEvents(events,'C#m')[0].notes,['C#4','E4','G#4','A4','B4']);
  assert.deepEqual(transposeEvents(events,'Am')[0].notes,['A4','C5','E5','F5','G5']);
  assert.deepEqual(transposeEvents(events,'Fm')[0].notes,['F4','G#4','C5','C#5','D#5']);
  assert.deepEqual(transposeEvents([{notes:['C4','E4','G4']}],'Db')[0].notes,['C#4','F4','G#4']);
});

test('sun progresses left to right across a day with midday at the apex', () => {
  const positions = ['dawn', 'farm', 'garden', 'pond', 'dusk'].map(scene => celestialPosition(DAY_PHASES[scene]));
  for (let index = 1; index < positions.length; index++) assert.ok(positions[index].x > positions[index - 1].x);
  assert.equal(positions[2].x, 50);
  assert.equal(positions[2].y, 11);
  assert.ok(positions[0].y > positions[1].y);
  assert.ok(positions[4].y > positions[3].y);
  assert.ok(positions.every(position => !position.moon));
});

test('the moon travels from left to right across two night scenes before dawn', () => {
  const night = nextDayPhase(DAY_PHASES.dusk, 'night');
  const lateNight = nextDayPhase(night, 'late-night');
  const dawn = nextDayPhase(lateNight, 'dawn');
  assert.equal(night, 1.28);
  assert.equal(lateNight, 1.68);
  assert.equal(dawn, 2.04);
  assert.equal(nextDayPhase(dawn, 'farm'), 2.22);
  const firstMoon=celestialPosition(night),secondMoon=celestialPosition(lateNight);
  assert.ok(firstMoon.moon&&secondMoon.moon);
  assert.ok(firstMoon.x<secondMoon.x);
  assert.ok(Math.abs(firstMoon.x-33.28)<1e-8);
  assert.ok(Math.abs(secondMoon.x-63.68)<1e-8);
  assert.ok(!celestialPosition(dawn).moon);
  assert.equal(nextDayPhase(0.7, 'dusk'), 0.96);
});

test('night phrases and string chords stay inside their natural minor scales',()=>{
  for(const [root,tonic] of [['C#m',1],['Am',9],['Fm',5]]){
    const pitches=[0,2,3,5,7,8,10].map(degree=>(tonic+degree)%12);
    for(const name of ['piano','guitar','ukulele','marimba','panflute','flute','melody']){
      const profile=equippedProfile(name,root,{complexity:1.5});
      for(const phrase of profile.phrases)for(const event of phrase.events)for(const note of event.notes??[event.note])assert.ok(pitches.includes(noteMidi(note)%12),`${name} ${root}: ${note}`);
      if(['guitar','ukulele'].includes(name)){
        const chord=profile.chords.find(value=>value.degree===0&&value.size===3);
        assert.equal(chord.name,root);
        assert.deepEqual(chord.tones,[tonic,(tonic+3)%12,(tonic+7)%12]);
      }
    }
  }
});