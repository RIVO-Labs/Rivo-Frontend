"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useUserAgreements } from "./useRivoHub";
import { formatUnits } from "viem";

// Status enum mapping - MUST match RivoHub.sol exactly
// enum Status { Created, Funded, Proposed, Accepted, Completed, Cancelled, Disputed }
export const AgreementStatus = {
  0: "created",    // Agreement created, waiting for company deposit
  1: "funded",     // Company deposited funds, freelancer can start work
  2: "proposed",   // Freelancer submitted work proof, waiting company review
  3: "accepted",   // Company accepted work, ready for payment release
  4: "completed",  // Payment released, agreement finished
  5: "cancelled",  // Agreement cancelled by company, funds refunded
  6: "disputed",   // Agreement in dispute, funds locked
} as const;

// Payment type enum mapping - MUST match RivoHub.sol exactly
// enum PType { OneTime, Milestone, Monthly }
export const PaymentType = {
  0: "one-time",   // Single payment on completion
  1: "milestone",  // Multiple milestone-based payments
  2: "monthly",    // Monthly recurring payments (note: "monthly" not "payroll")
} as const;

export interface FormattedAgreement {
  id: string;
  company: string;
  companyWallet: string;
  freelancer: string;
  freelancerWallet: string;
  type: "one-time" | "milestone" | "monthly";  // Changed from "payroll" to "monthly"
  status: "created" | "funded" | "proposed" | "accepted" | "completed" | "cancelled" | "disputed";  // Updated to match smart contract
  escrowAmount: number;
  nextPayment: number;
  nextPaymentDate: string;
  createdAt: string;
  lastActivity: string;
  projectName: string;
  description: string;
  totalBudget: number;
  amountReleased: number;
  monthlyRate: number;
  totalMilestones: number;
  currentMilestone: number;
  milestoneDeadlines: number[];
  currentProofURI: string;
  token: string;
  arbitrator: string;
  lastPaymentTime: number;
}

/**
 * Hook untuk fetch dan format semua agreements dari user yang sedang login
 * Uses manual fetching with useReadContract to avoid hooks in loops
 */
export function useUserAgreementsList() {
  const { address } = useAccount();
  const { agreementIds, isLoading: isLoadingIds, refetch: refetchIds } = useUserAgreements(address);
  const [agreements, setAgreements] = useState<FormattedAgreement[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Fetch agreement details when IDs change
  const fetchAllAgreements = useCallback(async () => {
      if (!agreementIds || agreementIds.length === 0) {
        setAgreements([]);
        return;
      }

      setIsLoadingDetails(true);
      const formattedAgreements: FormattedAgreement[] = [];

      const uniqueIds = Array.from(new Set(agreementIds.map((id) => id.toString()))).map((id) => BigInt(id));

      // Fetch each agreement sequentially (not ideal but works for now)
      for (const id of uniqueIds) {
        try {
          // Direct contract read using wagmi
          const { readContract } = await import("wagmi/actions");
          const { config } = await import("@/lib/web3/config");
          const { CONTRACTS } = await import("@/lib/web3/contracts");

          const data = await readContract(config, {
            address: CONTRACTS.RivoHub.address,
            abi: CONTRACTS.RivoHub.abi,
            functionName: "getAgreementDetails",
            args: [id],
          });

          if (data) {
            formattedAgreements.push(formatAgreementData(id, data));
          }
        } catch (error) {
          console.error(`Failed to fetch agreement ${id}:`, error);
        }
      }

      setAgreements(formattedAgreements);
      setIsLoadingDetails(false);
  }, [agreementIds]);

  useEffect(() => {
    fetchAllAgreements();
  }, [fetchAllAgreements, refreshTick]);

  const refetch = useCallback(async () => {
    await refetchIds();
    // Force detail refresh even if IDs don't change
    setRefreshTick((tick) => tick + 1);
  }, [refetchIds]);

  return {
    agreements,
    isLoading: isLoadingIds || isLoadingDetails,
    refetch,
    agreementIds,
  };
}

/**
 * Helper function untuk format data agreement dari contract ke format UI
 */
function formatAgreementData(id: bigint, data: any): FormattedAgreement {
  // CRITICAL: USDC uses 6 decimals, NOT 18!
  const totalBudget = Number(formatUnits(data.totalBudget, 6));
  const amountReleased = Number(formatUnits(data.amountReleased, 6));
  const monthlyRate = Number(formatUnits(data.monthlyRate, 6));
  const status = AgreementStatus[data.status as keyof typeof AgreementStatus];
  const milestoneDeadlines = Array.isArray(data.milestoneDeadlines)
    ? data.milestoneDeadlines.map((deadline: bigint) => Number(deadline))
    : [];

  // CRITICAL: Escrow is 0 when status is "created" (before deposit)
  // Only after deposit() is called and status becomes "funded", the escrow shows totalBudget
  const escrowAmount = status === "created" ? 0 : totalBudget;

  return {
    id: id.toString(),
    company: "Company", // You might want to fetch name from another source
    companyWallet: data.company,
    freelancer: "Freelancer", // You might want to fetch name from another source
    freelancerWallet: data.freelancer,
    arbitrator: data.arbitrator,
    type: PaymentType[data.paymentType as keyof typeof PaymentType],
    status,
    escrowAmount,
    nextPayment: calculateNextPayment(data),
    nextPaymentDate: calculateNextPaymentDate(data),
    createdAt: new Date().toISOString(), // You might want to get this from events
    lastActivity: "Recently", // You might want to get this from events
    projectName: data.projectName,
    description: data.description,
    totalBudget,
    amountReleased,
    monthlyRate,
    totalMilestones: milestoneDeadlines.length,
    currentMilestone: data.currentMilestone,
    milestoneDeadlines,
    currentProofURI: data.currentProofURI,
    token: data.token,
    lastPaymentTime: Number(data.lastPaymentTime),  // Add lastPaymentTime from contract
  };
}

/**
 * Calculate next payment amount based on payment type
 */
function calculateNextPayment(data: any): number {
  const totalBudget = Number(formatUnits(data.totalBudget, 6));
  const amountReleased = Number(formatUnits(data.amountReleased, 6));
  const monthlyRate = Number(formatUnits(data.monthlyRate, 6));

  // PaymentType: 0 = OneTime, 1 = Milestone, 2 = Payroll
  if (data.paymentType === 0) {
    // One-time: remaining budget
    return totalBudget - amountReleased;
  } else if (data.paymentType === 1) {
    // Milestone: budget divided by milestones
    // For the last milestone, return remaining budget to handle rounding
    const currentMilestone = Number(data.currentMilestone);
    const totalMilestones = data.milestoneDeadlines ? data.milestoneDeadlines.length : 0;

    if (currentMilestone + 1 === totalMilestones) {
      // Last milestone: return remaining budget
      return totalBudget - amountReleased;
    } else {
      // Not last milestone: equal division
      return totalMilestones > 0 ? totalBudget / totalMilestones : 0;
    }
  } else if (data.paymentType === 2) {
    // Payroll: monthly rate
    return monthlyRate;
  }

  return 0;
}

/**
 * Calculate next payment date based on payment type
 */
function calculateNextPaymentDate(data: any): string {
  const lastPaymentTime = Number(data.lastPaymentTime);

  // Helper function to format date as dd/mm/yyyy
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (data.paymentType === 0) {
    // One-time: OneTime has 1 deadline stored in milestoneDeadlines[0]
    if (data.milestoneDeadlines && data.milestoneDeadlines.length > 0) {
      const deadline = Number(data.milestoneDeadlines[0]);
      return formatDate(deadline);
    }
    return "No deadline set";
  } else if (data.paymentType === 1) {
    // Milestone
    if (data.currentMilestone < data.milestoneDeadlines.length) {
      const deadline = Number(data.milestoneDeadlines[data.currentMilestone]);
      return formatDate(deadline);
    }
    return "No upcoming milestone";
  } else if (data.paymentType === 2) {
    // Monthly (Payroll): 30 days from last payment
    const nextPayment = lastPaymentTime + 30 * 24 * 60 * 60; // 30 days in seconds
    return formatDate(nextPayment);
  }

  return "-";
}

/**
 * Hook untuk fetch single agreement detail
 */
export function useSingleAgreement(agreementId?: string | number) {
  const [agreement, setAgreement] = useState<FormattedAgreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAgreement() {
      if (agreementId === undefined) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { readContract } = await import("wagmi/actions");
        const { config } = await import("@/lib/web3/config");
        const { CONTRACTS } = await import("@/lib/web3/contracts");

        const data = await readContract(config, {
          address: CONTRACTS.RivoHub.address,
          abi: CONTRACTS.RivoHub.abi,
          functionName: "getAgreementDetails",
          args: [BigInt(agreementId)],
        });

        if (data) {
          setAgreement(formatAgreementData(BigInt(agreementId), data));
        }
      } catch (error) {
        console.error(`Failed to fetch agreement ${agreementId}:`, error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgreement();
  }, [agreementId]);

  const refetch = async () => {
    if (agreementId === undefined) return;

    setIsLoading(true);
    try {
      const { readContract } = await import("wagmi/actions");
      const { config } = await import("@/lib/web3/config");
      const { CONTRACTS } = await import("@/lib/web3/contracts");

      const data = await readContract(config, {
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "getAgreementDetails",
        args: [BigInt(agreementId)],
      });

      if (data) {
        setAgreement(formatAgreementData(BigInt(agreementId), data));
      }
    } catch (error) {
      console.error(`Failed to fetch agreement ${agreementId}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    agreement,
    isLoading,
    refetch,
  };
}
