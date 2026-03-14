import { useState, useEffect, useCallback } from 'react';

export function useFocusTimer(isActive: boolean, timeoutMs: number = 30000) {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showNudge, setShowNudge] = useState(false);

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowNudge(false);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleScroll = () => resetTimer();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleScroll);
    window.addEventListener('keydown', handleScroll);

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > timeoutMs) {
        setShowNudge(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleScroll);
      window.removeEventListener('keydown', handleScroll);
      clearInterval(interval);
    };
  }, [isActive, lastActivity, timeoutMs, resetTimer]);

  return { showNudge, resetTimer };
}
