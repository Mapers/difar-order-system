'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ChevronDown, ChevronRight, Edit, Plus, Settings, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/app/api/client'

interface Rol {
  id: number
  nombre: string
  fecha_creacion: string
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
  const { toast } = useToast()

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/roles/listar')
      setRoles(response.data.data.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los roles',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMenusRol = async (idRol: number) => {
    try {
      const response = await apiClient.get(`/roles/${idRol}/menus`)
      setMenus(response.data.data.menus)
      setSelectedRol(roles.find(r => r.id === idRol) || null)
      setShowMenusDialog(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los menús del rol',
        variant: 'destructive'
      })
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

      toast({
        title: 'Éxito',
        description: 'Menús actualizados correctamente'
      });

      setShowMenusDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los menús',
        variant: 'destructive'
      });
    }
  };

  const toggleMenu = (menuId: number) => {
    console.log(menuId)
    console.log(expandedMenus)
    if (expandedMenus.includes(menuId)) {
      setExpandedMenus(expandedMenus.filter(id => id !== menuId))
    } else {
      setExpandedMenus([...expandedMenus, menuId])
    }
  }

  const toggleHabilitado = (menuId: number) => {
    const updateMenus = (menusList: Menu[]): Menu[] => {
      return menusList.map(menu => {
        if (menu.id === menuId) {
          return { ...menu, habilitado: !menu.habilitado };
        }
        if (menu.hijos && menu.hijos.length > 0) {
          return { ...menu, hijos: updateMenus(menu.hijos) };
        }
        return menu;
      });
    };

    setMenus(updateMenus(menus));
  };

  useEffect(() => {
    fetchRoles()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Roles</h1>
          <p className="text-sm text-gray-500">Administra los roles y permisos del sistema</p>
        </div>

        {/*<Button className="flex items-center gap-2">*/}
        {/*  <Plus className="h-4 w-4" />*/}
        {/*  Nuevo Rol*/}
        {/*</Button>*/}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Cargando roles...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  {/*<TableHead>Fecha Creación</TableHead>*/}
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((rol) => (
                  <TableRow key={rol.id}>
                    <TableCell className="font-medium">{rol.nombre}</TableCell>
                    {/*<TableCell>{new Date(rol.fecha_creacion).toLocaleDateString()}</TableCell>*/}
                    <TableCell>
                      {rol.activo ? (
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchMenusRol(rol.id)}
                      >
                        <Settings className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showMenusDialog} onOpenChange={setShowMenusDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Menús para: {selectedRol?.nombre}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {menus
              .filter(menu => menu.id_padre === null)
              .map(menuPadre => (
                <div key={menuPadre.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    onClick={() => toggleMenu(menuPadre.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {menuPadre.hijos.length > 0 && (expandedMenus.includes(menuPadre.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      ))}
                      <span>{menuPadre.nombre}</span>
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
                    <div className="divide-y">
                      {menuPadre.hijos.map(menuHijo => (
                        <div key={menuHijo.id} className="flex items-center justify-between p-3 pl-10">
                          <span>{menuHijo.nombre}</span>
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

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowMenusDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateMenus}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}