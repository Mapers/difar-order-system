"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { Smartphone, ClipboardList, Users, PackageCheck, ArrowRight } from "lucide-react"

// Para el rol Vendedor los pedidos se toman solo desde la app DIFAR.
// Al entrar a Tomar Pedido se muestra este modal a pantalla completa: no se
// puede cerrar ni usar el formulario de atrás; solo ir a Mis Pedidos.

export default function ModalPedidoApp() {
    const router = useRouter()

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-300"
            role="dialog" aria-modal="true" aria-labelledby="modal-pedido-app-titulo">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-background shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="relative flex flex-col items-center bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-6 pb-10 pt-10 text-white">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                    <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-white/10" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 ring-4 ring-white/20">
                        <Smartphone className="h-12 w-12" strokeWidth={1.6} />
                    </div>
                    <h2 id="modal-pedido-app-titulo" className="relative mt-6 text-center text-2xl font-bold sm:text-3xl">
                        Los pedidos se toman desde la app
                    </h2>
                    <p className="relative mt-2 max-w-md text-center text-sm text-blue-100 sm:text-base">
                        Como vendedor, registra tus pedidos en la <span className="font-semibold text-white">app DIFAR</span> de tu celular.
                    </p>
                </div>

                <div className="space-y-3 px-6 py-6 sm:px-8">
                    {[
                        { icon: Users, texto: "Tus clientes y su línea de crédito al día" },
                        { icon: PackageCheck, texto: "Stock, lotes y precios en tiempo real" },
                        { icon: ClipboardList, texto: "Tus pedidos los sigues viendo en la web, en Mis Pedidos" },
                    ].map(({ icon: Icon, texto }) => (
                        <div key={texto} className="flex items-center gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm text-foreground">
                            <Icon className="h-5 w-5 shrink-0 text-blue-600" />
                            {texto}
                        </div>
                    ))}
                </div>

                <div className="border-t bg-muted/40 px-6 py-4 sm:px-8">
                    <button type="button" onClick={() => router.push("/dashboard/mis-pedidos")}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-700">
                        Ir a Mis Pedidos <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
