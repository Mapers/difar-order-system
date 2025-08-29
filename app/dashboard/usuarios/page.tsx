'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus, Edit, Trash2, User, Check, X, Users, UserCheck, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/app/api/client'

interface Usuario {
  id_usuario: number
  idVendedor: number | null
  id: number | null
  codigo: string
  nombre_completo: string
  dni: string
  telefono: string
  activo: boolean
  id_rol: number
  nombre_rol: string
}

interface Vendedor {
  idVendedor: number
  codigo: string
  nombres: string
  apellidos: string
  DNI: string
  telefono: string
  comisionVend: number
  comisionCobranza: number
  empRegistro: string
  activo: number
}

interface UsuarioNoWeb {
  IdUsuarios: number
  NombreUsuarios: string
  EmpRegistros: string
  ObsUsuario: string
  ClaveUsuarios: string
}

interface Rol {
  id: number
  nombre: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [usuariosNoWeb, setUsuariosNoWeb] = useState<UsuarioNoWeb[]>([])
  const [vendedoresNoUsuarios, setVendedoresNoUsuarios] = useState<Vendedor[]>([])
  const [usuariosNoWebBusqueda, setUsuariosNoWebBusqueda] = useState<UsuarioNoWeb[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [userType, setUserType] = useState('')
  const [busquedaVendedor, setBusquedaVendedor] = useState('')
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [selectedVendedor, setSelectedVendedor] = useState(null)
  const [selectedUsuarioNoWeb, setSelectedUsuarioNoWeb] = useState<UsuarioNoWeb | null>(null)
  const [selectedRol, setSelectedRol] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [activo, setActivo] = useState(true)
  const { toast } = useToast()

  // Estados para mantenedores
  const [activeTab, setActiveTab] = useState('usuarios-web')
  const [showVendedorDialog, setShowVendedorDialog] = useState(false)
  const [showUsuarioDialog, setShowUsuarioDialog] = useState(false)
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null)
  const [editingUsuario, setEditingUsuario] = useState<UsuarioNoWeb | null>(null)
  const [newVendedor, setNewVendedor] = useState({
    codigo: '',
    nombres: '',
    apellidos: '',
    DNI: '',
    telefono: '',
    comisionVend: 0.0000,
    comisionCobranza: 0.0000,
    empRegistro: '20481321892',
    activo: 1
  })

  const [newUsuario, setNewUsuario] = useState({
    NombreUsuarios: '',
    EmpRegistros: '20481321892',
    ObsUsuario: '',
    ClaveUsuarios: '0000'
  })

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

  const fetchVendedores = async () => {
    try {
      const response = await apiClient.get('/usuarios/listar/vendedores')
      const vendedoresTransformados = response.data.data.data.map((v: any) => ({
        idVendedor: v.idVendedor,
        codigo: v.Codigo_Vend,
        nombres: v.Nombres,
        apellidos: v.Apellidos,
        DNI: v.DNI,
        telefono: v.Telefonos,
        comisionVend: v.ComisionVend,
        comisionCobranza: v.ComisionCobranza,
        empRegistro: v.EmpRegistro,
        ciudad: v.Ciudad,
        activo: v.Estado === 'A' ? 1 : 0
      }));
      setVendedores(vendedoresTransformados);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los vendedores',
        variant: 'destructive'
      })
    }
  }

  const fetchUsuariosNoWeb = async () => {
    try {
      const response = await apiClient.get('/usuarios/listar/usuarios-noweb')
      setUsuariosNoWeb(response.data.data.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios generales',
        variant: 'destructive'
      })
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

  const fetchUsuariosNoWebBusqueda = async () => {
    try {
      const response = await apiClient.get(`/usuarios/search/usuario?busqueda=${busquedaUsuarios}`)
      setUsuariosNoWebBusqueda(response.data.data.data)
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
      if ((!selectedVendedor && !selectedUsuarioNoWeb) || !selectedRol || !dni) {
        toast({
          title: 'Error',
          description: 'Debe completar todos los campos obligatorios',
          variant: 'destructive'
        })
        return
      }

      const payload = {
        id_vendedor: selectedVendedor?.idVendedor || null,
        id_usuario: selectedUsuarioNoWeb?.IdUsuarios || null,
        id_rol: parseInt(selectedRol),
        activo,
        dni,
        telefono,
        nombre_completo: selectedVendedor?.nombre_completo || selectedUsuarioNoWeb?.NombreUsuarios || '',
        tipo: selectedVendedor ? 'vendedor' : 'usuario'
      }

      await apiClient.post('/usuarios/register', payload)

      toast({
        title: 'Éxito',
        description: 'Usuario registrado correctamente'
      })

      setShowAddDialog(false)
      setSelectedVendedor(null)
      setSelectedUsuarioNoWeb(null)
      setSelectedRol('')
      setDni('')
      setTelefono('')
      setBusquedaVendedor('')
      setBusquedaUsuarios('')
      setUserType('')
      setActivo(true)

      fetchUsuarios()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo registrar el usuario',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateUsuario = async () => {
    try {
      if (!selectedUsuario || !selectedRol) return

      await apiClient.put(`/usuarios/update/${selectedUsuario.id}`, {
        id_rol: parseInt(selectedRol),
        activo,
        dni: selectedUsuario.dni,
        telefono: selectedUsuario.telefono
      })

      toast({
        title: 'Éxito',
        description: 'Usuario actualizado correctamente'
      })

      setShowEditDialog(false)
      fetchUsuarios()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el usuario',
        variant: 'destructive'
      })
    }
  }

  // Funciones para mantenedor de vendedores
  const handleCreateVendedor = async () => {
    try {
      const payload = {
        Codigo_Vend: newVendedor.codigo,
        Nombres: newVendedor.nombres,
        Apellidos: newVendedor.apellidos,
        DNI: newVendedor.DNI,
        Telefonos: newVendedor.telefono,
        ComisionVend: newVendedor.comisionVend,
        ComisionCobranza: newVendedor.comisionCobranza,
        EmpRegistro: newVendedor.empRegistro,
        Estado: newVendedor.activo === 1 ? 'A' : 'I',
      };

      await apiClient.post('/usuarios/vendedores/create', payload)
      toast({
        title: 'Éxito',
        description: 'Vendedor creado correctamente'
      })
      setShowVendedorDialog(false)
      setNewVendedor({
        codigo: '',
        nombres: '',
        apellidos: '',
        DNI: '',
        telefono: '',
        comisionVend: 0.0000,
        comisionCobranza: 0.0000,
        empRegistro: '20481321892',
        ciudad: '',
        activo: 1
      });
      fetchVendedores()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear el vendedor',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateVendedor = async () => {
    try {
      if (!editingVendedor) return

      const payload = {
        Codigo_Vend: editingVendedor.codigo,
        Nombres: editingVendedor.nombres,
        Apellidos: editingVendedor.apellidos,
        DNI: editingVendedor.DNI,
        Telefonos: editingVendedor.telefono,
        ComisionVend: editingVendedor.comisionVend,
        ComisionCobranza: editingVendedor.comisionCobranza,
        EmpRegistro: editingVendedor.empRegistro,
        Estado: editingVendedor.activo === 1 ? 'A' : 'I'
      };

      await apiClient.put(`/usuarios/vendedores/update/${editingVendedor.idVendedor}`, payload)
      toast({
        title: 'Éxito',
        description: 'Vendedor actualizado correctamente'
      })
      setShowVendedorDialog(false)
      setEditingVendedor(null)
      fetchVendedores()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el vendedor',
        variant: 'destructive'
      })
    }
  }

  // const handleDeleteVendedor = async (id: number) => {
  //   if (!confirm('¿Está seguro de que desea eliminar este vendedor?')) return
  //
  //   try {
  //     await apiClient.delete(`/vendedores/delete/${id}`)
  //     toast({
  //       title: 'Éxito',
  //       description: 'Vendedor eliminado correctamente'
  //     })
  //     fetchVendedores()
  //   } catch (error: any) {
  //     toast({
  //       title: 'Error',
  //       description: error.response?.data?.message || 'No se pudo eliminar el vendedor',
  //       variant: 'destructive'
  //     })
  //   }
  // }

  // Funciones para mantenedor de usuarios generales
  const handleCreateUsuario = async () => {
    try {
      const payload = {
        NombreUsuarios: newUsuario.NombreUsuarios,
        EmpRegistros: newUsuario.EmpRegistros,
        ClaveUsuarios: newUsuario.ClaveUsuarios,
        ObsUsuario: newUsuario.ObsUsuario
      };

      await apiClient.post('/usuarios/usuarios-noweb/create', payload)
      toast({
        title: 'Éxito',
        description: 'Usuario general creado correctamente'
      })
      setShowUsuarioDialog(false)
      setNewUsuario({
        NombreUsuarios: '',
        EmpRegistros: '20481321892',
        ObsUsuario: '',
        ClaveUsuarios: '0000'
      })
      fetchUsuariosNoWeb()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear el usuario',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateUsuarioGeneral = async () => {
    try {
      if (!editingUsuario) return
      const payload = {
        NombreUsuarios: editingUsuario.NombreUsuarios,
        EmpRegistros: editingUsuario.EmpRegistros,
        ClaveUsuarios: editingUsuario.ClaveUsuarios,
        ObsUsuario: editingUsuario.ObsUsuario
      };

      await apiClient.put(`/usuarios/usuarios-noweb/update/${editingUsuario.IdUsuarios}`, payload)
      toast({
        title: 'Éxito',
        description: 'Usuario general actualizado correctamente'
      })
      setShowUsuarioDialog(false)
      setEditingUsuario(null)
      fetchUsuariosNoWeb()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el usuario',
        variant: 'destructive'
      })
    }
  }

  // const handleDeleteUsuario = async (id: number) => {
  //   if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return
  //
  //   try {
  //     await apiClient.delete(`/usuarios-no-web/delete/${id}`)
  //     toast({
  //       title: 'Éxito',
  //       description: 'Usuario general eliminado correctamente'
  //     })
  //     fetchUsuariosNoWeb()
  //   } catch (error: any) {
  //     toast({
  //       title: 'Error',
  //       description: error.response?.data?.message || 'No se pudo eliminar el usuario',
  //       variant: 'destructive'
  //     })
  //   }
  // }

  useEffect(() => {
    fetchUsuarios()
    fetchVendedores()
    fetchUsuariosNoWeb()
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
        fetchUsuariosNoWebBusqueda()
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

        {activeTab === 'vendedores' && (
          <Button onClick={() => {
            setEditingVendedor(null)
            setNewVendedor({
              codigo: '',
              nombres: '',
              apellidos: '',
              DNI: '',
              telefono: '',
              comisionVend: 0.0000,
              comisionCobranza: 0.0000,
              empRegistro: '20481321892',
              activo: 1
            })
            setShowVendedorDialog(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Vendedor
          </Button>
        )}

        {activeTab === 'usuarios-web' && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Usuario Web
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Usuario</label>
                  <Select
                    value={userType}
                    onValueChange={(value) => {
                      setUserType(value)
                      setSelectedVendedor(null)
                      setSelectedUsuarioNoWeb(null)
                      setBusquedaVendedor('')
                      setBusquedaUsuarios('')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="usuario">Usuario General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userType === 'vendedor' && (
                  <>
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
                              onClick={() => {
                                setSelectedVendedor(v)
                                setDni(v.DNI)
                                setTelefono(v.telefono)
                              }}
                            >
                              <p className="font-medium">{v.nombre_completo}</p>
                              <p className="text-sm text-gray-600">DNI: {v.DNI} - Teléfono: {v.telefono}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">DNI</label>
                      <Input
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        placeholder="DNI del vendedor"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Teléfono</label>
                      <Input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Teléfono del vendedor"
                      />
                    </div>
                  </>
                )}

                {userType === 'usuario' && (
                  <>
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

                      {usuariosNoWebBusqueda.length > 0 && (
                        <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                          {usuariosNoWebBusqueda.map((v) => (
                            <div
                              key={v.IdUsuarios}
                              className={`p-3 hover:bg-gray-50 cursor-pointer ${selectedUsuarioNoWeb?.IdUsuarios === v.IdUsuarios ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                setSelectedUsuarioNoWeb(v)
                                setDni(v.ObsUsuario || '')
                              }}
                            >
                              <p className="font-medium">{v.NombreUsuarios}</p>
                              <p className="text-sm text-gray-600">CodEmp: {v.EmpRegistros} - Código: {v.ObsUsuario}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">DNI</label>
                      <Input
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        placeholder="Ingrese DNI del usuario"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Teléfono</label>
                      <Input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ingrese teléfono del usuario"
                      />
                    </div>
                  </>
                )}

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
        )}

        {activeTab === 'usuarios-generales' && (
          <Button onClick={() => {
            setEditingUsuario(null)
            setNewUsuario({
              NombreUsuarios: '',
              EmpRegistros: '20481321892',
              ObsUsuario: '',
              ClaveUsuarios: '0000',
            })
            setShowUsuarioDialog(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="usuarios-web" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Usuarios Web
          </TabsTrigger>
          <TabsTrigger value="vendedores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendedores
          </TabsTrigger>
          <TabsTrigger value="usuarios-generales" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Usuarios Generales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios-web">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Cargando usuarios...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario, index) => (
                      <tr key={index}>
                        <td className="font-medium">{usuario.nombre_completo}</td>
                        <td>{usuario.dni}</td>
                        <td>{usuario.telefono}</td>
                        <td>{usuario.nombre_rol}</td>
                        <td>
                          {usuario.activo ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" /> Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <X className="h-3 w-3 mr-1" /> Inactivo
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex space-x-2">
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
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Editar Usuario</DialogTitle>
                                </DialogHeader>

                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Nombre</label>
                                    <Input
                                      value={selectedUsuario?.nombre_completo || ''}
                                      disabled
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-1">DNI</label>
                                    <Input
                                      value={selectedUsuario?.dni || ''}
                                      onChange={(e) => setSelectedUsuario({
                                        ...selectedUsuario!,
                                        dni: e.target.value
                                      })}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                                    <Input
                                      value={selectedUsuario?.telefono || ''}
                                      onChange={(e) => setSelectedUsuario({
                                        ...selectedUsuario!,
                                        telefono: e.target.value
                                      })}
                                    />
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
                                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleUpdateUsuario}>
                                    Guardar Cambios
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendedores">
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedores.map((vendedor) => (
                    <TableRow key={vendedor.idVendedor}>
                      <TableCell>{vendedor.codigo}</TableCell>
                      <TableCell>{vendedor.nombres} {vendedor.apellidos}</TableCell>
                      <TableCell>{vendedor.DNI}</TableCell>
                      <TableCell>{vendedor.telefono}</TableCell>
                      <TableCell>
                        {vendedor.activo === 1 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactivo
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingVendedor(vendedor)
                              setShowVendedorDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          {/*<Button*/}
                          {/*  variant="ghost"*/}
                          {/*  size="icon"*/}
                          {/*  onClick={() => handleDeleteVendedor(vendedor.idVendedor)}*/}
                          {/*>*/}
                          {/*  <Trash2 className="h-4 w-4 text-red-600" />*/}
                          {/*</Button>*/}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios-generales">
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Emp. Registro</TableHead>
                    <TableHead>Observación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosNoWeb.map((usuario) => (
                    <TableRow key={usuario.IdUsuarios}>
                      <TableCell>{usuario.NombreUsuarios}</TableCell>
                      <TableCell>{usuario.EmpRegistros}</TableCell>
                      <TableCell>{usuario.ObsUsuario}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingUsuario(usuario)
                              setShowUsuarioDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          {/*<Button*/}
                          {/*  variant="ghost"*/}
                          {/*  size="icon"*/}
                          {/*  onClick={() => handleDeleteUsuario(usuario.IdUsuarios)}*/}
                          {/*>*/}
                          {/*  <Trash2 className="h-4 w-4 text-red-600" />*/}
                          {/*</Button>*/}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showVendedorDialog} onOpenChange={setShowVendedorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVendedor ? 'Editar Vendedor' : 'Crear Nuevo Vendedor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Código (4 caracteres máximo)"
                value={editingVendedor ? editingVendedor.codigo : newVendedor.codigo}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 4);
                  editingVendedor
                    ? setEditingVendedor({...editingVendedor, codigo: value})
                    : setNewVendedor({...newVendedor, codigo: value})
                }}
                required
              />
              {(!editingVendedor?.codigo && !newVendedor.codigo) && (
                <p className="text-red-500 text-xs mt-1">El código es requerido</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nombres <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Nombres"
                value={editingVendedor ? editingVendedor.nombres : newVendedor.nombres}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 50);
                  editingVendedor
                    ? setEditingVendedor({...editingVendedor, nombres: value})
                    : setNewVendedor({...newVendedor, nombres: value})
                }}
                required
              />
              {(!editingVendedor?.nombres && !newVendedor.nombres) && (
                <p className="text-red-500 text-xs mt-1">Los nombres son requeridos</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Apellidos"
                value={editingVendedor ? editingVendedor.apellidos : newVendedor.apellidos}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 50);
                  editingVendedor
                    ? setEditingVendedor({...editingVendedor, apellidos: value})
                    : setNewVendedor({...newVendedor, apellidos: value})
                }}
                required
              />
              {(!editingVendedor?.apellidos && !newVendedor.apellidos) && (
                <p className="text-red-500 text-xs mt-1">Los apellidos son requeridos</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                DNI <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="DNI"
                value={editingVendedor ? editingVendedor.DNI : newVendedor.DNI}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 50);
                  editingVendedor
                    ? setEditingVendedor({...editingVendedor, DNI: value})
                    : setNewVendedor({...newVendedor, DNI: value})
                }}
                required
              />
              {(!editingVendedor?.DNI && !newVendedor.DNI) && (
                <p className="text-red-500 text-xs mt-1">El DNI es requerido</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <Input
                placeholder="Teléfono"
                value={editingVendedor ? editingVendedor.telefono : newVendedor.telefono}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 50);
                  editingVendedor
                    ? setEditingVendedor({...editingVendedor, telefono: value})
                    : setNewVendedor({...newVendedor, telefono: value})
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Comisión Vendedor <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                placeholder="0.0000"
                value={editingVendedor ? editingVendedor.comisionVend : newVendedor.comisionVend}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  editingVendedor
                    ? setEditingVendedor({...editingVendedor, comisionVend: value})
                    : setNewVendedor({...newVendedor, comisionVend: value})
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Comisión Cobranza <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                placeholder="0.0000"
                value={editingVendedor ? editingVendedor.comisionCobranza : newVendedor.comisionCobranza}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  editingVendedor
                    ? setEditingVendedor({...editingVendedor, comisionCobranza: value})
                    : setNewVendedor({...newVendedor, comisionCobranza: value})
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Empresa Registro <span className="text-red-500">*</span>
              </label>
              <Input
                disabled
                placeholder="Código de Empresa (11 caracteres)"
                value={editingVendedor ? editingVendedor.empRegistro : newVendedor.empRegistro}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 11);
                  editingVendedor
                    ? setEditingVendedor({...editingVendedor, empRegistro: value})
                    : setNewVendedor({...newVendedor, empRegistro: value})
                }}
                required
              />
              {(!editingVendedor?.empRegistro && !newVendedor.empRegistro) && (
                <p className="text-red-500 text-xs mt-1">La empresa de registro es requerida</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Activo</label>
              <input
                type="checkbox"
                checked={editingVendedor ? editingVendedor.activo === 1 : newVendedor.activo === 1}
                onChange={(e) => editingVendedor
                  ? setEditingVendedor({...editingVendedor, activo: e.target.checked ? 1 : 0})
                  : setNewVendedor({...newVendedor, activo: e.target.checked ? 1 : 0})
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVendedorDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={editingVendedor ? handleUpdateVendedor : handleCreateVendedor}
              disabled={
                (!editingVendedor?.codigo && !newVendedor.codigo) ||
                (!editingVendedor?.nombres && !newVendedor.nombres) ||
                (!editingVendedor?.apellidos && !newVendedor.apellidos) ||
                (!editingVendedor?.DNI && !newVendedor.DNI) ||
                (editingVendedor?.comisionVend === undefined && newVendedor.comisionVend === undefined) ||
                (editingVendedor?.comisionCobranza === undefined && newVendedor.comisionCobranza === undefined) ||
                (!editingVendedor?.empRegistro && !newVendedor.empRegistro)
              }
            >
              {editingVendedor ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUsuarioDialog} onOpenChange={setShowUsuarioDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUsuario ? 'Editar Usuario General' : 'Crear Nuevo Usuario General'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre de Usuario <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Nombre de Usuario"
                value={editingUsuario ? editingUsuario.NombreUsuarios : newUsuario.NombreUsuarios}
                onChange={(e) => editingUsuario
                  ? setEditingUsuario({...editingUsuario, NombreUsuarios: e.target.value})
                  : setNewUsuario({...newUsuario, NombreUsuarios: e.target.value})
                }
                required
              />
              {(!editingUsuario?.NombreUsuarios && !newUsuario.NombreUsuarios) && (
                <p className="text-red-500 text-xs mt-1">El nombre de usuario es requerido</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Empresa de Registro <span className="text-red-500">*</span>
              </label>
              <Input
                disabled
                placeholder="Empresa de Registro (11 caracteres máximo)"
                value={editingUsuario ? editingUsuario.EmpRegistros : newUsuario.EmpRegistros}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 11); // Limitar a 11 caracteres
                  editingUsuario
                    ? setEditingUsuario({...editingUsuario, EmpRegistros: value})
                    : setNewUsuario({...newUsuario, EmpRegistros: value})
                }}
                required
              />
              {(!editingUsuario?.EmpRegistros && !newUsuario.EmpRegistros) && (
                <p className="text-red-500 text-xs mt-1">La empresa de registro es requerida</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Observación</label>
              <Input
                placeholder="Observación"
                value={editingUsuario ? editingUsuario.ObsUsuario : newUsuario.ObsUsuario}
                onChange={(e) => editingUsuario
                  ? setEditingUsuario({...editingUsuario, ObsUsuario: e.target.value})
                  : setNewUsuario({...newUsuario, ObsUsuario: e.target.value})
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Clave <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Clave (4 caracteres máximo)"
                value={editingUsuario ? editingUsuario.ClaveUsuarios : newUsuario.ClaveUsuarios}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 4); // Limitar a 4 caracteres
                  editingUsuario
                    ? setEditingUsuario({...editingUsuario, ClaveUsuarios: value})
                    : setNewUsuario({...newUsuario, ClaveUsuarios: value})
                }}
                required
              />
              {(!editingUsuario?.ClaveUsuarios && !newUsuario.ClaveUsuarios) && (
                <p className="text-red-500 text-xs mt-1">La clave es requerida</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUsuarioDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={editingUsuario ? handleUpdateUsuarioGeneral : handleCreateUsuario}
              disabled={
                (!editingUsuario?.NombreUsuarios && !newUsuario.NombreUsuarios) ||
                (!editingUsuario?.EmpRegistros && !newUsuario.EmpRegistros) ||
                (!editingUsuario?.ClaveUsuarios && !newUsuario.ClaveUsuarios)
              }
            >
              {editingUsuario ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}