import {AppConfig} from "@/app/types/config-types";

export interface UserLoginDTO {
    dni: string;
}

export interface SmsSend {
    dni: string,
    telefono: string
}

export interface SmsCheck {
    dni: string,
    codigo: string
}

export interface JwtPayload {
    usuario: {
        idVendedor: number,
        usuario: string,
        codigo: string,
        telefono: string,
        nombreCompleto: string,
        rol: {
            id: number,
            nombre: string
        };
        codRepres: string;
        idRepresentante: string;
        vendedores: VendedorRelacionado[];
        vendedorRelacion?: VendedorRelacionUnico | null;
        edicion_pedido: boolean;
        simuladoPorRepresentante?: number | string | null;
    },
    menus: Menu[]
    iat: number;
    exp: number;
}

export interface VendedorRelacionUnico {
    idVendedor: number;
    codigo: string;
    nombreCompleto: string;
}

export interface Menu {
    id: string,
    nombre: string,
    icono: string,
    ruta: string,
    id_padre: number,
    orden: number
}

export interface VendedorRelacionado {
    idVendedor: number,
    codigo: string,
    Nombres: string
}

export interface User {
    idVendedor: number,
    codigo: string,
    telefono: string,
    nombreCompleto: string,
    idRol: number;
    rolDescripcion: string;
    menus: Menu[];
    codRepres: string;
    idRepresentante?: string | null;
    vendedores: VendedorRelacionado[];
    vendedorRelacion?: VendedorRelacionUnico | null;
    edicion_pedido: boolean;
    /** idRepresentante de origen cuando es un vendedor simulado por un representante */
    simuladoPorRepresentante?: number | string | null;
}

export interface UserRegisterDTO {
    dni: string;
    nombre: string;
    password: string;
    id_rol?: number;
}

export interface AuthContextType {
    user: User | null;
    signup: (user: UserRegisterDTO) => Promise<any>;
    sendDni: (user: UserLoginDTO) => Promise<any>;
    signin: (smsCheck: SmsCheck) => Promise<any>;
    ingresarComoVendedor: () => Promise<boolean>;
    ingresarComoRepresentante: () => Promise<boolean>;
    switchingRole: boolean;
    pendingRoleSelection: boolean;
    clearPendingRoleSelection: () => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    errors: string[];
    loading: boolean;
    refreshToken: () => void;
    globalConfigs: AppConfig[];
    fetchGlobalConfigs: () => Promise<void>;
    isAdmin: () => boolean;
    isVendedor: () => boolean;
    isRepresentante: () => boolean;
    hasRole: (roleName: string | string[]) => boolean;
}