"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { CONTRACTS } from "@/lib/web3/contracts";
import { parseUnits } from "viem";

// Standard ERC20 ABI for approve and allowance functions
const ERC20_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/**
 * Hook to check USDC allowance for RivoHub contract
 */
export function useUSDCAllowance(
  usdcAddress?: `0x${string}`,
  ownerAddress?: `0x${string}`
) {
  const { data: allowance, isLoading, refetch } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
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
 * Hook to approve USDC spending for RivoHub contract
 * Uses max uint256 for unlimited approval (one-time approval)
 */
export function useApproveUSDC() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (usdcAddress: `0x${string}`) => {
    try {
      // Approve max uint256 for unlimited approval (standard practice)
      const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.RivoHub.address, maxUint256],
      });

      toast({
        title: "Approving USDC",
        description: "Granting USDC access to the RivoHub contract...",
      });
    } catch (error) {
      console.error("Failed to approve USDC:", error);
      toast({
        title: "Approval Failed",
        description: "Approval failed. Please try again.",
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
export function hassufficientAllowance(
  allowance: bigint | undefined,
  requiredAmount: bigint
): boolean {
  if (!allowance) return false;
  return allowance >= requiredAmount;
}
