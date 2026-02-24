"use client";

import React, { useEffect, useState } from 'react';
import { Card, Input, Button, Badge } from '@/components/ui';
import { GitCompare, ArrowRight, ShieldAlert, FileText, Upload, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { supabase } from '@/lib/supabase';
import { transferOwnershipOnChain } from '@/lib/blockchain';
import { isAddress } from 'ethers';
import Link from 'next/link';

export default function TransferOwnershipPage() {
  const { address } = useWeb3();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const selectedProperty = properties.find(p => p.property_id === selectedId);
  const isDisputed = selectedProperty?.state === 'under_dispute';

  const fetchMyProperties = async () => {
    if (!address) return;
    setFetching(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_wallet', address)
      .in('state', ['active', 'under_dispute', 'frozen']);

    if (error) {
      console.error(error);
      setError("Failed to fetch your properties");
    } else {
      setProperties(data || []);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchMyProperties();
  }, [address]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !selectedProperty) return;
    if (!isAddress(recipient)) {
      setError("Invalid recipient wallet address");
      return;
    }
    if (recipient.toLowerCase() === address.toLowerCase()) {
      setError("Cannot transfer to yourself");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Execute Blockchain Transfer
      console.log(`🚀 Transferring ${selectedId} to ${recipient}...`);
      const blockchainTx = await transferOwnershipOnChain(selectedId, recipient, "Manual Transfer");
      setTxHash(blockchainTx);

      // 2. Update Supabase Property Record
      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          owner_wallet: recipient,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProperty.id);

      if (updateError) throw updateError;

      // 3. Log Transfer
      const { data: transferData, error: transferError } = await supabase
        .from('transfers')
        .insert({
          property_id: selectedProperty.id,
          from_wallet: address,
          to_wallet: recipient,
          blockchain_tx_hash: blockchainTx,
          status: 'approved' // Immediate since owner initiated
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // 4. Audit Log
      await supabase
        .from('audit_logs')
        .insert({
          actor_wallet: address,
          action: 'Transferred Ownership',
          property_id: selectedProperty.id,
          related_transfer_id: transferData.id,
          blockchain_tx_hash: blockchainTx
        });

      setSuccess(true);
    } catch (err: any) {
      console.error("Transfer error:", err);
      setError(err.message || "Failed to execute transfer. Ensure you have enough gas and are the owner.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 max-w-[600px] mx-auto text-center">
        <div className="w-20 h-20 bg-status-active/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-status-active" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl">Transfer Successful!</h1>
          <p className="text-neutral-text-secondary">
            Ownership of <strong>{selectedId}</strong> has been successfully transferred on the blockchain.
          </p>
        </div>
        <Card className="w-full bg-neutral-bg/50 border-dashed">
          <div className="flex flex-col gap-3 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-neutral-text-secondary font-medium uppercase tracking-tight text-[11px]">Recipient</span>
              <span className="font-mono text-[12px] truncate max-w-[200px]">{recipient}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-text-secondary font-medium uppercase tracking-tight text-[11px]">Transaction Hash</span>
              <a 
                href={`https://amoy.polygonscan.com/tx/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 font-mono text-[12px] truncate max-w-[200px] hover:underline"
              >
                {txHash}
              </a>
            </div>
          </div>
        </Card>
        <Link href="/citizen/dashboard" className="w-full">
          <Button variant="secondary" className="w-full">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-[900px]">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-primary-900 font-serif tracking-tight">Transfer Ownership</h1>
        <p className="text-neutral-text-secondary">Initiate a legal transfer of property ownership to another citizen wallet.</p>
      </div>

      {error && (
        <div className="bg-status-dispute/10 border border-status-dispute p-4 rounded-[8px] flex gap-3 items-center">
          <AlertCircle className="w-5 h-5 text-status-dispute" />
          <p className="text-sm font-medium text-status-dispute">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">Select Registered Property</label>
            <select 
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="gov-input bg-white"
                disabled={fetching}
            >
                <option value="">{fetching ? "Loading properties..." : "Select a property..."}</option>
                {properties.map(p => (
                  <option key={p.id} value={p.property_id}>
                    {p.property_id} - {p.title} ({p.state.toUpperCase()})
                  </option>
                ))}
            </select>
        </div>

        {selectedId && selectedProperty && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <Card className="bg-neutral-bg/30 border-dashed">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[18px] font-semibold uppercase tracking-tight">{selectedProperty.property_id}</span>
                            <span className="text-[14px] text-neutral-text-secondary">{selectedProperty.title} • {selectedProperty.area_sqft} sq.ft</span>
                        </div>
                        <Badge variant={selectedProperty.state === 'active' ? 'active' : 'dispute'}>
                            {selectedProperty.state.toUpperCase()}
                        </Badge>
                    </div>
                </Card>

                {selectedProperty.state === 'under_dispute' || selectedProperty.state === 'frozen' ? (
                    <div className="bg-status-dispute/10 border border-status-dispute p-6 rounded-[12px] flex gap-4 items-start">
                        <ShieldAlert className="w-6 h-6 text-status-dispute shrink-0" />
                        <div className="flex flex-col gap-2">
                            <span className="text-[16px] font-bold text-status-dispute uppercase tracking-tight">Transfer Restricted</span>
                            <p className="text-[14px] text-neutral-text-primary leading-relaxed">
                                This property is currently <strong>{selectedProperty.state.replace('_', ' ')}</strong>. Any ownership transfer operations are frozen until the status is resolved by the Registry Authority.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleTransfer} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="flex flex-col gap-6">
                            <h3 className="border-b border-neutral-border pb-2">Transfer Details</h3>
                            <Input 
                              label="Recipient Wallet Address" 
                              placeholder="0x..." 
                              required
                              value={recipient}
                              onChange={(e) => setRecipient(e.target.value)}
                            />
                            <Input label="Sale Consideration (Optional)" placeholder="0.00" type="number" />
                            <div className="flex flex-col gap-4">
                                <label className="text-[14px] font-medium">Agreement Documents (Optional)</label>
                                <div className="border border-neutral-border rounded-[8px] p-4 flex items-center gap-3 bg-white">
                                    <FileText className="w-5 h-5 text-neutral-text-secondary" />
                                    <span className="text-sm text-neutral-text-secondary flex-1">Upload PDF Document</span>
                                    <Button type="button" variant="secondary" className="py-1 px-3 text-xs">Browse</Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                             <h3 className="border-b border-neutral-border pb-2">Network Verification</h3>
                             <Card className="bg-primary-100/10 border-primary-100/30">
                                <ul className="flex flex-col gap-4">
                                    <li className="flex gap-2 text-[13px] items-center">
                                        <CheckCircle2 className="w-4 h-4 text-status-active" />
                                        <span>Wallet connection established</span>
                                    </li>
                                    <li className="flex gap-2 text-[13px] items-center">
                                        <CheckCircle2 className="w-4 h-4 text-status-active" />
                                        <span>Property ownership verified</span>
                                    </li>
                                    <li className="flex gap-2 text-[13px] items-center text-neutral-text-secondary">
                                        <div className="w-4 h-4 rounded-full border border-neutral-border" />
                                        <span>On-chain transaction confirmation</span>
                                    </li>
                                </ul>
                             </Card>
                             <Button 
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 py-4 h-auto text-lg"
                                disabled={loading}
                             >
                                {loading ? (
                                  <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                  <>
                                    Proceed with Transfer
                                    <ArrowRight className="w-5 h-5" />
                                  </>
                                )}
                             </Button>
                        </div>
                    </form>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
