"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, TableRow, TableCell, Badge, Button } from '@/components/ui';
import { Building2, PlusCircle, Search, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useWeb3 } from '@/contexts/Web3Context';
import { supabase } from '@/lib/supabase';

export default function CitizenDashboard() {
  const { address } = useWeb3();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalValues: 0,
    totalCount: 0,
    inDispute: 0
  });

  const fetchDashboardData = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_wallet', address)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
      
      const total = data?.length || 0;
      const dispute = data?.filter(p => p.state === 'under_dispute').length || 0;
      const totalValue = data?.reduce((acc, curr) => acc + (curr.area_sqft * 120), 0) || 0;

      setStats({
        totalValues: totalValue,
        totalCount: total,
        inDispute: dispute
      });

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [address]);

  return (
    <div className="flex flex-col gap-12 max-w-5xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border-light pb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
             <h1 className="text-3xl font-bold text-primary-900 font-serif tracking-tight">Citizen Dashboard</h1>
             <p className="text-primary-700">Property Portfolio & Actions</p>
          </div>
          <Button variant="secondary" onClick={fetchDashboardData} className="h-10 text-sm">
             <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
             Sync Data
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <section>
        <h3 className="text-lg font-bold text-primary-900 mb-4 uppercase tracking-wide">Overview</h3>
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
                 <td className="px-6 py-4 text-primary-800 font-medium">Total Registered Properties</td>
                 <td className="px-6 py-4 text-primary-900 font-mono text-right font-bold">{stats.totalCount}</td>
               </tr>
               <tr>
                 <td className="px-6 py-4 text-primary-800 font-medium">Approx. Asset Value</td>
                 <td className="px-6 py-4 text-primary-900 font-mono text-right text-primary-700">${(stats.totalValues).toLocaleString()}</td>
               </tr>
               <tr>
                 <td className="px-6 py-4 text-primary-800 font-medium">Properties Under Dispute</td>
                 <td className="px-6 py-4 text-primary-900 font-mono text-right">{stats.inDispute}</td>
               </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Actions Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/citizen/register">
          <Card className="h-full hover:bg-primary-100 transition-colors cursor-pointer group p-6">
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3">
                 <PlusCircle className="w-6 h-6 text-primary-900" />
                 <h3 className="text-lg font-bold text-primary-900 group-hover:underline">Register New Property</h3>
               </div>
               <p className="text-primary-600 text-sm">Submit documentation for a new land parcel registration.</p>
            </div>
          </Card>
        </Link>
        <Link href="/citizen/verify">
          <Card className="h-full hover:bg-primary-100 transition-colors cursor-pointer group p-6">
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3">
                 <Search className="w-6 h-6 text-primary-900" />
                 <h3 className="text-lg font-bold text-primary-900 group-hover:underline">Verify Records</h3>
               </div>
               <p className="text-primary-600 text-sm">Search the national archives for property legitimacy.</p>
            </div>
          </Card>
        </Link>
      </section>
    </div>
  );
}
