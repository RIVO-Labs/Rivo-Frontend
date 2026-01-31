"use client";

import { useEffect, useMemo, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient, useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { CONTRACTS } from "@/lib/web3/contracts";
import { parseUnits, keccak256, toBytes, isHex } from "viem";

/**
 * Hook for interacting with RivoHub smart contract
 * Provides functions for:
 * - createInvoice: Create a new invoice on-chain
 * - settleInvoice: Pay an existing invoice
 * - payInvoice: Create and pay a new invoice on-chain
 */
export function useRivoHub() {
  const { toast } = useToast();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Create a new invoice
   */
  const createInvoice = async (
    invoiceId: string,
    metadataCID: string,
    vendorAddress: `0x${string}`,
    payerAddress?: `0x${string}`,
    amount?: string
  ) => {
    try {
      const payer = payerAddress || (address as `0x${string}` | undefined);

      if (!payer) {
        throw new Error("Wallet address not found");
      }

      const invoiceIdHash = keccak256(toBytes(invoiceId));
      const amountInWei = parseUnits(amount || "0", 18);

      const txHash = await writeContractAsync({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "createInvoice",
        args: [invoiceIdHash, metadataCID, vendorAddress, payer, amountInWei],
      });

      toast({
        title: "Invoice Created",
        description: "Invoice has been created on-chain.",
      });

      return txHash;
    } catch (error: any) {
      console.error("Failed to create invoice:", error);
      toast({
        title: "Create Invoice Failed",
        description: error?.message || "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Pay existing invoice
   */
  const settleInvoice = async (invoiceId: string) => {
    try {
      const invoiceIdHash = keccak256(toBytes(invoiceId));

      const txHash = await writeContractAsync({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "payInvoice",
        args: [invoiceIdHash],
      });

      toast({
        title: "Paying Invoice",
        description: "Invoice payment is being processed...",
      });

      return txHash;
    } catch (error: any) {
      console.error("Failed to pay invoice:", error);
      toast({
        title: "Payment Failed",
        description: error?.message || "Failed to pay invoice. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Create and pay a new invoice
   * @param invoiceId - Unique invoice identifier (string)
   * @param metadataCID - IPFS CID for invoice metadata
   * @param vendorAddress - Vendor's wallet address
   * @param amount - Amount in IDRX (as string, will be converted to wei)
   */
  const payInvoice = async (
    invoiceId: string,
    metadataCID: string,
    vendorAddress: `0x${string}`,
    amount: string
  ) => {
    try {
      if (!publicClient) {
        throw new Error("Blockchain client not ready");
      }

      const payer = address as `0x${string}` | undefined;

      if (!payer) {
        throw new Error("Wallet address not found");
      }

      toast({
        title: "Processing Invoice",
        description: `Creating invoice for ${amount} IDRX...`,
      });

      const createHash = await createInvoice(invoiceId, metadataCID, vendorAddress, payer, amount);
      await publicClient.waitForTransactionReceipt({ hash: createHash });

      await settleInvoice(invoiceId);
    } catch (error: any) {
      console.error("Failed to pay invoice:", error);
      toast({
        title: "Payment Failed",
        description: error?.message || "Failed to process invoice payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    payInvoice,
    createInvoice,
    settleInvoice,
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
  const invoiceIdHash = useMemo(() => {
    if (!invoiceId) return undefined;
    if (isHex(invoiceId) && invoiceId.length === 66) return invoiceId as `0x${string}`;
    return keccak256(toBytes(invoiceId));
  }, [invoiceId]);

  const { data: invoice, isLoading, refetch } = useReadContract({
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    functionName: "getInvoice",
    args: invoiceIdHash ? [invoiceIdHash] : undefined,
  });

  const status = invoice && (invoice as { status?: number }).status !== undefined
    ? (invoice as { status: number }).status
    : undefined;

  return {
    status,
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

export interface PayableInvoice {
  invoiceId: `0x${string}`;
  metadataCID: string;
  vendor: `0x${string}`;
  payer: `0x${string}`;
  amount: bigint;
  status: number;
  createdAt: bigint;
  paidAt: bigint;
}

export const INVOICE_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Paid",
  2: "Cancelled",
};

const EMPTY_INVOICE_IDS = [] as `0x${string}`[];

export function formatInvoiceStatus(status?: number) {
  if (status === undefined || status === null) return "Unknown";
  return INVOICE_STATUS_LABELS[status] || `Status ${status}`;
}

function useInvoiceIds(
  functionName: "getPayerInvoices" | "getVendorInvoices",
  address?: `0x${string}`
) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    functionName,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    invoiceIds: (data as `0x${string}`[] | undefined) || EMPTY_INVOICE_IDS,
    isLoading,
    refetch,
  };
}

function useInvoicesByIds(invoiceIds: `0x${string}`[]) {
  const publicClient = usePublicClient();
  const [invoices, setInvoices] = useState<PayableInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const invoiceIdsKey = useMemo(() => invoiceIds.join("|"), [invoiceIds]);

  useEffect(() => {
    if (!publicClient || invoiceIds.length === 0) {
      if (invoices.length !== 0) {
        setInvoices([]);
      }
      setIsLoading(false);
      return;
    }

    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const contracts = invoiceIds.map((id) => ({
          address: CONTRACTS.RivoHub.address,
          abi: CONTRACTS.RivoHub.abi,
          functionName: "getInvoice" as const,
          args: [id],
        }));

        const results = await publicClient.multicall({
          contracts,
          allowFailure: true,
        });

        const parsed = results.flatMap((result, index) => {
          if (result.status !== "success" || !result.result) return [] as PayableInvoice[];
          const invoice = result.result as PayableInvoice;
          return [{ ...invoice, invoiceId: invoiceIds[index] }];
        });

        setInvoices(parsed);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [publicClient, invoiceIdsKey, invoices.length]);

  return { invoices, isLoading, error };
}

export function usePayerInvoices(payer?: `0x${string}`) {
  const { invoiceIds, isLoading: isLoadingIds, refetch } = useInvoiceIds("getPayerInvoices", payer);
  const { invoices, isLoading: isLoadingInvoices, error } = useInvoicesByIds(invoiceIds);

  return {
    invoices,
    invoiceIds,
    isLoading: isLoadingIds || isLoadingInvoices,
    error,
    refetch,
  };
}

export function useVendorInvoices(vendor?: `0x${string}`) {
  const { invoiceIds, isLoading: isLoadingIds, refetch } = useInvoiceIds("getVendorInvoices", vendor);
  const { invoices, isLoading: isLoadingInvoices, error } = useInvoicesByIds(invoiceIds);

  return {
    invoices,
    invoiceIds,
    isLoading: isLoadingIds || isLoadingInvoices,
    error,
    refetch,
  };
}

/**
 * Hook to cancel an invoice
 */
export function useCancelInvoice() {
  const { toast } = useToast();
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelInvoice = async (invoiceId: string, reason: string) => {
    try {
      const invoiceIdHash = keccak256(toBytes(invoiceId));

      const txHash = await writeContractAsync({
        address: CONTRACTS.RivoHub.address,
        abi: CONTRACTS.RivoHub.abi,
        functionName: "cancelInvoice",
        args: [invoiceIdHash, reason],
      });

      toast({
        title: "Invoice Cancelled",
        description: "Cancellation has been submitted on-chain.",
      });

      return txHash;
    } catch (error: any) {
      console.error("Failed to cancel invoice:", error);
      toast({
        title: "Cancel Failed",
        description: error?.message || "Failed to cancel invoice. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    cancelInvoice,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
