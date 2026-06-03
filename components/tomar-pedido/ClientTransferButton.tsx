"use client";

import { useState } from "react";
import { ArrowLeftRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/app/hooks/useToast";
import { useAuth } from "@/context/authContext";
import { NotificationService } from "@/app/services/notification/NotificationService";
import type { IClient } from "@/app/types/order/client-interface";

export function ClientTransferButton({ client }: { client: IClient }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading || requested) return;

    if (!user?.codigo) {
      toast({
        title: "Transferir",
        description: "No se pudo identificar tu código de vendedor",
        variant: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      await NotificationService.requestTransfer({
        clienteCodigo: client.codigo,
        solicitadoPor: user.codigo,
        solicitanteNombre: user.nombreCompleto,
        clienteNombre: client.Nombre,
        clienteRuc: client.RUC,
        vendedorOrigen: client.Vendedor ?? null,
      });
      setRequested(true);
      toast({
        title: "Transferir",
        description: "Solicitud de transferencia enviada. Espera la confirmación por favor...",
        variant: "success",
        duration: Infinity,
      });
    } catch (error: any) {
      toast({
        title: "Transferir",
        description: error?.response?.data?.message || "No se pudo enviar la solicitud",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={requested ? "outline" : "secondary"}
      disabled={loading || requested}
      onClick={handleClick}
      className="h-8 shrink-0 gap-1"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : requested ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <ArrowLeftRight className="h-3.5 w-3.5" />
      )}
      {requested ? "Solicitado" : "Transferir"}
    </Button>
  );
}
