'use client'

import React, {use, useEffect, useState} from "react"
import { SideNav } from "@/components/side-nav"
import { MobileNav } from "@/components/mobile-nav"
import socket from "@/app/api/socket";
import {useAuth} from "@/context/authContext";
import {Socket} from "socket.io-client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, User, Calendar } from "lucide-react";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    const { user } = useAuth()
    const [socketLocal, setSocketLocal] = useState<Socket>();
    const [visibleModalNewOrder, setVisibleModalNewOrder] = useState(false);
    const [newOrderData, setNewOrderData] = useState<any>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        setAudio(new Audio('/sounds/beep.mp3'));
    }, []);

    useEffect(() => {
        if (user?.idRol && !socketLocal?.connected) {
            const socketClient = socket;
            console.log('socket executing...');
            socketClient.on('connect', () => {
                console.log('Corriendo conexión realtime');
            })

            socketClient.on('disconnect', () => {
                console.log('Desconectado de realtime');
            })

            setSocketLocal(socketClient);
        }
    }, [user]);

    useEffect(() => {
        if (socketLocal && user) {
            socketLocal.on('notification:newOrder', data => {
                console.log('data newOrder', data);

                if (user?.idRol !== 1) {
                    audio?.play();
                    setNewOrderData(data);
                    setVisibleModalNewOrder(true);
                }
            })
            socketLocal.on('notification:newApprove', data => {
                console.log('data newApprove', data);

                if (user?.idRol !== 1) {
                    audio?.play();
                    setNewOrderData(data);
                    setVisibleModalNewOrder(true);
                }
            })
        }
    }, [socketLocal, user]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            <SideNav />
            <MobileNav />
            <div className="flex-1 p-4 pt-20 md:p-8 md:pl-72 md:pt-8">{children}</div>

            <Dialog open={visibleModalNewOrder} onOpenChange={setVisibleModalNewOrder}>
                <DialogContent className="sm:max-w-md md:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-full">
                                <ShoppingCart className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg">¡Nueva Orden Recibida!</DialogTitle>
                                <DialogDescription>
                                    {newOrderData ? newOrderData.message : 'Sin asignación'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {newOrderData && (
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <User className="h-5 w-5 text-gray-500" />
                                        <div>
                                            <p className="font-semibold">{newOrderData.cliente?.nombre || 'Cliente'}</p>
                                            <p className="text-sm text-gray-600">{newOrderData.cliente?.ruc || 'Sin RUC'}</p>
                                        </div>
                                        <Badge variant="secondary" className="ml-auto">
                                            #{String(newOrderData.numeroOrden || newOrderData.id).padStart(10, '0')}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span>{formatDate(newOrderData.fecha || new Date().toISOString())}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setVisibleModalNewOrder(false)}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}