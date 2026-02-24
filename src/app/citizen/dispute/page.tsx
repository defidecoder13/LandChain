"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { Search, AlertTriangle, Loader2, Info, Building2, ExternalLink } from 'lucide-react';
import { raiseDisputeOnChain, getPropertyOnChain } from '@/lib/blockchain';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';

export default function RaiseDisputePage() {
  const router = useRouter();
  const { address } = useWeb3();
  
  // State
  const [searchId, setSearchId] = useState("");
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search for Property
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProperty(null);

    try {
      // 1. Fetch from Supabase
      const { data: dbData, error: dbError } = await supabase
        .from('properties')
        .select('*')
        .eq('property_id', searchId)
        .single();

      if (dbError) throw new Error("Property not found in registry.");

      // 2. Fetch from Blockchain to verify state
      const chainProp = await getPropertyOnChain(searchId);
      
      if (!chainProp) {
        throw new Error(`Property ${searchId} exists in local DB but NOT on Blockchain. Cannot dispute invalid record.`);
      }

      let currentState = dbData.state;

      // Sync Check: If Chain says Disputed(1) but DB says Active
      if (Number(chainProp.state) === 1 && dbData.state !== 'under_dispute') {
          console.warn("State mismatch detected! Syncing DB to 'under_dispute'.");
          currentState = 'under_dispute';
          
          // Auto-fix DB
          await supabase
            .from('properties')
            .update({ state: 'under_dispute' })
            .eq('id', dbData.id);
      }

      if (currentState === 'under_dispute') {
          throw new Error(`Property ${searchId} is already under dispute on the blockchain.`);
      }

      setProperty({ ...dbData, state: currentState });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Dispute
  const handleSubmitDispute = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for the dispute.");
      return;
    }
    if (!address) {
       setError("Wallet not connected.");
       return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create Dispute Record (Pending)
      const { data: disputeData, error: disputeError } = await supabase
        .from('disputes')
        .insert({
          property_id: property.id,
          raised_by: address,
          reason: reason,
          status: 'pending_chain' // New temporary status
        })
        .select()
        .single();

      if (disputeError) throw disputeError;

      // 2. Blockchain Transaction
      console.log(`🚀 Raising on-chain dispute for ${property.property_id}...`);
      let txHash;
      try {
        txHash = await raiseDisputeOnChain(property.property_id, reason);
      } catch (chainErr: any) {
        // If chain fails, delete the pending dispute record to avoid ghosts
        await supabase.from('disputes').delete().eq('id', disputeData.id);
        throw chainErr;
      }
      
      // 3. Update Dispute Record to Open
      const { error: updateError } = await supabase
        .from('disputes')
        .update({
          status: 'open',
          blockchain_tx_hash: txHash
        })
        .eq('id', disputeData.id);

      if (updateError) console.error("Failed to update dispute status:", updateError);

      // 4. Update Property State
      const { error: dbError } = await supabase
        .from('properties')
        .update({ 
          state: 'under_dispute',
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id);

      if (dbError) console.error("DB Update Failed:", dbError);

      // 5. Audit Log
      await supabase
        .from('audit_logs')
        .insert({
          actor_wallet: address,
          action: 'Raised Property Dispute',
          property_id: property.id,
          blockchain_tx_hash: txHash
        });

      alert(`Dispute raised successfully! Transaction Hash: ${txHash}`);
      router.push('/citizen/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to raise dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-serif text-primary-900">Raise Property Dispute</h1>
        <p className="text-neutral-text-secondary">
          Initiate a legal challenge against a registered property record.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN - SEARCH */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4" /> Find Property
            </h3>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-primary-700 mb-1 block">Property ID</label>
                <Input 
                  placeholder="e.g. PROP-2024-001" 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={loading || !searchId} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search Records"}
              </Button>
            </form>
          </Card>

          {/* Guidelines */}
          <Card className="p-6 bg-neutral-bg-alt border-none">
            <h4 className="font-bold text-sm text-primary-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" /> Guidelines
            </h4>
            <ul className="text-xs text-neutral-text-secondary space-y-2 list-disc pl-4">
              <li>Disputes are recorded permanently on the blockchain.</li>
              <li>Frivolous disputes may lead to account penalties.</li>
              <li>Ensure you have legal standing before proceeding.</li>
            </ul>
          </Card>
        </div>

        {/* RIGHT COLUMN - RESULTS & ACTION */}
        <div className="md:col-span-2">
          {error && (
            <div className="bg-status-dispute/10 border border-status-dispute/20 text-status-dispute p-4 rounded-md mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {!property && !loading && !error && (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-text-disabled border-2 border-dashed border-border-light rounded-lg">
              <Building2 className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">Search for a property to begin</p>
            </div>
          )}

          {property && (
            <Card className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-6 border-b border-border-light pb-6">
                <div>
                  <div className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-1">Target Property</div>
                  <h2 className="text-2xl font-bold font-serif text-primary-900">{property.property_id}</h2>
                </div>
                <div className="px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded">
                  {property.state.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="text-xs text-neutral-text-secondary block mb-1">Current Owner</label>
                  <div className="font-mono text-sm truncate bg-neutral-bg-alt p-2 rounded border border-border-light">
                    {property.owner_wallet}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-text-secondary block mb-1">Registered Location</label>
                  <div className="text-sm font-medium p-2">
                    {property.location || "N/A"}
                  </div>
                </div>
              </div>

              {property.document_url && (
                 <div className="mb-8">
                    <label className="text-xs text-neutral-text-secondary block mb-1">Evidence Document</label>
                    <a 
                      href={property.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary-900 font-bold underline flex items-center gap-1 hover:text-black"
                    >
                      View Original Deed <ExternalLink className="w-3 h-3" />
                    </a>
                 </div>
              )}

              <div className="space-y-4">
                <label className="text-sm font-bold text-primary-900 block">
                  Citing Reason for Dispute
                </label>
                <textarea 
                  className="w-full h-32 p-3 text-sm border border-border-input rounded-md focus:ring-1 focus:ring-primary-900 focus:border-primary-900 outline-none resize-none"
                  placeholder="Describe the legal or factual basis for this dispute..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                
                <div className="pt-4 border-t border-border-light flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setProperty(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitDispute} 
                    disabled={submitting}
                    className="bg-status-dispute hover:bg-red-700 text-white border-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing On-Chain...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 mr-2" /> Confirm Dispute
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
