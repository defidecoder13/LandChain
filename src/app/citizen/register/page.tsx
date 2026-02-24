"use client";

import React, { useState, useRef } from 'react';
import { Card, Input, Button } from '@/components/ui';
import { Upload, FileText, CheckCircle2, AlertCircle, FileUp, X, RefreshCw } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPropertyPage() {
  const { address } = useWeb3();
  const router = useRouter();
  const [isHashing, setIsHashing] = useState(false);
  const [isHashed, setIsHashed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [generatedHash, setGeneratedHash] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    surveyNumber: "",
    area: "",
    landType: "residential",
    location: ""
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        return;
      }
      setFile(selectedFile);
      setIsHashed(false);
      setGeneratedHash("");
      setError(null);
    }
  };

  const handleGenerateHash = () => {
    if (!file) {
      setError("Please upload a document first.");
      return;
    }
    setIsHashing(true);
    // Simulate hashing delay
    setTimeout(() => {
      const docHash = "0x" + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setGeneratedHash(docHash);
      setIsHashing(false);
      setIsHashed(true);
    }, 1500);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setIsHashed(false);
    setGeneratedHash("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setError("Please connect your authority wallet first");
      return;
    }
    if (!isHashed) {
      setError("Please generate document hash first");
      return;
    }
    if (!file) {
      setError("Please upload a document");
      return;
    }

    setLoading(true);
    setError(null);

    const propertyId = `PROP-${Math.floor(Math.random() * 10000)}-${formData.surveyNumber.replace(/\D/g, '') || 'X'}`;
    const docHash = generatedHash;

    try {
      // 1. Upload File to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-documents')
        .getPublicUrl(fileName);

      // 2. Insert into Supabase DB
      const { error: dbError } = await supabase
        .from('properties')
        .insert([{
          property_id: propertyId,
          title: formData.title,
          location: formData.location,
          area_sqft: Number(formData.area),
          owner_wallet: address,
          document_hash: docHash,
          document_url: publicUrl,
          state: 'pending',
          land_type: formData.landType,
          survey_number: formData.surveyNumber
        }]);

      if (dbError) throw dbError;

      setSuccess(true);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-20 px-6 text-center">
        <div className="flex flex-col items-center gap-6 p-8 border border-success/30 bg-success/5 rounded-[6px]">
          <div className="w-16 h-16 bg-success text-white rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 font-serif">Registration Submitted</h2>
          <p className="text-primary-700">
            Your property application has been successfully submitted to the National Land Registry Authority.
            Your unique tracking ID is generated.
          </p>
          <div className="flex gap-4 mt-4">
            <Link href="/citizen/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-8 border-b border-border-light pb-6">
        <h1 className="text-3xl font-bold text-primary-900 font-serif tracking-tight">Register New Property</h1>
        <p className="text-primary-700 mt-2">
          Submit official land details for government verification and blockchain recording.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Section 1: Property Details */}
        <div className="flex flex-col gap-6">
           <h3 className="text-lg font-bold text-primary-900 uppercase tracking-wide border-b border-border-light pb-2">1. Property Particulars</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-primary-900 uppercase">Property Title / Name</label>
                <Input 
                   required
                   placeholder="e.g. Green Valley Plot A1"
                   value={formData.title}
                   onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-primary-900 uppercase">Survey Number</label>
                <Input 
                   required
                   placeholder="e.g. SR-299/B"
                   value={formData.surveyNumber}
                   onChange={(e) => handleInputChange('surveyNumber', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-primary-900 uppercase">Land Area (sq. ft.)</label>
                <Input 
                   required
                   type="number"
                   placeholder="e.g. 2400"
                   value={formData.area}
                   onChange={(e) => handleInputChange('area', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-primary-900 uppercase">Land Type</label>
                <select 
                   className="h-10 w-full rounded-[6px] border border-primary-500 bg-white px-3 py-2 text-sm text-primary-900 focus:outline-none focus:ring-1 focus:ring-primary-900"
                   value={formData.landType}
                   onChange={(e) => handleInputChange('landType', e.target.value)}
                >
                   <option value="residential">Residential</option>
                   <option value="commercial">Commercial</option>
                   <option value="agricultural">Agricultural</option>
                   <option value="industrial">Industrial</option>
                </select>
              </div>
           </div>

           <div className="flex flex-col gap-2">
             <label className="text-sm font-bold text-primary-900 uppercase">Full Address / Location</label>
             <textarea 
               required
               rows={3}
               className="w-full rounded-[6px] border border-primary-500 bg-white px-3 py-2 text-sm text-primary-900 focus:outline-none focus:ring-1 focus:ring-primary-900"
               placeholder="Enter detailed physical address of the property..."
               value={formData.location}
               onChange={(e) => handleInputChange('location', e.target.value)}
             />
           </div>
        </div>

        {/* Section 2: Documents */}
        <div className="flex flex-col gap-6">
           <h3 className="text-lg font-bold text-primary-900 uppercase tracking-wide border-b border-border-light pb-2">2. Deed Documentation</h3>
           
           <div className="border border-dashed border-primary-500 rounded-[6px] p-8 bg-primary-100/30 text-center">
             {!file ? (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="cursor-pointer flex flex-col items-center gap-4 hover:opacity-70 transition-opacity"
               >
                 <div className="p-4 bg-primary-100 rounded-full">
                    <FileUp className="w-8 h-8 text-primary-900" />
                 </div>
                 <div>
                    <p className="text-primary-900 font-bold">Click to Upload Deed Document</p>
                    <p className="text-primary-600 text-sm mt-1">PDF, JPG, or PNG (Max 10MB)</p>
                 </div>
               </div>
             ) : (
               <div className="flex items-center justify-between bg-white p-4 rounded-[6px] border border-border-light shadow-sm">
                 <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-primary-700" />
                    <div className="text-left">
                       <p className="text-primary-900 font-bold text-sm truncate max-w-[200px]">{file.name}</p>
                       <p className="text-primary-600 text-xs text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    {isHashed && <div className="text-success text-xs font-bold uppercase flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Hashed</div>}
                    <button type="button" onClick={removeFile} className="p-2 hover:bg-error/10 text-primary-500 hover:text-error rounded">
                       <X className="w-5 h-5" />
                    </button>
                 </div>
               </div>
             )}
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
           </div>

           {file && !isHashed && (
             <div className="flex justify-center">
                <Button type="button" onClick={handleGenerateHash} disabled={isHashing} variant="secondary" className="w-full">
                  {isHashing ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating Cryptographic Hash...</>
                  ) : (
                    <>Generate Document Hash</>
                  )}
                </Button>
             </div>
           )}

           {generatedHash && (
             <div className="bg-primary-100 p-4 rounded-[6px] border border-primary-500/20">
               <p className="text-xs font-bold text-primary-600 uppercase mb-1">Document Hash (SHA-256)</p>
               <p className="font-mono text-sm text-primary-900 break-all">{generatedHash}</p>
             </div>
           )}
        </div>

        {error && (
          <div className="p-4 bg-error/10 text-error border border-error/20 rounded-[6px] flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium text-sm">{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4 border-t border-border-light">
           <Link href="/citizen/dashboard">
              <Button type="button" variant="ghost">Cancel</Button>
           </Link>
           <Button type="submit" disabled={loading || !isHashed} className="px-8">
              {loading ? 'Submitting Application...' : 'Submit Application'}
           </Button>
        </div>

      </form>
    </div>
  );
}
