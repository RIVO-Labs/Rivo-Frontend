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
  RiAddCircleLine,
  RiMessage2Line,
  RiSettings4Line,
  RiLogoutBoxLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiInfoCardFill,
  RiMapPinLine,
  RiBarChartBoxLine,
  RiLineChartLine,
  RiDashboardLine,
  RiDatabase2Line,
  RiEyeLine,
  RiReceiptLine,
  RiFileList3Line,
  RiLockLine,
  RiTeamLine,
  RiWalletLine,
} from 'react-icons/ri';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

// Freelancer navigation items
const freelancerNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <RiHomeLine className="h-5 w-5" />,
  },
  {
    title: 'My Agreements',
    href: '/dashboard/agreements',
    icon: <RiFileList3Line className="h-5 w-5" />,
  },
  {
    title: 'Messages',
    href: '/dashboard/messages',
    icon: <RiMessage2Line className="h-5 w-5" />,
  },
  {
    title: 'Earnings',
    href: '/dashboard/payments',
    icon: <RiWalletLine className="h-5 w-5" />,
  },
  {
    title: 'Profile',
    href: '/dashboard/profile',
    icon: <RiInfoCardFill className="h-5 w-5" />,
  },
];

// Company navigation items
const companyNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <RiHomeLine className="h-5 w-5" />,
  },
  {
    title: 'Team Agreements',
    href: '/dashboard/agreements',
    icon: <RiFileList3Line className="h-5 w-5" />,
  },
  {
    title: 'Messages',
    href: '/dashboard/messages',
    icon: <RiMessage2Line className="h-5 w-5" />,
  },
  {
    title: 'Payments',
    href: '/dashboard/payments',
    icon: <RiReceiptLine className="h-5 w-5" />,
  },
  {
    title: 'Profile',
    href: '/dashboard/profile',
    icon: <RiInfoCardFill className="h-5 w-5" />,
  },
];

export function AceternitySidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { logout, user } = useAuth();
  const isFreelancer = user?.role === 'freelancer';
  const logoSrc = '/Rivologo.png';

  // Use user email if available, otherwise use prop
  const displayEmail = user?.email || email;

  // Get role-specific navigation items
  const navItems = isFreelancer ? freelancerNavItems : companyNavItems;

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
