import React from 'react';
import { Play, LoaderCircle,Plus,Check } from 'lucide-react';
import {ChildAvatar} from './ChildAvatar';
import './parent-guide.css';
import './avatar.css';
export function StartScreen({children=[],selectedId,loading,error,onStart,onSelect,onAdd}) {
  return <div className="start-overlay">
    <h1>Farm<span>Jam</span></h1>
    <div className="child-menu" role="radiogroup" aria-label="Choose a child">{children.map(child=><button key={child.id} className={`child-choice ${selectedId===child.id?'is-selected':''}`} role="radio" aria-checked={selectedId===child.id} aria-label={`Select ${child.name}`} onClick={()=>onSelect(child.id)}><ChildAvatar avatar={child.avatar} age={child.age}/><span>{child.name}</span>{selectedId===child.id&&<Check className="child-selected" size={18}/>}</button>)}<button className="child-add" aria-label="Add child" title="Add child" onClick={onAdd}><Plus size={32}/></button></div>
    {error && <p role="alert">{error}</p>}
    <button className="start-button" disabled={loading||!children.some(child=>child.id===selectedId)} onClick={onStart}>{loading?<LoaderCircle className="loading-icon" size={24}/>:<Play size={24} fill="currentColor"/>}{loading?'Loading sounds…':'Tap to play'}</button>
  </div>;
}
