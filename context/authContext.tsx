'use client';

import {createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef} from 'react';
import { useRouter } from 'next/navigation';
import { decodeToken, isTokenNearExpiry } from '@/app/utils/tokenUtils';
import { AuthService } from '@/app/services/auth/AuthService';
import { AuthContextType, SmsCheck, SmsSend, User, UserLoginDTO, UserRegisterDTO } from '@/app/services/auth/types';
import { toast } from '@/app/hooks/useToast';
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
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [pendingRoleSelection, setPendingRoleSelection] = useState<boolean>(false);
    const [switchingRole, setSwitchingRole] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();
    const [globalConfigs, setGlobalConfigs] = useState<AppConfig[]>([]);
    const tokenRef = useRef("");
    // true si el backend todavía no tiene el inicio de sesión con código (despliegue en curso): ver sendDni.
    const modoAntiguoRef = useRef(false);

    const clearAuthState = useCallback(() => {
        setUser(null);
        setIsAuthenticated(false);
        setPendingRoleSelection(false);
        localStorage.removeItem('token');
        localStorage.removeItem('invoice');
        localStorage.removeItem('lastActivityTime');
    }, []);

    // checkToken() (más abajo) solo llama a fetchGlobalConfigs() UNA VEZ, al montar
    // el AuthProvider (login o refresh de página). Ningún otro lugar de la app la
    // vuelve a llamar. Antes, si esa única llamada fallaba (red, backend lento,
    // etc.), globalConfigs se quedaba vacío para el resto de la sesión, y cualquier
    // pantalla que espera globalConfigs.length > 0 antes de cargar datos —como
    // Lista de Clientes— se quedaba esperando para siempre hasta que el usuario
    // recargaba la página a mano. Por eso ahora reintenta sola unas pocas veces.
    const fetchGlobalConfigs = useCallback(async (intentosRestantes = 3): Promise<void> => {
        try {
            const response = await apiClient.get('/admin/listar/configuraciones');
            if (response.data && response.data.data) {
                setGlobalConfigs(response.data.data);
            }
        } catch (error) {
            console.error("Error al cargar configuraciones globales", error);
            if (intentosRestantes > 1) {
                setTimeout(() => { fetchGlobalConfigs(intentosRestantes - 1); }, 1500);
            }
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
            // Seguro (auditoría 14/11/2026): el servidor manda el código al teléfono registrado y NO entrega el
            // token todavía; el token llega recién al verificar el código (signin, más abajo).
            tokenRef.current = '';
            modoAntiguoRef.current = false;
            try {
                const response = await AuthService.solicitarCodigo(userData.dni);
                if (response && response.success) {
                    return response.data?.telefono || 'tu teléfono registrado'
                }
                return undefined
            } catch (e: any) {
                // Compatibilidad de despliegue: si el backend todavía es el anterior (no tiene la ruta: 404), se usa
                // el inicio de sesión antiguo. Así el front se puede publicar ANTES que el backend sin cortar a nadie.
                if (e?.response?.status !== 404) throw e
                modoAntiguoRef.current = true
                const antiguo = await AuthService.loginRequest(userData)
                if (!antiguo?.success) return undefined
                const tokenResult = decodeToken(antiguo.data)
                if (!tokenResult.isValid || !tokenResult.user) return undefined
                tokenRef.current = antiguo.data
                const resInsert = await AuthService.insertToken({ dni: userData.dni, telefono: tokenResult.user.telefono })
                return resInsert?.success ? 'tu teléfono registrado' : undefined
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
            // Backend anterior (ver sendDni): se valida con la ruta antigua y se usa el token ya recibido.
            const resCheck = modoAntiguoRef.current
                ? { ...(await AuthService.checkToken(smsCheck)), data: tokenRef.current }
                : await AuthService.verificarCodigo(smsCheck);
            if (resCheck.success && resCheck.data) {
                tokenRef.current = resCheck.data;
                localStorage.setItem("token", tokenRef.current);
                localStorage.setItem("lastActivityTime", Date.now().toString());
                const tokenResult = decodeToken(tokenRef.current);
                setUser(tokenResult.user);
                setIsAuthenticated(true);
                const u = tokenResult.user;
                if (u?.idRepresentante && u?.vendedorRelacion?.idVendedor) {
                    setPendingRoleSelection(true);
                }
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

    const ingresarComoVendedor = async (): Promise<boolean> => {
        try {
            setLoading(true);
            setSwitchingRole(true);
            const currentToken = localStorage.getItem('token') || tokenRef.current;
            if (!currentToken) return false;
            const res = await AuthService.ingresarComoVendedor(currentToken);
            if (res && res.success && res.data) {
                const newToken = res.data;
                const tokenResult = decodeToken(newToken);
                if (tokenResult.isValid && tokenResult.user) {
                    localStorage.setItem('token', newToken);
                    tokenRef.current = newToken;
                    setUser(tokenResult.user);
                    setIsAuthenticated(true);
                    setPendingRoleSelection(false);
                    return true;
                }
            }
            handleError(res?.message || 'No se pudo ingresar como vendedor');
            return false;
        } catch (error: any) {
            handleError(error.response?.data?.message || 'Error al ingresar como vendedor');
            return false;
        } finally {
            setLoading(false);
            setSwitchingRole(false);
        }
    };

    const ingresarComoRepresentante = async (): Promise<boolean> => {
        try {
            setSwitchingRole(true);
            const currentToken = localStorage.getItem('token') || tokenRef.current;
            if (!currentToken) return false;
            const res = await AuthService.ingresarComoRepresentante(currentToken);
            if (res && res.success && res.data) {
                const newToken = res.data;
                const tokenResult = decodeToken(newToken);
                if (tokenResult.isValid && tokenResult.user) {
                    localStorage.setItem('token', newToken);
                    tokenRef.current = newToken;
                    setUser(tokenResult.user);
                    setIsAuthenticated(true);
                    return true;
                }
            }
            handleError(res?.message || 'No se pudo ingresar como representante');
            return false;
        } catch (error: any) {
            handleError(error.response?.data?.message || 'Error al ingresar como representante');
            return false;
        } finally {
            setSwitchingRole(false);
        }
    };

    const ADMIN_ROLE_NAMES = ['admin', 'administrador', 'administrativo', 'gerente'];

    const isAdmin = (): boolean => {
        const userRole = user?.rolDescripcion?.toLowerCase() ?? '';
        return ADMIN_ROLE_NAMES.some(adminRole => userRole.includes(adminRole));
    };

    const isVendedor = (): boolean =>
        user?.rolDescripcion?.toLowerCase().includes('vendedor') || false;

    const isRepresentante = (): boolean =>
        user?.rolDescripcion?.toLowerCase().includes('repre') || false;

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
                clearAuthState();
                router.push('/');
            }
        }
    }, [clearAuthState, router]);

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
                ingresarComoVendedor,
                ingresarComoRepresentante,
                switchingRole,
                pendingRoleSelection,
                clearPendingRoleSelection: () => setPendingRoleSelection(false),
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