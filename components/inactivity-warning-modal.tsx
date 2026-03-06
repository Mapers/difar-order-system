"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InactivityWarningModalProps {
  isOpen: boolean;
  timeLeft: number;
  onContinue: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

export function InactivityWarningModal({
                                         isOpen,
                                         timeLeft,
                                         onContinue,
                                         onLogout,
                                         isAuthenticated
                                       }: InactivityWarningModalProps) {
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  useEffect(() => {
    if (timeLeft <= 0 && isOpen && isAuthenticated) {
      onLogout();
    }
  }, [timeLeft, isOpen]);

  const handleInteractOutside = (e: Event) => {
    e.preventDefault();
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKey}
      >
        <DialogHeader>
          <DialogTitle>Inactividad detectada</DialogTitle>
          <DialogDescription>
            Su sesión se cerrará automáticamente por inactividad en:
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-4">
          <div className="text-3xl font-bold text-orange-500">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            ¿Desea continuar con su sesión?
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onLogout}>
            Cerrar sesión
          </Button>
          <Button onClick={onContinue}>
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}