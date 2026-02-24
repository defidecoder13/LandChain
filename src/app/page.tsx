"use client";

import React from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import { ArrowRight, FileText, Globe, Scale } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col gap-16">
      
      {/* Hero / Mission Statement - Text Heavy */}
      <section className="flex flex-col gap-6 max-w-4xl border-l-4 border-primary-900 pl-8 py-2">
        <h1 className="text-5xl md:text-6xl font-bold font-serif text-primary-900 tracking-tight leading-tight">
          National Land Registry Authority
        </h1>
        <p className="text-xl text-primary-700 leading-relaxed max-w-2xl">
          The official immutable ledger for land ownership and transfer. 
          Secured by the Polygon blockchain network, ensuring absolute transparency, 
          permanence, and legal validity for all property records.
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
           <Link href="/verify">
             <Button size="lg" className="px-8 text-lg">
                Verify Public Record
             </Button>
           </Link>
           <Link href="/citizen">
             <Button variant="secondary" size="lg" className="px-8 text-lg">
                Citizen Services
             </Button>
           </Link>
        </div>
      </section>

      {/* Registry Overview - Data Grid */}
      <section className="flex flex-col gap-8">
        <div className="flex items-center justify-between border-b border-border-light pb-4">
           <h2 className="text-2xl font-bold font-serif text-primary-900">Registry Statistics</h2>
           <span className="text-sm text-primary-600 font-mono">LIVE DATA • UPDATED 12:00 PM EST</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <Card className="p-8 flex flex-col gap-2 border-l-4 border-l-primary-900 rounded-none bg-primary-100/30">
              <span className="text-sm font-bold uppercase tracking-wider text-primary-600">Total Registered Assets</span>
              <span className="text-4xl font-mono font-bold text-primary-900">12,845</span>
           </Card>
           <Card className="p-8 flex flex-col gap-2 border-l-4 border-l-primary-900 rounded-none bg-primary-100/30">
              <span className="text-sm font-bold uppercase tracking-wider text-primary-600">Transfers Processed (Month)</span>
              <span className="text-4xl font-mono font-bold text-primary-900">892</span>
           </Card>
           <Card className="p-8 flex flex-col gap-2 border-l-4 border-l-primary-900 rounded-none bg-primary-100/30">
              <span className="text-sm font-bold uppercase tracking-wider text-primary-600">Active Nodes</span>
              <span className="text-4xl font-mono font-bold text-primary-900">12</span>
           </Card>
        </div>
      </section>

      {/* Public Notices - List */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
         <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold font-serif text-primary-900 border-b border-border-light pb-4">
               Public Notices
            </h2>
            <div className="flex flex-col gap-4">
               {[
                  { date: 'OCT 24, 2024', title: 'Maintenance schedule for Polygon mainnet upgrade.' },
                  { date: 'OCT 20, 2024', title: 'New regulation regarding commercial zoning disputes.' },
                  { date: 'OCT 15, 2024', title: 'Q3 Transparency Report published for public review.' },
               ].map((notice, i) => (
                  <div key={i} className="flex flex-col gap-1 pb-4 border-b border-border-light/50 last:border-0">
                     <span className="text-xs font-bold text-primary-600">{notice.date}</span>
                     <p className="text-primary-900 font-medium hover:underline cursor-pointer">{notice.title}</p>
                  </div>
               ))}
            </div>
            <Button variant="link" className="self-start p-0 text-primary-900 font-bold decoration-2">
               VIEW ARCHIVE <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
         </div>

         <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold font-serif text-primary-900 border-b border-border-light pb-4">
               System Status
            </h2>
            <div className="flex flex-col gap-4">
               <div className="flex items-center justify-between p-4 border border-border-light rounded-[6px]">
                  <div className="flex items-center gap-3">
                     <Globe className="w-5 h-5 text-primary-900" />
                     <span className="font-medium text-primary-900">Network Connection</span>
                  </div>
                  <Badge variant="active">OPERATIONAL</Badge>
               </div>
               <div className="flex items-center justify-between p-4 border border-border-light rounded-[6px]">
                  <div className="flex items-center gap-3">
                     <FileText className="w-5 h-5 text-primary-900" />
                     <span className="font-medium text-primary-900">Smart Contract</span>
                  </div>
                  <Badge variant="active">VERIFIED</Badge>
               </div>
               <div className="flex items-center justify-between p-4 border border-border-light rounded-[6px]">
                  <div className="flex items-center gap-3">
                     <Scale className="w-5 h-5 text-primary-900" />
                     <span className="font-medium text-primary-900">Dispute Tribunal</span>
                  </div>
                  <Badge variant="active">ONLINE</Badge>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-16 border-t border-border-light flex flex-col md:flex-row justify-between items-start gap-8">
         <div className="flex flex-col gap-2">
            <span className="font-serif font-bold text-lg">LandChain</span>
            <span className="text-sm text-primary-600 max-w-sm">
               Official government portal for land administration. All records are legally binding and immutable.
            </span>
         </div>
         <div className="flex gap-8 text-sm text-primary-600 font-medium">
            <a href="#" className="hover:text-primary-900">Privacy Policy</a>
            <a href="#" className="hover:text-primary-900">Terms of Service</a>
            <a href="#" className="hover:text-primary-900">Contact Authority</a>
         </div>
      </footer>

    </main>
  );
}
