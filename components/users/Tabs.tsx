// components/Tabs.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import {EditUsuarioWebModal, VendedorModal, UsuarioGeneralModal, RepresentanteModal} from './Modals';
import {Laboratorio, Representante, Usuario, UsuarioNoWeb, Vendedor} from "@/app/types/user-interface";

export const UsuariosWebTab = ({ usuarios, roles, isMobile, onRefresh }: { usuarios: Usuario[], roles: Rol[], isMobile: boolean, onRefresh: () => void }) => {
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [selected, setSelected] = useState<Usuario | null>(null);

    const toggle = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <Card><CardContent className="p-0">
            {isMobile ? (
                <div className="p-2">
                    {usuarios.map(u => (
                        <Card key={u.id_usuario} className="mb-4"><CardContent className="p-4">
                            <div className="flex justify-between">
                                <div><h3 className="font-semibold">{u.nombre_completo}</h3><p className="text-sm">DNI: {u.dni}</p></div>
                                <Button variant="ghost" size="icon" onClick={() => toggle(u.id_usuario)}>{expanded[u.id_usuario] ? <ChevronUp/> : <ChevronDown/>}</Button>
                            </div>
                            <div className="text-sm my-2">Tel: {u.telefono} <br/> Rol: {u.nombre_rol}</div>
                            {expanded[u.id_usuario] && <Button className="w-full mt-2" onClick={() => setSelected(u)}><Edit className="h-4 w-4 mr-2"/>Editar</Button>}
                        </CardContent></Card>
                    ))}
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr>
                        {['Nombre', 'Documento', 'Celular', 'Rol', 'Estado', 'Acciones'].map(h => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                    </tr></thead>
                    <tbody>
                    {usuarios.map(u => (
                        <tr key={u.id_usuario}>
                            <td className="p-4 text-sm">{u.nombre_completo}</td><td className="p-4 text-sm">{u.dni}</td><td className="p-4 text-sm">{u.telefono}</td><td className="p-4 text-sm">{u.nombre_rol}</td>
                            <td className="p-4 text-sm">{u.activo ? <span className="text-green-800 bg-green-100 px-2 rounded-full text-xs">Activo</span> : <span className="text-red-800 bg-red-100 px-2 rounded-full text-xs">Inactivo</span>}</td>
                            <td className="p-4 text-sm"><Button variant="ghost" size="icon" onClick={() => setSelected(u)}><Edit className="h-4 w-4 text-blue-600"/></Button></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
            <EditUsuarioWebModal isOpen={!!selected} onClose={() => setSelected(null)} usuario={selected} roles={roles} onSuccess={onRefresh} />
        </CardContent></Card>
    );
};

export const VendedoresTab = ({ vendedores, isMobile, onRefresh }: { vendedores: Vendedor[], isMobile: boolean, onRefresh: () => void }) => {
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [selected, setSelected] = useState<Vendedor | null>(null);

    return (
        <Card><CardContent className="p-0">
            {isMobile ? (
                <div className="p-2">
                    {vendedores.map(v => (
                        <Card key={v.idVendedor} className="mb-4"><CardContent className="p-4">
                            <div className="flex justify-between">
                                <div><h3 className="font-semibold">{v.nombres} {v.apellidos}</h3><p className="text-sm">Cod: {v.codigo}</p></div>
                                <Button variant="ghost" size="icon" onClick={() => setExpanded(p => ({ ...p, [v.idVendedor]: !p[v.idVendedor] }))}>{expanded[v.idVendedor] ? <ChevronUp/> : <ChevronDown/>}</Button>
                            </div>
                            {expanded[v.idVendedor] && <Button className="w-full mt-2" onClick={() => setSelected(v)}><Edit className="h-4 w-4 mr-2"/>Editar</Button>}
                        </CardContent></Card>
                    ))}
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr>
                        {['Código', 'Nombre', 'DNI', 'Teléfono', 'Estado', 'Acciones'].map(h => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                    </tr></thead>
                    <tbody>
                    {vendedores.map(v => (
                        <tr key={v.idVendedor}>
                            <td className="p-4 text-sm">{v.codigo}</td><td className="p-4 text-sm">{v.nombres} {v.apellidos}</td><td className="p-4 text-sm">{v.DNI}</td><td className="p-4 text-sm">{v.telefono}</td>
                            <td className="p-4 text-sm">{v.activo ? 'Activo' : 'Inactivo'}</td>
                            <td className="p-4 text-sm"><Button variant="ghost" size="icon" onClick={() => setSelected(v)}><Edit className="h-4 w-4 text-blue-600"/></Button></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
            <VendedorModal isOpen={!!selected} onClose={() => setSelected(null)} initialData={selected} onSuccess={onRefresh} />
        </CardContent></Card>
    );
};

export const UsuariosGeneralesTab = ({ usuarios, isMobile, onRefresh }: { usuarios: UsuarioNoWeb[], isMobile: boolean, onRefresh: () => void }) => {
    const [selected, setSelected] = useState<UsuarioNoWeb | null>(null);
    return (
        <Card><CardContent className="p-0">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr>{['Nombre', 'Emp. Registro', 'Observación', 'Acciones'].map(h => <th key={h} className="px-3 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody>
                {usuarios.map(u => (
                    <tr key={u.IdUsuarios}>
                        <td className="p-4 text-sm">{u.NombreUsuarios}</td><td className="p-4 text-sm">{u.EmpRegistros}</td><td className="p-4 text-sm">{u.ObsUsuario}</td>
                        <td className="p-4 text-sm"><Button variant="ghost" size="icon" onClick={() => setSelected(u)}><Edit className="h-4 w-4 text-blue-600"/></Button></td>
                    </tr>
                ))}
                </tbody>
            </table>
            <UsuarioGeneralModal isOpen={!!selected} onClose={() => setSelected(null)} initialData={selected} onSuccess={onRefresh} />
        </CardContent></Card>
    );
};

export const RepresentantesTab = ({ representantes, vendedores, laboratorios, isMobile, onRefresh }: { representantes: Representante[], vendedores: Vendedor[], laboratorios: Laboratorio[], isMobile: boolean, onRefresh: () => void }) => {
    const [selected, setSelected] = useState<Representante | null>(null);

    return (
        <Card><CardContent className="p-0">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr>
                        {['Código', 'Nombre', 'Vendedor', 'Laboratorios', 'Estado', 'Acciones'].map(h => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                    </tr></thead>
                    <tbody>
                    {representantes.map(r => (
                        <tr key={r.idRepresentante}>
                            <td className="p-4 text-sm font-mono font-medium">{r.CodRepres}</td>
                            <td className="p-4 text-sm">{r.NombreRepres}</td>
                            <td className="p-4 text-sm">{r.VendedorNombres ? `${r.VendedorNombres} ${r.VendedorApellidos}` : <span className="text-red-500 text-xs">Sin asignar</span>}</td>
                            <td className="p-4 text-sm">
                                <div className="flex flex-wrap gap-1">
                                    {r.LaboratoriosAsociados?.map((lab, idx) => (
                                        <span key={idx} className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">{lab.nombre}</span>
                                    ))}
                                    {(!r.LaboratoriosAsociados || r.LaboratoriosAsociados.length === 0) && <span className="text-gray-400 text-xs">Ninguno</span>}
                                </div>
                            </td>
                            <td className="p-4 text-sm">{r.Activo ? <span className="text-green-800 bg-green-100 px-2 rounded-full text-xs">Activo</span> : <span className="text-red-800 bg-red-100 px-2 rounded-full text-xs">Inactivo</span>}</td>
                            <td className="p-4 text-sm"><Button variant="ghost" size="icon" onClick={() => setSelected(r)}><Edit className="h-4 w-4 text-blue-600"/></Button></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <RepresentanteModal isOpen={!!selected} onClose={() => setSelected(null)} initialData={selected} vendedores={vendedores} laboratorios={laboratorios} onSuccess={onRefresh} />
        </CardContent></Card>
    );
};