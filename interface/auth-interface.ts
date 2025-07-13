// interface/auth-interface.ts

// Interface base del token JWT (campos que siempre están presentes)
export interface BaseJwtPayload {
    id_rol: number;
    descripcion_rol: string;
    iat: number;
    exp: number;
}

// Interface para vendedores (cuando idvendedor IS NOT NULL)
export interface VendedorJwtPayload extends BaseJwtPayload {
    Codigo_Vend: string;
    Nombre_Completo: string;
}

// Interface para usuarios/administradores (cuando IdUsuarios IS NOT NULL)
export interface UsuarioJwtPayload extends BaseJwtPayload {
    EmpRegistros: string;
    NombreUsuarios: string;
}

// Union type para los posibles payloads
export type JwtPayload = VendedorJwtPayload | UsuarioJwtPayload;

// Interface del usuario normalizada (siempre la misma estructura en el frontend)
export interface User {
    codigo: string;              // Codigo_vend o EmpRegistros
    nombre: string;              // Nombre_Completo o NombreUsuarios
    id_rol: number;
    descripcion_rol: string;
    user_type: 'vendedor' | 'usuario'; // Tipo de usuario
}

// Resto de interfaces...
export interface UserLoginDTO {
    dni: string;        // Basado en el SP que usa DNI
    password: string; // Basado en el SP que usa password
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
    signin: (user: UserLoginDTO) => Promise<any>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    errors: string[];
    loading: boolean;
    refreshToken: () => void;
}