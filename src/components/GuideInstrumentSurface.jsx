import React from 'react';
import {InstrumentSurface} from './PerformancePanel';
import {SIMPLE_GUIDE_OPTIONS} from '../utils/guideDemonstrations';
import {practiceProfile} from '../utils/practiceComposition';

const noop=()=>{};
// Guides have no engine, transport, resource ownership, or input dispatch.
const silentAudio=Object.freeze({manualNoteOn:noop,manualNoteOff:noop,manualStrike:noop,stopManualVoices:noop,setManualPitchBend:noop,manualVoices:new Map()});

export function GuideInstrumentSurface({instrument='piano',practice=false,cue,options=SIMPLE_GUIDE_OPTIONS}) {
  return <div className={`guide-surface performance-${instrument}`} inert aria-hidden="true"><InstrumentSurface name={instrument} root="C" audio={silentAudio} options={options} profile={practice?practiceProfile(instrument,'C',options):undefined} cue={cue} practice={practice}/></div>;
}
