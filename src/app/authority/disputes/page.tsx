"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, TableRow, TableCell, Badge, Button } from '@/components/ui';
import { AlertTriangle, ShieldAlert, Gavel, Snowflake, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { resolveDisputeOnChain, freezePropertyOnChain } from '@/lib/blockchain';

export default function DisputeCasesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*, properties(property_id, location)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (dispute: any) => {
    setActionLoading(`${dispute.id}-resolve`);
    try {
      const resolution = "Dispute resolved by authority officer.";
      
      // 1. Blockchain Resolution
      console.log(`🚀 Resolving on-chain dispute for ${dispute.properties.property_id}...`);
      const txHash = await resolveDisputeOnChain(dispute.properties.property_id, resolution);

      // 2. Update Dispute Table
      const { error: disputeError } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolution_note: resolution,
          resolved_at: new Date().toISOString(),
          blockchain_tx_hash: txHash
        })
        .eq('id', dispute.id);

      if (disputeError) throw disputeError;

      // 3. Update Property State
      await supabase
        .from('properties')
        .update({ state: 'active', updated_at: new Date().toISOString() })
        .eq('id', dispute.property_id);

      // 4. Audit Log
      await supabase
        .from('audit_logs')
        .insert({
          actor_wallet: "AUTHORITY_OFFICER", // In a real app, this would be the logged in officer's wallet
          action: 'Resolved Property Dispute',
          property_id: dispute.property_id,
          related_dispute_id: dispute.id,
          blockchain_tx_hash: txHash
        });

      alert("Dispute resolved successfully!");
      fetchDisputes();
    } catch (err: any) {
      console.error(err);
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary-900 font-serif tracking-tight">Dispute Cases</h1>
            <Button variant="secondary" onClick={fetchDisputes} disabled={loading} className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>
        <p className="text-neutral-text-secondary">Adjudicate legal disputes and manage registry freezes for investigation.</p>
      </div>

      {loading ? (
          <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          </div>
      ) : disputes.length === 0 ? (
          <Card className="py-20 text-center text-neutral-text-secondary bg-neutral-bg/20 border-dashed">
              No active dispute cases in the queue.
          </Card>
      ) : (
          <Table headers={["Property ID", "Raised By", "Reason / Evidence", "Status", "Action"]}>
            {disputes.map((dispute) => (
              <TableRow key={dispute.id}>
                <TableCell className="font-semibold uppercase tracking-tight">{(dispute.properties as any)?.property_id}</TableCell>
                <TableCell className="font-mono text-[12px]">{dispute.raised_by.substring(0, 6)}...{dispute.raised_by.substring(38)}</TableCell>
                <TableCell className="max-w-[300px] truncate">{dispute.reason}</TableCell>
                <TableCell>
                  <Badge variant="dispute">{dispute.status.toUpperCase()}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                        onClick={() => handleResolve(dispute)}
                        disabled={!!actionLoading}
                        variant="secondary" 
                        className="py-1.5 px-3 text-xs flex items-center gap-1.5 bg-primary-100/50 text-primary-700 border-primary-100 hover:bg-primary-100"
                    >
                      {actionLoading === `${dispute.id}-resolve` ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Gavel className="w-3 h-3" />}
                      Resolve
                    </Button>
                    <button className="p-1.5 text-status-dispute hover:bg-status-dispute/10 rounded-lg transition-colors" title="Reject Dispute">
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
