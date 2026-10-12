import {RotateCw} from 'lucide-react';
import './save-status.css';

export function SaveStatus({onRetry}) {
  return <div className="save-status" role="status">
    <span>This device could not save your changes. They may be lost when you close FarmJam.</span>
    <button type="button" onClick={onRetry} aria-label="Retry saving" title="Retry saving"><RotateCw size={20}/></button>
  </div>;
}