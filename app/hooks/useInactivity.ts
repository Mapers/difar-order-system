"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseInactivityProps {
  timeout?: number;
  warningTime?: number;
  onLogout: () => void;
  shouldCheckInactivity: boolean;
}

export const useInactivity = ({
                                timeout = 5 * 60 * 1000,
                                warningTime = 59 * 1000,
                                onLogout,
                                shouldCheckInactivity
                              }: UseInactivityProps) => {
  const [isWarning, setIsWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(warningTime);
  const STORAGE_KEY = 'lastActivityTime';
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onLogoutRef = useRef(onLogout);

  // Mantener la referencia al logout fresca sin recrear el temporizador
  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  const clearAllTimers = useCallback(() => {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    checkIntervalRef.current = null;
  }, []);

  const markActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (shouldCheckInactivity) {
      localStorage.setItem(STORAGE_KEY, now.toString());
    }
  }, [shouldCheckInactivity]);

  const resetTimer = useCallback(() => {
    markActivity();
    setIsWarning(false);
    setTimeLeft(warningTime);
  }, [markActivity, warningTime]);

  // Efecto para manejar los event listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, markActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, markActivity);
      });
    };
  }, [markActivity]);

  // Efecto para verificar inactividad
  useEffect(() => {
    if (!shouldCheckInactivity) {
      clearAllTimers();
      setIsWarning(false);
      setTimeLeft(warningTime);
      return;
    }

    // Retomar la última actividad persistida para que sobreviva a recargas
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '', 10);
    const now = Date.now();
    lastActivityRef.current = Number.isNaN(stored) || stored > now ? now : stored;
    localStorage.setItem(STORAGE_KEY, lastActivityRef.current.toString());

    const checkInactivity = () => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= timeout) {
        clearAllTimers();
        setIsWarning(false);
        setTimeLeft(warningTime);
        onLogoutRef.current();
        return;
      }

      if (elapsed >= timeout - warningTime) {
        setIsWarning(true);
        setTimeLeft(timeout - elapsed);
      } else {
        setIsWarning(false);
        setTimeLeft(warningTime);
      }
    };

    // Evaluar de inmediato: cubre el caso de sesión ya vencida al cargar la página
    checkInactivity();
    checkIntervalRef.current = setInterval(checkInactivity, 1000);

    return () => clearAllTimers();
  }, [shouldCheckInactivity, timeout, warningTime, clearAllTimers]);

  return {
    isWarning,
    timeLeft,
    resetTimer
  };
};
