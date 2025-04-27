"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { isAuthenticated } from './lib/auth';

function App() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/chat');
    } else {
      router.push('/login');
    }
  }, [router]);

  return null;
}

export default App;
