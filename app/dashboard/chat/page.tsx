'use client'

import { useRouter } from 'next/navigation'
import { Bot, Minimize2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIvanChat } from '@/app/hooks/useIvanChat'
import { ChatConversacion } from '@/components/ivan/ChatConversacion'

export default function ChatIvanPage() {
    const router = useRouter()
    const chat = useIvanChat()

    const limpiar = () => {
        if (chat.mensajes.length > 1 && !confirm('¿Borrar la conversación y empezar de nuevo?')) return
        chat.limpiar()
    }

    return (
        <div className="grid w-full min-w-0 gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">IVAN</h1>
                        <p className="text-sm text-muted-foreground">
                            Inteligencia Virtual de Atención y Negocios
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={limpiar}>
                        <Trash2 className="h-3.5 w-3.5" /> Limpiar
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push('/dashboard')}>
                        <Minimize2 className="h-3.5 w-3.5" /> Salir de pantalla completa
                    </Button>
                </div>
            </div>

            <div className="flex h-[calc(100vh-13rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-background">
                <ChatConversacion {...chat} amplio autoFocus />
            </div>
        </div>
    )
}
