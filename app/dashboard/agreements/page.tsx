'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowDownCircle, ArrowUpCircle, Lock, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useUserAgreementsList } from '@/hooks/useAgreements';
import { useCancelAgreement, useCreateAgreement, useDepositAgreement, useFeeConfig } from '@/hooks/useRivoHub';
import { SubmitWorkDialog } from '@/components/submit-work-dialog';
import { ReviewWorkDialog } from '@/components/review-work-dialog';
import { ReleasePaymentDialog } from '@/components/release-payment-dialog';
import { isAddress, parseUnits } from 'viem';
import { useAuth } from '@/hooks/useAuth';
import type { Agreement } from '@/types/user';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { hassufficientAllowance, useApproveUSDC, useUSDCAllowance } from '@/hooks/useUSDCApproval';

const DEFAULT_ARBITRATOR_ADDRESS =
  process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS ?? '0xBc861Aa65DcaF788e1fd7daD97A428f221b4120F';
const DEFAULT_TOKEN_ADDRESS = '0xadCf27CB81007962F01E543e2984fdbf299742d6';
const MIN_TOTAL_BUDGET_USDC = 2;

export default function AgreementsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const { agreements, isLoading, refetch } = useUserAgreementsList();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [agreementIdInput, setAgreementIdInput] = useState('');
  const [pendingDepositId, setPendingDepositId] = useState<number | null>(null);
  const [submitWorkOpen, setSubmitWorkOpen] = useState(false);
  const [releasePaymentOpen, setReleasePaymentOpen] = useState(false);
  const [reviewWorkOpen, setReviewWorkOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    freelancerAddress: '',
    arbitratorAddress: '',
    totalBudget: '',
    contractDuration: '', // For Monthly: duration in months (UI only)
    paymentType: '0', // 0: OneTime, 1: Milestone, 2: Payroll
    milestoneCount: '1',
    projectName: '',
    description: '',
    milestoneDeadlines: '',
  });

  const {
    createAgreement,
    isPending: isCreatePending,
    isConfirming: isCreateConfirming,
    isSuccess: isCreateSuccess,
  } = useCreateAgreement();
  const {
    cancelAgreement,
    isPending: isCancelPending,
    isConfirming: isCancelConfirming,
    isSuccess: isCancelSuccess,
  } = useCancelAgreement();
  const {
    deposit,
    isPending: isDepositPending,
    isConfirming: isDepositConfirming,
    isSuccess: isDepositSuccess,
  } = useDepositAgreement();
  const { approve, isPending: isApprovePending, isConfirming: isApproveConfirming, isSuccess: isApproveSuccess } =
    useApproveUSDC();
  const { feeBps, minFeeUsd, maxFeeUsd } = useFeeConfig();
  const depositableAgreements = useMemo(() => agreements.filter((agr) => agr.status === 'created'), [agreements]);
  const selectedDepositAgreement = useMemo(
    () => depositableAgreements.find((agr) => String(agr.id) === agreementIdInput),
    [depositableAgreements, agreementIdInput]
  );
  const { allowance, refetch: refetchAllowance } = useUSDCAllowance(
    selectedDepositAgreement?.token as `0x${string}` | undefined,
    address
  );
  const feeRate = feeBps != null ? feeBps : null;
  const minFeeUsdValue = minFeeUsd ?? null;
  const maxFeeUsdValue = maxFeeUsd ?? null;
  const formatEscrowUsd = (value: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value);
  const depositAmount = selectedDepositAgreement?.totalBudget ?? 0;
  const rawFee = feeRate !== null ? (depositAmount * feeRate) / 10000 : null;
  let estimatedFee = rawFee;
  if (estimatedFee !== null && minFeeUsdValue !== null) {
    estimatedFee = Math.max(estimatedFee, minFeeUsdValue);
  }
  if (estimatedFee !== null && maxFeeUsdValue !== null) {
    estimatedFee = Math.min(estimatedFee, maxFeeUsdValue);
  }
  const estimatedTotal = estimatedFee !== null ? depositAmount + estimatedFee : null;
  const requiredAmount =
    selectedDepositAgreement && estimatedTotal !== null ? parseUnits(estimatedTotal.toFixed(6), 6) : BigInt(0);
  const needsApproval = selectedDepositAgreement ? !hassufficientAllowance(allowance, requiredAmount) : false;
  const resolvedArbitratorAddress =
    formData.arbitratorAddress.trim().length > 0 ? formData.arbitratorAddress.trim() : DEFAULT_ARBITRATOR_ADDRESS;
  const paymentTypeLabel =
    formData.paymentType === '0' ? 'One-time' : formData.paymentType === '1' ? 'Milestone' : 'Monthly Payroll';
  const formatUsd = (value: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(value);
  const parsedTotalBudget = Number(formData.totalBudget);
  const parsedDuration = Number(formData.contractDuration);
  const canShowMonthlyRate =
    formData.paymentType === '2' && Number.isFinite(parsedTotalBudget) && parsedTotalBudget > 0 && parsedDuration > 0;
  const monthlyRateDisplay = canShowMonthlyRate ? formatUsd(parsedTotalBudget / parsedDuration) : null;
  const totalBudgetDisplay = Number.isFinite(parsedTotalBudget) && parsedTotalBudget > 0 ? formatUsd(parsedTotalBudget) : null;

  const parseDDMMYYYY = (dateStr: string): number | null => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 2000) return null;

    const date = new Date(year, month, day);
    const timestamp = Math.floor(date.getTime() / 1000);
    return !isNaN(timestamp) && timestamp > 0 ? timestamp : null;
  };

  const getDeadlineValidation = () => {
    const nowTimestamp = Math.floor(Date.now() / 1000);

    if (formData.paymentType === '2') {
      return { deadlines: [] as bigint[] };
    }

    if (!formData.milestoneDeadlines.trim()) {
      return { deadlines: [], deadlineError: 'Please provide deadline(s).' };
    }

    if (formData.paymentType === '0') {
      const timestamp = parseDDMMYYYY(formData.milestoneDeadlines.trim());
      if (!timestamp) {
        return { deadlines: [], deadlineError: 'Invalid deadline date. Use DD-MM-YYYY (e.g., 31-12-2025).' };
      }
      if (timestamp <= nowTimestamp) {
        return { deadlines: [], deadlineError: 'Deadline must be in the future.' };
      }
      return { deadlines: [BigInt(timestamp)] };
    }

    const rawDeadlines = formData.milestoneDeadlines
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const parsedDeadlines = rawDeadlines.map((d) => ({
      input: d,
      timestamp: parseDDMMYYYY(d),
    }));

    if (parsedDeadlines.some((d) => d.timestamp === null)) {
      return { deadlines: [], deadlineError: 'One or more deadlines are invalid. Use DD-MM-YYYY format.' };
    }

    if (parsedDeadlines.some((d) => (d.timestamp as number) <= nowTimestamp)) {
      return { deadlines: [], deadlineError: 'All deadlines must be in the future.' };
    }

    const expectedCount = parseInt(formData.milestoneCount, 10);
    if (Number.isNaN(expectedCount) || expectedCount < 1) {
      return { deadlines: [], countError: 'Milestone count must be at least 1.' };
    }

    if (parsedDeadlines.length !== expectedCount) {
      return {
        deadlines: [],
        countError: `Number of deadlines (${parsedDeadlines.length}) must match milestone count (${expectedCount}).`,
      };
    }

    return { deadlines: parsedDeadlines.map((d) => BigInt(d.timestamp as number)) };
  };

  const getValidationErrors = () => {
    const errors: Record<string, string> = {};

    if (formData.projectName.trim().length === 0) {
      errors.projectName = 'Project name is required.';
    }

    if (formData.freelancerAddress.trim().length === 0) {
      errors.freelancerAddress = 'Freelancer address is required.';
    } else if (!isAddress(formData.freelancerAddress)) {
      errors.freelancerAddress = 'Freelancer wallet address is invalid.';
    }

    const budgetValue = parseFloat(formData.totalBudget);
    if (formData.totalBudget.trim().length === 0) {
      errors.totalBudget = 'Total budget is required.';
    } else if (Number.isNaN(budgetValue) || budgetValue <= 0) {
      errors.totalBudget = 'Total budget must be greater than zero.';
    } else if (budgetValue < MIN_TOTAL_BUDGET_USDC) {
      errors.totalBudget = `Total budget must be at least ${MIN_TOTAL_BUDGET_USDC} USDC.`;
    }

    if (formData.paymentType === '2') {
      const durationValue = parseInt(formData.contractDuration, 10);
      if (formData.contractDuration.trim().length === 0) {
        errors.contractDuration = 'Contract duration is required.';
      } else if (Number.isNaN(durationValue) || durationValue < 1) {
        errors.contractDuration = 'Contract duration must be at least 1 month.';
      }
    } else {
      const { deadlineError, countError } = getDeadlineValidation();
      if (deadlineError) {
        errors.milestoneDeadlines = deadlineError;
      }
      if (countError) {
        errors.milestoneCount = countError;
      }
    }

    if (formData.arbitratorAddress.trim().length > 0 && !isAddress(formData.arbitratorAddress.trim())) {
      errors.arbitratorAddress = 'Arbitrator wallet address is invalid.';
    }

    return errors;
  };

  const validationErrors = getValidationErrors();
  const canSubmit = Object.keys(validationErrors).length === 0;

  const handleSubmitWorkClick = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setSubmitWorkOpen(true);
  };

  const handleReleasePaymentClick = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setReleasePaymentOpen(true);
  };

  const handleReviewWorkClick = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setReviewWorkOpen(true);
  };

  // Handle successful creation
  useEffect(() => {
    if (isCreateSuccess) {
      toast({
        title: 'Agreement Created!',
        description: 'Your agreement has been deployed to the blockchain.',
      });
      setIsCreateOpen(false);
      refetch(); // Refresh agreements list
      // Reset form
      setFormData({
        freelancerAddress: '',
        arbitratorAddress: '',
        totalBudget: '',
        contractDuration: '',
        paymentType: '0',
        milestoneCount: '1',
        projectName: '',
        description: '',
        milestoneDeadlines: '',
      });
    }
  }, [isCreateSuccess, toast, refetch]);

  useEffect(() => {
    if (isCancelSuccess) {
      toast({
        title: 'Agreement Cancelled',
        description: 'The agreement has been cancelled.',
      });
      refetch();
    }
  }, [isCancelSuccess, toast, refetch]);

  useEffect(() => {
    const depositId = searchParams.get('deposit');
    if (!depositId || user?.role === 'freelancer') {
      return;
    }
    setAgreementIdInput(depositId);
    setIsDepositOpen(true);
  }, [searchParams, user?.role]);

  useEffect(() => {
    if (isDepositSuccess) {
      toast({
        title: 'Deposit confirmed',
        description: 'Funds have been locked in escrow.',
      });
      setIsDepositOpen(false);
      setAgreementIdInput('');
      refetch();
    }
  }, [isDepositSuccess, toast, refetch]);

  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      if (pendingDepositId !== null) {
        deposit(BigInt(pendingDepositId));
        setPendingDepositId(null);
      }
    }
  }, [isApproveSuccess, refetchAllowance, pendingDepositId, deposit]);

  const handleDeposit = () => {
    if (!agreementIdInput || agreementIdInput === 'none') {
      toast({
        title: 'Validation Error',
        description: 'Please select an agreement to deposit.',
        variant: 'destructive',
      });
      return;
    }
    const parsedId = Number(agreementIdInput);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid agreement ID.',
        variant: 'destructive',
      });
      return;
    }
    if (needsApproval) {
      setPendingDepositId(parsedId);
      handleApprove();
      return;
    }
    deposit(BigInt(parsedId));
  };

  const handleApprove = () => {
    if (!selectedDepositAgreement?.token) {
      toast({
        title: 'Token Missing',
        description: 'Token address is not available for this agreement.',
        variant: 'destructive',
      });
      return;
    }
    approve(selectedDepositAgreement.token as `0x${string}`);
  };

  const handleDepositClick = (agreementId: string) => {
    setAgreementIdInput(agreementId);
    setIsDepositOpen(true);
  };

  const handleCreateAgreement = async () => {
    try {
      if (!canSubmit) {
        toast({
          title: 'Validation Error',
          description: 'Please fix the highlighted fields before deploying.',
          variant: 'destructive',
        });
        return;
      }

      // Validate basic fields
      if (!formData.freelancerAddress || !formData.totalBudget || !formData.projectName) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      if (!isAddress(formData.freelancerAddress)) {
        toast({
          title: 'Validation Error',
          description: 'Freelancer wallet address is invalid.',
          variant: 'destructive',
        });
        return;
      }

      // Validate deadline is provided (except for Monthly/Payroll)
      if (formData.paymentType !== '2' && (!formData.milestoneDeadlines || formData.milestoneDeadlines.trim().length === 0)) {
        toast({
          title: 'Validation Error',
          description: 'Please provide deadline(s) for the agreement.',
          variant: 'destructive',
        });
        return;
      }

      // Validate contract duration for payroll type
      if (formData.paymentType === '2' && (!formData.contractDuration || formData.contractDuration === '0')) {
        toast({
          title: 'Validation Error',
          description: 'Contract duration is required for monthly payroll agreements.',
          variant: 'destructive',
        });
        return;
      }

      // Validate contract duration is at least 1 month
      if (formData.paymentType === '2') {
        const duration = parseInt(formData.contractDuration);
        if (isNaN(duration) || duration < 1) {
          toast({
            title: 'Validation Error',
            description: 'Contract duration must be at least 1 month.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Parse milestone deadlines
      let milestoneDeadlines: bigint[] = [];
      const { deadlines, deadlineError, countError } = getDeadlineValidation();
      if (deadlineError) {
        toast({
          title: 'Validation Error',
          description: deadlineError,
          variant: 'destructive',
        });
        return;
      }
      if (countError) {
        toast({
          title: 'Validation Error',
          description: countError,
          variant: 'destructive',
        });
        return;
      }
      milestoneDeadlines = deadlines;

      // Validate at least one deadline for non-Monthly agreements
      if (formData.paymentType !== '2' && milestoneDeadlines.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'At least one valid deadline is required.',
          variant: 'destructive',
        });
        return;
      }

      // Calculate monthly rate for Monthly Payroll
      // monthlyRate = totalBudget / contractDuration (BigInt floor division)
      let monthlyRateWei = BigInt(0);
      if (formData.paymentType === '2') {
        const totalBudgetWei = parseUnits(formData.totalBudget, 6);
        const duration = BigInt(parseInt(formData.contractDuration));
        monthlyRateWei = totalBudgetWei / duration; // Floor division automatically

        // Validate monthly rate is not zero
        if (monthlyRateWei === BigInt(0)) {
          toast({
            title: 'Validation Error',
            description: 'Monthly rate cannot be zero. Increase total budget or reduce contract duration.',
            variant: 'destructive',
          });
          return;
        }
      }

      const arbitratorAddress =
        formData.arbitratorAddress.trim().length > 0 ? formData.arbitratorAddress.trim() : DEFAULT_ARBITRATOR_ADDRESS;

      if (!isAddress(arbitratorAddress)) {
        toast({
          title: 'Validation Error',
          description: 'Arbitrator wallet address is invalid.',
          variant: 'destructive',
        });
        return;
      }

      // Create agreement
      // CRITICAL: USDC uses 6 decimals, NOT 18!
      await createAgreement({
        freelancer: formData.freelancerAddress as `0x${string}`,
        token: DEFAULT_TOKEN_ADDRESS as `0x${string}`,
        totalBudget: parseUnits(formData.totalBudget, 6),
        monthlyRate: monthlyRateWei,
        milestoneDeadlines,
        paymentType: parseInt(formData.paymentType),
        projectName: formData.projectName,
        description: formData.description,
        arbitrator: arbitratorAddress as `0x${string}`,
      });
    } catch (error) {
      console.error('Failed to create agreement:', error);
    }
  };

  const isMonthlyPaymentAvailable = (agreement: Agreement): boolean => {
    if (agreement.type !== 'monthly') {
      return false;
    }
    if (agreement.status !== 'funded' && agreement.status !== 'accepted') {
      return false;
    }
    if (!agreement.currentProofURI || agreement.currentProofURI.trim() === '') {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const nextEligible = agreement.lastPaymentTime + (30 * 24 * 60 * 60);

    return now >= nextEligible;
  };

  // Filter agreements
  const filteredAgreements = agreements.filter((agr) => {
    const matchesSearch =
      (agr.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (agr.freelancer?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (agr.company?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = filterStatus === 'all' || agr.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const escrowStats = useMemo(() => {
    const totalEscrowed = agreements.reduce((sum, agr) => {
      const deposited =
        agr.status === 'created' || agr.status === 'cancelled' || agr.status === 'completed'
          ? 0
          : agr.totalBudget;
      const remaining = Math.max(deposited - agr.amountReleased, 0);
      return sum + remaining;
    }, 0);
    const totalReleased = agreements.reduce((sum, agr) => sum + agr.amountReleased, 0);
    const pendingDeposits = agreements.filter((agr) => agr.status === 'created').length;
    return { totalEscrowed, totalReleased, pendingDeposits };
  }, [agreements]);

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Agreements</h1>
          <p className="text-muted-foreground">Create and manage programmable work agreements</p>
        </div>
        {user?.role !== 'freelancer' && (
          <div className="flex items-center gap-2">
            <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Deposit Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deposit to Escrow</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Agreement ID</Label>
                    <Select value={agreementIdInput} onValueChange={setAgreementIdInput}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agreement" />
                      </SelectTrigger>
                      <SelectContent>
                        {depositableAgreements.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No agreements awaiting deposit
                          </SelectItem>
                        ) : (
                          depositableAgreements.map((agr) => (
                            <SelectItem key={agr.id} value={String(agr.id)}>
                              #{agr.id} • {agr.projectName || 'Untitled'} ({agr.type})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Only agreements waiting for deposit are shown.</p>
                  </div>
                  {selectedDepositAgreement && (
                    <div className="rounded-lg border border-muted p-3 text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium text-foreground">Agreement:</span>{' '}
                        {selectedDepositAgreement.projectName}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Type:</span>{' '}
                        {selectedDepositAgreement.type.replace('-', ' ')}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Escrow Amount:</span>{' '}
                        {formatEscrowUsd(depositAmount)} USDC
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Platform Fee:</span>{' '}
                        {estimatedFee !== null ? `${formatEscrowUsd(estimatedFee)} USDC` : 'Loading...'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        1.5% fee with a minimum of ${minFeeUsdValue !== null ? formatEscrowUsd(minFeeUsdValue) : '...'} and a
                        maximum of ${maxFeeUsdValue !== null ? formatEscrowUsd(maxFeeUsdValue) : '...'}.
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Total Charged:</span>{' '}
                        {estimatedTotal !== null ? `${formatEscrowUsd(estimatedTotal)} USDC` : 'Loading...'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Platform fee is charged on deposit, is non-refundable, and supports future improvements.
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Your wallet may ask to approve USDC before the deposit is submitted.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={
                          isDepositPending ||
                          isDepositConfirming ||
                          !selectedDepositAgreement ||
                          estimatedTotal === null
                        }
                      >
                        {isApprovePending || isApproveConfirming
                          ? 'Approving USDC...'
                          : isDepositPending || isDepositConfirming
                            ? 'Depositing...'
                            : 'Deposit Funds'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm deposit</AlertDialogTitle>
                        <AlertDialogDescription>
                          Please review the summary before sending funds to escrow.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">Agreement:</span>{' '}
                          {selectedDepositAgreement?.projectName || '-'}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Type:</span>{' '}
                          {selectedDepositAgreement?.type.replace('-', ' ') || '-'}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Freelancer:</span>{' '}
                          {selectedDepositAgreement?.freelancerWallet || '-'}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Escrow Amount:</span>{' '}
                          {selectedDepositAgreement ? `${formatEscrowUsd(depositAmount)} USDC` : '-'}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Platform Fee:</span>{' '}
                          {estimatedFee !== null ? `${formatEscrowUsd(estimatedFee)} USDC` : 'Loading...'}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Total Charged:</span>{' '}
                          {estimatedTotal !== null ? `${formatEscrowUsd(estimatedTotal)} USDC` : 'Loading...'}
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeposit}
                          disabled={
                            isDepositPending ||
                            isDepositConfirming ||
                            isApprovePending ||
                            isApproveConfirming ||
                            estimatedTotal === null
                          }
                        >
                          {isApprovePending || isApproveConfirming ? 'Approving...' : 'Confirm Deposit'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Agreement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Agreement</DialogTitle>
                  <DialogDescription>Deploy a programmable work agreement on Lisk</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Project Name *</Label>
                  <Input
                    placeholder="e.g., Website Development"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  />
                  {validationErrors.projectName && (
                    <p className="text-xs text-destructive">{validationErrors.projectName}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Agreement Type *</Label>
                  <Select value={formData.paymentType} onValueChange={(v) => setFormData({ ...formData, paymentType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">One-time Task</SelectItem>
                      <SelectItem value="1">Milestone-based</SelectItem>
                      <SelectItem value="2">Monthly Payroll</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Freelancer Wallet Address *</Label>
                  <Input
                    placeholder="0x..."
                    value={formData.freelancerAddress}
                    onChange={(e) => setFormData({ ...formData, freelancerAddress: e.target.value })}
                  />
                  {validationErrors.freelancerAddress && (
                    <p className="text-xs text-destructive">{validationErrors.freelancerAddress}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Arbitrator Wallet Address (optional)</Label>
                  <Input
                    placeholder={DEFAULT_ARBITRATOR_ADDRESS}
                    value={formData.arbitratorAddress}
                    onChange={(e) => setFormData({ ...formData, arbitratorAddress: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default arbitrator.
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Arbitrator is a neutral party who can mediate disputes between company and freelancer.
                  </p>
                  {validationErrors.arbitratorAddress && (
                    <p className="text-xs text-destructive">{validationErrors.arbitratorAddress}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Total Budget *</Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={formData.totalBudget}
                    onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Amount in USDC</p>
                  <p className="text-xs text-muted-foreground">
                    Minimum {MIN_TOTAL_BUDGET_USDC} USDC.
                  </p>
                  {validationErrors.totalBudget && (
                    <p className="text-xs text-destructive">{validationErrors.totalBudget}</p>
                  )}
                </div>
                {/* One-time Task */}
                {formData.paymentType === '0' && (
                  <div className="grid gap-2">
                    <Label>Completion Deadline *</Label>
                    <Input
                      placeholder="31-12-2025"
                      value={formData.milestoneDeadlines}
                      onChange={(e) => setFormData({ ...formData, milestoneDeadlines: e.target.value, milestoneCount: '1' })}
                    />
                    <p className="text-xs text-muted-foreground">Format: DD-MM-YYYY (e.g., 31-12-2025)</p>
                    {validationErrors.milestoneDeadlines && (
                      <p className="text-xs text-destructive">{validationErrors.milestoneDeadlines}</p>
                    )}
                  </div>
                )}

                {/* Milestone-based */}
                {formData.paymentType === '1' && (
                  <>
                    <div className="grid gap-2">
                      <Label>Number of Milestones *</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="3"
                        value={formData.milestoneCount}
                        onChange={(e) => setFormData({ ...formData, milestoneCount: e.target.value })}
                      />
                      {validationErrors.milestoneCount && (
                        <p className="text-xs text-destructive">{validationErrors.milestoneCount}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Milestone Deadlines *</Label>
                      <Input
                        placeholder="15-01-2025, 15-02-2025, 15-03-2025"
                        value={formData.milestoneDeadlines}
                        onChange={(e) => setFormData({ ...formData, milestoneDeadlines: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated dates (DD-MM-YYYY). Must match number of milestones.
                      </p>
                      {validationErrors.milestoneDeadlines && (
                        <p className="text-xs text-destructive">{validationErrors.milestoneDeadlines}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Monthly Payroll */}
                {formData.paymentType === '2' && (
                  <>
                    <div className="grid gap-2">
                      <Label>Contract Duration (months) *</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="6"
                        value={formData.contractDuration}
                        onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of months for this contract
                      </p>
                      {validationErrors.contractDuration && (
                        <p className="text-xs text-destructive">{validationErrors.contractDuration}</p>
                      )}
                    </div>
                    {canShowMonthlyRate && (
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="text-sm text-green-800 dark:text-green-200">
                          <p className="font-medium mb-1">💰 Calculated Monthly Rate:</p>
                          <p className="text-lg font-bold">
                            {monthlyRateDisplay} USDC / month
                          </p>
                          <p className="text-xs mt-1 text-green-700 dark:text-green-300">
                            Total Budget: {totalBudgetDisplay ?? '0.00'} USDC ÷ {formData.contractDuration} months
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex gap-2">
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <p className="font-medium mb-1">ℹ️ Monthly Payment Info:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Monthly rate is calculated automatically: Total Budget ÷ Contract Duration</li>
                            <li>Payment automatically becomes available every 30 days</li>
                            <li>Proof submission is required before claiming</li>
                            <li>Freelancer can claim payment after each 30-day cycle once proof is submitted</li>
                            <li>Payments continue until the total budget runs out</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the work..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={!canSubmit || isCreatePending || isCreateConfirming}>
                      {isCreatePending || isCreateConfirming ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isCreatePending ? 'Waiting for approval...' : 'Creating agreement...'}
                        </>
                      ) : (
                        'Deploy Agreement'
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Review agreement details</AlertDialogTitle>
                      <AlertDialogDescription>
                        Make sure the details below are correct before deploying to the blockchain.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Project:</span> {formData.projectName || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Type:</span> {paymentTypeLabel}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Freelancer:</span>{' '}
                        {formData.freelancerAddress || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Arbitrator:</span> {resolvedArbitratorAddress}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Total Budget:</span>{' '}
                        {formData.totalBudget ? `${formData.totalBudget} USDC` : 'N/A'}
                      </div>
                      {formData.paymentType === '2' ? (
                        <div>
                          <span className="font-medium text-foreground">Duration:</span>{' '}
                          {formData.contractDuration ? `${formData.contractDuration} months` : 'N/A'}
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-foreground">Deadline(s):</span>{' '}
                          {formData.milestoneDeadlines || 'N/A'}
                        </div>
                      )}
                      {formData.paymentType === '1' && (
                        <div>
                          <span className="font-medium text-foreground">Milestone Count:</span>{' '}
                          {formData.milestoneCount || 'N/A'}
                        </div>
                      )}
                      {formData.description.trim().length > 0 && (
                        <div>
                          <span className="font-medium text-foreground">Description:</span> {formData.description}
                        </div>
                      )}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCreateAgreement} disabled={!canSubmit || isCreatePending || isCreateConfirming}>
                        Confirm & Deploy
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Agreements</CardTitle>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Escrow</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                      Loading agreements...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAgreements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No agreements found. Create your first agreement to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgreements.map((agr) => (
                  <TableRow key={agr.id}>
                    <TableCell className="font-mono">#{agr.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{agr.projectName}</span>
                        <span className="text-xs text-muted-foreground">
                          {agr.companyWallet.slice(0, 6)}...{agr.companyWallet.slice(-4)} → {agr.freelancerWallet.slice(0, 6)}...
                          {agr.freelancerWallet.slice(-4)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {agr.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          agr.status === 'completed'
                            ? 'bg-success/10 text-success border-success/20'
                            : agr.status === 'funded' || agr.status === 'accepted'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : agr.status === 'proposed'
                                ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                : agr.status === 'created'
                                  ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                  : agr.status === 'disputed'
                                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                                    : 'bg-muted/10 text-muted-foreground border-muted/20'
                        }
                      >
                        {agr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">${agr.escrowAmount.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {agr.amountReleased > 0 && `$${agr.amountReleased.toLocaleString()} released`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/agreements/${agr.id}`}>
                          <Button variant="ghost" size="sm">
                            Details
                          </Button>
                        </Link>
                        {user?.role === 'freelancer' &&
                          agr.status === 'funded' &&
                          (agr.type === 'one-time' || agr.type === 'milestone' || agr.type === 'monthly') && (
                            <Button variant="outline" size="sm" onClick={() => handleSubmitWorkClick(agr)}>
                              Submit Work
                            </Button>
                          )}
                        {user?.role !== 'freelancer' && agr.status === 'created' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDepositClick(String(agr.id))}
                            >
                              Deposit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isCancelPending || isCancelConfirming}
                                >
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel this agreement?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will cancel the agreement and return funds to your wallet (if any).
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => cancelAgreement(BigInt(agr.id))}
                                  >
                                    Yes, cancel
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        {user?.role === 'freelancer' &&
                          ((agr.type === 'monthly' && isMonthlyPaymentAvailable(agr)) ||
                            (agr.type !== 'monthly' && agr.status === 'accepted')) && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleReleasePaymentClick(agr)}
                            >
                              Claim
                            </Button>
                          )}
                        {user?.role !== 'freelancer' && agr.status === 'proposed' && (
                          <Button variant="outline" size="sm" onClick={() => handleReviewWorkClick(agr)}>
                            Review Work
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {user?.role !== 'freelancer' && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Escrowed</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${escrowStats.totalEscrowed.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across all agreements</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Released</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${escrowStats.totalReleased.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Paid out from escrow</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{escrowStats.pendingDeposits}</div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Escrow by Agreement</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agreement</TableHead>
                    <TableHead>Deposited</TableHead>
                    <TableHead>Released</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                          Loading escrow...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : agreements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No agreements found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agreements.map((agr) => (
                      <TableRow key={agr.id}>
                        {(() => {
                          const deposited =
                            agr.status === 'created' || agr.status === 'cancelled' || agr.status === 'completed'
                              ? 0
                              : agr.totalBudget;
                          const remaining = Math.max(deposited - agr.amountReleased, 0);
                          return (
                            <>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{agr.projectName || `Agreement #${agr.id}`}</span>
                                  <span className="text-xs text-muted-foreground">
                                    #{agr.id} • {agr.type.replace('-', ' ')}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{`$${deposited.toLocaleString()}`}</TableCell>
                              <TableCell>{`$${agr.amountReleased.toLocaleString()}`}</TableCell>
                              <TableCell>{`$${remaining.toLocaleString()}`}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {agr.status}
                                </Badge>
                              </TableCell>
                            </>
                          );
                        })()}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {selectedAgreement && (
        <SubmitWorkDialog
          open={submitWorkOpen}
          onOpenChange={setSubmitWorkOpen}
          agreementId={selectedAgreement.id}
          projectName={selectedAgreement.projectName}
          description={selectedAgreement.description}
          companyWallet={selectedAgreement.companyWallet}
          paymentType={selectedAgreement.type}
          currentMilestone={selectedAgreement.currentMilestone}
          totalMilestones={selectedAgreement.totalMilestones}
          milestoneDeadlines={selectedAgreement.milestoneDeadlines}
          onSuccess={refetch}
        />
      )}

      {selectedAgreement && (
        <ReviewWorkDialog
          open={reviewWorkOpen}
          onOpenChange={setReviewWorkOpen}
          agreementId={selectedAgreement.id}
          projectName={selectedAgreement.projectName}
          description={selectedAgreement.description}
          proofUrl={selectedAgreement.currentProofURI || ''}
          paymentAmount={selectedAgreement.nextPayment}
          agreementType={selectedAgreement.type}
          currentMilestone={selectedAgreement.currentMilestone}
          onSuccess={refetch}
        />
      )}

      {selectedAgreement && (
        <ReleasePaymentDialog
          open={releasePaymentOpen}
          onOpenChange={setReleasePaymentOpen}
          agreementId={selectedAgreement.id}
          projectName={selectedAgreement.projectName}
          paymentAmount={selectedAgreement.nextPayment}
          paymentType={selectedAgreement.type}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
