"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { RefreshCw } from 'lucide-react';

export const AuthGuard = ({ children, role }: { children: React.ReactNode, role: 'citizen' | 'authority' }) => {
  const { auth, isConnected, isConnecting } = useWeb3();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isConnecting) return;

    const isEntryPage = pathname === `/${role}`;
    
    if (!isConnected || !auth) {
      if (!isEntryPage) {
        setIsRedirecting(true);
        router.replace(`/${role}`);
      } else {
        setIsRedirecting(false);
      }
    } else if (auth.role !== role) {
      setIsRedirecting(true);
      router.replace(`/${auth.role}/dashboard`);
    } else if (isEntryPage) {
        setIsRedirecting(true);
        router.replace(`/${role}/dashboard`);
    } else {
      setIsRedirecting(false);
    }
  }, [isConnected, auth, isConnecting, role, router, pathname]);

  // Determine if we should show the children or the loader
  const isEntryPage = pathname === `/${role}`;
  const isAuthorized = isConnected && auth && auth.role === role;
  const showContent = isEntryPage && !isConnected && !isConnecting;
  const isLoading = isConnecting || isRedirecting || (!isAuthorized && !isEntryPage);

  if (isLoading && !showContent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
        <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-neutral-text-primary font-semibold">Verifying Secure Session</p>
            <p className="text-neutral-text-secondary text-sm italic">Please wait while we authenticate your wallet...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
