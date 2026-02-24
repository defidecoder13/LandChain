"use client";

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Badge, Table, TableRow, TableCell } from '@/components/ui';
import { Search, MapPin, Calendar, Hash, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { getPropertyOnChain } from '@/lib/blockchain';

export default function VerifyPage() {
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

  const handleSearch = async (queryOverride?: string) => {
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
        .or(`property_id.ilike.%${query}%,title.ilike.%${query}%,document_hash.eq.${query}`)
        .single();

      if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError("No public record found matching this ID or hash.");
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
  };

  const verifyOnChain = async () => {
    if (!property?.property_id) return;
    setVerifyingChain(true);
    try {
      const data = await getPropertyOnChain(property.property_id);
      if (data) {
        setOnChainData(data);
      } else {
        alert("This property is not finalized on the blockchain.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Blockchain verification failed. Ensure you are connected to the correct network.");
    } finally {
      setVerifyingChain(false);
    }
  };

  useEffect(() => {
    if (initialId) handleSearch(initialId);
  }, [initialId]);

  return (
    <div className="flex flex-col gap-12 max-w-4xl mx-auto py-12 px-6">
      {/* ... (Header and Search Box remain same) ... */}
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold text-primary-900 font-serif tracking-tight">Public Record Verification</h1>
        <p className="text-primary-700 max-w-2xl">
          Search the national registry to verify property ownership, legal status, and blockchain immutability.
        </p>
      </div>

      <div className="flex gap-4 max-w-2xl mx-auto w-full">
        <Input 
            placeholder="Enter Property ID (e.g., PROP-1234-567) or Document Hash"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-12 text-lg"
        />
        <Button onClick={() => handleSearch()} disabled={loading} className="h-12 px-8">
            {loading ? 'Searching...' : 'Verify'}
        </Button>
      </div>

      {searched && !loading && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
           {error ? (
             <div className="p-6 border border-error/20 bg-error/5 rounded-[6px] flex items-center gap-4 text-error justify-center">
                <AlertCircle className="w-6 h-6" />
                <span className="font-medium">{error}</span>
             </div>
           ) : property && (
             <div className="flex flex-col gap-8">
                {/* Result Card */}
                <Card className="p-0 overflow-hidden border-border-light">
                   <div className="bg-primary-100 px-6 py-4 border-b border-border-light flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <h2 className="text-lg font-bold text-primary-900 font-mono">{property.property_id}</h2>
                         <Badge variant={property.state === 'active' ? 'active' : 'pending'}>
                            {property.state.toUpperCase()}
                         </Badge>
                      </div>
                      <div className="text-xs font-mono text-primary-600">
                        Registered: {new Date(property.created_at).toLocaleDateString()}
                      </div>
                   </div>
                   
                   <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col gap-6">
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Property Title</span>
                            <span className="text-lg font-medium text-primary-900">{property.title}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Location</span>
                            <div className="flex items-center gap-2 text-primary-900">
                               <MapPin className="w-4 h-4 text-primary-500" />
                               <span>{property.location_address}</span>
                            </div>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Current Owner</span>
                            <span className="font-mono text-sm bg-primary-100 px-2 py-1 rounded w-fit text-primary-800">
                               {property.owner_wallet}
                            </span>
                         </div>
                      </div>

                      <div className="flex flex-col gap-6">
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Land Area</span>
                            <span className="text-lg font-medium text-primary-900">{property.area_sqft} sq.ft.</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Usage Type</span>
                            <span className="text-primary-900 capitalize">{property.land_type}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Document Hash</span>
                            <div className="flex items-center gap-2">
                               <Hash className="w-4 h-4 text-primary-500" />
                               <span className="font-mono text-xs text-primary-600 break-all">{property.document_hash}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </Card>

                {/* Blockchain Verification */}
                <div className="flex flex-col gap-4">
                   <h3 className="text-lg font-bold text-primary-900 border-b border-border-light pb-2">Blockchain Integrity</h3>
                   {onChainData ? (
                      <div className="p-6 border border-success/30 bg-success/5 rounded-[6px] flex flex-col gap-4">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-success text-white rounded-full">
                               <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                               <h4 className="text-lg font-bold text-primary-900">Verified On-Chain</h4>
                               <p className="text-primary-700 text-sm">This record exactly matches the immutable ledger on Polygon.</p>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="p-3 bg-white border border-border-light rounded text-sm">
                               <p className="text-xs text-primary-600 uppercase">Owner Match</p>
                               <p className="font-mono font-medium text-primary-900 break-all">
                                  {onChainData.owner === property.owner_wallet ? '✅ Confirmed' : '❌ Mismatch'}
                               </p>
                            </div>
                            <div className="p-3 bg-white border border-border-light rounded text-sm">
                               <p className="text-xs text-primary-600 uppercase">Status Match</p>
                               <p className="font-mono font-medium text-primary-900">
                                  {onChainData.state === 0 ? '✅ Active' : onChainData.state === 1 ? '⚠️ Disputed' : '❄️ Frozen'}
                               </p>
                            </div>
                         </div>
                      </div>
                   ) : (
                      <div className="flex items-center justify-between p-6 border border-border-light rounded-[6px] bg-primary-100/30">
                         <div className="flex items-center gap-4">
                            <ShieldCheck className="w-8 h-8 text-primary-400" />
                            <div>
                               <p className="font-bold text-primary-900">Verify Ledger Integrity</p>
                               <p className="text-sm text-primary-600">Cross-check this record against the Polygon blockchain.</p>
                            </div>
                         </div>
                         <Button onClick={verifyOnChain} disabled={verifyingChain} variant="secondary">
                            {verifyingChain ? 'Verifying...' : 'Check Blockchain'}
                         </Button>
                      </div>
                   )}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
