import React from 'react';
import {Music} from 'lucide-react';
import {PracticeRoomArt} from './PracticeRoomArt';
import {YoungMusicianArt} from './YoungMusician';
import {InstrumentArt} from './InstrumentArt';
import {HelpButton} from './CaregiverHelp';
import {PracticeSelectors,PracticeExit,PracticeStageTabs} from './PracticeRoomControls';
import {INSTRUMENTS} from '../utils/music';
import './practice.css';

/** One header and spatial arrangement for live practice and passive guide state. */
export function PracticeRoomHeader({child,name,selected,companions={},phrases,phraseIndex,onInstrument,onPhrase,onHelp,onClose,metronome}) {
  return <header className="practice-topbar"><HelpButton onOpen={onHelp}/><h1 className="practice-room-title"><Music size={22}/>Farm Practice</h1>
    <div className="practice-lineup" role="group" aria-label="Musician and instruments">
      <div className="practice-musician" data-child-name={child?.name}><YoungMusicianArt child={child}/><InstrumentArt type={name}/><span>{INSTRUMENTS[name].label}</span></div>
      <div className="practice-neighbors" aria-label="Other landscape instruments">{selected.filter(instrument=>instrument!==name).map(instrument=><button key={instrument} className={companions[instrument]!==undefined?'is-accompanying':''} aria-label={`Switch to ${INSTRUMENTS[instrument].label}`} title={companions[instrument]!==undefined?`${INSTRUMENTS[instrument].label}, phrase ${companions[instrument]+1}`:`Practice ${INSTRUMENTS[instrument].label}`} onClick={()=>onInstrument(instrument)}><InstrumentArt type={instrument}/></button>)}</div>
    </div>
    <PracticeSelectors name={name} onInstrument={onInstrument} phraseIndex={phraseIndex} onPhrase={onPhrase} phrases={phrases}/>
    {metronome}<PracticeExit onClose={onClose}/>
  </header>;
}

export function PracticeRoomLayout({roomRef,roomProps={},header,stage,onStage,readout,transport,phraseTrack,surface,feedback,overlay}) {
  const {className='',...attributes}=roomProps;
  return <section ref={roomRef} className={`practice-room ${className}`} {...attributes}>
    <PracticeRoomArt/>{header}<PracticeStageTabs stage={stage} onChange={onStage}/>
    <main className="practice-main">{readout}{transport}{phraseTrack}{surface}</main>
    {feedback}{overlay}
  </section>;
}
