import React,{useState} from 'react';
import {Check,Trash2} from 'lucide-react';
import {AvatarDesigner} from './AvatarDesigner';
import {CaregiverDialog} from './CaregiverDialog';
import {CHILD_AGE_OPTIONS} from '../utils/caregiverHelp';

export function ChildEditor({child,onSave,onDelete,onClose}) {
  const [name,setName]=useState(child.name);
  const [age,setAge]=useState(child.age);
  const [avatar,setAvatar]=useState(child.avatar);
  const [confirm,setConfirm]=useState(false);
  const [error,setError]=useState('');
  function cancel(){if(confirm){setConfirm(false);setError('');}else onClose();}
  function save(){if(onSave({name:name.trim(),age,avatar}))onClose();else setError('The changes could not be fully saved on this device. Your edits are still here; please try again.');}
  function remove(){if(onDelete())onClose();else setError('Deletion could not be fully saved on this device. Please retry to finish removing this profile.');}
  const choices=(field,value,items,label,onChange)=><fieldset className="parent-choices"><legend>{label}</legend><div>{items.map(([id,text])=><label key={id} className={value===id?'is-selected':''}><input type="radio" name={field} checked={value===id} onChange={()=>onChange(id)}/><span>{text}</span></label>)}</div></fieldset>;
  return <CaregiverDialog key={confirm?'delete':'edit'} title={confirm?`Delete ${child.name}?`:`Edit ${child.name}`} confirm={confirm} onClose={cancel} footer={confirm?<><button data-autofocus onClick={cancel}>Keep child</button><button className="child-delete" onClick={remove}><Trash2 size={17}/>Delete child permanently</button></>:<><button onClick={onClose}>Cancel</button><div><button className="child-delete" onClick={()=>{setError('');setConfirm(true);}}><Trash2 size={17}/>Delete child</button><button className="is-next" disabled={!name.trim()} onClick={save}><Check size={17}/>Save changes</button></div></>}>
    {confirm?<section><p>This removes <strong>{child.name}</strong>, their appearance, setup answers and saved instrument settings from this browser on this device.</p><p><strong>This cannot be undone.</strong> Other children will not be changed.</p></section>:<section>
      <label className="parent-child-name" htmlFor="edit-child-name">Child name or nickname<input id="edit-child-name" data-autofocus type="text" value={name} onChange={event=>setName(event.target.value)} maxLength={40} required autoComplete="off"/></label>
      {choices('edit-age',age,CHILD_AGE_OPTIONS,'Child age range',setAge)}
      <AvatarDesigner avatar={avatar} age={age} name={name.trim()} onChange={setAvatar}/>
      <p className="parent-guide-note">Editing this profile keeps its instrument choices and difficulty unchanged.</p>
    </section>}
    {error&&<p role="alert" className="parent-completion-error">{error}</p>}
  </CaregiverDialog>;
}