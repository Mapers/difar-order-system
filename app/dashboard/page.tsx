'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, TrendingUp, Calendar, FileText } from "lucide-react"
import Link from "next/link"
import {useEffect, useState} from "react";
import apiClient from "@/app/api/client";
import {useAuth} from "@/context/authContext";

interface DashboardStats {
  totalClientes: number;
  nuevosClientesMes: number;
  totalArticulos: number;
  articulosActualizados: number;
  totalPedidos: number;
  nuevosPedidosHoy: number;
  ultimaActualizacion: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const {user} = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [clientesRes, articulosRes, pedidosRes] = await Promise.all([
          apiClient.post('/clientes/stats/count', {
            seller: (user?.idRol && [2, 3].includes(user.idRol)) ? user.codigo : null,
          }),
          apiClient.get('/articulos/stats/count'),
          apiClient.post('/pedidos/stats/count', {
            seller: (user?.idRol && [1].includes(user.idRol)) ? user.codigo : null,
          })
        ])

        if (clientesRes.status !== 200 || articulosRes.status !== 200 || pedidosRes.status !== 200) {
          throw new Error('Error al obtener datos del dashboard')
        }

        const [clientesData, articulosData, pedidosData] = [
          clientesRes.data,
          articulosRes.data,
          pedidosRes.data
        ]

        const nuevosClientesRes = await apiClient.get('/clientes/recent/month')
        const nuevosClientesData = nuevosClientesRes.data;

        const articulosActualizadosRes = await apiClient.get('/articulos/recent/updated')
        const articulosActualizadosData = articulosActualizadosRes.data;

        const pedidosHoyRes = await apiClient.get('/pedidos/stats/hoy')
        const pedidosHoyData = pedidosHoyRes.data;

        setStats({
          totalClientes: clientesData.data.total,
          nuevosClientesMes: nuevosClientesData.data.length,
          totalArticulos: articulosData.data.total,
          articulosActualizados: articulosActualizadosData.data.length,
          totalPedidos: pedidosData.data.total,
          nuevosPedidosHoy: pedidosHoyData.data.totalHoy,
          ultimaActualizacion: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando datos...</div>
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Panel de Control</h1>
        <p className="text-gray-500">Bienvenido al sistema de gestión de pedidos de DIFAR.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Tarjeta de Pedidos */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats?.totalPedidos || '--'}</div>
              <TrendingUp className="h-8 w-8 text-blue-100" />
            </div>
            <p className="mt-2 text-sm text-blue-100">
              {stats?.nuevosPedidosHoy || '--'} pedidos nuevos hoy
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta de Clientes */}
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats?.totalClientes || '--'}</div>
              <Users className="h-8 w-8 text-indigo-100" />
            </div>
            <p className="mt-2 text-sm text-indigo-100">
              {stats?.nuevosClientesMes || '--'} clientes nuevos este mes
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta de Productos */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats?.totalArticulos || '--'}</div>
              <Package className="h-8 w-8 text-purple-100" />
            </div>
            <p className="mt-2 text-sm text-purple-100">
              {stats?.articulosActualizados || '--'} productos actualizados
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta de Actividad */}
        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">Hoy</div>
              <Calendar className="h-8 w-8 text-cyan-100" />
            </div>
            <p className="mt-2 text-sm text-cyan-100">
              Última actualización: {stats?.ultimaActualizacion || '--'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/clientes">
          <Card className="hover:bg-blue-50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium text-blue-700">Clientes</CardTitle>
              <Users className="h-6 w-6 text-blue-600" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 text-base">
                Gestionar lista de clientes y sus datos
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/productos">
          <Card className="hover:bg-indigo-50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium text-indigo-700">Productos</CardTitle>
              <Package className="h-6 w-6 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 text-base">
                Ver y gestionar catálogo de productos
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/tomar-pedido">
          <Card className="hover:bg-purple-50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium text-purple-700">Tomar Pedido</CardTitle>
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 text-base">Crear y gestionar nuevos pedidos</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Link href="/dashboard/mis-pedidos">
        <Card className="hover:bg-teal-50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium text-teal-700">Mis Pedidos</CardTitle>
            <FileText className="h-6 w-6 text-teal-600" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-600 text-base">Ver historial de pedidos enviados</CardDescription>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}