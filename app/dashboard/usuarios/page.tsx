'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Plus, Edit, Trash2, User, Check, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/app/api/client'

interface Usuario {
  id_usuario: number
  idVendedor: number
  codigo: string
  nombre_completo: string
  DNI: string
  telefono: string
  activo: boolean
  id_rol: number
  nombre_rol: string
}

interface Vendedor {
  idVendedor: number
  codigo: string
  nombre_completo: string
  DNI: string
  telefono: string
}

interface UsuarioNoWeb {
  IdUsuarios: number
  NombreUsuarios: string
  EmpRegistros: string
  ObsUsuario: string
}

interface Rol {
  id: number
  nombre: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [vendedoresNoUsuarios, setVendedoresNoUsuarios] = useState<Vendedor[]>([])
  const [usuariosNoWeb, setUsuariosNoWeb] = useState<UsuarioNoWeb[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [busquedaVendedor, setBusquedaVendedor] = useState('')
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null)
  const [selectedUsuarioNoWeb, setSelectedUsuarioNoWeb] = useState<UsuarioNoWeb | null>(null)
  const [selectedRol, setSelectedRol] = useState('')
  const [activo, setActivo] = useState(true)
  const { toast } = useToast()

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/usuarios/listar')
      setUsuarios(response.data.data.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVendedoresNoUsuarios = async () => {
    try {
      const response = await apiClient.get(`/usuarios/search/vendedor?busqueda=${busquedaVendedor}`)
      setVendedoresNoUsuarios(response.data.data.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron buscar vendedores',
        variant: 'destructive'
      })
    }
  }

  const fetchUsuariosNoWeb = async () => {
    try {
      const response = await apiClient.get(`/usuarios/search/usuario?busqueda=${busquedaUsuarios}`)
      setUsuariosNoWeb(response.data.data.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron buscar usuarios',
        variant: 'destructive'
      })
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get('/roles/listar')
      setRoles(response.data.data.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los roles',
        variant: 'destructive'
      })
    }
  }

  const handleAddUsuario = async () => {
    try {
      if (!selectedVendedor || !selectedRol || !selectedUsuarioNoWeb) {
        toast({
          title: 'Error',
          description: 'Debe seleccionar un vendedor, usuario y un rol',
          variant: 'destructive'
        })
        return
      }

      await apiClient.post('/usuarios/register', {
        id_vendedor: selectedVendedor.idVendedor,
        id_rol: parseInt(selectedRol),
        activo,
        id_usuario: selectedUsuarioNoWeb.IdUsuarios
      })

      toast({
        title: 'Éxito',
        description: 'Usuario registrado correctamente'
      })

      setShowAddDialog(false)
      fetchUsuarios()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar el usuario',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateUsuario = async () => {
    try {
      if (!selectedUsuario || !selectedRol) return

      await apiClient.put(`/usuarios/update/${selectedUsuario.id_usuario}`, {
        id_rol: parseInt(selectedRol),
        activo
      })

      toast({
        title: 'Éxito',
        description: 'Usuario actualizado correctamente'
      })

      setShowEditDialog(false)
      fetchUsuarios()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el usuario',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    fetchUsuarios()
    fetchRoles()
  }, [])

  useEffect(() => {
    if (busquedaVendedor) {
      const timer = setTimeout(() => {
        fetchVendedoresNoUsuarios()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [busquedaVendedor])

  useEffect(() => {
    if (busquedaUsuarios) {
      const timer = setTimeout(() => {
        fetchUsuariosNoWeb()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [busquedaUsuarios])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500">Administra los usuarios con acceso al sistema</p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Buscar Vendedor</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <Input
                    placeholder="Buscar por nombre o DNI..."
                    className="pl-10"
                    value={busquedaVendedor}
                    onChange={(e) => setBusquedaVendedor(e.target.value)}
                  />
                </div>

                {vendedoresNoUsuarios.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                    {vendedoresNoUsuarios.map((v) => (
                      <div
                        key={v.idVendedor}
                        className={`p-3 hover:bg-gray-50 cursor-pointer ${selectedVendedor?.idVendedor === v.idVendedor ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedVendedor(v)}
                      >
                        <p className="font-medium">{v.nombre_completo}</p>
                        <p className="text-sm text-gray-600">DNI: {v.DNI} - Código: {v.codigo}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Buscar Usuario</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <Input
                    placeholder="Buscar por nombre usuario o empRegistro..."
                    className="pl-10"
                    value={busquedaUsuarios}
                    onChange={(e) => setBusquedaUsuarios(e.target.value)}
                  />
                </div>

                {usuariosNoWeb.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                    {usuariosNoWeb.map((v) => (
                      <div
                        key={v.IdUsuarios}
                        className={`p-3 hover:bg-gray-50 cursor-pointer ${selectedUsuarioNoWeb?.IdUsuarios === v.IdUsuarios ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedUsuarioNoWeb(v)}
                      >
                        <p className="font-medium">{v.NombreUsuarios}</p>
                        <p className="text-sm text-gray-600">CodEmp: {v.EmpRegistros} - Código: {v.ObsUsuario}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <Select value={selectedRol} onValueChange={setSelectedRol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol"/>
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Activo</label>
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddUsuario}>
                Registrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Cargando usuarios...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id_usuario}>
                    <TableCell className="font-medium">{usuario.nombre_completo}</TableCell>
                    <TableCell>{usuario.DNI}</TableCell>
                    <TableCell>{usuario.telefono}</TableCell>
                    <TableCell>{usuario.nombre_rol}</TableCell>
                    <TableCell>
                      {usuario.activo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <X className="h-3 w-3 mr-1" /> Inactivo
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUsuario(usuario)
                              setSelectedRol(usuario.id_rol.toString())
                              setActivo(usuario.activo)
                            }}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Usuario</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Vendedor</label>
                              <Input
                                value={selectedUsuario?.nombre_completo || ''}
                                disabled
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">Rol</label>
                              <Select value={selectedRol} onValueChange={setSelectedRol}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((rol) => (
                                    <SelectItem key={rol.id} value={rol.id.toString()}>
                                      {rol.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                              <label className="text-sm font-medium">Activo</label>
                              <input
                                type="checkbox"
                                checked={activo}
                                onChange={(e) => setActivo(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleUpdateUsuario}>
                              Guardar Cambios
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}