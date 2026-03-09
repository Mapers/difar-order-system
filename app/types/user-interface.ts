export interface Usuario {
    id_usuario: number;
    idVendedor: number | null;
    id: number | null;
    codigo: string;
    nombre_completo: string;
    dni: string;
    telefono: string;
    activo: boolean;
    id_rol: number;
    nombre_rol: string;
    tipo: string;
}

export interface Vendedor {
    idVendedor: number;
    codigo: string;
    nombres: string;
    apellidos: string;
    DNI: string;
    telefono: string;
    comisionVend: number;
    comisionCobranza: number;
    empRegistro: string;
    activo: number;
}

export interface UsuarioNoWeb {
    IdUsuarios: number;
    NombreUsuarios: string;
    EmpRegistros: string;
    ObsUsuario: string;
    ClaveUsuarios: string;
}

export interface Rol {
    id: number;
    nombre: string;
}

export interface Laboratorio {
    IdLineaGe: number;
    Descripcion: string;
    Codigo_Linea: string;
}

export interface Representante {
    idRepresentante: number;
    CodRepres: string;
    NombreRepres: string;
    Activo: number;
    IdVendedor: number | null;
    VendedorNombres: string;
    VendedorApellidos: string;
    LaboratoriosAsociados: { id: number; nombre: string }[];
}