"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, TableRow, TableCell, Badge, Button } from '@/components/ui';
import { FileCheck, Search, CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PendingTransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select('*, properties(property_id)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransfers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <h1>Pending Ownership Transfers</h1>
            <Button variant="secondary" onClick={fetchTransfers} disabled={loading} className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>
        <p className="text-neutral-text-secondary">Review and authorize ownership transfers between citizen wallets.</p>
      </div>

      {loading ? (
          <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          </div>
      ) : transfers.length === 0 ? (
          <Card className="py-20 text-center text-neutral-text-secondary bg-neutral-bg/20 border-dashed">
              No pending ownership transfers currently require review.
          </Card>
      ) : (
          <Table headers={["Property ID", "From (Current)", "To (Proposed)", "Date", "Action"]}>
            {transfers.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-semibold uppercase tracking-tight">{(tx.properties as any)?.property_id}</TableCell>
                <TableCell className="font-mono text-[12px]">{tx.from_wallet.substring(0, 6)}...{tx.from_wallet.substring(38)}</TableCell>
                <TableCell className="font-mono text-[12px] text-primary-600 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-neutral-text-secondary" />
                    {tx.to_wallet.substring(0, 6)}...{tx.to_wallet.substring(38)}
                </TableCell>
                <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/authority/review/${tx.property_id}`}>
                        <Button variant="secondary" className="py-1.5 px-3 text-xs flex items-center gap-1.5">
                        <Search className="w-3 H-3" />
                        Review
                        </Button>
                    </Link>
                    <button className="p-1.5 text-status-active hover:bg-status-active/10 rounded-lg transition-colors" title="Quick Approve">
                      <CheckCircle2 className="w-5 h-5" />
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
