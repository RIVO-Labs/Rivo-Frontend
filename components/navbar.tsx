'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuth } from '@/hooks/useAuth';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAccount, useChainId } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { useIDRXBalance } from '@/hooks/useIDRXApproval';

export function Navbar() {
  const { user, logout, isAuthenticated, isProfileComplete } = useAuth();
  const isVendor = user?.role === 'vendor';
  const logoSrc = '/RivoLogo.png';
  const { address } = useAccount();
  const chainId = useChainId();
  const { balanceFormatted } = useIDRXBalance(address as `0x${string}` | undefined);

  const formatAddress = (addr?: string) => {
    if (!addr) return 'Wallet';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const networkLabel = chainId === baseSepolia.id ? baseSepolia.name : `Chain ${chainId}`;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center gap-2 -ml-1">
              <img src={logoSrc} alt="Rivo logo" className="h-9 w-9" />
              <div className="hidden sm:block">
                <div className="text-xl font-bold bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                  Rivo
                </div>
                <div className="text-xs text-muted-foreground">Work Agreement Platform</div>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex gap-6">
            {/* <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Home
            </Link> */}
            {isAuthenticated && isProfileComplete && (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>

                {/* Role-specific navigation */}
                {isVendor ? (
                  <>
                    <Link
                      href="/dashboard/invoices"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Invoices
                    </Link>
                    <Link
                      href="/dashboard/payments"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Payments
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Settings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard/invoices"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Invoices
                    </Link>
                    <Link
                      href="/dashboard/suppliers"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Suppliers
                    </Link>
                    <Link
                      href="/dashboard/employees"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Employees
                    </Link>
                    <Link
                      href="/dashboard/payments"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Payments
                    </Link>
                    <Link
                      href="/dashboard/analytics"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Analytics
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Settings
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {(user?.businessName || user?.username) && (
                <span className="text-sm hidden lg:inline">
                  {user.businessName || user.username}
                </span>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {formatAddress(address)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    Network: {networkLabel}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    Balance: {balanceFormatted} IDRX
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <ConnectWalletButton />
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
