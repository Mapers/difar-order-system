"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useSidebar } from "@/context/sidebarContext";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { LogoDifar } from "@/components/LogoDifar";

/** Iniciales para el avatar: primera letra de las dos primeras palabras ("web-aws" → "WA"). */
function iniciales(nombre?: string | null): string {
  const partes = (nombre ?? "").trim().split(/[\s\-_.]+/).filter(Boolean);
  if (!partes.length) return "U";
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase();
}

/** Cabecera compartida del sidebar: logo + tarjeta con datos del usuario. */
export function UserCard() {
  const { user, ingresarComoVendedor, ingresarComoRepresentante, switchingRole } = useAuth();
  const { collapsed } = useSidebar();
  const router = useRouter();

  // Modo activo según el token
  const esVendedorSimulado = !!user?.simuladoPorRepresentante;
  const esRepresentante = !!user?.idRepresentante;

  const puedeAlternar =
    (esRepresentante && !!user?.vendedorRelacion?.idVendedor) || esVendedorSimulado;

  const handleToggle = async (haciaVendedor: boolean) => {
    if (switchingRole) return;
    const ok = haciaVendedor
      ? await ingresarComoVendedor()
      : await ingresarComoRepresentante();
    if (ok) router.push("/dashboard");
  };

  const avatar = (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold tracking-wide text-white ring-1 ring-white/30">
      {iniciales(user?.nombreCompleto)}
      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3" title="Sesión activa">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
        <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-indigo-600 bg-emerald-400" />
      </span>
    </span>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-b border-border/60 px-2 pb-3 pt-3">
        <Link href="/dashboard" title={user?.nombreCompleto || "Inicio"}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/25">
          <span className="text-sm font-bold tracking-wide text-white">{iniciales(user?.nombreCompleto)}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 border-b border-border/60 px-3 pb-3 pt-4">
      <Link href="/dashboard" className="flex items-center gap-2">
        <LogoDifar
          width={120}
          height={60}
          className="object-contain"
        />
      </Link>

      <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 p-3 text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/35">
        {/* Brillo decorativo */}
        <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 animate-pulse rounded-full bg-white/20 blur-2xl [animation-duration:4s]" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-indigo-300/20 blur-2xl" />

        <div className="relative flex items-center gap-3">
          {avatar}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight" title={user?.nombreCompleto || "Usuario"}>
              {user?.nombreCompleto || "Usuario"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-semibold leading-tight">
                {!!user?.codRepres
                  ? "Representante"
                  : user?.rolDescripcion || "Sin rol"}
              </span>
              <span className="font-mono text-[10.5px] text-white/75">
                {!!user?.codRepres ? user?.codRepres : user?.codigo || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {puedeAlternar && (
          <div className="relative mt-3 border-t border-white/20 pt-2.5">
            <div className="flex items-center justify-center gap-2">
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  !esVendedorSimulado ? "text-white" : "text-white/55"
                )}
              >
                Representante
              </span>
              <Switch
                checked={esVendedorSimulado}
                disabled={switchingRole}
                onCheckedChange={(v) => handleToggle(v)}
                aria-label="Cambiar entre representante y vendedor"
              />
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  esVendedorSimulado ? "text-white" : "text-white/55"
                )}
              >
                Vendedor
              </span>
              {switchingRole && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white/80" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
