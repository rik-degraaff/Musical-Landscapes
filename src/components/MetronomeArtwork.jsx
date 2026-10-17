import React from 'react';
import {Volume2,VolumeX} from 'lucide-react';
import './metronome.css';

/** Shared artwork only. Scheduling and input remain in Metronome. */
export function MetronomeBody() {
  return <svg className="metronome-body" viewBox="0 0 100 140" aria-hidden="true"><path d="M32 6h36l25 124H7Z" fill="#9d7053" stroke="#624d40" strokeWidth="3"/><path d="M36 14h28l18 101H18Z" fill="#f0e2be" stroke="#c19b69" strokeWidth="2"/><path d="M6 126h88v10H6Z" fill="#526d58"/><circle cx="50" cy="112" r="7" fill="#526d58"/>{[28,44,60,76,92].map(y=><path key={y} d={`M43 ${y}h14`} stroke="#977c5c" strokeWidth="1"/>)}</svg>;
}

export function MetronomeMini({tempo=104,angle=0,onOpen}) {
  return <button className="metronome-mini" aria-label="Open metronome" title="Metronome" onClick={onOpen}><MetronomeBody/><svg className="mini-mechanism" viewBox="0 0 100 140" aria-hidden="true"><g className="mini-pendulum" style={{rotate:`${angle}deg`}}><path d="M50 17V112" stroke="#526d58" strokeWidth="4"/><rect x="40" y={22.4+(tempo-40)/168*64.4-7} width="20" height="14" rx="2" fill="#b78842" stroke="#624d40" strokeWidth="2"/></g></svg><span>{tempo}</span></button>;
}

export function MetronomeMechanism({tempo,angle=0,railRef,weightProps={}}) {
  return <div className="metronome-mechanism"><MetronomeBody/><div ref={railRef} className="metronome-rail" style={{rotate:`${angle}deg`}}><i className="metronome-needle" aria-hidden="true"/><button className="metronome-weight" role="slider" aria-label="Metronome tempo weight" aria-orientation="vertical" aria-valuemin={40} aria-valuemax={208} aria-valuenow={tempo} aria-valuetext={`${tempo} beats per minute`} style={{top:`${(tempo-40)/168*100}%`}} {...weightProps}><span aria-hidden="true"/></button></div></div>;
}

export function MetronomeSoundButton({sound,onClick}) {
  return <button className="metronome-sound" role="switch" aria-label="Metronome sound" aria-checked={sound} title="Metronome sound" onClick={onClick}>{sound?<Volume2 size={16}/>:<VolumeX size={16}/>}<span className="metronome-switch-track" aria-hidden="true"><i/></span></button>;
}

export function MetronomeArtwork({tempo=104,sound=true}) {
  return <div className="guide-metronome-art metronome-widget is-open" inert><div className="metronome-menu"><MetronomeMechanism tempo={tempo}/><output className="metronome-tempo">{tempo} BPM</output><MetronomeSoundButton sound={sound}/></div></div>;
}
