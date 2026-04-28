'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, TrendingUp, Calendar, FileText, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts"

interface DashboardStats {
  totalClientes: number
  nuevosClientesMes: number
  totalArticulos: number
  articulosActualizados: number
  totalPedidos: number
  nuevosPedidosHoy: number
  ultimaActualizacion: string
}

const quickLinks = [
  { href: "/dashboard/clientes",     label: "Clientes",     desc: "Gestionar lista de clientes",         icon: Users,        color: "text-blue-600",   bg: "hover:bg-blue-50"   },
  { href: "/dashboard/productos",    label: "Productos",    desc: "Ver y gestionar catálogo",             icon: Package,      color: "text-indigo-600", bg: "hover:bg-indigo-50" },
  { href: "/dashboard/tomar-pedido", label: "Tomar Pedido", desc: "Crear y gestionar nuevos pedidos",     icon: ShoppingCart, color: "text-purple-600", bg: "hover:bg-purple-50" },
  { href: "/dashboard/mis-pedidos",  label: "Mis Pedidos",  desc: "Ver historial de pedidos enviados",    icon: FileText,     color: "text-teal-600",   bg: "hover:bg-teal-50"   },
]

export default function Dashboard() {
  const [stats, setStats]         = useState<DashboardStats | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [ventasDiarias, setVentasDiarias]   = useState<any[]>([])
  const [ventasMensuales, setVentasMensuales] = useState<any[]>([])
  const [clientesFrecuentes, setClientesFrecuentes] = useState<any[]>([])
  const [ticketPromedio, setTicketPromedio] = useState<number>(0)

  const { user, isAdmin, isVendedor } = useAuth()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [clientesRes, articulosRes, pedidosRes] = await Promise.all([
          apiClient.post('/clientes/stats/count', {
            seller: (user?.idRol && isAdmin()) ? user.codigo : null,
          }),
          apiClient.get('/articulos/stats/count'),
          apiClient.post('/pedidos/stats/count', {
            seller: (user?.idRol && isVendedor()) ? user.codigo : null,
          })
        ])

        const nuevosClientesRes        = await apiClient.get('/clientes/recent/month')
        const articulosActualizadosRes = await apiClient.get('/articulos/recent/updated')
        const pedidosHoyRes            = await apiClient.get('/pedidos/stats/hoy')

        setStats({
          totalClientes:       clientesRes.data.data.total,
          nuevosClientesMes:   nuevosClientesRes.data.data.length,
          totalArticulos:      articulosRes.data.data.total,
          articulosActualizados: articulosActualizadosRes.data.data.length,
          totalPedidos:        pedidosRes.data.data.total,
          nuevosPedidosHoy:    pedidosHoyRes.data.data.totalHoy,
          ultimaActualizacion: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        })

        try {
          const [ventasDiariasRes, ventasMensualesRes, ticketRes, frecuentesRes] = await Promise.all([
            apiClient.get(`/admin/dashboard/ventas-diarias`),
            apiClient.get(`/admin/dashboard/ventas-mensuales`),
            apiClient.get(`/admin/dashboard/ticket-promedio`),
            apiClient.get(`/admin/dashboard/clientes-frecuentes`),
          ])

          const rawDiarias: { fecha: string; total: number }[] = ventasDiariasRes.data.data || []
          const now     = new Date()
          const allDays = generateMonthDays(now.getFullYear(), now.getMonth() + 1)
          setVentasDiarias(
              allDays.map(fecha => {
                const found = rawDiarias.find(d => d.fecha.startsWith(fecha))
                return { fecha, total: found ? Number(found.total) : 0 }
              })
          )

          const rawMensuales: { mes_key: string; mes: string; total: number }[] = ventasMensualesRes.data.data || []
          const allMonths = generateLast3Months()
          setVentasMensuales(
              allMonths.map(m => {
                const found = rawMensuales.find(d => d.mes_key === m.mes_key)
                return {
                  mes_key: m.mes_key,
                  mes:     m.mes,
                  total:   found ? Number(found.total) : 0
                }
              })
          )

          setTicketPromedio(ticketRes.data.data?.ticketPromedio || 0)

          setClientesFrecuentes(frecuentesRes.data.data || [])

        } catch {
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const generateLast3Months = () => {
    const now = new Date()
    return Array.from({ length: 3 }, (_, i) => {
      const date  = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1)
      const key   = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const nombres = [
        'Enero','Febrero','Marzo','Abril','Mayo','Junio',
        'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
      ]
      return {
        mes_key: key,
        mes:     nombres[date.getMonth()],
        total:   0
      }
    })
  }

  const generateMonthDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0')
      const m   = String(month).padStart(2, '0')
      return `${year}-${m}-${day}`
    })
  }

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-500">Cargando datos...</div>
  if (error)   return <div className="text-red-500 p-4">Error: {error}</div>

  return (
      <div className="grid gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Panel de Control</h1>
          <p className="text-gray-500">Bienvenido al sistema de gestión de pedidos de DIFAR.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-100">Pedidos Totales</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalPedidos ?? '--'}</div>
              <p className="text-xs text-blue-100 mt-1">+{stats?.nuevosPedidosHoy ?? '--'} hoy</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-indigo-100">Clientes</CardTitle>
              <Users className="h-5 w-5 text-indigo-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalClientes ?? '--'}</div>
              <p className="text-xs text-indigo-100 mt-1">+{stats?.nuevosClientesMes ?? '--'} este mes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-100">Productos</CardTitle>
              <Package className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalArticulos ?? '--'}</div>
              <p className="text-xs text-purple-100 mt-1">{stats?.articulosActualizados ?? '--'} actualizados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-cyan-100">Actividad</CardTitle>
              <Calendar className="h-5 w-5 text-cyan-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Hoy</div>
              <p className="text-xs text-cyan-100 mt-1">Actualizado: {stats?.ultimaActualizacion ?? '--'}</p>
            </CardContent>
          </Card>
        </div>

        {isAdmin() && <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total de ventas</p>
                  <CardTitle className="text-xl font-bold text-blue-600">
                    S/{ventasDiarias.reduce((s, d) => s + (d.total || 0), 0).toLocaleString('es-PE', {minimumFractionDigits: 2})}
                  </CardTitle>
                </div>
                <select className="text-xs border rounded px-2 py-1 text-gray-600">
                  <option>Mes actual (April)</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ventasDiarias} margin={{bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis
                      dataKey="fecha"
                      tick={{fontSize: 10, fill: '#666'}}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                  />
                  <YAxis tick={{fontSize: 10}}/>
                  <Tooltip formatter={(v: any) => [`S/${Number(v).toFixed(2)}`, 'Ventas']}/>
                  <Legend wrapperStyle={{fontSize: 11}}/>
                  <Line
                      type="monotone"
                      dataKey="total"
                      name="Total de Ventas Diarias"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{r: 4, fill: '#3b82f6'}}
                      activeDot={{r: 6}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Ventas por Mes</CardTitle>
                <select className="text-xs border rounded px-2 py-1 text-gray-600">
                  <option>Últimos 3 meses</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ventasMensuales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="mes" tick={{fontSize: 11}}/>
                  <YAxis tick={{fontSize: 11}}/>
                  <Tooltip formatter={(v: any) => [`S/${Number(v).toFixed(2)}`, 'Ventas']}/>
                  <Legend wrapperStyle={{fontSize: 11}}/>
                  <Bar dataKey="total" name="Total de Ventas por Mes" fill="#eab308" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 flex flex-col gap-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Ticket Promedio ℹ</CardTitle>
                <select className="text-xs border rounded px-2 py-1 text-gray-600">
                  <option>Mes actual (April)</option>
                </select>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                S/{ticketPromedio.toLocaleString('es-PE', {minimumFractionDigits: 2})}
              </p>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center justify-between">
                Clientes Frecuentes
                <select className="border rounded px-1 py-0.5 text-xs font-normal text-gray-500">
                  <option>Mes actual (April)</option>
                </select>
              </p>
              <ul className="space-y-2">
                {clientesFrecuentes.slice(0, 5).map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                      <Users className="h-3.5 w-3.5 text-gray-400 shrink-0"/>
                      <span className="truncate">{c.nombre || c.client || c.cliente}</span>
                    </li>
                ))}
                {clientesFrecuentes.length === 0 && (
                    <li className="text-xs text-gray-400 italic">Sin datos disponibles</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>}

        {!isAdmin() && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({href, label, desc, icon: Icon, color, bg}) => (
              <Link href={href} key={href}>
                <Card className={`${bg} transition-colors h-full cursor-pointer`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className={`text-base font-semibold ${color}`}>{label}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Icon className={`h-5 w-5 ${color}`}/>
                      <ArrowUpRight className={`h-3.5 w-3.5 ${color} opacity-60`}/>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </CardContent>
                </Card>
              </Link>
          ))}
        </div>}
      </div>
  )
}