"use client";

import React, { useEffect, useState } from 'react';
import { Table, TableRow, TableCell, Badge, Button } from '@/components/ui';
import { ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, properties(property_id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-3xl font-bold text-primary-900 font-serif tracking-tight">
                Audit Logs
                <ShieldCheck className="w-6 h-6 text-status-active" />
            </h1>
            <Button variant="secondary" onClick={fetchLogs} disabled={loading} className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>
        <p className="text-neutral-text-secondary">Immutable historical record of all registry operations performed by authority officers.</p>
      </div>

      {loading ? (
          <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          </div>
      ) : logs.length === 0 ? (
          <div className="py-20 text-center text-neutral-text-secondary bg-neutral-bg/20 border-dashed rounded-[12px] border border-neutral-border">
              No audit logs recorded yet.
          </div>
      ) : (
          <Table headers={["Officer Wallet", "Action performed", "Property ID", "Timestamp", "Blockchain Tx"]}>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-[12px]">
                    {log.actor_wallet.substring(0, 6)}...{log.actor_wallet.substring(38)}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${
                    log.action.includes('Approve') || log.action.includes('Register') ? 'bg-status-active/10 text-status-active' :
                    log.action.includes('Reject') || log.action.includes('Dispute') ? 'bg-status-dispute/10 text-status-dispute' :
                    'bg-primary-100 text-primary-700'
                  }`}>
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="font-semibold uppercase tracking-tight">
                    {(log.properties as any)?.property_id || "SYSTEM"}
                </TableCell>
                <TableCell className="text-neutral-text-secondary text-[13px]">
                    {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                   {log.blockchain_tx_hash ? (
                       <a 
                         href={`https://amoy.polygonscan.com/tx/${log.blockchain_tx_hash}`} 
                         target="_blank" 
                         className="flex items-center gap-1 text-primary-600 hover:underline font-mono text-[12px]"
                       >
                          {log.blockchain_tx_hash.substring(0, 6)}...{log.blockchain_tx_hash.substring(60)}
                          <ExternalLink className="w-3 h-3" />
                       </a>
                   ) : (
                       <span className="text-neutral-text-secondary text-[12px]">N/A</span>
                   )}
                </TableCell>
              </TableRow>
            ))}
          </Table>
      )}
    </div>
  );
}
