"use client";

import React, { useEffect, useState } from 'react';
import { Card, Table, TableRow, TableCell, Badge, Button } from '@/components/ui';
import { Building2, Search, ArrowRight, MapPin, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useWeb3 } from '@/contexts/Web3Context';
import { supabase } from '@/lib/supabase';

export default function MyPropertiesPage() {
  const { address } = useWeb3();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
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
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [address]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary-900 font-serif tracking-tight">My Registered Properties</h1>
            <Button variant="secondary" onClick={fetchProperties} disabled={loading} className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>
        <p className="text-neutral-text-secondary">Manage and view details of your blockchain-verified land holdings.</p>
      </div>

      {loading ? (
          <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          </div>
      ) : properties.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center gap-4 border-dashed">
              <Building2 className="w-12 h-12 text-neutral-text-secondary opacity-20" />
              <div className="flex flex-col gap-1">
                  <p className="font-medium">No properties registered</p>
                  <p className="text-sm text-neutral-text-secondary">Properties you register or receive will appear here.</p>
              </div>
              <Link href="/citizen/register">
                  <Button>Register New Property</Button>
              </Link>
          </Card>
      ) : (
          <Table headers={["Property ID", "Location", "Area", "Status", "Registry Date", "Action"]}>
            {properties.map((prop) => (
              <TableRow key={prop.id}>
                <TableCell className="font-semibold uppercase tracking-tight">{prop.property_id}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-neutral-text-secondary" />
                        {prop.location || "N/A"}
                    </div>
                </TableCell>
                <TableCell>{prop.area_sqft.toLocaleString()} sq.ft</TableCell>
                <TableCell>
                  <Badge variant={prop.state as any}>{prop.state.toUpperCase()}</Badge>
                </TableCell>
                <TableCell>{new Date(prop.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Link href={`/citizen/verify?id=${prop.property_id}`}>
                    <button className="text-primary-600 font-medium hover:underline flex items-center gap-1">
                        View Details
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </Table>
      )}
    </div>
  );
}
