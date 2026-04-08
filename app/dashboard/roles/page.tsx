'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ChevronDown, ChevronRight, Edit, Plus, Settings, Trash2, X } from 'lucide-react'
import apiClient from '@/app/api/client'
import { toast } from "@/app/hooks/useToast"

interface Rol {
  id: number
  nombre: string
  fecha_creacion?: string
  activo: boolean
}

interface Menu {
  id: number
  nombre: string
  icono: string
  ruta: string
  id_padre: number | null
  orden: number
  visible: boolean
  habilitado: boolean
  asignado: boolean
  hijos: Menu[]
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null)
  const [menus, setMenus] = useState<Menu[]>([])
  const [expandedMenus, setExpandedMenus] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenusDialog, setShowMenusDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Rol | null>(null)
  const [roleFormData, setRoleFormData] = useState({ nombre: '', activo: true })
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/roles/listar')
      setRoles(response.data.data.data || response.data.data)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los roles' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRoleModal = (rol?: Rol) => {
    if (rol) {
      setEditingRole(rol)
      setRoleFormData({ nombre: rol.nombre, activo: rol.activo })
    } else {
      setEditingRole(null)
      setRoleFormData({ nombre: '', activo: true })
    }
    setShowRoleDialog(true)
  }

  const handleSaveRole = async () => {
    if (!roleFormData.nombre.trim()) {
      toast({ title: 'Atención', description: 'El nombre del rol es obligatorio' })
      return
    }

    try {
      setIsSaving(true)
      if (editingRole) {
        await apiClient.put(`/roles/${editingRole.id}/editar`, roleFormData)
        toast({ title: 'Éxito', description: 'Rol actualizado correctamente' })
      } else {
        await apiClient.post('/roles/crear', roleFormData)
        toast({ title: 'Éxito', description: 'Rol creado correctamente' })
      }
      setShowRoleDialog(false)
      fetchRoles()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar el rol',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDeleteRole = (id: number) => {
    setRoleToDelete(id)
    setShowDeleteDialog(true)
  }

  const executeDeleteRole = async () => {
    if (roleToDelete === null) return

    try {
      setIsDeleting(true)
      await apiClient.delete(`/roles/${roleToDelete}/eliminar`)
      toast({ title: 'Éxito', description: 'Rol eliminado correctamente' })
      fetchRoles()
      setShowDeleteDialog(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo eliminar el rol',
      })
    } finally {
      setIsDeleting(false)
      setRoleToDelete(null)
    }
  }

  const fetchMenusRol = async (idRol: number) => {
    try {
      const response = await apiClient.get(`/roles/${idRol}/menus`)
      setMenus(response.data.data.menus)
      setSelectedRol(roles.find(r => r.id === idRol) || null)
      setShowMenusDialog(true)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los menús del rol' })
    }
  }

  const handleUpdateMenus = async () => {
    try {
      if (!selectedRol) return;
      const flattenMenus = (menusList: Menu[]): { id: number; habilitado: boolean }[] => {
        return menusList.reduce((acc, menu) => {
          acc.push({ id: menu.id, habilitado: menu.habilitado });
          if (menu.hijos && menu.hijos.length > 0) {
            acc.push(...flattenMenus(menu.hijos));
          }
          return acc;
        }, [] as { id: number; habilitado: boolean }[]);
      };

      const menusToUpdate = flattenMenus(menus);
      await apiClient.put(`/roles/${selectedRol.id}/menus`, { menus: menusToUpdate });
      toast({ title: 'Éxito', description: 'Menús actualizados correctamente' });
      setShowMenusDialog(false);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron actualizar los menús' });
    }
  };

  const toggleMenu = (menuId: number) => {
    if (expandedMenus.includes(menuId)) {
      setExpandedMenus(expandedMenus.filter(id => id !== menuId))
    } else {
      setExpandedMenus([...expandedMenus, menuId])
    }
  }

  const toggleHabilitado = (menuId: number) => {
    const updateMenus = (menusList: Menu[]): Menu[] => {
      return menusList.map(menu => {
        if (menu.id === menuId) return { ...menu, habilitado: !menu.habilitado };
        if (menu.hijos && menu.hijos.length > 0) return { ...menu, hijos: updateMenus(menu.hijos) };
        return menu;
      });
    };
    setMenus(updateMenus(menus));
  };

  useEffect(() => {
    fetchRoles()
  }, [])

  return (
      <div className="space-y-6 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Roles</h1>
            <p className="text-sm text-gray-500">Administra los roles y permisos del sistema</p>
          </div>

          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => handleOpenRoleModal()}>
            <Plus className="h-4 w-4" />
            Nuevo Rol
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">Cargando roles...</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((rol) => (
                          <TableRow key={rol.id}>
                            <TableCell className="font-medium">{rol.nombre}</TableCell>
                            <TableCell>
                              {rol.activo ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <Check className="h-3 w-3 mr-1" /> Activo
                          </span>
                              ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            <X className="h-3 w-3 mr-1" /> Inactivo
                          </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" title="Configurar Menús" onClick={() => fetchMenusRol(rol.id)}>
                                  <Settings className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Editar Rol" onClick={() => handleOpenRoleModal(rol)}>
                                  <Edit className="h-4 w-4 text-amber-600" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Eliminar Rol" onClick={() => confirmDeleteRole(rol.id)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Rol</Label>
                <Input
                    id="nombre"
                    placeholder="Ej. Administrador"
                    value={roleFormData.nombre}
                    onChange={(e) => setRoleFormData({...roleFormData, nombre: e.target.value})}
                />
              </div>
              {editingRole && (
                  <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="activo"
                        checked={roleFormData.activo}
                        onChange={(e) => setRoleFormData({...roleFormData, activo: e.target.checked})}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="activo" className="font-normal cursor-pointer">
                      Rol activo
                    </Label>
                  </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)} disabled={isSaving}>Cancelar</Button>
              <Button onClick={handleSaveRole} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.
                Si el rol está en uso por algún usuario, la eliminación podría no ser permitida.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={executeDeleteRole} disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showMenusDialog} onOpenChange={setShowMenusDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurar Menús para: {selectedRol?.nombre}</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 mt-4">
              {menus.filter(menu => menu.id_padre === null).map(menuPadre => (
                  <div key={menuPadre.id} className="border rounded-lg overflow-hidden">
                    <div
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleMenu(menuPadre.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {menuPadre.hijos.length > 0 && (expandedMenus.includes(menuPadre.id) ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                        ))}
                        <span className="font-medium">{menuPadre.nombre}</span>
                      </div>
                      <input
                          type="checkbox"
                          checked={menuPadre.habilitado}
                          onChange={() => toggleHabilitado(menuPadre.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {expandedMenus.includes(menuPadre.id) && menuPadre.hijos.length > 0 && (
                        <div className="divide-y bg-white">
                          {menuPadre.hijos.map(menuHijo => (
                              <div key={menuHijo.id} className="flex items-center justify-between p-3 pl-10 hover:bg-gray-50">
                                <span className="text-sm text-gray-600">{menuHijo.nombre}</span>
                                <input
                                    type="checkbox"
                                    checked={menuHijo.habilitado}
                                    onChange={() => toggleHabilitado(menuHijo.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </div>
                          ))}
                        </div>
                    )}
                  </div>
              ))}
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowMenusDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateMenus}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}