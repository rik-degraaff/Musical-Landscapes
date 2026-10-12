import { useEffect, useEffectEvent } from 'react';
import { appUpdates } from '../utils/updatePolicy.js';

export function useAppUpdates({ started, loading, parentGuide }) {
  const getAppState = useEffectEvent(() => ({ started, loading, parentGuide }));
  useEffect(() => {
    const apply = () => { void appUpdates.applyWhenSafe(getAppState); };
    const unsubscribe = appUpdates.subscribe(apply);
    apply();
    return unsubscribe;
  }, [started, loading, parentGuide]);
}