import {useCallback,useEffect,useRef,useState} from 'react';
import {createLearningStorage,emptyLearning} from '../utils/learning';

export function useLearning(preview=false) {
  const [storage]=useState(()=>createLearningStorage(preview?()=>({getItem:()=>null,setItem(){}}):undefined));
  const [initial]=useState(()=>preview?{state:emptyLearning(),error:null}:storage.load());
  const [state,setState]=useState(initial.state);
  const [error,setError]=useState(Boolean(initial.error));
  const pending=useRef([]);
  const latest=useRef(state);
  const change=useCallback(update=>{
    const next=update(latest.current);
    if(next===latest.current)return;
    pending.current.push(update);
    latest.current=next;
    setState(latest.current);
  },[]);
  useEffect(()=>{
    if(!pending.current.length)return;
    const result=storage.save(state);
    setError(!result.ok);
    if(result.ok)pending.current=[];
  },[state,storage]);
  function retry() {
    const recovered=storage.load();
    if(recovered.error){setError(true);return;}
    // Replay only unsaved edits after recovery, preserving unreadable sibling progress.
    const next=pending.current.reduce((value,update)=>update(value),recovered.state);
    const result=storage.save(next);
    latest.current=next;setState(next);setError(!result.ok);
    if(result.ok)pending.current=[];
  }
  return {state,change,error,retry};
}
