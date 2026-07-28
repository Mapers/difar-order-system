"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/sidebarContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/authContext";

/**
 * El botón y el diálogo son dos componentes separados a propósito.
 *
 * En móvil el botón vive dentro del <SheetContent> del drawer, y tocarlo cierra
 * el drawer. Radix desmonta el contenido del Sheet al cerrarse, así que un
 * diálogo anidado ahí se montaba y se desmontaba en el mismo gesto: el modal
 * aparecía y se iba al instante. El diálogo tiene que montarse FUERA de
 * cualquier contenedor que se desmonte — ver mobile-nav.tsx.
 */

interface LogoutButtonProps {
  onClick: () => void;
}

/** Solo el botón "Cerrar sesión". */
export function LogoutButton({ onClick }: LogoutButtonProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="border-t p-4 shrink-0">
      {collapsed ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={onClick}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar sesión</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onClick}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      )}
    </div>
  );
}

interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Solo el diálogo de confirmación. Montarlo fuera del drawer, no adentro. */
export function LogoutConfirmDialog({ open, onOpenChange }: LogoutConfirmDialogProps) {
  const { logout } = useAuth();

  const handleConfirmLogout = () => {
    onOpenChange(false);
    logout();
  };

  const preventClose = (event: Event) => {
    event.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
  );
}
