'use client';

import { useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4">
      <Card className="max-w-[500px] w-full flex flex-col items-center text-center gap-6 p-10 border-status-dispute/20 shadow-lg shadow-status-dispute/5">
        <div className="w-16 h-16 bg-status-dispute/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-status-dispute" />
        </div>
        
        <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-neutral-text-primary">System Encountered an Issue</h1>
            <p className="text-neutral-text-secondary text-sm">
                We apologize for the inconvenience. An unexpected error occurred while processing your request. Our technical team has been notified.
            </p>
        </div>

        {error.message && (
            <div className="bg-neutral-bg p-3 rounded-[8px] border border-neutral-border w-full text-left">
                <span className="text-[10px] font-bold text-neutral-text-secondary uppercase tracking-widest block mb-1">Diagnostic Detail</span>
                <code className="text-[12px] text-neutral-text-primary break-all">{error.message}</code>
            </div>
        )}

        <div className="flex flex-col w-full gap-3">
            <Button onClick={() => reset()} className="w-full flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Attempt Recovery
            </Button>
            <Link href="/" className="w-full">
                <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                    <Home className="w-4 h-4" />
                    Return to Home
                </Button>
            </Link>
        </div>
      </Card>
    </div>
  );
}
