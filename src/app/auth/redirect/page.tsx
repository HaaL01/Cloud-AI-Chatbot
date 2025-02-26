'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Increased timeout to ensure cookie is set
    setTimeout(() => {
      // Use window.location.href for a full page reload
      window.location.href = '/';
    }, 2000); // Increased to 2 seconds
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">Setting up your session...</div>
        <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
} 