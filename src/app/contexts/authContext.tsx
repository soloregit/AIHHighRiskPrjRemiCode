'use client';
import { createContext, useContext, useState, ReactNode, JSX } from 'react';
import { auth } from '../config/firebase';

interface AuthContextType {
    isLoading: boolean;
    setCredentials: (oai_key: string, img_base_url: string, api_token: string) => void;
    handleLogout: () => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType>({
    isLoading: true,
    setCredentials: () => { },
    handleLogout: () => { },
});

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
    const [isLoading] = useState<boolean>(true);

    const setCredentials = (oai_key: string, img_base_url: string, api_token: string) => {
        // Save credentials to localStorage
        console.log('Setting credentials:', { oai_key, img_base_url, api_token });
        localStorage.setItem('acnt::isAuthenticated', 'true');
        localStorage.setItem('acnt::oai_key', oai_key);
        localStorage.setItem('acnt::imgBaseUrl', img_base_url);
        localStorage.setItem('acnt::api_token', api_token);
    };

    const handleLogout = () => {
        // Clear credentials from localStorage
        localStorage.removeItem('acnt::oai_key');
        localStorage.removeItem('acnt::imgBaseUrl');
        localStorage.removeItem('acnt::api_token');
        // Sign out from Firebase
        auth.signOut();
    };

    return (
        <AuthContext.Provider
            value={{
                isLoading,
                setCredentials,
                handleLogout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = (): AuthContextType => useContext(AuthContext);