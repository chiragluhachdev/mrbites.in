import { useState, useEffect, useRef, useCallback } from 'react';

export function useVendorAlarm() {
  const [unacknowledgedIds, setUnacknowledgedIds] = useState(new Set());
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const alarmAudio = useRef(null);

  useEffect(() => {
    // Initialize audio object once
    alarmAudio.current = new Audio('/NewOrder.mp3');
    alarmAudio.current.loop = true;

    const handleUserInteraction = () => {
      setUserHasInteracted(true);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      if (alarmAudio.current) {
        alarmAudio.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (!alarmAudio.current) return;

    if (unacknowledgedIds.size > 0 && userHasInteracted) {
      // Ensure loop is set (some browsers reset it)
      alarmAudio.current.loop = true;
      
      // We must check if the audio is paused before playing to avoid DOMExceptions
      if (alarmAudio.current.paused) {
         alarmAudio.current.play().catch(e => console.error("Alarm blocked by browser:", e));
      }
    } else {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
    }
  }, [unacknowledgedIds, userHasInteracted]);

  const addUnacknowledged = useCallback((orderId) => {
    setUnacknowledgedIds(prev => new Set(prev).add(orderId));
  }, []);

  const removeUnacknowledged = useCallback((orderId) => {
    setUnacknowledgedIds(prev => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }, []);

  // UI Sound Effects
  const playInteractionSound = useCallback((status) => {
    if (status === 'ready' || status === 'preparing') {
      new Audio('/click.mp3').play().catch(() => {});
    } else if (status === 'cancelled') {
      new Audio('/error.mp3').play().catch(() => {});
    } else if (status === 'delivered') {
      new Audio('/success.mp3').play().catch(() => {});
    } else {
      new Audio('/click.mp3').play().catch(() => {});
    }
  }, []);

  return {
    unacknowledgedIds,
    addUnacknowledged,
    removeUnacknowledged,
    playInteractionSound,
    userHasInteracted
  };
}
