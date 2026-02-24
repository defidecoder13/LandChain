"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, TableRow, TableCell, Badge, Button } from '@/components/ui';
import { FileCheck, Search, CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { registerPropertyOnChain } from '@/lib/blockchain';
import Link from 'next/link';

export default function PendingRegistrationsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('state', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setError("Failed to fetch pending registrations");
    } else {
      setRegistrations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleApprove = async (reg: any) => {
    setActionLoading(reg.id);
    setError(null);
    try {
      console.log(`Approving property ${reg.property_id}...`);
      // 1. Register on Blockchain
      const txHash = await registerPropertyOnChain(
        reg.property_id,
        reg.owner_wallet,
        reg.document_hash
      );

      // 2. Update Supabase
      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          state: 'active',
          blockchain_tx_hash: txHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', reg.id);

      if (updateError) throw updateError;

      // 2.5 Audit Log
      await supabase
        .from('audit_logs')
        .insert({
          actor_wallet: "AUTHORITY_OFFICER",
          action: 'Approved Registration (Quick)',
          property_id: reg.id,
          blockchain_tx_hash: txHash
        });

      // 3. Refresh list
      await fetchRegistrations();
    } catch (err: any) {
      console.error("Approval error:", err);
      setError(err.message || `Failed to approve ${reg.property_id}. Ensure you are the contract authority.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary-900 font-serif tracking-tight">Pending Registrations</h1>
            <Button variant="secondary" onClick={fetchRegistrations} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
            </Button>
        </div>
        <p className="text-neutral-text-secondary">Verify and approve new property entries into the National Blockchain Registry.</p>
      </div>

      {error && (
        <div className="bg-status-dispute/10 border border-status-dispute p-4 rounded-[8px] flex gap-3 items-center">
          <AlertCircle className="w-5 h-5 text-status-dispute" />
          <p className="text-sm font-medium text-status-dispute">{error}</p>
        </div>
      )}

      {registrations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-16 h-16 bg-neutral-bg rounded-full flex items-center justify-center">
                <FileCheck className="w-8 h-8 text-neutral-text-secondary" />
            </div>
            <div className="flex flex-col gap-1">
                <h3 className="text-lg">No Pending Registrations</h3>
                <p className="text-sm text-neutral-text-secondary">All submitted properties have been reviewed.</p>
            </div>
        </Card>
      ) : (
        <Table headers={["Property ID", "Owner Wallet", "Submitted Date", "Status", "Action"]}>
            {registrations.map((reg) => (
            <TableRow key={reg.id}>
                <TableCell className="font-semibold uppercase tracking-tight">{reg.property_id}</TableCell>
                <TableCell className="font-mono text-[12px]">{reg.owner_wallet.substring(0, 6)}...{reg.owner_wallet.substring(38)}</TableCell>
                <TableCell>{new Date(reg.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                <Badge variant="pending">Pending Review</Badge>
                </TableCell>
                <TableCell>
                <div className="flex items-center gap-2">
                    <Link href={`/authority/review/${reg.id}`}>
                        <Button variant="secondary" className="py-1.5 px-3 text-xs flex items-center gap-1.5">
                        <Search className="w-3 h-3" />
                        Review
                        </Button>
                    </Link>
                    <button 
                        className={`p-1.5 text-status-active hover:bg-status-active/10 rounded-lg transition-colors ${actionLoading === reg.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Quick Approve"
                        disabled={actionLoading === reg.id}
                        onClick={() => handleApprove(reg)}
                    >
                        {actionLoading === reg.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    </button>
                    <button className="p-1.5 text-status-dispute hover:bg-status-dispute/10 rounded-lg transition-colors" title="Reject">
                    <XCircle className="w-5 h-5" />
                    </button>
                </div>
                </TableCell>
            </TableRow>
            ))}
        </Table>
      )}
    </div>
  );
}
