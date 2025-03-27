'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserPlus, Eye, Edit, Trash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {useEffect, useState} from "react";
import {ClientService} from "@/app/services/ClientService";
import {IClient} from "@/app/models/Client";

export default function ClientsPage() {
  const [clients, setClients] = useState<IClient[]>([]);

  const getUsers = async () => {
    try {
      const s = new ClientService();
      const user = await s.getAllClients();
      console.log(user);
      setClients(user);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    getUsers()
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Clientes</h1>
        <p className="text-gray-500">Gestiona la información de tus clientes.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <CardTitle className="text-xl font-semibold text-blue-700">Lista de Clientes</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Buscar clientes..." className="pl-8 bg-white" />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Nombre Comercial</TableHead>
                  <TableHead className="hidden md:table-cell">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.Codigo} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{client.Codigo}</TableCell>
                    <TableCell>{client.Nombre}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.NombreComercial}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={client.Estado === "Activo" ? "default" : "secondary"}
                        className={
                          client.Estado === "Activo"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {client.Estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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

