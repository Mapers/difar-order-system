import {AppConfig} from "@/app/dashboard/configuraciones/page";

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
        usuario: string,
        codigo: string,
        telefono: string,
        nombreCompleto: string,
        rol: {
            id: number,
            nombre: string
        };
    },
    menus: Menu[]
    iat: number;
    exp: number;
}

export interface Menu {
    id: string,
    nombre: string,
    icono: string,
    ruta: string,
    id_padre: number,
    orden: number
}

export interface User {
    codigo: string,
    telefono: string,
    nombreCompleto: string,
    idRol: number;
    rolDescripcion: string;
    menus: Menu[]
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
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    errors: string[];
    loading: boolean;
    refreshToken: () => void;
    globalConfigs: AppConfig[];
    fetchGlobalConfigs: () => Promise<void>;
}