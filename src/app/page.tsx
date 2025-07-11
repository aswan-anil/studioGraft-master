'use client';

import { useState, useEffect } from 'react';
import LoadingScreen from '@/components/loading-screen';
import Dashboard from '@/components/dashboard';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Simulate initialization time

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Dashboard />;
}
