"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type Role = "public" | "citizen" | "authority";

interface AuthSession {
  address: string;
  role: Role;
  signature: string;
}

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  auth: AuthSession | null;
  error: string | null;
  connectWallet: () => Promise<string | null>;
  login: (role: Role) => Promise<boolean>;
  logout: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInitialAuth = useCallback(() => {
    const savedAuth = sessionStorage.getItem('landchain_auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setAuth(parsed);
        setAddress(parsed.address);
      } catch (e) {
        sessionStorage.removeItem('landchain_auth');
      }
    }
  }, []);

  useEffect(() => {
    checkInitialAuth();
  }, [checkInitialAuth]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0 || (auth && accounts[0].toLowerCase() !== auth.address.toLowerCase())) {
          logout();
        } else if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [auth]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError("MetaMask is not installed.");
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      setAddress(accounts[0]);
      return accounts[0] as string;
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet.");
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const login = async (requestedRole: Role): Promise<boolean> => {
    setError(null);
    setIsConnecting(true);
    
    try {
      // 1. Ensure wallet is connected
      let currentAddress = address;
      if (!currentAddress) {
        currentAddress = await connectWallet();
      }
      if (!currentAddress) return false;

      // 2. Check Role Separation in Supabase
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('wallet_address', currentAddress.toLowerCase())
        .single();

      if (user && user.role !== requestedRole) {
        throw new Error(`This wallet is registered as a ${user.role}. You cannot login as ${requestedRole}.`);
      }

      // 3. Request Signature
      const message = `LandChain Authentication\n\nRole: ${requestedRole.toUpperCase()}\nWallet: ${currentAddress}\nTimestamp: ${new Date().toISOString()}`;
      
      const signature = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [message, currentAddress],
      });

      if (!signature) throw new Error("Signature rejected.");

      // 4. Save Session
      const session: AuthSession = {
        address: currentAddress,
        role: requestedRole,
        signature: signature
      };

      // Ensure user exists in Supabase with correct role if it's the first login
      if (!user) {
        await supabase.from('users').insert({
          wallet_address: currentAddress.toLowerCase(),
          role: requestedRole
        });
      }

      sessionStorage.setItem('landchain_auth', JSON.stringify(session));
      setAuth(session);
      return true;
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed");
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = () => {
    setAddress(null);
    setAuth(null);
    sessionStorage.removeItem('landchain_auth');
    // Force a reload or redirect to break any immediate auto-relogin
    window.location.href = '/';
  };

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected: !!auth, // isConnected now means authenticated
        isConnecting,
        auth,
        error,
        connectWallet,
        login,
        logout,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
