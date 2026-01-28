"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { CONTRACTS } from "@/lib/web3/contracts";
import { parseUnits, keccak256, toBytes } from "viem";

/**
 * Hook for interacting with RivoHub smart contract
 * Provides functions for:
 * - payInvoice: Pay a single invoice to a vendor
 * - payPayroll: Batch payment to multiple recipients
 * - checkInvoiceStatus: Check if an invoice has been paid
 */
export function useRivoHub() {
  const { toast } = useToast();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Pay a single invoice
   * @param invoiceId - Unique invoice identifier (string)
   * @param vendorAddress - Vendor's wallet address
   * @param amount - Amount in IDRX (as string, will be converted to wei)
   */
  const payInvoice = async (
    invoiceId: string,
    vendorAddress: `0x${string}`,
    amount: string
  ) => {
    try {
      // Convert invoiceId string to bytes32 hash
      const invoiceIdHash = keccak256(toBytes(invoiceId));

      // Convert IDRX amount to wei (18 decimals)
      const amountInWei = parseUnits(amount, 18);

      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "payInvoice",
        args: [invoiceIdHash, vendorAddress, amountInWei],
      });

      toast({
        title: "Processing Invoice Payment",
        description: `Paying ${amount} IDRX to vendor...`,
      });
    } catch (error: any) {
      console.error("Failed to pay invoice:", error);
      toast({
        title: "Payment Failed",
        description: error?.message || "Failed to process invoice payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Pay multiple recipients (Payroll)
   * @param recipients - Array of wallet addresses
   * @param amounts - Array of amounts in IDRX (as strings)
   */
  const payPayroll = async (
    recipients: `0x${string}`[],
    amounts: string[]
  ) => {
    try {
      if (recipients.length !== amounts.length) {
        throw new Error("Recipients and amounts arrays must have the same length");
      }

      if (recipients.length === 0) {
        throw new Error("No recipients specified");
      }

      // Convert all amounts to wei
      const amountsInWei = amounts.map(amount => parseUnits(amount, 18));

      // Calculate total for display
      const totalAmount = amounts.reduce((sum, amount) => {
        return sum + parseFloat(amount);
      }, 0);

      writeContract({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "payPayroll",
        args: [recipients, amountsInWei],
      });

      toast({
        title: "Processing Payroll",
        description: `Paying ${recipients.length} recipients, total: ${totalAmount.toLocaleString()} IDRX`,
      });
    } catch (error: any) {
      console.error("Failed to pay payroll:", error);
      toast({
        title: "Payroll Failed",
        description: error?.message || "Failed to process payroll. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    payInvoice,
    payPayroll,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook to check if an invoice has been paid
 * @param invoiceId - Invoice ID to check
 */
export function useCheckInvoiceStatus(invoiceId?: string) {
  const invoiceIdHash = invoiceId ? keccak256(toBytes(invoiceId)) : undefined;

  const { data: isPaid, isLoading, refetch } = useReadContract({
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    functionName: "paidInvoices",
    args: invoiceIdHash ? [invoiceIdHash] : undefined,
  });

  return {
    isPaid: isPaid as boolean | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Hook to get IDRX token address from RivoHub contract
 */
export function useIDRXTokenAddress() {
  const { data: tokenAddress, isLoading } = useReadContract({
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    functionName: "idrxToken",
  });

  return {
    tokenAddress: tokenAddress as `0x${string}` | undefined,
    isLoading,
  };
}
