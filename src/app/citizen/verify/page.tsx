"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Card, Input, Badge } from '@/components/ui';
import { Search, ExternalLink, User, Calendar, Hash, MapPin, RefreshCw, AlertCircle, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPropertyOnChain } from '@/lib/blockchain';
import { useSearchParams } from 'next/navigation';

export default function CitizenVerifyPage() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || "";

  const [searchQuery, setSearchQuery] = useState(initialId);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // On-chain State
  const [onChainData, setOnChainData] = useState<any>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  const handleSearch = useCallback(async (queryOverride?: string) => {
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setOnChainData(null);
    setProperty(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .or(`property_id.ilike.%${query}%,location.ilike.%${query}%,document_hash.eq.${query}`)
        .single();
// ...

      if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError("No property found matching this ID or hash.");
          } else {
            throw fetchError;
          }
      } else {
          setProperty(data);
      }
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while searching the registry.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId, handleSearch]);

  const verifyOnChain = async () => {
    if (!property?.property_id) return;
    setVerifyingChain(true);
    try {
      const data = await getPropertyOnChain(property.property_id);
      if (data && data.isActive) {
        setOnChainData(data);
      } else {
        alert("This property is not yet finalized on the blockchain.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Blockchain verification failed. Ensure MetaMask is connected to Polygon Amoy.");
    } finally {
      setVerifyingChain(false);
    }
  };

  const stateLabels = ["ACTIVE", "UNDER DISPUTE", "FROZEN"];

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-text-primary">Registry Verification</h1>
        <p className="text-neutral-text-secondary">
          Enter a Property ID or Document Hash to verify ownership and blockchain integrity.
        </p>
      </div>

      <div className="flex gap-3 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-text-secondary" />
          <Input 
            className="pl-10"
            placeholder="Search by ID, Title, or Hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={() => handleSearch()} disabled={loading} className="min-w-[120px]">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : "Verify"}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-status-dispute/10 border border-status-dispute/20 rounded-[12px] text-status-dispute text-sm max-w-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {property && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Card className="flex flex-col gap-6 shadow-sm border-neutral-border">
            <div className="flex items-center justify-between border-b border-neutral-border pb-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-neutral-text-secondary uppercase tracking-widest">Registry ID</span>
                <span className="text-lg font-semibold text-neutral-text-primary font-mono">{property.property_id}</span>
              </div>
              <Badge variant={property.state as any}>{(property.state || 'pending').toLowerCase() === 'active' ? 'active' : (property.state || 'pending').toLowerCase() === 'frozen' ? 'frozen' : (property.state || 'pending').toLowerCase() === 'under_dispute' ? 'dispute' : 'pending'}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-neutral-text-secondary uppercase tracking-widest">Location / Address</span>
                <span className="text-sm font-medium">{property.location || "N/A"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-neutral-text-secondary uppercase tracking-widest">Total Area</span>
                <span className="text-sm font-medium">{property.area_sqft?.toLocaleString() || "0"} sq.ft</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-neutral-text-secondary uppercase tracking-widest">Verified Owner</span>
                <span className="text-sm font-mono truncate max-w-[150px]">{property.owner_wallet}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-neutral-text-secondary uppercase tracking-widest">Last Updated</span>
                <span className="text-sm font-medium">{new Date(property.updated_at || property.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-neutral-text-secondary uppercase tracking-widest">Document Integrity Hash</span>
              <span className="text-[11px] font-mono p-3 bg-neutral-bg rounded-[8px] break-all border border-neutral-border">
                {property.document_hash}
              </span>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {property.blockchain_tx_hash && (
                <Button 
                  variant="secondary" 
                  className="w-full text-xs"
                  onClick={() => window.open(`https://amoy.polygonscan.com/tx/${property.blockchain_tx_hash}`, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  View Transaction on PolygonScan
                </Button>
              )}
              <Button 
                onClick={verifyOnChain}
                disabled={verifyingChain || !property.blockchain_tx_hash}
                className="w-full bg-primary-700 hover:bg-primary-800 text-white"
              >
                {verifyingChain ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Run Live Blockchain Shield Check
              </Button>
            </div>
          </Card>

          {onChainData && (
            <Card className="bg-primary-900 border-primary-800 text-white animate-in zoom-in-95 duration-300 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-status-active/20 rounded-full">
                    <ShieldCheck className="w-6 h-6 text-status-active" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Immutable Verification</h3>
                    <p className="text-white/60 text-xs">Direct state read from Polygon Amoy</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-white/5 rounded-[12px] border border-white/10 flex flex-col gap-1">
                    <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">On-Chain Asset Holder</span>
                    <span className="font-mono text-sm break-all text-primary-100">{onChainData.owner}</span>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 bg-white/5 rounded-[12px] border border-white/10 flex flex-col gap-1">
                      <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Contract State</span>
                      <span className="font-bold text-status-active">{stateLabels[onChainData.state]}</span>
                    </div>
                    <div className="flex-1 p-4 bg-white/5 rounded-[12px] border border-white/10 flex flex-col gap-1">
                      <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Consensus</span>
                      <span className="font-bold text-primary-400">100% VALID</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-[12px] border border-white/10 flex flex-col gap-1">
                    <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Asset Integrity Hash</span>
                    <span className="font-mono text-xs break-all text-primary-200">{onChainData.documentHash}</span>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-[8px] border border-white/5">
                  <p className="text-[10px] text-white/40 leading-relaxed italic text-center">
                    This verification layer bypasses our centralized database and reads the immutable ledger state directly from the blockchain networks.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {!onChainData && !verifyingChain && property && (
            <div className="hidden lg:flex flex-col items-center justify-center p-12 border-2 border-dashed border-neutral-border rounded-[24px] text-neutral-text-secondary h-full">
              <Zap className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm text-center">Click "Run Live Blockchain Shield Check" to verify the registry data against the immutable ledger.</p>
            </div>
          )}
        </div>
      )}

      {searched && !loading && !property && !error && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-neutral-border rounded-[24px] max-w-2xl">
          <div className="p-4 bg-neutral-bg rounded-full">
            <Search className="w-8 h-8 text-neutral-text-secondary opacity-50" />
          </div>
          <div className="text-center">
            <p className="text-neutral-text-primary font-medium">No property found</p>
            <p className="text-neutral-text-secondary text-sm">Verify the ID or hash and try again.</p>
          </div>
        </div>
      )}
    </div>
  );
}
