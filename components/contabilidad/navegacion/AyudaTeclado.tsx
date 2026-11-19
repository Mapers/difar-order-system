import type { ReactNode } from "react"
import { Keyboard } from "lucide-react"

// Línea de ayuda bajo las grillas de Contabilidad: recuerda cómo moverse con el teclado
// (ver useNavegacionEnter). Se oculta cuando el periodo está cerrado.
const Tecla = ({ children }: { children: ReactNode }) => (
    <kbd className="rounded border border-b-2 border-border bg-background px-1.5 py-px font-sans text-[10px] font-medium text-foreground">
        {children}
    </kbd>
)

export function AyudaTeclado({ className = "" }: { className?: string }) {
    return (
        <div role="note" className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground ${className}`}>
            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <Keyboard className="h-3.5 w-3.5" /> Teclado:
            </span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap"><Tecla>Enter</Tecla> siguiente casilla</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap"><Tecla>Shift</Tecla>+<Tecla>Enter</Tecla> anterior</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap"><Tecla>↑</Tecla><Tecla>↓</Tecla> misma columna</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap"><Tecla>Enter</Tecla> al final: línea nueva</span>
        </div>
    )
}
