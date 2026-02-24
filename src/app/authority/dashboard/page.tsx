"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, TableRow, TableCell, Badge, Button } from '@/components/ui';
import { ShieldCheck, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthorityDashboard() {
  const [stats, setStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    disputeCount: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const { data: props, error: propsError } = await supabase
        .from('properties')
        .select('state');

      if (propsError) throw propsError;

      const total = props?.length || 0;
      const pending = props?.filter(p => p.state === 'pending.verification').length || 0;
      const dispute = props?.filter(p => p.state === 'under_dispute').length || 0;

      setStats({
        totalCount: total,
        pendingCount: pending,
        disputeCount: dispute
      });

      // 2. Fetch Recent Activities
      const { data: activity, error: actError } = await supabase
        .from('audit_logs')
        .select('*, properties(property_id)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (actError) throw actError;
      setRecentActivity(activity || []);

    } catch (err) {
      console.error("Authority dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-col gap-12 max-w-5xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border-light pb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
             <h1 className="text-3xl font-bold text-primary-900 font-serif tracking-tight">Authority Control Center</h1>
             <p className="text-primary-700">National Land Records Administration</p>
          </div>
          <Button variant="secondary" onClick={fetchDashboardData} className="h-10 text-sm">
             <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
             Sync Ledger
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <section>
        <h3 className="text-lg font-bold text-primary-900 mb-4 uppercase tracking-wide">Registry Statistics</h3>
        <div className="border border-border-light rounded-[6px] overflow-hidden bg-white">
          <table className="w-full text-left">
            <thead className="bg-primary-100 border-b border-border-light">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-primary-900 uppercase">Metric</th>
                <th className="px-6 py-4 text-sm font-bold text-primary-900 uppercase text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
               <tr>
                 <td className="px-6 py-4 text-primary-800 font-medium">Total Registered Parcels</td>
                 <td className="px-6 py-4 text-primary-900 font-mono text-right font-bold">{stats.totalCount}</td>
               </tr>
               <tr>
                 <td className="px-6 py-4 text-primary-800 font-medium">Pending Verification</td>
                 <td className="px-6 py-4 text-primary-900 font-mono text-right">{stats.pendingCount}</td>
               </tr>
               <tr>
                 <td className="px-6 py-4 text-primary-800 font-medium">Active Disputes</td>
                 <td className="px-6 py-4 text-primary-900 font-mono text-right text-error">{stats.disputeCount}</td>
               </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Activity Log */}
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-primary-900 mb-2 uppercase tracking-wide">Recent Registry Activity</h3>
        <div className="border border-border-light rounded-[6px] overflow-hidden bg-white">
          <table className="w-full text-left">
             <thead className="bg-primary-100 border-b border-border-light">
               <tr>
                 <th className="px-6 py-4 text-sm font-bold text-primary-900 uppercase">Timestamp</th>
                 <th className="px-6 py-4 text-sm font-bold text-primary-900 uppercase">Action</th>
                 <th className="px-6 py-4 text-sm font-bold text-primary-900 uppercase">Property Ref</th>
                 <th className="px-6 py-4 text-sm font-bold text-primary-900 uppercase">User</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-border-light">
               {recentActivity.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-primary-600">No recent activity found on the ledger.</td>
                 </tr>
               ) : (
                 recentActivity.map((log) => (
                   <tr key={log.id} className="hover:bg-primary-100 transition-colors">
                     <td className="px-6 py-4 text-sm text-primary-700 font-mono">
                       {new Date(log.created_at).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-sm text-primary-900 font-medium">
                       {log.action}
                     </td>
                     <td className="px-6 py-4 text-sm text-primary-600 font-mono">
                       {log.properties?.property_id?.substring(0,8) || 'N/A'}...
                     </td>
                     <td className="px-6 py-4 text-sm text-primary-600 font-mono">
                       {log.performed_by?.substring(0,6)}...
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
