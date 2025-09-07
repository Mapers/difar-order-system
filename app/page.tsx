"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/components/login-form";
import {useInactivityContext} from "@/app/providers/inactivity-provider";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const { resetInactivityTimer } = useInactivityContext();

  useEffect(() => {
    setLoading(false);
  }, []);

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="absolute inset-0 bg-grid-blue-500/[0.05] -z-10"></div>
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-3/4 h-3/4 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}