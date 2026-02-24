"use client";

import React, { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { supabase } from '@/lib/supabase';

export default function CitizenEntryPage() {
  const router = useRouter();
  const { login, isConnecting, error: walletError } = useWeb3();
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (isLoginView) {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        // SIGNUP
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        // Auto login after signup for better UX
        setIsLoginView(true);
        alert("Account created! Please login.");
        setLoading(false);
        return; 
      }
      
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    const success = await login('citizen');
    if (success) {
      router.push('/citizen/dashboard');
    }
  };

  // ------------------------------------------------------------------
  // VIEW 1: AUTHENTICATION FORM (Login / Signup)
  // ------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-[420px] w-full p-8 flex flex-col gap-6">
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-primary-100 text-primary-900 rounded-full flex items-center justify-center mb-2">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-primary-900">Citizen Portal</h1>
            <p className="text-primary-600 text-sm">
              {isLoginView ? "Sign in to access your property records" : "Create an account to get started"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-primary-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-primary-400" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-9"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-primary-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-primary-400" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-9"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {authError && (
              <p className="text-xs text-status-dispute bg-status-dispute/5 p-2 rounded border border-status-dispute/20">
                {authError}
              </p>
            )}

            <Button type="submit" disabled={loading} className="mt-2 text-sm h-11">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLoginView ? "Sign In" : "Create Account")}
            </Button>
          </form>

          <div className="text-center text-xs text-primary-600">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setIsLoginView(!isLoginView);
                setAuthError(null);
              }}
              className="text-primary-900 font-bold hover:underline"
            >
              {isLoginView ? "Sign up" : "Log in"}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 2: WALLET CONNECTION (Revealed after Auth)
  // ------------------------------------------------------------------
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-[480px] w-full text-center p-12 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-2">
          <User className="w-8 h-8" />
        </div>
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-primary-900 font-serif tracking-tight">Identity Verified</h1>
          <p className="text-neutral-text-secondary text-[16px]">
            Please connect your wallet to access blockchain records.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleWalletLogin}
            disabled={isConnecting}
            className="w-full py-4 text-[16px] font-semibold flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
              </>
            ) : (
              <>
                Connect Web3 Wallet <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {walletError && (
            <p className="text-status-dispute text-[12px] font-medium">
              {walletError}
            </p>
          )}
        </div>

        <p className="text-caption text-neutral-text-secondary">
          Welcome back, <span className="text-primary-900 font-medium">{email}</span>
        </p>
      </Card>
    </div>
  );
}
