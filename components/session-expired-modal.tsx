"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionExpiredModal({
                                      isOpen,
                                      onClose
                                    }: SessionExpiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sesión cerrada</DialogTitle>
          <DialogDescription>
            Su sesión ha sido cerrada automáticamente por inactividad.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Aceptar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}