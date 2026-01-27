'use client';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FreelancerDashboard } from '@/components/freelancer-dashboard';
import { CompanyDashboard } from '@/components/company-dashboard';
import { useUserAgreementsList } from '@/hooks/useAgreements';
import { useAccount } from 'wagmi';

export default function DashboardPage() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isConnected } = useAccount();
  const isFreelancer = user?.role === 'freelancer';

  // Fetch agreements from blockchain
  const { agreements, isLoading: isLoadingAgreements, refetch } = useUserAgreementsList();

  // Show loading state while auth is loading or agreements are loading
  if (isAuthLoading || isLoadingAgreements) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show connect wallet message if not connected
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

  // Render role-specific dashboard
  return (
    <>
      {isFreelancer ? (
        <FreelancerDashboard agreements={agreements} onRefresh={refetch} />
      ) : (
        <CompanyDashboard agreements={agreements} onRefresh={refetch} />
      )}
    </>
  );
}
