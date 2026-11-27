import React from 'react';
import { Play, LoaderCircle,Plus,Check,Pencil,Settings2 } from 'lucide-react';
import {ChildAvatar} from './ChildAvatar';
import {PracticeVisitTrigger} from './PracticeVisitNotice';
import {SaveStatus} from './SaveStatus';
import {TrialAge} from './TrialInformation';
import {TRIAL_DESCRIPTION} from '../utils/editions';
import './parent-guide.css';
import './avatar.css';
import './caregiver.css';
export function StartScreen({children=[],selectedId,loading,error,onStart,onSelect,onAdd,onEdit,saveError,onRetrySave,onSettings,unreadGuides=0,practiceReminder,onPracticeReminder,inert=false,trialPreferences,onMembership}) {
  if(trialPreferences)return <div className="start-overlay trial-menu" inert={inert}>
    <h1>Farm<span>Jam</span></h1>
    <p className="trial-menu-note">{TRIAL_DESCRIPTION}</p>
    {!trialPreferences.age&&<TrialAge value={trialPreferences.age} onChange={age=>{trialPreferences.setAge(age);requestAnimationFrame(()=>document.getElementById('trial-play')?.focus());}}/>}
    {error&&<p className="trial-menu-note" role="alert">{error}</p>}
    {saveError&&<SaveStatus onRetry={onRetrySave}/>}
    <button id="trial-play" className="start-button" disabled={loading||!trialPreferences.age} onClick={onStart}>{loading?<LoaderCircle className="loading-icon" size={24}/>:<Play size={24} fill="currentColor"/>}{loading?'Loading sounds…':'Tap to play'}</button>
    <div className="trial-menu-actions">
      <button className="start-settings learning-action" disabled={loading} onClick={onSettings}><Settings2 size={19}/>Settings</button>
      {onMembership&&<button className="learning-action" disabled={loading} onClick={onMembership}>For parents</button>}
    </div>
  </div>;
  return <div className={`start-overlay${practiceReminder?' has-practice-reminder':''}`} inert={inert}>
    {practiceReminder&&<div className="practice-menu-notice"><PracticeVisitTrigger child={practiceReminder} onOpen={onPracticeReminder}/></div>}
    <h1>Farm<span>Jam</span></h1>
    <div className="child-menu" role="radiogroup" aria-label="Choose a child">{children.map(child=><div className="child-profile" key={child.id}><button className={`child-choice ${selectedId===child.id?'is-selected':''}`} role="radio" aria-checked={selectedId===child.id} aria-label={`Select ${child.name}`} disabled={loading} onClick={()=>onSelect(child.id)}><ChildAvatar avatar={child.avatar} age={child.age}/><span>{child.name}</span>{selectedId===child.id&&<Check className="child-selected" size={18}/>}</button><button className="child-edit" disabled={loading} aria-label={`Edit ${child.name}`} title={`Edit ${child.name}`} onClick={()=>onEdit(child.id)}><Pencil size={17}/></button></div>)}<button className="child-add" aria-label="Add child" title="Add child" disabled={loading} onClick={onAdd}><Plus size={32}/></button></div>
    {error && <p role="alert">{error}</p>}
    {!children.length&&<p className="start-empty">Choose <strong>Add child (+)</strong> to set up a musician and start playing.</p>}
    {saveError&&<SaveStatus onRetry={onRetrySave}/>}
    <button className="start-button" disabled={loading||!children.some(child=>child.id===selectedId)} onClick={onStart}>{loading?<LoaderCircle className="loading-icon" size={24}/>:<Play size={24} fill="currentColor"/>}{loading?'Loading sounds…':'Tap to play'}</button>
    {onSettings&&<button className="start-settings learning-action" disabled={loading} onClick={onSettings}><Settings2 size={19}/>Settings{unreadGuides>0&&<span className="guide-status">{unreadGuides} unread guides</span>}</button>}
  </div>;
}
