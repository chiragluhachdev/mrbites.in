import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2 } from 'lucide-react';

export function useVendorAlarm() {
  const [unacknowledgedIds, setUnacknowledgedIds] = useState(new Set());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const alarmAudio = useRef(null);

  useEffect(() => {
    // Initialize audio object once
    alarmAudio.current = new Audio('/NewOrder.mp3');
    alarmAudio.current.loop = true;

    // Clean up on unmount
    return () => {
      if (alarmAudio.current) {
        alarmAudio.current.pause();
      }
    };
  }, []);

  const enableAudio = useCallback(() => {
    if (!alarmAudio.current) return;
    
    // Play and immediately pause to unlock the AudioContext for this session
    alarmAudio.current.play().then(() => {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
      setAudioEnabled(true);
    }).catch(e => {
      console.error("Failed to unlock audio:", e);
      // Even if it failed, we assume they interacted. Modern browsers might still allow it later.
      setAudioEnabled(true);
    });
  }, []);

  useEffect(() => {
    if (!alarmAudio.current) return;

    if (unacknowledgedIds.size > 0 && audioEnabled) {
      alarmAudio.current.loop = true;
      if (alarmAudio.current.paused) {
         alarmAudio.current.play().catch(e => console.error("Alarm blocked by browser:", e));
      }
    } else {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
    }
  }, [unacknowledgedIds, audioEnabled]);

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
    if (!audioEnabled) return;
    
    if (status === 'ready' || status === 'preparing') {
      new Audio('/click.mp3').play().catch(() => {});
    } else if (status === 'cancelled') {
      new Audio('/error.mp3').play().catch(() => {});
    } else if (status === 'delivered') {
      new Audio('/success.mp3').play().catch(() => {});
    } else {
      new Audio('/click.mp3').play().catch(() => {});
    }
  }, [audioEnabled]);

  // The Banner Component
  const AudioUnlocker = useCallback(() => {
    if (audioEnabled) return null;

    return (
      <div className="bg-amber-100 border-b-2 border-amber-500 text-amber-900 px-4 py-3 flex items-center justify-between z-50 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-white p-2 rounded-full">
            <Volume2 size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">Order Alerts are muted</p>
            <p className="text-xs opacity-80 mt-0.5">Enable sound to hear the alarm when new orders arrive.</p>
          </div>
        </div>
        <button 
          onClick={enableAudio}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-4 rounded-lg text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-amber-100"
        >
          Enable Alerts
        </button>
      </div>
    );
  }, [audioEnabled, enableAudio]);

  return {
    unacknowledgedIds,
    addUnacknowledged,
    removeUnacknowledged,
    playInteractionSound,
    AudioUnlocker,
    audioEnabled
  };
}
