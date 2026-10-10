import React from 'react';
import { Play, LoaderCircle,HelpCircle } from 'lucide-react';
import './parent-guide.css';
export function StartScreen({loading,error,onStart,onParentGuide}) {
  return <div className="start-overlay">
    <button className="start-help-button" aria-label="Parent guide and setup" title="Parent guide and setup" onClick={onParentGuide}><HelpCircle size={22}/></button>
    <div className="title-note">♪</div>
    <h1>Farm<span>Jam</span></h1>
    {error && <p role="alert">{error}</p>}
    <button className="start-button" disabled={loading} onClick={onStart}>{loading?<LoaderCircle className="loading-icon" size={24}/>:<Play size={24} fill="currentColor"/>}{loading?'Loading sounds…':'Tap to play'}</button>
  </div>;
}
