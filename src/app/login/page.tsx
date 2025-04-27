'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '../components/LoginPage';
import { isAuthenticated, setCredentials } from '../lib/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';

export default function LoginRoute() {
    const router = useRouter();
    const [user] = useAuthState(auth);

    useEffect(() => {
        // Redirect to /chat if already authenticated
        if (isAuthenticated() && user) {
            router.push('/chat');
        }
    }, [router]);

    const handleLogin = (oai_key: string, user: any, api_token: string) => {
        setCredentials(oai_key, api_token, user);

        // Redirect to chat page
        router.push('/chat');
    };

    return <LoginPage onLogin={handleLogin} />;
}
