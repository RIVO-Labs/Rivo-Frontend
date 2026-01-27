"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/web3/contracts";
import { useToast } from "@/hooks/use-toast";
import { formatUnits } from "viem";

/**
 * Hook untuk berinteraksi dengan RivoHub smart contract
 */
export function useRivoHub() {
  const { toast } = useToast();

  // Read contract helper
  const readContract = <T,>(functionName: string, args?: unknown[]) => {
    return useReadContract({
      address: CONTRACTS.RivoHub.address,
      abi: CONTRACTS.RivoHub.abi,
      functionName,
      args,
    }) as { data: T | undefined; isError: boolean; isLoading: boolean; refetch: () => void };
  };

  return {
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    readContract,
  };
}

/**
 * Hook untuk mengambil konfigurasi fee contract
 */
export function useFeeConfig() {
  const USD_DECIMALS = 6;
  const normalizeUsdValue = (value?: bigint) => {
    if (value === undefined) return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    // Heuristic: if value is already in human USD (e.g., 2, 500), keep as-is.
    // If it's scaled (e.g., 2e6), convert using USD_DECIMALS.
    if (numeric > 10 ** USD_DECIMALS) {
      return Number(formatUnits(value, USD_DECIMALS));
    }
    return numeric;
  };

  const feeBps = useReadContract({
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    functionName: "feeBps",
  });
  const minFeeUsd = useReadContract({
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    functionName: "minFeeUsd",
  });
  const maxFeeUsd = useReadContract({
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    functionName: "maxFeeUsd",
  });

  return {
    feeBps: feeBps.data != null ? Number(feeBps.data) : null,
    minFeeUsd: normalizeUsdValue(minFeeUsd.data as bigint | undefined),
    maxFeeUsd: normalizeUsdValue(maxFeeUsd.data as bigint | undefined),
    isLoading: feeBps.isLoading || minFeeUsd.isLoading || maxFeeUsd.isLoading,
    isError: feeBps.isError || minFeeUsd.isError || maxFeeUsd.isError,
  };
}

/**
 * Hook untuk mendapatkan detail agreement
 */
export function useAgreementDetails(agreementId?: bigint | number) {
  const { readContract } = useRivoHub();

  const { data, isError, isLoading, refetch } = readContract<{
    company: `0x${string}`;
    freelancer: `0x${string}`;
    token: `0x${string}`;
    totalBudget: bigint;
    amountReleased: bigint;
    lastPaymentTime: bigint;
    monthlyRate: bigint;
    milestoneDeadlines: bigint[];
    status: number;
    paymentType: number;
    projectName: string;
    description: string;
    currentProofURI: string;
    totalMilestones: number;
    currentMilestone: number;
  }>("getAgreementDetails", agreementId !== undefined ? [BigInt(agreementId)] : undefined);

  return {
    agreement: data,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Hook untuk mendapatkan semua agreement IDs dari user
 */
export function useUserAgreements(userAddress?: `0x${string}`) {
  const { readContract } = useRivoHub();

  const { data, isError, isLoading, refetch } = readContract<bigint[]>(
    "getAgreementsByUser",
    userAddress ? [userAddress] : undefined
  );

  return {
    agreementIds: data,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Hook untuk create agreement
 */
export function useCreateAgreement() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending, isError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createAgreement = async (params: {
    freelancer: `0x${string}`;
    token: `0x${string}`;
    totalBudget: bigint;
    monthlyRate: bigint;
    milestoneDeadlines: bigint[];
    paymentType: number; // 0: OneTime, 1: Milestone, 2: Payroll
    projectName: string;
    description: string;
    arbitrator: `0x${string}`;
  }) => {
    try {
      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "createAgreement",
        args: [
          params.freelancer,
          params.token,
          params.totalBudget,
          params.monthlyRate,
          params.milestoneDeadlines,
          params.paymentType,
          params.projectName,
          params.description,
          params.arbitrator,
        ],
      });

      toast({
        title: "Transaction Submitted",
        description: "Creating agreement on blockchain...",
      });
    } catch (error) {
      console.error("Failed to create agreement:", error);
      toast({
        title: "Transaction Failed",
        description: "Failed to create agreement. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    createAgreement,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    hash,
  };
}

/**
 * Hook untuk deposit ke agreement
 */
export function useDepositAgreement() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = (agreementId: bigint | number) => {
    try {
      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "deposit",
        args: [BigInt(agreementId)],
      });

      toast({
        title: "Depositing Funds",
        description: "Locking funds in escrow...",
      });
    } catch (error) {
      console.error("Failed to deposit:", error);
      toast({
        title: "Deposit Failed",
        description: "Failed to deposit funds. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    deposit,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook untuk submit work
 */
export function useSubmitWork() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitWork = (agreementId: bigint | number, proofURI: string) => {
    try {
      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "submitWork",
        args: [BigInt(agreementId), proofURI],
      });

      toast({
        title: "Submitting Work",
        description: "Submitting proof of work to blockchain...",
      });
    } catch (error) {
      console.error("Failed to submit work:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit work. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    submitWork,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook untuk accept work (company)
 */
export function useAcceptWork() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const acceptWork = (agreementId: bigint | number) => {
    try {
      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "acceptWork",
        args: [BigInt(agreementId)],
      });

      toast({
        title: "Accepting Work",
        description: "Approving work submission...",
      });
    } catch (error) {
      console.error("Failed to accept work:", error);
      toast({
        title: "Accept Failed",
        description: "Failed to accept work. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    acceptWork,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook untuk reject work (company)
 */
export function useRejectWork() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const rejectWork = (agreementId: bigint | number, reason: string) => {
    try {
      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "rejectWork",
        args: [BigInt(agreementId), reason],
      });

      toast({
        title: "Rejecting Work",
        description: "Submitting rejection to blockchain...",
      });
    } catch (error) {
      console.error("Failed to reject work:", error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject work. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    rejectWork,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook untuk release payment
 */
export function useReleasePayment() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const releasePayment = (agreementId: bigint | number) => {
    try {
      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "releasePayment",
        args: [BigInt(agreementId)],
      });

      toast({
        title: "Releasing Payment",
        description: "Processing payment release...",
      });
    } catch (error) {
      console.error("Failed to release payment:", error);
      toast({
        title: "Release Failed",
        description: "Failed to release payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    releasePayment,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook untuk cancel agreement
 */
export function useCancelAgreement() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelAgreement = (agreementId: bigint | number) => {
    try {
      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "cancelAgreement",
        args: [BigInt(agreementId)],
      });

      toast({
        title: "Cancelling Agreement",
        description: "Processing cancellation and refund...",
      });
    } catch (error) {
      console.error("Failed to cancel agreement:", error);
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel agreement. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    cancelAgreement,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook untuk raise dispute
 */
export function useRaiseDispute() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const raiseDispute = (agreementId: bigint | number, reason: string) => {
    try {
      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "raiseDispute",
        args: [BigInt(agreementId), reason],
      });

      toast({
        title: "Opening Dispute",
        description: "Locking agreement and notifying both parties...",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Failed to raise dispute:", error);
      toast({
        title: "Dispute Failed",
        description: "Failed to open dispute. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    raiseDispute,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook untuk mengambil public key enkripsi user
 */
export function useEncryptionPublicKey(userAddress?: `0x${string}`) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    functionName: "getEncryptionPublicKey",
    args: userAddress ? [userAddress] : undefined,
  });

  return {
    key: data as string | undefined,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Hook untuk set public key enkripsi user
 */
export function useSetEncryptionPublicKey() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setEncryptionPublicKey = (key: string) => {
    try {
      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "setEncryptionPublicKey",
        args: [key],
      });

      toast({
        title: "Publishing Encryption Key",
        description: "Saving your key on-chain...",
      });
    } catch (error) {
      console.error("Failed to publish encryption key:", error);
      toast({
        title: "Publish Failed",
        description: "Failed to publish key. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    setEncryptionPublicKey,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook untuk mengambil CID profil user
 */
export function useProfileCID(userAddress?: `0x${string}`) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    functionName: "getProfileCID",
    args: userAddress ? [userAddress] : undefined,
  });

  return {
    cid: data as string | undefined,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Hook untuk set CID profil user
 */
export function useSetProfileCID() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setProfileCID = (cid: string) => {
    try {
      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "setProfileCID",
        args: [cid],
      });

      toast({
        title: "Publishing Profile",
        description: "Saving your profile CID on-chain...",
      });
    } catch (error) {
      console.error("Failed to publish profile CID:", error);
      toast({
        title: "Publish Failed",
        description: "Failed to publish profile CID. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    setProfileCID,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
