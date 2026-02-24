"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Building2, 
  GitCompare, 
  AlertTriangle, 
  Search, 
  History,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/components/ui';

const menuItems = {
  citizen: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/citizen/dashboard' },
    { name: 'Register Property', icon: PlusCircle, path: '/citizen/register' },
    { name: 'My Properties', icon: Building2, path: '/citizen/properties' },
    { name: 'Transfer Ownership', icon: GitCompare, path: '/citizen/transfer' },
    { name: 'Raise Dispute', icon: AlertTriangle, path: '/citizen/dispute' },
    { name: 'Verify Property', icon: Search, path: '/citizen/verify' },
  ],
  authority: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/authority/dashboard' },
    { name: 'Pending Registrations', icon: FileCheck, path: '/authority/registrations' },
    { name: 'Pending Transfers', icon: GitCompare, path: '/authority/transfers' },
    { name: 'Dispute Cases', icon: AlertTriangle, path: '/authority/disputes' },
    { name: 'All Properties', icon: Building2, path: '/authority/all' },
    { name: 'Audit Logs', icon: History, path: '/authority/audit' },
  ]
};

export const Sidebar = () => {
  const { role } = useRole();
  const pathname = usePathname();
  const router = useRouter();

  if (role === 'public') return null;

  const items = menuItems[role as keyof typeof menuItems] || [];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[240px] nexus-sidebar p-4 flex flex-col gap-2 z-40">
      <div className="px-4 py-3 mb-2 border-b border-border-light">
        <h3 className="text-xs font-bold text-primary-900 uppercase tracking-widest">
          Main Menu
        </h3>
      </div>
      {items.map((item) => {
        const isActive = pathname === item.path;
        return (
          <button
            key={item.name}
            onClick={() => router.push(item.path)}
            className={cn(
              "group flex items-center gap-3 px-4 py-3 rounded-[6px] transition-all relative w-full overflow-hidden text-left",
              isActive 
                ? 'bg-primary-100 text-primary-900 font-bold border border-border-light' 
                : 'text-primary-700 hover:bg-primary-100 hover:text-primary-900'
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary-900" />
            )}
            <item.icon className={cn(
              "w-4 h-4",
              isActive ? 'text-primary-900' : 'text-primary-600 group-hover:text-primary-900'
            )} />
            <span className="text-sm">{item.name}</span>
          </button>
        );
      })}
    </aside>
  );
};
