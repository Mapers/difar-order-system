import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import apiClient from '@/app/api/client';
import {Laboratorio, Rol, UsuarioNoWeb, Vendedor} from "@/app/types/user-interface";

export const CreateUsuarioWebModal = ({ isOpen, onClose, vendedores, usuariosNoWeb, roles, onSuccess }: any) => {
    const { toast } = useToast();
    const [userType, setUserType] = useState('');
    const [busquedaVendedor, setBusquedaVendedor] = useState('');
    const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
    const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null);
    const [selectedUsuarioNoWeb, setSelectedUsuarioNoWeb] = useState<UsuarioNoWeb | null>(null);
    const [selectedRol, setSelectedRol] = useState('');
    const [dni, setDni] = useState('');
    const [telefono, setTelefono] = useState('');
    const [activo, setActivo] = useState(true);
    const [dniError, setDniError] = useState('');
    const [telefonoError, setTelefonoError] = useState('');

    const vendedoresFiltrados = busquedaVendedor
        ? vendedores.filter((v: Vendedor) => v.DNI.includes(busquedaVendedor) || `${v.nombres} ${v.apellidos}`.toLowerCase().includes(busquedaVendedor.toLowerCase()))
        : vendedores;

    const usuariosFiltrados = busquedaUsuarios
        ? usuariosNoWeb.filter((u: UsuarioNoWeb) => u.NombreUsuarios.toLowerCase().includes(busquedaUsuarios.toLowerCase()) || u.ObsUsuario?.toLowerCase().includes(busquedaUsuarios.toLowerCase()) || u.EmpRegistros.toLowerCase().includes(busquedaUsuarios.toLowerCase()))
        : usuariosNoWeb;

    const handleSave = async () => {
        let hasError = false;
        if (!dni || dni.length !== 8) { setDniError('Debe tener 8 dígitos'); hasError = true; }
        if (!telefono || telefono.length !== 9) { setTelefonoError('Debe tener 9 dígitos'); hasError = true; }
        if (!selectedRol) hasError = true;

        if (hasError) return;

        try {
            const payload = {
                id_vendedor: selectedVendedor?.idVendedor || null,
                id_usuario: selectedUsuarioNoWeb?.IdUsuarios || null,
                id_rol: parseInt(selectedRol),
                activo, dni, telefono,
                nombre_completo: selectedVendedor ? `${selectedVendedor.nombres} ${selectedVendedor.apellidos}` : (selectedUsuarioNoWeb?.NombreUsuarios || ''),
                tipo: selectedVendedor ? 'vendedor' : 'usuario'
            };
            await apiClient.post('/usuarios/register', payload);
            toast({ title: 'Éxito', description: 'Usuario registrado correctamente' });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Error al registrar', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Registrar Nuevo Usuario</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Usuario</label>
                        <Select value={userType} onValueChange={(v) => { setUserType(v); setSelectedVendedor(null); setSelectedUsuarioNoWeb(null); }}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar tipo"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vendedor">Vendedor</SelectItem>
                                <SelectItem value="usuario">Usuario General</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {userType === 'vendedor' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Buscar Vendedor</label>
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                <Input placeholder="Buscar..." className="pl-10" value={busquedaVendedor} onChange={(e) => setBusquedaVendedor(e.target.value)} />
                            </div>
                            <div className="border rounded-lg max-h-40 overflow-y-auto">
                                {vendedoresFiltrados.map((v: Vendedor) => (
                                    <div key={v.idVendedor} className={`p-3 cursor-pointer ${selectedVendedor?.idVendedor === v.idVendedor ? 'bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => { setSelectedVendedor(v); setDni(v.DNI); setTelefono(v.telefono); }}>
                                        <p className="font-medium">{v.nombres} {v.apellidos}</p>
                                        <p className="text-sm text-gray-600">DNI: {v.DNI}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {userType === 'usuario' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Buscar Usuario</label>
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                <Input placeholder="Buscar..." className="pl-10" value={busquedaUsuarios} onChange={(e) => setBusquedaUsuarios(e.target.value)} />
                            </div>
                            <div className="border rounded-lg max-h-40 overflow-y-auto">
                                {usuariosFiltrados.map((v: UsuarioNoWeb) => (
                                    <div key={v.IdUsuarios} className={`p-3 cursor-pointer ${selectedUsuarioNoWeb?.IdUsuarios === v.IdUsuarios ? 'bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => { setSelectedUsuarioNoWeb(v); setDni(v.ObsUsuario || ''); }}>
                                        <p className="font-medium">{v.NombreUsuarios}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(userType) && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">DNI *</label>
                                <Input value={dni} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); setDni(v); setDniError(v.length !== 8 ? 'Requerido 8 dígitos' : ''); }} />
                                {dniError && <p className="text-red-500 text-xs">{dniError}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Teléfono *</label>
                                <Input value={telefono} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 9); setTelefono(v); setTelefonoError(v.length !== 9 ? 'Requerido 9 dígitos' : ''); }} />
                                {telefonoError && <p className="text-red-500 text-xs">{telefonoError}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Rol *</label>
                                <Select value={selectedRol} onValueChange={setSelectedRol}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar rol"/></SelectTrigger>
                                    <SelectContent>{roles.map((r: Rol) => <SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 rounded" />
                                <label className="text-sm font-medium">Activo</label>
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!userType || !!dniError || !!telefonoError || !selectedRol}>Registrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const EditUsuarioWebModal = ({ isOpen, onClose, usuario, roles, onSuccess }: any) => {
    const { toast } = useToast();
    const [dni, setDni] = useState('');
    const [telefono, setTelefono] = useState('');
    const [selectedRol, setSelectedRol] = useState('');
    const [activo, setActivo] = useState(true);

    useEffect(() => {
        if (usuario) {
            setDni(usuario.dni); setTelefono(usuario.telefono);
            setSelectedRol(usuario.id_rol.toString()); setActivo(usuario.activo);
        }
    }, [usuario, isOpen]);

    const handleUpdate = async () => {
        try {
            await apiClient.put(`/usuarios/update/${usuario.id}`, { id_rol: parseInt(selectedRol), activo, dni, telefono });
            toast({ title: 'Éxito', description: 'Actualizado correctamente' });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Editar Usuario</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <Input value={usuario?.nombre_completo || ''} disabled />
                    <Input value={dni} disabled />
                    <Input value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))} />
                    <Select value={selectedRol} onValueChange={setSelectedRol}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar rol"/></SelectTrigger>
                        <SelectContent>{roles.map((r: Rol) => <SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 rounded" />
                        <label className="text-sm font-medium">Activo</label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleUpdate}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const VendedorModal = ({ isOpen, onClose, initialData, onSuccess }: any) => {
    const { toast } = useToast();
    const [form, setForm] = useState({ codigo: '', nombres: '', apellidos: '', DNI: '', telefono: '', comisionVend: 0, comisionCobranza: 0, empRegistro: '20481321892', activo: 1 });

    useEffect(() => {
        if (initialData) setForm(initialData);
        else setForm({ codigo: '', nombres: '', apellidos: '', DNI: '', telefono: '', comisionVend: 0, comisionCobranza: 0, empRegistro: '20481321892', activo: 1 });
    }, [initialData, isOpen]);

    const handleSave = async () => {
        try {
            const payload = { ...form, Codigo_Vend: form.codigo, Nombres: form.nombres, Apellidos: form.apellidos, Telefonos: form.telefono, ComisionVend: form.comisionVend, ComisionCobranza: form.comisionCobranza, EmpRegistro: form.empRegistro, Estado: form.activo === 1 ? 'A' : 'I' };
            if (initialData) await apiClient.put(`/usuarios/vendedores/update/${initialData.idVendedor}`, payload);
            else await apiClient.post('/usuarios/vendedores/create', payload);
            toast({ title: 'Éxito', description: 'Vendedor guardado' });
            onSuccess();
            onClose();
        } catch (error) { toast({ title: 'Error', description: 'Error al guardar', variant: 'destructive' }); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{initialData ? 'Editar Vendedor' : 'Nuevo Vendedor'}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                    <Input placeholder="Código" value={form.codigo} onChange={(e) => setForm({...form, codigo: e.target.value.slice(0, 4)})} required />
                    <Input placeholder="Nombres" value={form.nombres} onChange={(e) => setForm({...form, nombres: e.target.value.slice(0, 50)})} required />
                    <Input placeholder="Apellidos" value={form.apellidos} onChange={(e) => setForm({...form, apellidos: e.target.value.slice(0, 50)})} required />
                    <Input placeholder="DNI" value={form.DNI} onChange={(e) => setForm({...form, DNI: e.target.value.slice(0, 50)})} required />
                    <Input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value.slice(0, 50)})} />
                    <Input type="number" placeholder="Comisión Vend" value={form.comisionVend} onChange={(e) => setForm({...form, comisionVend: parseFloat(e.target.value)||0})} />
                    <Input type="number" placeholder="Comisión Cobr" value={form.comisionCobranza} onChange={(e) => setForm({...form, comisionCobranza: parseFloat(e.target.value)||0})} />
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={form.activo === 1} onChange={(e) => setForm({...form, activo: e.target.checked ? 1 : 0})} className="h-4 w-4" />
                        <label className="text-sm">Activo</label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!form.codigo || !form.nombres || !form.apellidos || !form.DNI}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const UsuarioGeneralModal = ({ isOpen, onClose, initialData, onSuccess }: any) => {
    const { toast } = useToast();
    const [form, setForm] = useState({ NombreUsuarios: '', EmpRegistros: '20481321892', ObsUsuario: '', ClaveUsuarios: '0000' });

    useEffect(() => {
        if (initialData) setForm(initialData);
        else setForm({ NombreUsuarios: '', EmpRegistros: '20481321892', ObsUsuario: '', ClaveUsuarios: '0000' });
    }, [initialData, isOpen]);

    const handleSave = async () => {
        try {
            if (initialData) await apiClient.put(`/usuarios/usuarios-noweb/update/${initialData.IdUsuarios}`, form);
            else await apiClient.post('/usuarios/usuarios-noweb/create', form);
            toast({ title: 'Éxito', description: 'Usuario guardado' });
            onSuccess();
            onClose();
        } catch (error) { toast({ title: 'Error', description: 'Error al guardar', variant: 'destructive' }); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{initialData ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                    <Input placeholder="Nombre" value={form.NombreUsuarios} onChange={(e) => setForm({...form, NombreUsuarios: e.target.value})} required />
                    <Input placeholder="Observación" value={form.ObsUsuario} onChange={(e) => setForm({...form, ObsUsuario: e.target.value})} />
                    <Input placeholder="Clave (Max 4)" value={form.ClaveUsuarios} onChange={(e) => setForm({...form, ClaveUsuarios: e.target.value.slice(0, 4)})} required />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!form.NombreUsuarios || !form.ClaveUsuarios}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const RepresentanteModal = ({ isOpen, onClose, initialData, vendedores, laboratorios, onSuccess }: any) => {
    const { toast } = useToast();
    const [form, setForm] = useState({
        idRepresentante: 0, CodRepres: '', NombreRepres: '', IdVendedor: '', Activo: 1
    });
    const [selectedLabs, setSelectedLabs] = useState<number[]>([]);

    useEffect(() => {
        if (initialData) {
            setForm({
                idRepresentante: initialData.idRepresentante,
                CodRepres: initialData.CodRepres,
                NombreRepres: initialData.NombreRepres,
                IdVendedor: initialData.IdVendedor ? initialData.IdVendedor.toString() : '',
                Activo: initialData.Activo
            });
            setSelectedLabs(initialData.LaboratoriosAsociados?.map((l:any) => l.id) || []);
        } else {
            setForm({ idRepresentante: 0, CodRepres: '', NombreRepres: '', IdVendedor: '', Activo: 1 });
            setSelectedLabs([]);
        }
    }, [initialData, isOpen]);

    const toggleLab = (id: number) => {
        setSelectedLabs(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        try {
            const payload = {
                idRepresentante: form.idRepresentante,
                CodRepres: form.CodRepres,
                NombreRepres: form.NombreRepres,
                IdVendedor: form.IdVendedor ? parseInt(form.IdVendedor) : null,
                laboratoriosIds: selectedLabs,
                Activo: form.Activo
            };
            await apiClient.post('/usuarios/representantes/upsert', payload);
            toast({ title: 'Éxito', description: 'Representante guardado' });
            onSuccess();
            onClose();
        } catch (error) {
            toast({ title: 'Error', description: 'Error al guardar el representante', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{initialData ? 'Editar Representante' : 'Nuevo Representante'}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Código *</label>
                            <Input placeholder="Máx 4 chars" maxLength={4} value={form.CodRepres} onChange={(e) => setForm({...form, CodRepres: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Nombre *</label>
                            <Input placeholder="Nombre del Representante" value={form.NombreRepres} onChange={(e) => setForm({...form, NombreRepres: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Vendedor Asociado *</label>
                        <Select value={form.IdVendedor} onValueChange={(v) => setForm({...form, IdVendedor: v})}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar Vendedor..."/></SelectTrigger>
                            <SelectContent>
                                {vendedores.map((v: Vendedor) => (
                                    <SelectItem key={v.idVendedor} value={v.idVendedor.toString()}>
                                        {v.nombres} {v.apellidos}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1 border rounded-md p-3">
                        <label className="text-sm font-medium block mb-2">Laboratorios Asignados ({selectedLabs.length})</label>
                        <div className="max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {laboratorios.map((lab: Laboratorio) => (
                                <div key={lab.IdLineaGe} className="flex items-center space-x-2">
                                    <input type="checkbox" id={`lab-${lab.IdLineaGe}`} checked={selectedLabs.includes(lab.IdLineaGe)} onChange={() => toggleLab(lab.IdLineaGe)} className="rounded border-gray-300"/>
                                    <label htmlFor={`lab-${lab.IdLineaGe}`} className="text-xs truncate cursor-pointer" title={lab.Descripcion}>{lab.Descripcion}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={form.Activo === 1} onChange={(e) => setForm({...form, Activo: e.target.checked ? 1 : 0})} className="h-4 w-4 rounded" />
                        <label className="text-sm font-medium">Activo</label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!form.CodRepres || !form.NombreRepres || !form.IdVendedor}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};