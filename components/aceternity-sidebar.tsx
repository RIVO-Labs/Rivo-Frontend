'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoleBadge } from '@/components/role-badge';
import { useAuth } from '@/hooks/useAuth';
import {
  RiHomeLine,
  RiQrCodeLine,
  RiTeamLine,
  RiStore2Line,
  RiLineChartLine,
  RiSettings4Line,
  RiLogoutBoxLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiInfoCardFill,
  RiMoneyDollarCircleLine,
  RiFileTextLine,
  RiUserLine,
} from 'react-icons/ri';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

// RIVO main navigation items
const rivoNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <RiHomeLine className="h-5 w-5" />,
  },
  {
    title: 'QR Invoices',
    href: '/dashboard/invoices',
    icon: <RiQrCodeLine className="h-5 w-5" />,
  },
  {
    title: 'Payroll',
    href: '/dashboard/payroll',
    icon: <RiTeamLine className="h-5 w-5" />,
  },
  {
    title: 'Suppliers',
    href: '/dashboard/suppliers',
    icon: <RiStore2Line className="h-5 w-5" />,
  },
  {
    title: 'Employees',
    href: '/dashboard/employees',
    icon: <RiUserLine className="h-5 w-5" />,
  },
  {
    title: 'Payments',
    href: '/dashboard/payments',
    icon: <RiMoneyDollarCircleLine className="h-5 w-5" />,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: <RiLineChartLine className="h-5 w-5" />,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: <RiSettings4Line className="h-5 w-5" />,
  },
];

export function AceternitySidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { logout, user } = useAuth();
  const logoSrc = '/Rivologo.png';

  // Use user email if available, otherwise use prop
  const displayEmail = user?.email || email;

  // Use unified RIVO navigation
  const navItems = rivoNavItems;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="relative justify-between flex flex-col pb-20">
      <motion.div
        initial={{ width: '16rem' }}
        animate={{ width: isCollapsed ? '5rem' : '16rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className=" border-r bg-background relative flex-1"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border shadow-md bg-background"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <RiArrowRightSLine className="h-3 w-3" />
          ) : (
            <RiArrowLeftSLine className="h-3 w-3" />
          )}
        </Button>

        <ScrollArea className="h-full py-6 flex flex-col">
          <div className="px-3 py-2">

            {/* Role Badge */}
            {!isCollapsed && (
              <div className="mb-4 px-4">
                <RoleBadge className="w-full justify-center" />
              </div>
            )}

            <div className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      isCollapsed && 'justify-center px-2',
                    )}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="ml-2">{item.title}</span>}
                  </Button>
                </Link>
              ))}
            </div>
          </div>{' '}
          <div className="mt-auto px-3 py-2">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-muted-foreground',
                isCollapsed && 'justify-center px-2',
              )}
              onClick={handleLogout}
            >
              <RiLogoutBoxLine className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Log out</span>}
            </Button>
          </div>
        </ScrollArea>
      </motion.div>
      {displayEmail && !isCollapsed ? (
        <div className="p-4">
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Signed in as:</p>
            <p className="text-xs opacity-80 truncate">{displayEmail}</p>
          </div>
        </div>
      ) : displayEmail && isCollapsed ? (
        <div className="p-4 mb-4 bg-muted rounded-full w-fit mx-auto">
          <p>{displayEmail[0].toUpperCase()}</p>
        </div>
      ) : null}
    </div>
  );
}
