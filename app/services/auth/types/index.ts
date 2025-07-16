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
    codigo: string,
    telefono: string,
    nombreCompleto: string,
    idRol: number;
    rolDescripcion: string;
    iat: number;
    exp: number;
}

export interface User {
    codigo: string,
    telefono: string,
    nombreCompleto: string,
    idRol: number;
    rolDescripcion: string;
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
}