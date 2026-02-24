"use client";

import React, { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';

export default function AuthorityEntryPage() {
  const router = useRouter();
  const { login, isConnecting, error: walletError } = useWeb3();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFixedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    // Simulate API delay
    setTimeout(() => {
      if (username === 'admin' && password === 'admin@nexus') {
        setIsAuthenticated(true);
      } else {
        setAuthError("Invalid Authority Credentials");
      }
      setLoading(false);
    }, 1000);
  };

  const handleWalletLogin = async () => {
    const success = await login('authority');
    if (success) {
      router.push('/authority/dashboard');
    }
  };

  // ------------------------------------------------------------------
  // VIEW 1: FIXED AUTHENTICATION FORM
  // ------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-[420px] w-full p-8 flex flex-col gap-6 border-status-dispute/20">
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-status-dispute/10 text-status-dispute rounded-full flex items-center justify-center mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-primary-900">Authority Access</h1>
            <p className="text-primary-600 text-sm">
              Restricted Area. Authorized Personnel Only.
            </p>
          </div>

          <form onSubmit={handleFixedLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-primary-700">Officer ID</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-primary-400" />
                <Input 
                  type="text" 
                  placeholder="Officer ID" 
                  className="pl-9"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-primary-700">Secure Password</label>
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
              <p className="text-xs text-status-dispute bg-status-dispute/5 p-2 rounded border border-status-dispute/20 font-bold flex items-center gap-2 justify-center">
                <ShieldAlert className="w-4 h-4" /> {authError}
              </p>
            )}

            <Button type="submit" disabled={loading} className="mt-2 text-sm h-11 bg-primary-900 hover:bg-black">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Credentials"}
            </Button>
          </form>

          <div className="text-center text-[11px] text-neutral-text-secondary uppercase tracking-widest opacity-60">
            Official Use Only • Monitored
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
        <div className="w-16 h-16 bg-status-dispute/10 text-status-dispute rounded-full flex items-center justify-center mb-2">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-primary-900 font-serif tracking-tight">Government Authority Access</h1>
          <p className="text-neutral-text-secondary text-[16px]">
            Restricted access for authorized registrar wallets only.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleWalletLogin}
            disabled={isConnecting}
            className="w-full py-4 text-[16px] font-semibold bg-primary-900 hover:bg-black flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                 <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
              </>
            ) : (
              <>
                Connect Authority Wallet <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {walletError && (
            <p className="text-status-dispute text-[12px] font-medium">
              {walletError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-caption text-neutral-text-secondary font-medium uppercase tracking-[0.05em]">
            Immutable Ledger Access
          </p>
          <p className="text-[12px] text-neutral-text-secondary opacity-70 italic">
            Session ID: {Math.random().toString(36).substring(7).toUpperCase()}
          </p>
        </div>
      </Card>
    </div>
  );
}
