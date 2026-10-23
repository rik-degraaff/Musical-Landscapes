import React,{useRef,useState} from 'react';
import {Volume2,VolumeX} from 'lucide-react';
import {CaregiverDialog} from './CaregiverDialog';
import './sound-help.css';

export function SoundHelpButton({status='running',muted=false,onOpen,className=''}) {
  const needsHelp=muted||!['running','unavailable'].includes(status);
  return <button className={`sound-help-button ${className}`} data-attention={needsHelp} aria-label={needsHelp?'Sound needs attention — open sound help':'Open sound help'} title={needsHelp?'Sound needs attention':'No sound? Tap for help'} onClick={onOpen}>{needsHelp?<VolumeX size={23}/>:<Volume2 size={23}/>}</button>;
}

export function SoundHelp({audio,status,muted,onClose,onRestore,onSettings}) {
  const [testing,setTesting]=useState(false);
  const [result,setResult]=useState('');
  const busy=useRef(false);
  async function test() {
    if(busy.current)return;
    busy.current=true;setTesting(true);setResult('');
    try {
      const requested=await audio.testSound();
      setResult(requested?'A quiet test note was sent. If you did not hear it, try the steps below.':'Sound is still blocked. Try the steps below, then tap Retry and test sound again.');
    } catch {
      setResult('Sound could not restart. Try the steps below.');
    } finally {busy.current=false;setTesting(false);}
  }
  const message=status==='closed'?'The browser has closed audio. Return to the main menu, then reload FarmJam to restart it.':muted?'The sound mix is muted. Restore sound levels or open Sound settings.':status==='interrupted'?'Another app or a phone call has interrupted audio. Finish the call or pause the other app, then retry.':status==='suspended'?'The browser has paused or blocked audio. Tap Retry and test sound to restart it.':audio?'The browser is running audio. It cannot check your phone’s Silent mode, media volume, or speaker output.':'Start play to load the sounds. If starting fails, tap Tap to play again.';
  return <CaregiverDialog title="Sound help" onClose={onClose} footer={<button onClick={onClose}>Back</button>}>
    <section className="sound-help-copy">
      <p role="status">{message}</p>
      <div className="sound-help-actions">
        {audio&&<button className="learning-action" disabled={testing||status==='closed'} onClick={test}>{testing?'Trying sound…':'Retry and test sound'}</button>}
        {onRestore&&<button className="learning-action" onClick={()=>{onRestore();setResult('Sound levels restored. Tap an instrument to play, or try the test note.');}}>Restore sound levels</button>}
        {onSettings&&<button className="learning-action" onClick={onSettings}>Open Sound settings</button>}
      </div>
      <p role="status">{result}</p>
      <ol>
        <li>Turn media volume up a little while testing sound. Ring volume can be a separate control.</li>
        <li>On iPhone or iPad, try turning Silent mode off with the side switch, Action button, or Control Center. Older browsers may mute music in Silent mode.</li>
        <li>Check whether sound is going to Bluetooth headphones, a speaker, or AirPlay. Select the output you want.</li>
        <li>Pause other music or finish a call, return to FarmJam, then retry. Check that the browser tab or site is not muted.</li>
        <li>Tap a landscape instrument to turn it on. In Settings → Sound, raise its level or restore the sound levels.</li>
        <li>If sound is still missing, return to the main menu and reload FarmJam. Keep your browser site data to retain child profiles.</li>
      </ol>
    </section>
  </CaregiverDialog>;
}
