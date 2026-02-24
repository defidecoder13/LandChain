"use client";

import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useRole } from '@/contexts/RoleContext';
import { usePathname } from 'next/navigation';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, setRole } = useRole();
  const pathname = usePathname();

  // Sync role based on path for components that depend on RoleContext
  useEffect(() => {
    if (pathname.startsWith('/authority')) {
      if (role !== 'authority') setRole('authority');
    } else if (pathname.startsWith('/citizen')) {
      if (role !== 'citizen') setRole('citizen');
    } else {
      if (role !== 'public') setRole('public');
    }
  }, [pathname, role, setRole]);

  // Sidebar is only visible for deep portal routes (dashboard, services, etc)
  const showSidebar = (pathname.startsWith('/citizen') || pathname.startsWith('/authority')) && 
                      role !== 'public' && 
                      pathname !== '/citizen' && 
                      pathname !== '/authority';

  return (
    <div className="min-h-screen bg-white text-primary-900 pt-16">
      
      <Navbar />
      
      <div className="flex relative z-10 min-h-[calc(100vh-64px)]">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 transition-all duration-300 ${!showSidebar ? 'w-full' : 'pl-[240px]'}`}>
          <div className={`${!showSidebar ? 'bg-white' : 'p-8 bg-primary-100/50 min-h-full'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
