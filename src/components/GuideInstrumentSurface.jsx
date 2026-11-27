import React from 'react';
import {InstrumentSurface} from './PerformancePanel';
import {SIMPLE_GUIDE_OPTIONS} from '../utils/guideDemonstrations';
import {editionPracticeProfile} from '../utils/practiceComposition';
import {useEdition} from './EditionContext';

const noop=()=>{};
// Guides have no engine, transport, resource ownership, or input dispatch.
export const silentAudio=Object.freeze({manualNoteOn:noop,manualNoteOff:noop,manualStrike:noop,stopManualVoices:noop,setManualPitchBend:noop,manualVoices:new Map()});

export function GuideInstrumentSurface({instrument='piano',practice=false,cue,options=SIMPLE_GUIDE_OPTIONS,bare=false}) {
  const {trial}=useEdition();
  const root=trial?'A':'C';
  const surface=<InstrumentSurface name={instrument} root={root} audio={silentAudio} options={options} profile={practice?editionPracticeProfile(instrument,root,options,trial):undefined} cue={cue} practice={practice}/>;
  return bare?surface:<div className={`guide-surface performance-${instrument}`} inert aria-hidden="true">{surface}</div>;
}
