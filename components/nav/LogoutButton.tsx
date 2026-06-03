"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/authContext";

interface LogoutButtonProps {
  /** Se llama justo antes de abrir el diálogo (móvil lo usa para cerrar el drawer). */
  onBeforeOpen?: () => void;
}

/** Botón "Cerrar sesión" + diálogo de confirmación, compartido por ambos navs. */
export function LogoutButton({ onBeforeOpen }: LogoutButtonProps) {
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    onBeforeOpen?.();
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const preventClose = (event: Event) => {
    event.preventDefault();
  };

  return (
    <>
      <div className="border-t p-4 shrink-0">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogoutClick}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={preventClose}
          onEscapeKeyDown={preventClose}
        >
          <DialogHeader>
            <DialogTitle>Confirmar cierre de sesión</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea cerrar su sesión actual?
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-4">
            <div className="text-3xl font-bold text-orange-500 mb-2">
              <LogOut className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Será redirigido a la página de inicio de sesión
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleCancelLogout}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Cerrar sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
