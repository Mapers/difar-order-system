import { jwtDecode } from 'jwt-decode';
import { JwtPayload, User } from '../services/auth/types';

export interface TokenDecodeResult {
    isValid: boolean;
    user: User | null;
    isExpired: boolean;
    error?: string;
}


/**
 * Decodifica un token JWT y extrae la información del usuario
 * @param token - Token JWT a decodificar
 * @returns Resultado de la decodificación con información del usuario
 */
export const decodeToken = (token: string | null | undefined): TokenDecodeResult => {
    try {
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return {
                isValid: false,
                user: null,
                isExpired: false,
                error: 'Token vacío o inválido'
            };
        }
        const decoded = jwtDecode<JwtPayload>(token.trim());
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
        const user: User = {
            codigo: decoded.codigo,
            telefono: decoded.telefono,
            nombreCompleto: decoded.nombreCompleto,
            idRol: decoded.idRol,
            rolDescripcion: decoded.rolDescripcion
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

        const decoded = jwtDecode<JwtPayload>(token.trim());
        const currentTime = Date.now();
        const expiryTime = decoded.exp * 1000;
        const fiveMinutes = 5 * 60 * 1000;

        return (expiryTime - currentTime) < fiveMinutes;
    } catch {
        return true;
    }
};