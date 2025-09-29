"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import {useInactivity} from "@/app/hooks/useInactivity";
import {InactivityWarningModal} from "@/app/components/inactivity-warning-modal";
import {SessionExpiredModal} from "@/app/components/session-expired-modal";

interface InactivityContextType {
  resetInactivityTimer: () => void;
}

const InactivityContext = createContext<InactivityContextType | undefined>(undefined);

export function useInactivityContext() {
  const context = useContext(InactivityContext);
  if (context === undefined) {
    throw new Error("useInactivityContext must be used within an InactivityProvider");
  }
  return context;
}

interface InactivityProviderProps {
  children: ReactNode;
}

export function InactivityProvider({ children }: InactivityProviderProps) {
  const { logout, isAuthenticated, user } = useAuth();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [shouldCheckInactivity, setShouldCheckInactivity] = useState(false);

  useEffect(() => {
    if (user?.idRol === 1) {
      setShouldCheckInactivity(false);
    } else {
      setShouldCheckInactivity(isAuthenticated);
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    if (isAuthenticated) {
      localStorage.removeItem('lastActivityTime');
      logout();
      setShowExpiredModal(true);
    }
  };

  const { isWarning, timeLeft, resetTimer } = useInactivity({
    timeout: 8 * 60 * 60 * 1000,
    onLogout: handleLogout,
    shouldCheckInactivity: shouldCheckInactivity
  });

  const handleContinue = () => {
    resetTimer();
  };

  const handleCloseExpiredModal = () => {
    setShowExpiredModal(false);
  };

  const shouldShowWarning = isWarning && shouldCheckInactivity;

  return (
      <InactivityContext.Provider value={{ resetInactivityTimer: resetTimer }}>
        {children}

        <InactivityWarningModal
            isOpen={shouldShowWarning}
            timeLeft={timeLeft}
            onContinue={handleContinue}
            onLogout={handleLogout}
            isAuthenticated={isAuthenticated}
        />

        <SessionExpiredModal
            isOpen={showExpiredModal}
            onClose={handleCloseExpiredModal}
        />
      </InactivityContext.Provider>
  );
}