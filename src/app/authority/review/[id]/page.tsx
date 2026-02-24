"use client";

import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { FileText, ShieldCheck, User, Calendar, Hash, MapPin, XCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { registerPropertyOnChain } from '@/lib/blockchain';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id as string)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load property details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchProperty();
  }, [params.id]);

  const handleApprove = async () => {
    if (!property) return;
    setActionLoading(true);
    try {
      // 1. Register on Blockchain
      console.log(`🚀 Registering ${property.property_id} on-chain...`);
      const txHash = await registerPropertyOnChain(
        property.property_id,
        property.owner_wallet,
        property.document_hash
      );

      // 2. Update Supabase
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          state: 'active',
          blockchain_tx_hash: txHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id);

      if (updateError) throw updateError;

      // 3. Audit Log
      await supabase
        .from('audit_logs')
        .insert({
          actor_wallet: "AUTHORITY_OFFICER", // In a real app, from officer's connected wallet
          action: 'Approved Registration',
          property_id: property.id,
          blockchain_tx_hash: txHash
        });

      alert("Property approved and registered on-chain successfully!");
      router.push('/authority/registrations');
    } catch (err: any) {
      console.error(err);
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!property) return;
    if (!confirm("Are you sure you want to reject this application? This action cannot be undone.")) return;

    setActionLoading(true);
    try {
      // 1. Update Supabase
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          state: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id);

      if (updateError) throw updateError;

      // 2. Audit Log
      await supabase
        .from('audit_logs')
        .insert({
          actor_wallet: "AUTHORITY_OFFICER",
          action: 'Rejected Registration',
          property_id: property.id,
          details: 'Application rejected by authority'
        });

      alert("Application rejected successfully.");
      router.push('/authority/registrations');
    } catch (err: any) {
      console.error(err);
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      <span className="mt-4 text-neutral-text-secondary">Loading property records...</span>
    </div>
  );

  if (error || !property) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Badge variant="dispute">Error</Badge>
      <p>{error || "Property not found"}</p>
      <Button variant="secondary" onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-[900px]">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-sm text-neutral-text-secondary hover:text-primary-700 font-medium">
          ← Back to Queue
        </button>
        <div className="h-4 w-px bg-neutral-border" />
        <h1 className="text-[24px]">Review Application: {property.property_id}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-8">
          <Card className="flex flex-col gap-6">
            <h3 className="border-b border-neutral-border pb-2">Property Information</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                    <span className="text-caption text-neutral-text-secondary">Full Title</span>
                    <span className="font-medium">{property.title}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-caption text-neutral-text-secondary">Land Type</span>
                    <span className="font-medium uppercase tracking-tight">{property.land_type}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-caption text-neutral-text-secondary">Area</span>
                    <span className="font-medium uppercase">{property.area_sqft.toLocaleString()} SQ. FT.</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-caption text-neutral-text-secondary">Location</span>
                    <span className="font-medium">{property.location || "Address details on record"}</span>
                </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
             <h3 className="border-b border-neutral-border pb-2">Document Verification</h3>
             {property.document_url ? (
               <div className="flex flex-col gap-4">
                 <iframe 
                   src={property.document_url} 
                   className="w-full h-[500px] border border-neutral-border rounded-[8px]"
                   title="Property Document"
                 />
                 <div className="flex justify-end">
                   <a href={property.document_url} target="_blank" rel="noopener noreferrer">
                     <Button variant="secondary" className="text-xs">Download full PDF Archive</Button>
                   </a>
                 </div>
               </div>
             ) : (
               <div className="bg-neutral-bg border border-neutral-border rounded-[8px] p-12 flex flex-col items-center justify-center gap-4 border-dashed">
                  <FileText className="w-12 h-12 text-neutral-text-secondary opacity-30" />
                  <span className="text-sm font-medium text-neutral-text-secondary italic">No document available</span>
               </div>
             )}
             <div className="flex flex-col gap-2 p-4 bg-primary-100/10 rounded-[8px] border border-primary-100/30">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">Blockchain Metadata</span>
                    <span className="text-[11px] text-status-active font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> PENDING VERIFICATION
                    </span>
                </div>
                <span className="text-[12px] font-mono text-neutral-text-primary break-all">
                    {property.document_hash}
                </span>
             </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
            <Card className="bg-neutral-bg/50 sticky top-24">
                <h3 className="mb-4">Adjudication</h3>
                <div className="flex flex-col gap-4">
                    <Button 
                      onClick={handleApprove}
                      disabled={actionLoading || property.state !== 'pending'}
                      className="w-full h-auto flex items-center justify-center gap-2 bg-status-active hover:bg-green-700 py-4"
                    >
                        {actionLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            {property.state === 'active' ? 'Already Approved' : 'Approve Registration'}
                          </>
                        )}
                    </Button>
                    <Button 
                      onClick={handleReject}
                      variant="secondary" 
                      disabled={actionLoading || property.state !== 'pending'}
                      className="w-full flex items-center justify-center gap-2 text-status-dispute hover:bg-status-dispute/10 hover:border-status-dispute py-4"
                    >
                        <XCircle className="w-4 h-4" />
                        Reject Application
                    </Button>
                    <div className="h-px bg-neutral-border my-2" />
                    <p className="text-[12px] text-neutral-text-secondary leading-relaxed">
                        Approving this request will mint a new property NFT on the Polygon blockchain and update the national land registry database.
                    </p>
                </div>
            </Card>

             <Card className="flex flex-col gap-3">
                <h3 className="text-[14px]">Owner Identity</h3>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center text-white font-bold">
                        {property.owner_wallet.substring(2, 4).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold font-mono truncate max-w-[150px]">{property.owner_wallet}</span>
                        <span className="text-[11px] text-neutral-text-secondary">KYC Link Verified</span>
                    </div>
                </div>
             </Card>
        </div>
      </div>
    </div>
  );
}
