"use client";

import { Button, Card } from "@/components/ui";
import { ShieldCheck, Search, FileText, Lock } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-section">
      {/* Hero Section */}
      <section className="text-center py-page-top">
        <h1 className="mb-4">National Blockchain Property Registry</h1>
        <p className="text-neutral-text-secondary text-lg max-w-2xl mx-auto mb-8">
          Tamper-proof digital land records powered by blockchain technology. 
          Ensuring transparency, security, and immutability for national land assets.
        </p>
        <div className="flex flex-col items-center gap-4 mt-8">
          <Link href="/verify">
            <Button className="flex items-center gap-2 py-4 px-12 text-[16px] bg-primary-700 hover:bg-primary-800">
              <Search className="w-5 h-5" />
              Verify Property
            </Button>
          </Link>
          <p className="text-[13px] text-neutral-text-secondary mt-2">
            Public property verification does not require wallet connection.
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <ShieldCheck className="text-primary-700 w-6 h-6" />
          </div>
          <h3 className="mb-2">Immutable Records</h3>
          <p className="text-[14px] text-neutral-text-secondary">
            Every property registration and transfer is recorded on an immutable ledger, 
            preventing unauthorized alterations.
          </p>
        </Card>

        <Card className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Search className="text-primary-700 w-6 h-6" />
          </div>
          <h3 className="mb-2">Public Verification</h3>
          <p className="text-[14px] text-neutral-text-secondary">
            Instantly verify property ownership and status using the property ID or survey 
            numbers through our portal.
          </p>
        </Card>

        <Card className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="text-primary-700 w-6 h-6" />
          </div>
          <h3 className="mb-2">Dispute & Freeze</h3>
          <p className="text-[14px] text-neutral-text-secondary">
            Advanced mechanisms for legal disputes and property freezing to prevent fraudulent 
            transfers during investigation.
          </p>
        </Card>
      </section>
    </div>
  );
}
