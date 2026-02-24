"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { cn } from '@/components/ui';

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { address, logout } = useWeb3();

  const navLinks = [
    { name: 'Public Portal', href: '/' },
    { name: 'Citizen Services', href: '/citizen' },
    { name: 'Authority Access', href: '/authority' },
  ];

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleLogout = () => {
    logout();
  };

  const isCitizen = pathname.startsWith('/citizen');
  const isAuthority = pathname.startsWith('/authority');
  const isPublic = !isCitizen && !isAuthority;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border-light z-50 px-6 md:px-12 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-lg font-serif font-bold text-primary-900 tracking-tight">LandChain</span>
        </Link>
        {!(isCitizen && pathname !== '/citizen') && !(isAuthority && pathname !== '/authority') && (
          <>
            <div className="h-6 w-px bg-border-light hidden md:block" />
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = (link.href === '/' && isPublic) || 
                                (link.href === '/citizen' && isCitizen) || 
                                (link.href === '/authority' && isAuthority);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:bg-primary-100 px-3 py-1.5 rounded-[4px]",
                      isActive 
                        ? 'text-primary-900 underline underline-offset-4 decoration-2' 
                        : 'text-primary-700'
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        {(isCitizen || isAuthority) && address && (
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-primary-100 border border-border-light rounded-[4px] flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span className="text-xs font-mono text-primary-900">{formatAddress(address)}</span>
             </div>
             <button 
               onClick={handleLogout}
               className="text-sm text-primary-700 hover:text-primary-900 font-medium underline underline-offset-2"
             >
               Logout
             </button>
          </div>
        )}
      </div>
    </nav>
  );
};
