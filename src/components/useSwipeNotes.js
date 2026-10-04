import { useEffect, useRef } from 'react';

export function useSwipeNotes(surface, onEnter, onLeave) {
  const callbacks = useRef({ onEnter, onLeave });
  callbacks.current = { onEnter, onLeave };
  useEffect(() => {
    const pointers = new Map();
    const hit = (x, y) => {
      const element = document.elementFromPoint(x, y)?.closest('[data-swipe-note]');
      return element && surface.current?.contains(element) ? element : null;
    };
    function visit(pointer, x, y, id) {
      const next = hit(x, y);
      if (pointer.note === next) return;
      if (pointer.note) {
        callbacks.current.onLeave?.(pointer.note.dataset.swipeNote, `swipe-${id}`);
        pointer.note.removeAttribute(`data-pointer-${id}`);
        if (!pointer.note.getAttributeNames().some(name => name.startsWith('data-pointer-'))) pointer.note.classList.remove('swipe-pressed');
      }
      pointer.note = next;
      if (next) {
        next.setAttribute(`data-pointer-${id}`, '');
        next.classList.add('swipe-pressed');
        callbacks.current.onEnter(next.dataset.swipeNote, `swipe-${id}`);
      }
    }
    function down(event) {
      if (event.button !== 0) return;
      const pointer = { x: event.clientX, y: event.clientY, note: null };
      pointers.set(event.pointerId, pointer);
      visit(pointer, pointer.x, pointer.y, event.pointerId);
    }
    function move(event) {
      const pointer = pointers.get(event.pointerId);
      if (!pointer) return;
      const steps = Math.max(1, Math.ceil(Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) / 3));
      for (let step = 1; step <= steps; step++) visit(pointer, pointer.x + (event.clientX - pointer.x) * step / steps, pointer.y + (event.clientY - pointer.y) * step / steps, event.pointerId);
      pointer.x = event.clientX; pointer.y = event.clientY;
    }
    function end(event) {
      const pointer = pointers.get(event.pointerId);
      if (!pointer) return;
      visit(pointer, -1, -1, event.pointerId);
      pointers.delete(event.pointerId);
    }
    function clear() { for (const id of [...pointers.keys()]) end({ pointerId: id }); }
    const hidden = () => { if (document.hidden) clear(); };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', end, true);
    window.addEventListener('pointercancel', end, true);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      clear();
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', end, true);
      window.removeEventListener('pointercancel', end, true);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [surface]);
}