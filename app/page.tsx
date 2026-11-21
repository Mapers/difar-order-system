"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { useInactivityContext } from "@/app/providers/inactivity-provider";
import { useAuth } from "@/context/authContext";
import { FondoLogin } from "@/components/auth/FondoLogin";
import { LogoDifar } from "@/components/LogoDifar";
import { BookText, Boxes, HandCoins, ShoppingCart } from "lucide-react";

const AREAS = [
  { icono: ShoppingCart, titulo: "Pedidos", detalle: "del vendedor a la farmacia" },
  { icono: Boxes, titulo: "Almacén", detalle: "ingresos, salidas y lotes" },
  { icono: HandCoins, titulo: "Cobranzas", detalle: "planillas y recibos" },
  { icono: BookText, titulo: "Contabilidad", detalle: "libros y registros" },
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const { resetInactivityTimer } = useInactivityContext();
  const { isAuthenticated, loading: authLoading, pendingRoleSelection } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !pendingRoleSelection) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, pendingRoleSelection, router]);

  // Reiniciar el timer cuando haya actividad
  useEffect(() => {
    const handleActivity = () => {
      resetInactivityTimer();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetInactivityTimer]);

  if (typeof window === "undefined" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 dark:from-[#0b0f19] dark:via-[#0c1226] dark:to-[#10102e]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <FondoLogin />
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 p-4 lg:grid-cols-[1.1fr_1fr] lg:px-10">
        {/* Panel de marca: solo en escritorio. */}
        <aside className="hidden lg:block">
          <div className="relative h-24 w-64">
            <LogoDifar fill style={{ objectFit: "contain", objectPosition: "left" }} sizes="260px" priority />
          </div>
          <p className="mt-8 inline-flex items-center rounded-full border border-blue-600/20 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 backdrop-blur dark:border-blue-300/20 dark:bg-white/5 dark:text-blue-300">
            Intranet · Distribución farmacéutica
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white xl:text-5xl">
            Del almacén a la farmacia,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">todo en un solo lugar.</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-slate-600 dark:text-slate-300">
            Sistema de Gestión de Pedidos de DIFAR: ventas, almacén, cobranzas y contabilidad.
          </p>
          <ul className="mt-8 grid max-w-md grid-cols-2 gap-3">
            {AREAS.map(({ icono: Icono, titulo, detalle }) => (
              <li key={titulo} className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/55 p-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md">
                  <Icono className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{titulo}</span>
                  <span className="block truncate text-xs text-slate-600 dark:text-slate-400">{detalle}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
        <div className="w-full max-w-md justify-self-center">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}