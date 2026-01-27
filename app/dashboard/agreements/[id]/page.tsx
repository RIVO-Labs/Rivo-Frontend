'use client';

import { use, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSingleAgreement } from '@/hooks/useAgreements';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAgreementDispute } from '@/hooks/useDisputeEvents';
import { useEncryptionPublicKey, useProfileCID, useSetEncryptionPublicKey, useSetProfileCID } from '@/hooks/useRivoHub';
import { fetchProfileFromIPFS, uploadEncryptedProfileToIPFS, isPinataConfigured, type UserProfileMetadata } from '@/lib/ipfs/pinata';
import { generatePassphrase } from '@/lib/ipfs/encryption';
import { encryptPassphraseForWallet } from '@/lib/ipfs/wallet-encryption';
import { storeWalletIPFSMapping } from '@/lib/ipfs/storage';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  ExternalLink,
  User,
  Building2,
  Wallet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { OpenDisputeDialog } from '@/components/dialogs/open-dispute-dialog';
import { ToastAction } from '@/components/ui/toast';
import { usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/lib/web3/contracts';

export default function AgreementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user } = useAuth();
  const { toast } = useToast();
  const publicClient = usePublicClient();
  const { agreement, isLoading, refetch } = useSingleAgreement(id);
  const { dispute } = useAgreementDispute(id, agreement?.status === 'disputed');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<UserProfileMetadata | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<UserProfileMetadata | null>(null);
  const [companyProfileStatus, setCompanyProfileStatus] = useState<'idle' | 'loading' | 'available' | 'unavailable'>('idle');
  const [freelancerProfileStatus, setFreelancerProfileStatus] = useState<'idle' | 'loading' | 'available' | 'unavailable'>('idle');
  const [companyProfileReason, setCompanyProfileReason] = useState<string>('');
  const [freelancerProfileReason, setFreelancerProfileReason] = useState<string>('');
  const viewerAddress = user?.address;
  const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';
  const [companyDecrypting, setCompanyDecrypting] = useState(false);
  const [freelancerDecrypting, setFreelancerDecrypting] = useState(false);
  const [isSharingProfile, setIsSharingProfile] = useState(false);
  const [lastSharedRole, setLastSharedRole] = useState<'company' | 'freelancer' | null>(null);
  const { key: viewerEncryptionKey } = useEncryptionPublicKey(viewerAddress as `0x${string}` | undefined);
  const { setEncryptionPublicKey } = useSetEncryptionPublicKey();
  const {
    setProfileCID,
    isPending: isProfilePending,
    isConfirming: isProfileConfirming,
    isSuccess: isProfileSuccess,
  } = useSetProfileCID();
  const { cid: companyProfileCid, refetch: refetchCompanyProfileCid } = useProfileCID(
    agreement?.companyWallet as `0x${string}` | undefined,
  );
  const { cid: freelancerProfileCid, refetch: refetchFreelancerProfileCid } = useProfileCID(
    agreement?.freelancerWallet as `0x${string}` | undefined,
  );

  const explainUnavailable = async (cid: string, address: string) => {
    try {
      console.info('[profile] explainUnavailable:start', { cid, address });
      const response = await fetch(`https://${pinataGateway}/ipfs/${cid}`);
      if (!response.ok) {
        console.warn('[profile] explainUnavailable:ipfs_not_ok', {
          cid,
          status: response.status,
          statusText: response.statusText,
        });
        return 'Profile cannot be reached on IPFS.';
      }

      const raw = await response.text();
      let payload: any;
      try {
        payload = JSON.parse(raw);
      } catch (error) {
        console.warn('[profile] explainUnavailable:invalid_json', { cid, error });
        return 'Profile data is invalid. Ask them to update their profile again.';
      }
      if (payload?.type === 'encrypted-profile') {
        const recipients = Array.isArray(payload.recipients)
          ? payload.recipients.map((recipient: string) => recipient.toLowerCase())
          : [];
        const addressKey = address.toLowerCase();

        if (!recipients.includes(addressKey)) {
          if (!viewerEncryptionKey) {
            return 'Publish your key first so profiles can be shared. Ask them to update their profile after you publish.';
          }
          return 'Profile is encrypted and not shared with your wallet yet. Ask them to update their profile.';
        }

        return 'Failed to decrypt. The key may be outdated. Ask them to update their key and profile.';
      }

      return 'Profile could not be read from IPFS.';
    } catch (error) {
      console.error('[profile] explainUnavailable:error', { cid, error });
      return 'Failed to load profile from IPFS.';
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function setInitialProfileState(
      cid: string | undefined,
      targetAddress: string | undefined,
      setProfile: (profile: UserProfileMetadata | null) => void,
      setStatus: (status: 'idle' | 'loading' | 'available' | 'unavailable') => void,
      setReason: (reason: string) => void,
    ) {
      if (!cid || !viewerAddress) {
        setStatus('unavailable');
        setReason(!cid ? 'Profile has not been shared yet.' : 'Connect your wallet to view the profile.');
        return;
      }

      if (
        targetAddress &&
        user &&
        targetAddress.toLowerCase() === viewerAddress.toLowerCase()
      ) {
        const authProfile = user as {
          username?: string;
          email?: string;
          firstName?: string;
          lastName?: string;
          role?: 'freelancer' | 'company';
          createdAt?: string;
          updatedAt?: string;
        };
        setProfile({
          username: authProfile.username || '',
          email: authProfile.email || '',
          firstName: authProfile.firstName || '',
          lastName: authProfile.lastName || '',
          role: authProfile.role || 'freelancer',
          walletAddress: viewerAddress,
          createdAt: authProfile.createdAt || new Date().toISOString(),
          updatedAt: authProfile.updatedAt,
        });
        setStatus('available');
        setReason('');
        return;
      }

      if (typeof window !== 'undefined' && window.ethereum?.request) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (Array.isArray(accounts) && accounts.length > 0) {
            const normalized = accounts.map((account) => account.toLowerCase());
            if (!normalized.includes(viewerAddress.toLowerCase())) {
              setStatus('unavailable');
              setReason(`Connect MetaMask with ${viewerAddress} to view this profile.`);
              return;
            }
          }
        } catch {
          // Ignore account lookup errors.
        }
      }

      setStatus('unavailable');
      setReason('Click "View Profile" to open the profile.');
    }

    setInitialProfileState(
      companyProfileCid,
      agreement?.companyWallet,
      setCompanyProfile,
      setCompanyProfileStatus,
      setCompanyProfileReason,
    );
    setInitialProfileState(
      freelancerProfileCid,
      agreement?.freelancerWallet,
      setFreelancerProfile,
      setFreelancerProfileStatus,
      setFreelancerProfileReason,
    );

    return () => {
      isMounted = false;
    };
  }, [companyProfileCid, freelancerProfileCid, viewerAddress, viewerEncryptionKey, pinataGateway, user, agreement?.companyWallet, agreement?.freelancerWallet]);

  useEffect(() => {
    if (!isProfileSuccess || !lastSharedRole) return;
    if (lastSharedRole === 'company') {
      refetchCompanyProfileCid();
    } else {
      refetchFreelancerProfileCid();
    }
    setLastSharedRole(null);
  }, [isProfileSuccess, lastSharedRole, refetchCompanyProfileCid, refetchFreelancerProfileCid]);

  const canAttemptDecrypt = (targetAddress?: string) => {
    if (!viewerAddress || !targetAddress) return false;
    return targetAddress.toLowerCase() !== viewerAddress.toLowerCase();
  };

  const handleDecryptProfile = async (
    cid: string | undefined,
    setProfile: (profile: UserProfileMetadata | null) => void,
    setStatus: (status: 'idle' | 'loading' | 'available' | 'unavailable') => void,
    setReason: (reason: string) => void,
    setDecrypting: (value: boolean) => void,
  ) => {
    if (!cid || !viewerAddress) return;
    if (typeof window === 'undefined' || !window.ethereum?.request) {
      toast({
        title: 'Wallet Unavailable',
        description: 'Connect MetaMask to decrypt this profile.',
        variant: 'destructive',
      });
      return;
    }
    let resolvedAccount = viewerAddress;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accountList = Array.isArray(accounts) ? (accounts as string[]) : [];
      const normalized = accountList.map((account) => account.toLowerCase());
      const activeAccount = normalized[0];
      if (activeAccount !== viewerAddress.toLowerCase()) {
        toast({
          title: 'Wrong Wallet Connected',
          description: `Switch MetaMask to ${viewerAddress} and try again.`,
          variant: 'destructive',
        });
        return;
      }
      resolvedAccount = accountList[0] || viewerAddress;
      if (!publicClient) {
        toast({
          title: 'Blockchain Unavailable',
          description: 'Unable to verify your encryption key on-chain.',
          variant: 'destructive',
        });
        return;
      }
      const [walletKey, onchainKey] = await Promise.all([
        window.ethereum.request({
          method: 'eth_getEncryptionPublicKey',
          params: [viewerAddress],
        }),
        publicClient.readContract({
          address: CONTRACTS.RivoHub.address,
          abi: CONTRACTS.RivoHub.abi,
          functionName: 'getEncryptionPublicKey',
          args: [viewerAddress as `0x${string}`],
        }),
      ]);
      if (typeof walletKey === 'string' && typeof onchainKey === 'string' && walletKey !== onchainKey) {
        toast({
          title: 'Encryption Key Mismatch',
          description: 'Your on-chain key is outdated. Publish your key again, then re-share the profile.',
          variant: 'destructive',
          action: (
            <ToastAction altText="Publish key" onClick={handlePublishEncryptionKey}>
              Publish Key
            </ToastAction>
          ),
        });
        return;
      }
    } catch (error) {
      toast({
        title: 'Wallet Connection Failed',
        description: error instanceof Error ? error.message : 'Unable to connect MetaMask.',
        variant: 'destructive',
      });
      return;
    }
    console.info('[profile] decrypt:start', { cid, viewerAddress: resolvedAccount });
    setDecrypting(true);
    setStatus('loading');

    const data = await fetchProfileFromIPFS(cid, resolvedAccount);

    if (data) {
      console.info('[profile] decrypt:success', { cid, viewerAddress: resolvedAccount });
      setProfile(data);
      setStatus('available');
      setReason('');
    } else {
      console.warn('[profile] decrypt:failed', { cid, viewerAddress: resolvedAccount });
      setProfile(null);
      setStatus('unavailable');
      const reason = await explainUnavailable(cid, resolvedAccount);
      setReason(reason);
    }

    setDecrypting(false);
  };

  const formatDisplayName = (profile: UserProfileMetadata | null) => {
    if (!profile) return 'Profile unavailable';
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    return fullName || profile.username || 'Profile available';
  };

  const handlePublishEncryptionKey = async () => {
    if (!viewerAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Connect your wallet to publish your encryption key.',
        variant: 'destructive',
      });
      return;
    }

    if (typeof window === 'undefined' || !window.ethereum?.request) {
      toast({
        title: 'Wallet Unavailable',
        description: 'Your wallet does not support encryption keys.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const publicKey = await window.ethereum.request({
        method: 'eth_getEncryptionPublicKey',
        params: [viewerAddress],
      });

      if (typeof publicKey !== 'string') {
        throw new Error('Unexpected response from wallet.');
      }

      setEncryptionPublicKey(publicKey);
    } catch (error) {
      toast({
        title: 'Failed to Publish Key',
        description: error instanceof Error ? error.message : 'Unable to publish encryption key.',
        variant: 'destructive',
      });
    }
  };

  const handleShareProfile = async () => {
    if (!viewerAddress || !agreement) return;

    if (!isPinataConfigured()) {
      toast({
        title: 'Pinata Not Configured',
        description: 'Set Pinata environment variables before sharing profiles.',
        variant: 'destructive',
      });
      return;
    }

    if (!publicClient) {
      toast({
        title: 'Blockchain Unavailable',
        description: 'Unable to access blockchain client.',
        variant: 'destructive',
      });
      return;
    }
    if (typeof window === 'undefined' || !window.ethereum?.request) {
      toast({
        title: 'Wallet Unavailable',
        description: 'Connect MetaMask to share your profile.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const normalized = Array.isArray(accounts) ? accounts.map((account) => account.toLowerCase()) : [];
      const activeAccount = normalized[0];
      if (activeAccount !== viewerAddress.toLowerCase()) {
        toast({
          title: 'Wrong Wallet Connected',
          description: `Switch MetaMask to ${viewerAddress} and try again.`,
          variant: 'destructive',
        });
        return;
      }
    } catch (error) {
      toast({
        title: 'Wallet Connection Failed',
        description: error instanceof Error ? error.message : 'Unable to connect MetaMask.',
        variant: 'destructive',
      });
      return;
    }

    const counterpartyWallet =
      viewerAddress.toLowerCase() === agreement.companyWallet.toLowerCase()
        ? agreement.freelancerWallet
        : agreement.companyWallet;
    const roleForShare =
      viewerAddress.toLowerCase() === agreement.companyWallet.toLowerCase() ? 'company' : 'freelancer';
    console.info('[profile] share:start', { viewerAddress, counterpartyWallet, roleForShare });

    const storedProfile = localStorage.getItem(`user_${viewerAddress}`);
    let storedData: Partial<UserProfileMetadata> = {};
    if (storedProfile) {
      try {
        storedData = JSON.parse(storedProfile);
      } catch {
        storedData = {};
      }
    }

    const authProfile = user as {
      username?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: 'freelancer' | 'company';
      createdAt?: string;
    };
    const profileData: UserProfileMetadata = {
      username: authProfile.username || storedData.username || '',
      email: authProfile.email || storedData.email || '',
      firstName: authProfile.firstName || storedData.firstName || '',
      lastName: authProfile.lastName || storedData.lastName || '',
      role: authProfile.role || 'freelancer',
      walletAddress: viewerAddress,
      createdAt: storedData.createdAt || authProfile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!profileData.username || !profileData.email) {
      console.warn('[profile] share:incomplete_profile', { viewerAddress });
      toast({
        title: 'Profile Incomplete',
        description: 'Complete your profile before sharing.',
        variant: 'destructive',
      });
      return;
    }

    setIsSharingProfile(true);

    try {
      const walletKey = await window.ethereum.request({
        method: 'eth_getEncryptionPublicKey',
        params: [viewerAddress],
      });
      if (typeof walletKey !== 'string' || walletKey.length === 0) {
        throw new Error('Unable to access your encryption key.');
      }

      const counterpartyKey = await publicClient.readContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: 'getEncryptionPublicKey',
        args: [counterpartyWallet as `0x${string}`],
      });

      if (typeof counterpartyKey !== 'string' || counterpartyKey.length === 0) {
        console.warn('[profile] share:missing_counterparty_key', { counterpartyWallet });
        toast({
          title: 'Counterparty Key Missing',
          description: 'Ask your counterparty to publish their encryption key first.',
          variant: 'destructive',
        });
        return;
      }

      const recipients = [viewerAddress.toLowerCase(), counterpartyWallet.toLowerCase()];
      const passphrase = generatePassphrase();
      const encryptedPassphrases: Record<string, ReturnType<typeof encryptPassphraseForWallet>> = {};

      encryptedPassphrases[viewerAddress.toLowerCase()] = encryptPassphraseForWallet(walletKey, passphrase);
      encryptedPassphrases[counterpartyWallet.toLowerCase()] = encryptPassphraseForWallet(counterpartyKey, passphrase);

      const ipfsCID = await uploadEncryptedProfileToIPFS(
        profileData,
        passphrase,
        encryptedPassphrases,
        recipients,
      );
      console.info('[profile] share:ipfs_uploaded', { ipfsCID });

      storeWalletIPFSMapping(viewerAddress, ipfsCID);
      setProfileCID(ipfsCID);
      setLastSharedRole(roleForShare);

      toast({
        title: 'Profile Shared',
        description: 'Your profile is now available to this counterparty.',
      });
    } catch (error) {
      console.error('Failed to share profile:', error);
      toast({
        title: 'Share Failed',
        description: error instanceof Error ? error.message : 'Unable to share profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSharingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agreement details...</p>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Agreement Not Found</h2>
        <p className="text-muted-foreground">The agreement you're looking for doesn't exist.</p>
        <Link href="/dashboard/agreements">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agreements
          </Button>
        </Link>
      </div>
    );
  }

  const isCompany = user?.role === 'company';
  const isFreelancer = user?.role === 'freelancer';
  const canOpenDispute =
    (isCompany || isFreelancer) &&
    agreement.status !== 'completed' &&
    agreement.status !== 'cancelled' &&
    agreement.status !== 'created' &&
    agreement.status !== 'disputed';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'accepted':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'proposed':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'funded':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'created':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'disputed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'proposed':
        return <Clock className="h-4 w-4" />;
      case 'funded':
        return <DollarSign className="h-4 w-4" />;
      case 'created':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'disputed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agreements">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{agreement.projectName}</h1>
            <p className="text-muted-foreground">Agreement #{agreement.id}</p>
          </div>
        </div>
        <Badge variant="outline" className={getStatusColor(agreement.status)}>
          {getStatusIcon(agreement.status)}
          <span className="ml-2 capitalize">{agreement.status}</span>
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - Spans 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Project Description */}
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {agreement.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>

          {/* Proof of Work */}
          {agreement.currentProofURI && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submitted Proof of Work
                </CardTitle>
                <CardDescription>
                  {agreement.status === 'proposed' && isCompany && 'Review the submitted work'}
                  {agreement.status === 'proposed' && isFreelancer && 'Waiting for company review'}
                  {agreement.status === 'accepted' && 'Work has been accepted'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">IPFS Document</span>
                  </div>

                  <div className="bg-background rounded p-3 break-all border">
                    <p className="text-xs font-mono text-muted-foreground">
                      {agreement.currentProofURI}
                    </p>
                  </div>

                  <Link
                    href={agreement.currentProofURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Proof in New Tab
                  </Link>
                </div>

                {agreement.status === 'proposed' && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex gap-2">
                      <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        {isCompany && (
                          <p><strong>Action Required:</strong> Please review the submitted work and either accept or reject it.</p>
                        )}
                        {isFreelancer && (
                          <p><strong>Pending Review:</strong> Waiting for the company to review your submission.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {agreement.status === 'accepted' && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="text-sm text-green-800 dark:text-green-200">
                        <p><strong>Work Accepted:</strong> {isFreelancer ? 'You can now claim your payment.' : 'Freelancer can claim payment.'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Proof Submitted */}
          {!agreement.currentProofURI && agreement.status === 'funded' && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isFreelancer && 'No proof submitted yet. Submit your work when ready.'}
                  {isCompany && 'Waiting for freelancer to submit proof of work.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">${agreement.totalBudget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Released</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${agreement.amountReleased.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Progress</span>
                  <span className="font-medium">
                    {agreement.totalBudget > 0
                      ? Math.round((agreement.amountReleased / agreement.totalBudget) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${
                        agreement.totalBudget > 0
                          ? (agreement.amountReleased / agreement.totalBudget) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Escrow Balance</p>
                  <p className="text-lg font-semibold">${agreement.escrowAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Payment</p>
                  <p className="text-lg font-semibold text-blue-600">
                    ${agreement.nextPayment.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agreement Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agreement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Payment Type</p>
                <Badge variant="outline" className="capitalize">
                  {agreement.type}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-muted-foreground mb-1">Deadline</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{agreement.nextPaymentDate}</span>
                </div>
              </div>

              {agreement.type === 'milestone' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1">Milestone Progress</p>
                    <p className="font-medium">
                      {agreement.currentMilestone} / {agreement.totalMilestones}
                    </p>
                  </div>
                </>
              )}

              {agreement.type === 'monthly' && agreement.monthlyRate > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1">Monthly Rate</p>
                    <p className="font-medium">${agreement.monthlyRate.toLocaleString()}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>


          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Company Wallet</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wallet className="h-3 w-3" />
                  <span className="font-mono break-all">{agreement.companyWallet}</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {companyProfileStatus === 'loading' ? 'Loading profile...' : formatDisplayName(companyProfile)}
                  </p>
                  {companyProfile?.email && <p>{companyProfile.email}</p>}
                  {companyProfileStatus === 'unavailable' && (
                    <>
                      <p>{companyProfileReason || 'Profile not available.'}</p>
                      {canAttemptDecrypt(agreement?.companyWallet) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() =>
                            handleDecryptProfile(
                              companyProfileCid,
                              setCompanyProfile,
                              setCompanyProfileStatus,
                              setCompanyProfileReason,
                              setCompanyDecrypting,
                            )
                          }
                          disabled={companyDecrypting || !companyProfileCid}
                        >
                          {companyDecrypting ? 'Opening...' : 'View Profile'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Freelancer Wallet</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wallet className="h-3 w-3" />
                  <span className="font-mono break-all">{agreement.freelancerWallet}</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {freelancerProfileStatus === 'loading' ? 'Loading profile...' : formatDisplayName(freelancerProfile)}
                  </p>
                  {freelancerProfile?.email && <p>{freelancerProfile.email}</p>}
                  {freelancerProfileStatus === 'unavailable' && (
                    <>
                      <p>{freelancerProfileReason || 'Profile not available.'}</p>
                      {canAttemptDecrypt(agreement?.freelancerWallet) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() =>
                            handleDecryptProfile(
                              freelancerProfileCid,
                              setFreelancerProfile,
                              setFreelancerProfileStatus,
                              setFreelancerProfileReason,
                              setFreelancerDecrypting,
                            )
                          }
                          disabled={freelancerDecrypting || !freelancerProfileCid}
                        >
                          {freelancerDecrypting ? 'Opening...' : 'View Profile'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {(isCompany || isFreelancer) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile</CardTitle>
                <CardDescription>Share your profile for this agreement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={handleShareProfile}
                    disabled={isSharingProfile || isProfilePending || isProfileConfirming}
                  >
                    {isSharingProfile
                      ? 'Sharing...'
                      : isProfilePending || isProfileConfirming
                        ? 'Publishing Profile...'
                        : 'Share My Profile'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Make sure MetaMask is connected to this site and the correct account.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {(isCompany || isFreelancer) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2"
                  onClick={() => setDisputeOpen(true)}
                  disabled={!canOpenDispute}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Open Dispute
                </Button>
                {!canOpenDispute && (
                  <p className="text-xs text-muted-foreground">
                    Disputes can only be opened for active agreements.
                  </p>
                )}
                {agreement.status === 'disputed' && (
                  <div className="rounded-lg border border-destructive/30 p-3 text-sm space-y-2">
                    <p className="font-medium text-destructive">Dispute Information</p>
                    <div>
                      <p className="text-muted-foreground mb-1">Reason</p>
                      <p className="font-medium">
                        {dispute?.reason || 'Reason not available.'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Opened At</p>
                      <p className="font-medium">
                        {dispute?.timestamp ? new Date(dispute.timestamp).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Arbitrator</p>
                      <p className="font-mono text-xs break-all text-muted-foreground">
                        {agreement.arbitrator}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      <OpenDisputeDialog
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        agreementId={agreement.id}
        agreementTitle={agreement.projectName}
        otherPartyName={isCompany ? agreement.freelancer : agreement.company}
        arbitratorAddress={agreement.arbitrator}
        onSuccess={refetch}
      />
    </div>
  );
}
