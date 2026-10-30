// Reproducible approximation of autoplay loudness across keys and musical roles.
// This complements sample normalization; listening still decides the final mix.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import ffmpeg from 'ffmpeg-static';
import {INSTRUMENTS,CHORD_INSTRUMENTS} from '../src/utils/music.js';
import {compositionProfile} from '../src/utils/composition.js';
import {noteMidi} from '../src/utils/autoplay.js';
import {beatOffset} from '../src/utils/practice.js';
import {SAMPLE_LIBRARY,DRUM_SAMPLES,DRUM_NOTES,DRUM_DURATIONS,sampleUrls} from '../src/audio/sampleLibrary.js';

const root=new URL('../',import.meta.url),rate=24000,beat=60/92,bar=beat*4;
const path=relative=>fileURLToPath(new URL(relative,root));
const levels=JSON.parse(readFileSync(path('src/audio/audioLevels.json'),'utf8'));
const run=(args,input)=>{
  const result=spawnSync(ffmpeg,args,{input,maxBuffer:64*1024*1024});
  if(result.status!==0)throw new Error(result.stderr.toString());
  return result;
};
const duration=value=>value==='1m'?bar:beat*4/Number(value.match(/^\d+/)[0])*(value.endsWith('.')?1.5:1);
const cache=new Map();
function recording(name,note){
  const urls=name==='drums'?Object.fromEntries(Object.entries(DRUM_NOTES).map(([hit,pitch])=>[pitch,`drums/${DRUM_SAMPLES[hit==='rim'?'snare':hit==='shaker'?'hat':hit].file}`])):sampleUrls(name);
  const selected=Object.keys(urls).sort((a,b)=>Math.abs(noteMidi(a)-noteMidi(note))-Math.abs(noteMidi(b)-noteMidi(note))||noteMidi(a)-noteMidi(b))[0];
  const file=`instruments/${urls[selected]}`;
  if(!cache.has(file)){
    const raw=run(['-v','error','-i',path(`public/audio/${file}`),'-f','f32le','-ac','1','-ar',String(rate),'pipe:1']).stdout;
    const gain=10**(levels[file].gainDb/20);
    cache.set(file,Float32Array.from({length:raw.length/4},(_,i)=>raw.readFloatLE(i*4)*gain));
  }
  return {samples:cache.get(file),pitchRate:2**((noteMidi(note)-noteMidi(selected))/12)};
}
mkdirSync(path('test-results/mix-calibration'),{recursive:true});
const report={};
for(const name of Object.keys(INSTRUMENTS)){
  const roles=name==='drums'?['rhythm']:CHORD_INSTRUMENTS.includes(name)?['accompaniment','melody']:['melody'];
  const phrases=['C','A','Fm'].flatMap(key=>roles.flatMap(role=>{
    const pool=compositionProfile(name,key,{complexity:1,role,genre:'folk',degree:0});
    return [pool.find(p=>['pulse','arch','walking'].includes(p.name)),pool.find(p=>['broken','question','backbeat'].includes(p.name))].filter(Boolean);
  }));
  const output=new Float32Array(Math.ceil((phrases.length*bar+1)*rate));
  for(const [index,phrase] of phrases.entries())for(const event of phrase.events){
    const notes=event.notes??[event.note];
    for(const [voice,value] of notes.entries()){
      const note=name==='drums'?DRUM_NOTES[value]:value;
      const {samples,pitchRate}=recording(name,note);
      const start=Math.round((index*bar+beatOffset(event.time)*beat+(['guitar','ukulele'].includes(name)?voice*.016:0))*rate);
      const gate=name==='drums'?DRUM_DURATIONS[value]:duration(event.dur)*(event.gate??1),release=name==='drums'?.08:SAMPLE_LIBRARY[name].release;
      const end=Math.min(output.length-start,Math.floor(samples.length/pitchRate),Math.ceil((gate+release)*rate));
      for(let i=0;i<end;i++){
        const time=i/rate,envelope=Math.min(1,time/.002)*(time<=gate?1:Math.exp(-5*(time-gate)/release));
        const offset=i*pitchRate,base=Math.floor(offset),fraction=offset-base;
        output[start+i]+=(samples[base]*(1-fraction)+(samples[base+1]??0)*fraction)*event.velocity*(1-voice*.04)*envelope;
      }
    }
  }
  const pcm=Buffer.alloc(output.length*4);output.forEach((value,i)=>pcm.writeFloatLE(value,i*4));
  const stats=run(['-hide_banner','-f','f32le','-ac','1','-ar',String(rate),'-i','pipe:0','-af','loudnorm=I=-23:TP=-2:LRA=7:print_format=json','-f','null','-'],pcm);
  const measured=JSON.parse(/\{[\s\S]*\}/.exec(stats.stderr.toString())[0]);
  const lufs=Number(measured.input_i),target=name==='drums'?-33:-35;
  report[name]={bars:phrases.length,lufs,target,suggestedVolume:Math.max(-24,Math.min(3,Math.round(target-lufs))),currentVolume:INSTRUMENTS[name].volume};
  console.log(name,JSON.stringify(report[name]));
}
writeFileSync(path('test-results/mix-calibration/report.json'),JSON.stringify(report,null,2)+'\n');
