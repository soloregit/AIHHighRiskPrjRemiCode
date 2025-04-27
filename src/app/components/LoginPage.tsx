'use client';

import React, { useState } from 'react';
import { LogIn } from 'react-feather';
import { Button } from './Button';
import apiService from '../lib/apiServices';
import { auth } from '../config/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';

interface LoginPageProps {
    onLogin: (oai_key: string, user: any, api_token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [showApiKeyInput] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                signInWithEmailAndPassword(auth, email, password);
            }
            // setShowApiKeyInput(true); // Show API key input after successful Firebase auth
            processApiKey();
        } catch (error: any) {
            setError(error.message);
        }
    };

    const processApiKey = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setError('Please login first');
                return;
            }

            // Verify API key
            const data = await apiService.getRemiOAKey('###');
            if (data) {
                onLogin(data.api_key, user, user.uid);
            } else {
                setError('Invalid API key');
            }
        } catch (error: any) {
            setError(error.message);
        }
    }

    const handleApiKeySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const user = auth.currentUser;
            if (!user) {
                setError('Please login first');
                return;
            }

            // Verify API key
            const data = await apiService.getRemiOAKey(apiKey);
            if (data) {
                onLogin(data.api_key, user, user.uid);
            } else {
                setError('Invalid API key');
            }
        } catch (error: any) {
            setError(error.message);
        }
    };

    if (showApiKeyInput) {
        return (
            <div className="flex flex-col overflow-hidden h-screen items-center justify-center">
                <form className="px-8 pt-6 pb-8 mb-4" onSubmit={handleApiKeySubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Enter your Remi Access Key
                        </label>
                        <input
                            className="appearance-none block w-full bg-gray-200 text-gray-700 border rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="mb-4 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        label="Submit API Key"
                        iconPosition={'end'}
                        icon={LogIn}
                        buttonStyle={'regular'}
                        type="submit"
                    />
                </form>
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-hidden h-screen items-center justify-center">
            <div className="inset-0 flex justify-center items-center p-4 bg-white/30 backdrop-blur-md">
                <form className="px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                        </label>
                        <input
                            className="appearance-none block w-full bg-gray-200 text-gray-700 border rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            className="appearance-none block w-full bg-gray-200 text-gray-700 border rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="mb-4 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <Button
                            label={isSignUp ? 'Sign Up' : 'Login to Remi'}
                            iconPosition={'end'}
                            icon={LogIn}
                            buttonStyle={'regular'}
                            type="submit"
                        />

                        {/* <Button
                            label="Sign in with Google"
                            buttonStyle={'regular'}
                            onClick={handleGoogleSignIn}
                            type="button"
                        /> */}

                        <button
                            type="button"
                            className="text-sm text-gray-600 hover:text-gray-800"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up with Remi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;