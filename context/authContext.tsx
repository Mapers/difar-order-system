'use client';

import { createContext, useContext, useEffect, useState, ReactNode, } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { AuthContextType, JwtPayload, User, UserLoginDTO, UserRegisterDTO } from '@/interface/auth-interface';
import { loginRequest, registerRequest } from '@/app/api/auth';
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

    const signup = async (user: UserRegisterDTO) => {
        try {
            const res = await registerRequest(user);
            if (res && res.status === 201) {
                const { user, token } = res.data
                localStorage.setItem("token", token)
                setUser(user);
                setIsAuthenticated(true);
                return res;
            }
        } catch (error: any) {
            const message = error.response?.data?.error?.message
            setErrors([message]);
            console.log("> Error sign up :", error);
        }
    };

    const signin = async (user: UserLoginDTO) => {
        try {
            const res = await loginRequest(user)
            if (res && res.status === 200) {
                console.log(" > logui request : ", res.data)
                const { user, token } = res.data
                localStorage.setItem("token", token)
                setUser(user)
                setIsAuthenticated(true);
                return res
            }
        } catch (error: any) {
            const message = error.response?.data?.error?.message
            setErrors([message]);
            console.log("> Error sign in :", error);
        }
    }

    const logout = async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('invoice');
        setUser(null);
        setIsAuthenticated(false);
        router.push('/');
    };

    // Verifica si el token está expirado
    const checkToken = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<JwtPayload>(token);
                const isExpired = decoded.exp * 1000 < Date.now();
                if (isExpired) {
                    console.log('Token expirado. Cerrando sesión...');
                    logout();
                } else {
                    setUser({
                        _id: decoded._id,
                        email: decoded.email,
                        role: decoded.role,
                    });
                    setIsAuthenticated(true);
                }
            } catch (err) {
                console.log('Token inválido. Cerrando sesión...');
                logout();
            }
        } else {
            logout();
        }
        setLoading(false);
    };

    useEffect(() => {
        checkToken();
    }, []);


    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            setIsAuthenticated(true)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => {
                setErrors([]);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errors]);

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
            }}
        >
            {children}
        </AuthContext.Provider>
    );

};

export default AuthContext;
