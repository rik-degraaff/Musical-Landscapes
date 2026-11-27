import React from 'react';
import {CHILD_AGE_OPTIONS} from '../utils/caregiverHelp.js';
import {TRIAL_DESCRIPTION,TRIAL_CONTENT,FULL_CONTENT} from '../utils/editions.js';
import './edition.css';

export function TrialAge({value,onChange}) {
  return <label className="trial-age">Child age range
    <select value={value??''} onChange={event=>onChange(event.target.value)}>
      <option value="" disabled>Choose the child’s age range</option>
      {CHILD_AGE_OPTIONS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
    </select>
  </label>;
}

export function TrialInformation() {
  return <section className="edition-comparison">
    <h3>Unlimited free trial</h3><p>{TRIAL_DESCRIPTION}</p><p>{TRIAL_CONTENT}</p>
    <h3>Full version</h3><p>{FULL_CONTENT}</p>
    <p>A parent can unlock the full version with a one-time payment or an invitation. Use the same parent email on your devices to access it.</p>
  </section>;
}
