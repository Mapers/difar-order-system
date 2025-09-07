"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseInactivityProps {
  timeout?: number;
  warningTime?: number;
  onLogout: () => void;
}

export const useInactivity = ({
                                timeout = 5 * 60 * 1000,
                                warningTime = 60 * 1000,
                                onLogout,
                              }: UseInactivityProps) => {
  const [isWarning, setIsWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(warningTime);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Referencias para los timers
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    inactivityTimerRef.current = null;
    countdownIntervalRef.current = null;
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearAllTimers();

    // Programar el temporizador de advertencia
    inactivityTimerRef.current = setTimeout(() => {
      setIsWarning(true);
      setTimeLeft(warningTime);

      // Iniciar cuenta regresiva visual
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            clearAllTimers();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }, timeout - warningTime);
  }, [timeout, warningTime, onLogout, clearAllTimers]);

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    if (isWarning) {
      setIsWarning(false);
      setTimeLeft(warningTime);
      clearAllTimers();
      startInactivityTimer();
    }
  }, [isWarning, warningTime, clearAllTimers, startInactivityTimer]);

  // Efecto para manejar los event listeners
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Efecto para verificar inactividad
  useEffect(() => {
    const checkInactivity = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - lastActivity;

      if (!isWarning && elapsed >= timeout - warningTime) {
        setIsWarning(true);
        setTimeLeft(warningTime - (elapsed - (timeout - warningTime)));

        // Iniciar cuenta regresiva
        countdownIntervalRef.current = setInterval(() => {
          setTimeLeft(prev => {
            const newTime = prev - 1000;
            if (newTime <= 0) {
              clearAllTimers();
              return 0;
            }
            return newTime;
          });
        }, 1000);
      } else if (elapsed >= timeout) {
        clearAllTimers();
      }
    };

    // Verificar inactividad cada segundo
    const interval = setInterval(checkInactivity, 1000);

    return () => {
      clearInterval(interval);
      clearAllTimers();
    };
  }, [lastActivity, timeout, warningTime, isWarning, onLogout, clearAllTimers]);

  // Iniciar el temporizador al montar
  useEffect(() => {
    startInactivityTimer();
    return () => clearAllTimers();
  }, [startInactivityTimer, clearAllTimers]);

  return {
    isWarning,
    timeLeft,
    resetTimer
  };
};