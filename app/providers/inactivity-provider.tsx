"use client";

import { createContext, useContext, useState, ReactNode } from "react";
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
  const { logout, isAuthenticated  } = useAuth();
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const handleLogout = () => {
    console.log('isAuthenticated', isAuthenticated)
    if (isAuthenticated) {
      logout();
      setShowExpiredModal(true);
    }
  };

  const { isWarning, timeLeft, resetTimer } = useInactivity({
    timeout: 5 * 60 * 1000,
    onLogout: handleLogout,
  });

  const handleContinue = () => {
    resetTimer();
  };

  const handleCloseExpiredModal = () => {
    setShowExpiredModal(false);
  };

  // No mostrar modales si el usuario no está autenticado
  const shouldShowWarning = isWarning && isAuthenticated;

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