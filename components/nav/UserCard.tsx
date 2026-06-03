"use client";

import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { useAuth } from "@/context/authContext";

/** Cabecera compartida del sidebar: logo + tarjeta con datos del usuario. */
export function UserCard() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center border-b px-4 pt-4 pb-2 gap-2">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image
          src="/difar-logo.png"
          alt="Logo difar"
          width={120}
          height={60}
          className="object-contain"
        />
      </Link>
      <div className="w-full rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-2 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 shadow-inner">
            <User className="h-6 w-6 text-blue-700" />
          </div>

          <div className="flex-1 min-w-0">
            <span style={{ fontSize: "12px" }}>
              {user?.nombreCompleto || "Usuario"}
            </span>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                {!!user?.codRepres
                  ? "Representante"
                  : user?.rolDescripcion || "Sin rol"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-xs text-gray-400 font-mono">
                {!!user?.codRepres ? user?.codRepres : user?.codigo || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
