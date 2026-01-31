"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { CONTRACTS } from "@/lib/web3/contracts";
import { TOKENS } from "@/lib/web3/tokens";
import { parseUnits, formatUnits } from "viem";

/**
 * Hook to check IDRX allowance for RivoHub contract
 */
export function useIDRXAllowance(ownerAddress?: `0x${string}`) {
  const { data: allowance, isLoading, refetch } = useReadContract({
    address: CONTRACTS.IDRX.address,
    abi: CONTRACTS.IDRX.abi,
    functionName: "allowance",
    args: ownerAddress ? [ownerAddress, CONTRACTS.RivoHub.address] : undefined,
  });

  return {
    allowance: allowance as bigint | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Hook to get IDRX balance of an address
 */
export function useIDRXBalance(address?: `0x${string}`) {
  const { data: balance, isLoading, refetch } = useReadContract({
    address: CONTRACTS.IDRX.address,
    abi: CONTRACTS.IDRX.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  return {
    balance: balance as bigint | undefined,
    balanceFormatted: balance ? formatUnits(balance as bigint, 18) : "0",
    isLoading,
    refetch,
  };
}

/**
 * Hook to approve IDRX spending for RivoHub contract
 * Can approve specific amount or unlimited (max uint256)
 */
export function useApproveIDRX() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Approve IDRX spending
   * @param amount - Amount to approve in IDRX (string). If not provided, approves max uint256
   */
  const approve = (amount?: string) => {
    try {
      let approvalAmount: bigint;

      if (amount) {
        // Approve specific amount
        approvalAmount = parseUnits(amount, 18);
      } else {
        // Approve max uint256 for unlimited approval (standard practice)
        approvalAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      }

      writeContract({
        address: CONTRACTS.IDRX.address,
        abi: CONTRACTS.IDRX.abi,
        functionName: "approve",
        args: [CONTRACTS.RivoHub.address, approvalAmount],
      });

      toast({
        title: "Approving IDRX",
        description: amount
          ? `Approving ${amount} IDRX for RivoHub contract...`
          : "Granting unlimited IDRX access to RivoHub contract...",
      });
    } catch (error: any) {
      console.error("Failed to approve IDRX:", error);
      toast({
        title: "Approval Failed",
        description: error?.message || "Failed to approve IDRX. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    approve,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Helper to check if allowance is sufficient for amount
 */
export function hasSufficientAllowance(
  allowance: bigint | undefined,
  requiredAmount: string
): boolean {
  if (!allowance) return false;
  const requiredAmountBigInt = parseUnits(requiredAmount, 18);
  return allowance >= requiredAmountBigInt;
}

/**
 * Helper to format IDRX amount for display
 */
export function formatIDRX(amount: bigint | undefined): string {
  if (!amount) return "0";
  return parseFloat(formatUnits(amount, 18)).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
