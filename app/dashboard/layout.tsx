"use client";

import { AceternitySidebar } from "@/components/aceternity-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAccount } from "wagmi";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const { isConnected } = useAccount();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Please connect your wallet to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 flex">
        <AceternitySidebar email={user?.email} />
        <main className="flex-1 p-6 overflow-auto h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
