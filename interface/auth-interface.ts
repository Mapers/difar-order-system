
export interface User {
    _id: string;
    email: string;
    role: string;
}

export interface UserLoginDTO {
    dni: string;
    password: string;
}

export interface UserRegisterDTO {
    email: string;
    username: string,
    password: string;
    role: string
}

export interface JwtPayload {
    EmpRegistros: string;
    NombreUsuarios: string;
    id_rol: number;
    descripcion_rol: string;
}


export interface AuthContextType {
    user: User | null;
    signup: (data: UserRegisterDTO) => Promise<any>;
    signin: (data: UserLoginDTO) => Promise<any>;
    logout: () => Promise<any>;
    isAuthenticated: boolean;
    errors: string[];
    loading: boolean;
}
