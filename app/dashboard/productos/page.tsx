import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, PackagePlus, Eye, Edit, Trash } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Mock data for products
const products = [
  { IdArticulo: 1, NombreItem: "Producto 1", Categoria: "Categoría A", Stock: 25, Estado: "Disponible" },
  { IdArticulo: 2, NombreItem: "Producto 2", Categoria: "Categoría B", Stock: 10, Estado: "Disponible" },
  { IdArticulo: 3, NombreItem: "Producto 3", Categoria: "Categoría A", Stock: 0, Estado: "Agotado" },
  { IdArticulo: 4, NombreItem: "Producto 4", Categoria: "Categoría C", Stock: 15, Estado: "Disponible" },
  { IdArticulo: 5, NombreItem: "Producto 5", Categoria: "Categoría B", Stock: 5, Estado: "Disponible" },
]

export default function ProductsPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Productos</h1>
        <p className="text-gray-500">Gestiona tu catálogo de productos.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <CardTitle className="text-xl font-semibold text-indigo-700">Lista de Productos</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Buscar productos..." className="pl-8 bg-white" />
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <PackagePlus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="hidden md:table-cell">Stock</TableHead>
                  <TableHead className="hidden md:table-cell">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.IdArticulo} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{product.IdArticulo}</TableCell>
                    <TableCell>{product.NombreItem}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.Categoria}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.Stock}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={product.Estado === "Disponible" ? "default" : "secondary"}
                        className={
                          product.Estado === "Disponible"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {product.Estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

