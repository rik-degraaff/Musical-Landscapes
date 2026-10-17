import React from 'react';
import {Menu,X,SkipForward,ArrowUpFromLine} from 'lucide-react';
import './controls.css';

export function SettingsButton({open=false,onClick}) {
  return <button className="mixer-button game-settings-button" onClick={onClick} aria-expanded={open} aria-controls="landscape-mixer" aria-label={open?'Close settings':'Open settings'} title={open?'Close settings':'Double-click or double-tap to open settings'}>{open?<X size={22}/>:<Menu size={22}/>}</button>;
}

export function InstrumentActions({onNext,onReturn,canNext=true}) {
  return <><button className="next-phrase" aria-label="Next phrase" title="Next phrase" disabled={!canNext} onClick={onNext}><SkipForward size={20}/></button><button className="return-instrument" aria-label="Put instrument down" title="Put instrument down" onClick={onReturn}><ArrowUpFromLine size={20}/></button></>;
}
