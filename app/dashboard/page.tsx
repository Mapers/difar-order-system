import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, TrendingUp, Calendar, FileText } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Panel de Control</h1>
        <p className="text-gray-500">Bienvenido al sistema de gestión de pedidos de DIFAR CHIMBOTE.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">24</div>
              <TrendingUp className="h-8 w-8 text-blue-100" />
            </div>
            <p className="mt-2 text-sm text-blue-100">12 pedidos nuevos hoy</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">156</div>
              <Users className="h-8 w-8 text-indigo-100" />
            </div>
            <p className="mt-2 text-sm text-indigo-100">3 clientes nuevos este mes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">89</div>
              <Package className="h-8 w-8 text-purple-100" />
            </div>
            <p className="mt-2 text-sm text-purple-100">5 productos actualizados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">Hoy</div>
              <Calendar className="h-8 w-8 text-cyan-100" />
            </div>
            <p className="mt-2 text-sm text-cyan-100">Última actualización: 10:45 AM</p>
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

        <Link href="/dashboard/pedido">
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

