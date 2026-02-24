"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, TableRow, TableCell, Badge, Input, Button } from '@/components/ui';
import { Search, Filter, Download, ShieldAlert, Snowflake, RotateCcw, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { raiseDisputeOnChain, resolveDisputeOnChain, freezePropertyOnChain } from '@/lib/blockchain';
import Link from 'next/link';

export default function AllPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleAction = async (property: any, action: 'freeze' | 'dispute' | 'resolve') => {
    setActionLoading(`${property.id}-${action}`);
    try {
      let txHash = "";
      let nextState = property.state;

      if (action === 'freeze') {
        txHash = await freezePropertyOnChain(property.property_id);
        nextState = 'frozen';
      } else if (action === 'dispute') {
        txHash = await raiseDisputeOnChain(property.property_id, "Administrative Flag");
        nextState = 'under_dispute';
      } else if (action === 'resolve') {
        txHash = await resolveDisputeOnChain(property.property_id, "Resolution Applied");
        nextState = 'active';
      }

      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          state: nextState,
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id);

      if (updateError) throw updateError;

      // 3. Audit Log
      await supabase
        .from('audit_logs')
        .insert({
          actor_wallet: "AUTHORITY_OFFICER",
          action: `${action.charAt(0).toUpperCase() + action.slice(1)} Property`,
          property_id: property.id,
          blockchain_tx_hash: txHash
        });

      alert(`Success! Transaction: ${txHash}`);
      fetchProperties();
    } catch (err: any) {
      console.error(err);
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProperties = properties.filter(p => 
    p.property_id.toLowerCase().includes(search.toLowerCase()) ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.owner_wallet.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary-900 font-serif tracking-tight">National Property Database</h1>
            <div className="flex gap-3">
                <Button variant="secondary" onClick={fetchProperties} className="flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
                <Button variant="secondary" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            </div>
        </div>
        <p className="text-neutral-text-secondary">Comprehensive database of all blockchain-registered property assets.</p>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-text-secondary" />
                <Input 
                  className="pl-10" 
                  placeholder="Search by ID, User Wallet, or Property Title..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button variant="secondary" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
            </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <Table headers={["Property ID", "Owner Wallet", "Land Area", "Status", "Actions"]}>
          {filteredProperties.map((prop) => (
            <TableRow key={prop.id}>
              <TableCell className="font-semibold uppercase tracking-tight">
                <div className="flex flex-col">
                  <span>{prop.property_id}</span>
                  <span className="text-[10px] text-neutral-text-secondary truncate max-w-[100px]">{prop.title}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-[11px]">
                  {prop.owner_wallet.substring(0, 6)}...{prop.owner_wallet.substring(38)}
              </TableCell>
              <TableCell>{prop.area_sqft} sq.ft</TableCell>
              <TableCell>
                <Badge variant={prop.state as any}>{prop.state.toUpperCase()}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {prop.state === 'active' && (
                    <>
                      <button 
                        onClick={() => handleAction(prop, 'freeze')}
                        disabled={!!actionLoading}
                        className="p-1.5 hover:bg-neutral-bg rounded-md text-neutral-text-secondary flex items-center gap-1 text-[11px] font-medium"
                        title="Freeze Property"
                      >
                        <Snowflake className={`w-3.5 h-3.5 ${actionLoading === `${prop.id}-freeze` ? 'animate-spin' : ''}`} />
                        Freeze
                      </button>
                      <button 
                         onClick={() => handleAction(prop, 'dispute')}
                         disabled={!!actionLoading}
                         className="p-1.5 hover:bg-neutral-bg rounded-md text-status-dispute flex items-center gap-1 text-[11px] font-medium"
                         title="Raise Dispute"
                      >
                        <ShieldAlert className={`w-3.5 h-3.5 ${actionLoading === `${prop.id}-dispute` ? 'animate-spin' : ''}`} />
                        Flag
                      </button>
                    </>
                  )}
                  {prop.state === 'under_dispute' && (
                    <button 
                       onClick={() => handleAction(prop, 'resolve')}
                       disabled={!!actionLoading}
                       className="p-1.5 hover:bg-neutral-bg rounded-md text-status-active flex items-center gap-1 text-[11px] font-medium"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${actionLoading === `${prop.id}-resolve` ? 'animate-spin' : ''}`} />
                      Resolve
                    </button>
                  )}
                  {prop.state === 'frozen' && (
                    <button 
                       onClick={() => handleAction(prop, 'resolve')} // Using resolve to unfreeze for now or could have dedicated unfreeze
                       disabled={!!actionLoading}
                       className="p-1.5 hover:bg-neutral-bg rounded-md text-status-active flex items-center gap-1 text-[11px] font-medium"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${actionLoading === `${prop.id}-resolve` ? 'animate-spin' : ''}`} />
                      Unfreeze
                    </button>
                  )}
                  <Link href={`/verify?id=${prop.property_id}`} target="_blank">
                    <button className="p-1.5 hover:bg-neutral-bg rounded-md text-primary-600 flex items-center gap-1 text-[11px] font-medium">
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
