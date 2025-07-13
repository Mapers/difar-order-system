import { jwtDecode } from 'jwt-decode';
import { JwtPayload, User, BaseJwtPayload } from '@/interface/auth-interface';

export interface TokenDecodeResult {
    isValid: boolean;
    user: User | null;
    isExpired: boolean;
    error?: string;
}

/**
 * Determina el tipo de usuario basado en los campos presentes en el token
 * Basado en la lógica del SP: si tiene Codigo_vend es vendedor, si tiene EmpRegistros es usuario
 */
const determineUserType = (decoded: any): 'vendedor' | 'usuario' | 'unknown' => {
    // Si tiene Codigo_vend y Nombre_Completo, es un vendedor
    if (decoded.Codigo_Vend && decoded.Nombre_Completo) {
        return 'vendedor';
    }
    // Si tiene EmpRegistros y NombreUsuarios, es un usuario/administrador
    if (decoded.EmpRegistros && decoded.NombreUsuarios) {
        return 'usuario';
    }
    return 'unknown';
};

/**
 * Normaliza los datos del usuario según el tipo
 */
const normalizeUserData = (decoded: any, userType: string): User | null => {
    const baseUser = {
        id_rol: decoded.id_rol,
        descripcion_rol: decoded.descripcion_rol,
        user_type: userType as 'vendedor' | 'usuario'
    };

    switch (userType) {
        case 'vendedor':
            return {
                ...baseUser,
                codigo: decoded.Codigo_Vend,
                nombre: decoded.Nombre_Completo,
            };
        
        case 'usuario':
            return {
                ...baseUser,
                codigo: decoded.EmpRegistros,
                nombre: decoded.NombreUsuarios,
            };
        
        default:
            return null;
    }
};

/**
 * Decodifica un token JWT y extrae la información del usuario
 * @param token - Token JWT a decodificar
 * @returns Resultado de la decodificación con información del usuario
 */
export const decodeToken = (token: string | null | undefined): TokenDecodeResult => {
    try {
        // Verificar que el token existe y es un string
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return {
                isValid: false,
                user: null,
                isExpired: false,
                error: 'Token vacío o inválido'
            };
        }

        const cleanToken = token.trim();
        const decoded = jwtDecode<BaseJwtPayload>(cleanToken);
        const currentTime = Date.now();
        const isExpired = decoded.exp * 1000 < currentTime;
        
        if (isExpired) {
            return {
                isValid: false,
                user: null,
                isExpired: true,
                error: 'Token expirado'
            };
        }

        // Determinar el tipo de usuario basado en la lógica del SP
        console.log("decoded:", decoded)
        const userType = determineUserType(decoded);
        
        if (userType === 'unknown') {
            return {
                isValid: false,
                user: null,
                isExpired: false,
                error: 'Estructura de token no reconocida'
            };
        }

        // Normalizar los datos del usuario
        const user = normalizeUserData(decoded, userType);
        
        if (!user) {
            return {
                isValid: false,
                user: null,
                isExpired: false,
                error: 'No se pudo extraer información del usuario'
            };
        }

        return {
            isValid: true,
            user,
            isExpired: false
        };
        
    } catch (error) {
        console.error('Error al decodificar token:', error);
        return {
            isValid: false,
            user: null,
            isExpired: false,
            error: 'Error al decodificar token'
        };
    }
};

/**
 * Verifica si un token está próximo a expirar (dentro de 5 minutos)
 */
export const isTokenNearExpiry = (token: string | null | undefined): boolean => {
    try {
        if (!token || typeof token !== 'string') {
            return true;
        }

        const decoded = jwtDecode<BaseJwtPayload>(token.trim());
        const currentTime = Date.now();
        const expiryTime = decoded.exp * 1000;
        const fiveMinutes = 5 * 60 * 1000;
        
        return (expiryTime - currentTime) < fiveMinutes;
    } catch {
        return true;
    }
};