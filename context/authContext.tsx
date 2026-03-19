'use client';

import {createContext, useContext, useEffect, useState, ReactNode, useCallback, use} from 'react';
import { useRouter } from 'next/navigation';
import { decodeToken, isTokenNearExpiry } from '@/app/utils/tokenUtils';
import { AuthService } from '@/app/services/auth/AuthService';
import { AuthContextType, SmsCheck, SmsSend, User, UserLoginDTO, UserRegisterDTO } from '@/app/services/auth/types';
import { toast } from '@/app/hooks/use-toast';
import apiClient from "@/app/api/client";
import {AppConfig} from "@/app/types/config-types";

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string>("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();
    const [globalConfigs, setGlobalConfigs] = useState<AppConfig[]>([]);

    const clearAuthState = useCallback(() => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('invoice');
    }, []);

    const fetchGlobalConfigs = useCallback(async () => {
        try {
            const response = await apiClient.get('/admin/listar/configuraciones');
            if (response.data && response.data.data) {
                setGlobalConfigs(response.data.data);
            }
        } catch (error) {
            console.error("Error al cargar configuraciones globales", error);
        }
    }, []);

    const handleError = useCallback((error: string) => {
        setErrors(prev => [...prev, error]);
    }, []);

    const signup = async (userData: UserRegisterDTO) => {
        try {
            setLoading(true);
            const res = await AuthService.registerRequest(userData);

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


    const sendDni = async (userData: UserLoginDTO) => {
        try {
            setLoading(true);
            const response = await AuthService.loginRequest(userData);
            if (response && response.success) {
                const token = response.data;
                const tokenResult = decodeToken(token);
                if (tokenResult.isValid && tokenResult.user) {
                    setToken(response.data)
                    const telefono = tokenResult.user.telefono
                    return telefono
                }
            }
        } catch (error: any) {
            if (error.response) {
                toast({ title: "Iniciar Sesión", description: error.response.data.message, variant: "warning" })

            }
            else {
                const message = "No cargó correctamente, por favor intente nuevamente."
                handleError(message);
                throw new Error(message)
            }
        } finally {
            setLoading(false);
        }
    };


    const signin = async (smsCheck: SmsCheck) => {
        try {
            setLoading(true);
            const resCheck = await AuthService.checkToken(smsCheck);
            if (resCheck.success) {
                localStorage.setItem("token", token);
                const tokenResult = decodeToken(token);
                setUser(tokenResult.user);
                setIsAuthenticated(true);
                return resCheck;
            } 
        } catch (error: any) {
            if (error.response) {
                clearAuthState();
                handleError(error.response.data.message || "Error en validación SMS");
                return error.response.data
            }
            else {
                const message = "Error en validación SMS"
                handleError(message);
                throw new Error(message)
            }
        } finally {
            setLoading(false);
        }
    };

    const ADMIN_ROLE_NAMES = ['admin', 'administrador', 'administrativo', 'gerente'];

    const isAdmin = (): boolean => {
        const userRole = user?.rolDescripcion?.toLowerCase() ?? '';
        return ADMIN_ROLE_NAMES.some(adminRole => userRole.includes(adminRole));
    };

    const isVendedor = (): boolean =>
        user?.rolDescripcion?.toLowerCase() === 'vendedor';

    const isRepresentante = (): boolean =>
        user?.rolDescripcion?.toLowerCase() === 'representante';

    const hasRole = (roleName: string | string[]): boolean => {
        const desc = user?.rolDescripcion?.toLowerCase() ?? '';
        if (Array.isArray(roleName)) return roleName.map(r => r.toLowerCase()).includes(desc);
        return desc === roleName.toLowerCase();
    };

    const logout = async () => {
        clearAuthState();
        router.push('/');

    };

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

    const checkToken = useCallback(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenResult = decodeToken(token);

            if (tokenResult.isValid && tokenResult.user) {
                setUser(tokenResult.user);
                setIsAuthenticated(true);
                fetchGlobalConfigs();

                if (isTokenNearExpiry(token)) {
                    console.warn('Token próximo a expirar');
                }
            } else {
                console.log('Token inválido o expirado:', tokenResult.error);
                clearAuthState();
            }
        } else {
            setIsAuthenticated(false);
        }
        setLoading(false);
    }, [clearAuthState, fetchGlobalConfigs]);

    useEffect(() => {
        checkToken();
    }, [checkToken]);

    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => {
                setErrors([]);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errors]);

    useEffect(() => {
        if (isAuthenticated) {
            const interval = setInterval(() => {
                refreshToken();
            }, 5 * 60 * 1000);

            return () => clearInterval(interval);
        }
    }, [isAuthenticated, refreshToken]);

    return (
        <AuthContext.Provider
            value={{
                user,
                signup,
                sendDni,
                signin,
                logout,
                isAuthenticated,
                errors,
                loading,
                refreshToken,
                globalConfigs,
                fetchGlobalConfigs,
                isAdmin,
                isVendedor,
                isRepresentante,
                hasRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;