'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuth } from '@/hooks/useAuth';
import { useUnlock } from '@/hooks/useUnlock';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { RiLockLine, RiLockUnlockLine } from 'react-icons/ri';

export function Navbar() {
  const { user, logout, isAuthenticated, isProfileComplete } = useAuth();
  const { isUnlocked, isUnlocking, unlockEncryption, lock } = useUnlock();
  const isFreelancer = user?.role === 'freelancer';
  const logoSrc = '/Rivologo.png';

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
                {isFreelancer ? (
                  <>
                    <Link
                      href="/dashboard/agreements"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      My Agreements
                    </Link>
                    <Link
                      href="/dashboard/payments"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Earnings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard/agreements"
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      Team Agreements
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
              {user?.username && (
                <span className="text-sm hidden lg:inline">
                  {user.username}
                </span>
              )}
              {isProfileComplete && (
                <>
                  {/* Unlock/Lock Encryption Button */}
                  {isUnlocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={lock}
                      title="Click to lock encryption (key will persist until logout)"
                      className="text-green-600 hover:text-green-700 border-green-600/20"
                    >
                      <RiLockUnlockLine className="h-4 w-4 mr-1" />
                      Unlocked
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={unlockEncryption}
                      disabled={isUnlocking}
                      title="Sign to unlock private data encryption"
                    >
                      <RiLockLine className="h-4 w-4 mr-1" />
                      {isUnlocking ? "Unlocking..." : "Unlock"}
                    </Button>
                  )}

                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/profile">Profile</Link>
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                Log out
              </Button>
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
