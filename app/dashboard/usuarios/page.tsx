'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus, Edit, Trash2, User, Check, X, Users, UserCheck, Eye, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [dniError, setDniError] = useState('')
  const [telefonoError, setTelefonoError] = useState('')

  const [newUsuario, setNewUsuario] = useState({
    NombreUsuarios: '',
    EmpRegistros: '20481321892',
    ObsUsuario: '',
    ClaveUsuarios: '0000'
  })

  const [isMobile, setIsMobile] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

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
      let hasError = false

      if (!dni || dni.length !== 8) {
        setDniError('El DNI es obligatorio y debe tener 8 dígitos')
        hasError = true
      }

      if (!telefono || telefono.length !== 9) {
        setTelefonoError('El teléfono es obligatorio y debe tener 9 dígitos')
        hasError = true
      }

      if (!selectedRol) {
        hasError = true
      }

      if (hasError) {
        toast({
          title: "Error de validación",
          description: "Por favor complete todos los campos obligatorios correctamente",
          variant: "destructive"
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

  useEffect(() => {
    fetchUsuarios()
    fetchVendedores()
    fetchUsuariosNoWeb()
    fetchRoles()
  }, [])

  useEffect(() => {
    if (busquedaVendedor) {
      setVendedoresNoUsuarios(vendedores.filter(item =>
          item.DNI.includes(busquedaVendedor) ||
          `${item.nombres} ${item.apellidos}`.toLowerCase().includes(busquedaVendedor.toLowerCase()),))
    } else {
      setVendedoresNoUsuarios(vendedores)
    }
  }, [busquedaVendedor, vendedores])

  useEffect(() => {
    if (busquedaUsuarios) {
      setUsuariosNoWebBusqueda(usuariosNoWeb.filter(item =>
          item.NombreUsuarios.toLowerCase().includes(busquedaVendedor.toLowerCase()) ||
          item.ObsUsuario.toLowerCase().includes(busquedaVendedor.toLowerCase()) ||
          item.EmpRegistros.toLowerCase().includes(busquedaVendedor.toLowerCase())))
    } else {
      setUsuariosNoWebBusqueda(usuariosNoWeb)
    }
  }, [busquedaUsuarios, usuariosNoWeb])

  const MobileUsuarioCard = ({ usuario }: { usuario: Usuario }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold">{usuario.nombre_completo}</h3>
            <p className="text-sm text-gray-600">DNI: {usuario.dni}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleRowExpansion(usuario.id_usuario)}
          >
            {expandedRows[usuario.id_usuario] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">Teléfono:</span>
          <span className="text-sm">{usuario.telefono}</span>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">Rol:</span>
          <span className="text-sm">{usuario.nombre_rol}</span>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm">Estado:</span>
          {usuario.activo ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Check className="h-3 w-3 mr-1" /> Activo
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <X className="h-3 w-3 mr-1" /> Inactivo
            </span>
          )}
        </div>

        {expandedRows[usuario.id_usuario] && (
          <div className="mt-3 pt-3 border-t">
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button
                    className="w-full mb-2"
                    onClick={() => {
                      setSelectedUsuario(usuario)
                      setSelectedRol(usuario.id_rol.toString())
                      setActivo(usuario.activo)
                    }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                        disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Celular</label>
                    <Input
                        placeholder="Ingrese Celular (9 dígitos)"
                        className={telefonoError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                        value={selectedUsuario?.telefono || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                          setSelectedUsuario({
                            ...selectedUsuario!,
                            telefono: value
                          })
                          if (value.length > 0 && value.length !== 9) {
                            setTelefonoError('El Celular debe tener 9 dígitos')
                          } else {
                            setTelefonoError('')
                          }
                        }}
                    />
                    {telefonoError && <p className="text-red-500 text-xs mt-1">{telefonoError}</p>}
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
        )}
      </CardContent>
    </Card>
  )

  const MobileVendedorCard = ({ vendedor }: { vendedor: Vendedor }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold">{vendedor.nombres} {vendedor.apellidos}</h3>
            <p className="text-sm text-gray-600">Código: {vendedor.codigo}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleRowExpansion(vendedor.idVendedor)}
          >
            {expandedRows[vendedor.idVendedor] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">DNI:</span>
          <span className="text-sm">{vendedor.DNI}</span>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">Teléfono:</span>
          <span className="text-sm">{vendedor.telefono}</span>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm">Estado:</span>
          {vendedor.activo === 1 ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Activo
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Inactivo
            </span>
          )}
        </div>

        {expandedRows[vendedor.idVendedor] && (
          <div className="mt-3 pt-3 border-t flex space-x-2">
            <Button
              className="flex-1"
              onClick={() => {
                setEditingVendedor(vendedor)
                setShowVendedorDialog(true)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const MobileUsuarioGeneralCard = ({ usuario }: { usuario: UsuarioNoWeb }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold">{usuario.NombreUsuarios}</h3>
            <p className="text-sm text-gray-600">Emp. Reg: {usuario.EmpRegistros}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleRowExpansion(usuario.IdUsuarios)}
          >
            {expandedRows[usuario.IdUsuarios] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm">Observación:</span>
          <span className="text-sm">{usuario.ObsUsuario}</span>
        </div>

        {expandedRows[usuario.IdUsuarios] && (
          <div className="mt-3 pt-3 border-t flex space-x-2">
            <Button
              className="flex-1"
              onClick={() => {
                setEditingUsuario(usuario)
                setShowUsuarioDialog(true)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
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
          }} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Vendedor
          </Button>
        )}

        {activeTab === 'usuarios-web' && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Nuevo Usuario Web
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                          setDniError('')
                          setTelefonoError('')
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
                                          setDniError('')
                                          setTelefonoError('')
                                        }}
                                    >
                                      <p className="font-medium">{v.nombres} {v.apellidos}</p>
                                      <p className="text-sm text-gray-600">DNI: {v.DNI} - Teléfono: {v.telefono}</p>
                                    </div>
                                ))}
                              </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">DNI *</label>
                          <Input
                              value={dni}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                                setDni(value)
                                if (value.length > 0 && value.length !== 8) {
                                  setDniError('El DNI debe tener 8 dígitos')
                                } else {
                                  setDniError('')
                                }
                              }}
                              placeholder="Ingrese DNI (8 dígitos)"
                              className={dniError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                          />
                          {dniError && <p className="text-red-500 text-xs mt-1">{dniError}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Teléfono *</label>
                          <Input
                              value={telefono}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                                setTelefono(value)
                                if (value.length > 0 && value.length !== 9) {
                                  setTelefonoError('El teléfono debe tener 9 dígitos')
                                } else {
                                  setTelefonoError('')
                                }
                              }}
                              placeholder="Ingrese teléfono (9 dígitos)"
                              className={telefonoError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                          />
                          {telefonoError && <p className="text-red-500 text-xs mt-1">{telefonoError}</p>}
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
                                          setDniError('')
                                          setTelefonoError('')
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
                          <label className="block text-sm font-medium mb-1">DNI *</label>
                          <Input
                              value={dni}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                                setDni(value)
                                if (value.length > 0 && value.length !== 8) {
                                  setDniError('El DNI debe tener 8 dígitos')
                                } else {
                                  setDniError('')
                                }
                              }}
                              placeholder="Ingrese DNI (8 dígitos)"
                              className={dniError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                              required
                          />
                          {dniError && <p className="text-red-500 text-xs mt-1">{dniError}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Teléfono *</label>
                          <Input
                              value={telefono}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                                setTelefono(value)
                                if (value.length > 0 && value.length !== 9) {
                                  setTelefonoError('El Celular debe tener 9 dígitos')
                                } else {
                                  setTelefonoError('')
                                }
                              }}
                              placeholder="Ingrese Celular (9 dígitos)"
                              className={telefonoError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                              required
                          />
                          {telefonoError && <p className="text-red-500 text-xs mt-1">{telefonoError}</p>}
                        </div>
                      </>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Rol *</label>
                    <Select value={selectedRol} onValueChange={setSelectedRol}>
                      <SelectTrigger className={!selectedRol ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}>
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
                    {!selectedRol && <p className="text-red-500 text-xs mt-1">Debe seleccionar un rol</p>}
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
                  <Button variant="outline" onClick={() => {
                    setShowAddDialog(false)
                    setDniError('')
                    setTelefonoError('')
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddUsuario} disabled={!!dniError || !!telefonoError || !selectedRol}>
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
          }} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4 w-full">
          <TabsTrigger value="usuarios-web" className="flex items-center gap-2 text-xs sm:text-sm">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios Web</span>
            <span className="sm:hidden">Web</span>
          </TabsTrigger>
          <TabsTrigger value="vendedores" className="flex items-center gap-2 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Vendedores</span>
            <span className="sm:hidden">Vend</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios-generales" className="flex items-center gap-2 text-xs sm:text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
            <span className="sm:hidden">Generales</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios-web">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Cargando usuarios...</p>
                </div>
              ) : isMobile ? (
                <div className="p-2">
                  {usuarios.map((usuario) => (
                    <MobileUsuarioCard key={usuario.id + '|' + usuario.id_rol} usuario={usuario} />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Celular</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {usuarios.map((usuario, index) => (
                      <tr key={index}>
                        <td className="p-4 text-sm">{usuario.nombre_completo}</td>
                        <td className="p-4 text-sm">{usuario.dni}</td>
                        <td className="p-4 text-sm">{usuario.telefono}</td>
                        <td className="p-4 text-sm">{usuario.nombre_rol}</td>
                        <td className="p-4 text-sm">
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
                        <td className="p-4 text-sm">
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
                              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                                      disabled
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-1">Celular</label>
                                    <Input
                                        placeholder="Ingrese Celular (9 dígitos)"
                                        className={telefonoError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                      value={selectedUsuario?.telefono || ''}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                                        setSelectedUsuario({
                                          ...selectedUsuario!,
                                          telefono: value
                                        })
                                        if (value.length > 0 && value.length !== 9) {
                                          setTelefonoError('El Celular debe tener 9 dígitos')
                                        } else {
                                          setTelefonoError('')
                                        }
                                      }}
                                    />
                                    {telefonoError && <p className="text-red-500 text-xs mt-1">{telefonoError}</p>}
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendedores">
          <Card>
            <CardContent className='p-0'>
              {isMobile ? (
                <div className="p-2">
                  {vendedores.map((vendedor) => (
                    <MobileVendedorCard key={vendedor.idVendedor + '|' + vendedor.empRegistro} vendedor={vendedor} />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendedores.map((vendedor, index) => (
                        <tr key={index}>
                          <td className="p-4 text-sm">{vendedor.codigo}</td>
                          <td className="p-4 text-sm">{vendedor.nombres} {vendedor.apellidos}</td>
                          <td className="p-4 text-sm">{vendedor.DNI}</td>
                          <td className="p-4 text-sm">{vendedor.telefono}</td>
                          <td className="p-4 text-sm">
                            {vendedor.activo === 1 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-sm">
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios-generales">
          <Card>
            <CardContent className='p-0'>
              {isMobile ? (
                <div className="p-2">
                  {usuariosNoWeb.map((usuario) => (
                    <MobileUsuarioGeneralCard key={usuario.IdUsuarios} usuario={usuario} />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emp. Registro</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observación</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosNoWeb.map((usuario, index) => (
                        <tr key={index}>
                          <td className="p-4 text-sm">{usuario.NombreUsuarios}</td>
                          <td className="p-4 text-sm">{usuario.EmpRegistros}</td>
                          <td className="p-4 text-sm">{usuario.ObsUsuario}</td>
                          <td className="p-4 text-sm">
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showVendedorDialog} onOpenChange={setShowVendedorDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                  const value = e.target.value.slice(0, 11);
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
                  const value = e.target.value.slice(0, 4);
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