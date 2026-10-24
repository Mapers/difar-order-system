'use client'

import { useRouter } from 'next/navigation'
import { Minimize2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIvanChat } from '@/app/hooks/useIvanChat'
import { ChatConversacion } from '@/components/ivan/ChatConversacion'
import { AvatarIvan } from '@/components/ivan/AvatarIvan'

export default function ChatIvanPage() {
    const router = useRouter()
    const chat = useIvanChat()

    const limpiar = () => {
        if (chat.mensajes.length > 0 && !confirm('¿Borrar la conversación y empezar de nuevo?')) return
        chat.limpiar()
    }

    return (
        <div className="grid w-full min-w-0 gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <AvatarIvan tamano="lg" activo={chat.pensando} />
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">IVAN</h1>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${chat.pensando ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
                            {chat.pensando ? 'Trabajando en tu consulta…' : 'Inteligencia Virtual de Atención y Negocios'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={limpiar}>
                        <RotateCcw className="h-3.5 w-3.5" /> Nueva conversación
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push('/dashboard')}>
                        <Minimize2 className="h-3.5 w-3.5" /> Salir de pantalla completa
                    </Button>
                </div>
            </div>

            <div className="flex h-[calc(100vh-13rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                <ChatConversacion {...chat} amplio autoFocus />
            </div>
        </div>
    )
}
