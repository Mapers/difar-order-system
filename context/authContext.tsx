'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContextType, User, UserLoginDTO, UserRegisterDTO } from '@/interface/auth-interface';
import { loginRequest, registerRequest } from '@/app/api/auth';
import { decodeToken, isTokenNearExpiry } from '@/app/utils/tokenUtils';

// Inicialización del contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Hook para acceder al contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

// Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    // Función para limpiar el estado de autenticación
    const clearAuthState = useCallback(() => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('invoice');
    }, []);

    // Función para manejar errores
    const handleError = useCallback((error: string) => {
        setErrors(prev => [...prev, error]);
    }, []);

    const signup = async (userData: UserRegisterDTO) => {
        try {
            setLoading(true);
            const res = await registerRequest(userData);

            if (res && res.status === 201) {
                const { user, token } = res.data;
                localStorage.setItem("token", token);

                const tokenResult = decodeToken(token);

                if (tokenResult.isValid && tokenResult.user) {
                    setUser(tokenResult.user);
                    setIsAuthenticated(true);
                } else {
                    clearAuthState();
                    handleError(tokenResult.error || 'Token inválido');
                }

                return res;
            }
        } catch (error: any) {
            const message = error.response?.data?.error?.message || 'Error en el registro';
            handleError(message);
            console.error("> Error sign up:", error);
        } finally {
            setLoading(false);
        }
    };

    const signin = async (userData: UserLoginDTO) => {
        try {
            setLoading(true);
            const res = await loginRequest(userData);
            if (res && res.status === 200) {
                const token = res.data.data;
                console.log("> Token", token);
                localStorage.setItem("token", token);
                const tokenResult = decodeToken(token);

                if (tokenResult.isValid && tokenResult.user) {
                    console.log("> Token result valid :", tokenResult.user);
                    setUser(tokenResult.user);
                    setIsAuthenticated(true);
                } else {
                    clearAuthState();
                    handleError(tokenResult.error || 'Token inválido');
                }

                return res;
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error en el inicio de sesión';
            handleError(message);
            console.error("> Error sign in:", error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        clearAuthState();
        router.push('/');
    };

    // Función para refrescar el token (verificar estado actual)
    const refreshToken = useCallback(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenResult = decodeToken(token);

            if (tokenResult.isValid && tokenResult.user) {
                setUser(tokenResult.user);
                setIsAuthenticated(true);
            } else {
                console.log('Token inválido o expirado. Cerrando sesión...');
                logout();
            }
        }
    }, []);

    // Verificar token al cargar la aplicación
    const checkToken = useCallback(() => {
        const token = localStorage.getItem('token');

        if (token) {
            const tokenResult = decodeToken(token);

            if (tokenResult.isValid && tokenResult.user) {
                setUser(tokenResult.user);
                setIsAuthenticated(true);

                // Verificar si está próximo a expirar
                if (isTokenNearExpiry(token)) {
                    console.warn('Token próximo a expirar');
                    // Aquí podrías implementar lógica para renovar el token
                }
            } else {
                console.log('Token inválido o expirado:', tokenResult.error);
                clearAuthState();
            }
        } else {
            setIsAuthenticated(false);
        }

        setLoading(false);
    }, [clearAuthState]);

    // Verificar token al montar el componente
    useEffect(() => {
        checkToken();
    }, [checkToken]);

    // Limpiar errores después de 5 segundos
    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => {
                setErrors([]);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errors]);

    // Verificar token periódicamente (cada 5 minutos)
    useEffect(() => {
        if (isAuthenticated) {
            const interval = setInterval(() => {
                refreshToken();
            }, 5 * 60 * 1000); // 5 minutos

            return () => clearInterval(interval);
        }
    }, [isAuthenticated, refreshToken]);

    return (
        <AuthContext.Provider
            value={{
                user,
                signup,
                signin,
                logout,
                isAuthenticated,
                errors,
                loading,
                refreshToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;