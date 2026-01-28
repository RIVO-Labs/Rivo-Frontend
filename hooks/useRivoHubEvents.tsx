"use client";

import { useEffect, useState } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { CONTRACTS } from "@/lib/web3/contracts";
import { formatUnits } from "viem";

export interface InvoicePaidEvent {
  invoiceId: string;
  payer: string;
  vendor: string;
  amount: string;
  amountFormatted: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
}

export interface PayrollExecutedEvent {
  payer: string;
  totalRecipients: number;
  totalAmount: string;
  totalAmountFormatted: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
}

/**
 * Hook to fetch InvoicePaid events from RivoHub contract
 * @param fromBlock - Starting block number (default: 0 for all history)
 * @param toBlock - Ending block number (default: 'latest')
 */
export function useInvoicePaidEvents(
  fromBlock: bigint = 0n,
  toBlock: "latest" | bigint = "latest"
) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [events, setEvents] = useState<InvoicePaidEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = async () => {
    if (!publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const logs = await publicClient.getLogs({
        address: CONTRACTS.RivoHub.address,
        event: {
          type: "event",
          name: "InvoicePaid",
          inputs: [
            { type: "bytes32", indexed: true, name: "invoiceId" },
            { type: "address", indexed: true, name: "payer" },
            { type: "address", indexed: true, name: "vendor" },
            { type: "uint256", indexed: false, name: "amount" },
            { type: "uint256", indexed: false, name: "timestamp" },
          ],
        },
        fromBlock,
        toBlock,
      });

      const parsedEvents: InvoicePaidEvent[] = logs.map((log) => {
        const amount = log.args.amount as bigint;
        const timestamp = log.args.timestamp as bigint;

        return {
          invoiceId: log.args.invoiceId as string,
          payer: log.args.payer as string,
          vendor: log.args.vendor as string,
          amount: amount.toString(),
          amountFormatted: formatUnits(amount, 18),
          timestamp: Number(timestamp),
          txHash: log.transactionHash as string,
          blockNumber: log.blockNumber,
        };
      });

      // Sort by timestamp descending (newest first)
      parsedEvents.sort((a, b) => b.timestamp - a.timestamp);

      setEvents(parsedEvents);
    } catch (err) {
      console.error("Error fetching InvoicePaid events:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [publicClient, fromBlock, toBlock]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
  };
}

/**
 * Hook to fetch PayrollExecuted events from RivoHub contract
 * @param fromBlock - Starting block number (default: 0 for all history)
 * @param toBlock - Ending block number (default: 'latest')
 */
export function usePayrollExecutedEvents(
  fromBlock: bigint = 0n,
  toBlock: "latest" | bigint = "latest"
) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [events, setEvents] = useState<PayrollExecutedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = async () => {
    if (!publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const logs = await publicClient.getLogs({
        address: CONTRACTS.RivoHub.address,
        event: {
          type: "event",
          name: "PayrollExecuted",
          inputs: [
            { type: "address", indexed: true, name: "payer" },
            { type: "uint256", indexed: false, name: "totalRecipients" },
            { type: "uint256", indexed: false, name: "totalAmount" },
            { type: "uint256", indexed: false, name: "timestamp" },
          ],
        },
        fromBlock,
        toBlock,
      });

      const parsedEvents: PayrollExecutedEvent[] = logs.map((log) => {
        const totalAmount = log.args.totalAmount as bigint;
        const timestamp = log.args.timestamp as bigint;
        const totalRecipients = log.args.totalRecipients as bigint;

        return {
          payer: log.args.payer as string,
          totalRecipients: Number(totalRecipients),
          totalAmount: totalAmount.toString(),
          totalAmountFormatted: formatUnits(totalAmount, 18),
          timestamp: Number(timestamp),
          txHash: log.transactionHash as string,
          blockNumber: log.blockNumber,
        };
      });

      // Sort by timestamp descending (newest first)
      parsedEvents.sort((a, b) => b.timestamp - a.timestamp);

      setEvents(parsedEvents);
    } catch (err) {
      console.error("Error fetching PayrollExecuted events:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [publicClient, fromBlock, toBlock]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
  };
}

/**
 * Hook to fetch user-specific invoice events (as payer or vendor)
 */
export function useUserInvoiceEvents(userAddress?: `0x${string}`) {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<InvoicePaidEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!publicClient || !userAddress) return;

    const fetchUserEvents = async () => {
      setIsLoading(true);
      try {
        // Fetch events where user is payer
        const payerLogs = await publicClient.getLogs({
          address: CONTRACTS.RivoHub.address,
          event: {
            type: "event",
            name: "InvoicePaid",
            inputs: [
              { type: "bytes32", indexed: true, name: "invoiceId" },
              { type: "address", indexed: true, name: "payer" },
              { type: "address", indexed: true, name: "vendor" },
              { type: "uint256", indexed: false, name: "amount" },
              { type: "uint256", indexed: false, name: "timestamp" },
            ],
          },
          args: {
            payer: userAddress,
          },
          fromBlock: 0n,
        });

        // Fetch events where user is vendor
        const vendorLogs = await publicClient.getLogs({
          address: CONTRACTS.RivoHub.address,
          event: {
            type: "event",
            name: "InvoicePaid",
            inputs: [
              { type: "bytes32", indexed: true, name: "invoiceId" },
              { type: "address", indexed: true, name: "payer" },
              { type: "address", indexed: true, name: "vendor" },
              { type: "uint256", indexed: false, name: "amount" },
              { type: "uint256", indexed: false, name: "timestamp" },
            ],
          },
          args: {
            vendor: userAddress,
          },
          fromBlock: 0n,
        });

        // Combine and deduplicate
        const allLogs = [...payerLogs, ...vendorLogs];
        const uniqueLogs = Array.from(
          new Map(allLogs.map(log => [log.transactionHash, log])).values()
        );

        const parsedEvents: InvoicePaidEvent[] = uniqueLogs.map((log) => {
          const amount = log.args.amount as bigint;
          const timestamp = log.args.timestamp as bigint;

          return {
            invoiceId: log.args.invoiceId as string,
            payer: log.args.payer as string,
            vendor: log.args.vendor as string,
            amount: amount.toString(),
            amountFormatted: formatUnits(amount, 18),
            timestamp: Number(timestamp),
            txHash: log.transactionHash as string,
            blockNumber: log.blockNumber,
          };
        });

        parsedEvents.sort((a, b) => b.timestamp - a.timestamp);
        setEvents(parsedEvents);
      } catch (error) {
        console.error("Error fetching user invoice events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserEvents();
  }, [publicClient, userAddress]);

  return { events, isLoading };
}

/**
 * Hook to fetch user-specific payroll events (as payer)
 */
export function useUserPayrollEvents(userAddress?: `0x${string}`) {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<PayrollExecutedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!publicClient || !userAddress) return;

    const fetchUserEvents = async () => {
      setIsLoading(true);
      try {
        const logs = await publicClient.getLogs({
          address: CONTRACTS.RivoHub.address,
          event: {
            type: "event",
            name: "PayrollExecuted",
            inputs: [
              { type: "address", indexed: true, name: "payer" },
              { type: "uint256", indexed: false, name: "totalRecipients" },
              { type: "uint256", indexed: false, name: "totalAmount" },
              { type: "uint256", indexed: false, name: "timestamp" },
            ],
          },
          args: {
            payer: userAddress,
          },
          fromBlock: 0n,
        });

        const parsedEvents: PayrollExecutedEvent[] = logs.map((log) => {
          const totalAmount = log.args.totalAmount as bigint;
          const timestamp = log.args.timestamp as bigint;
          const totalRecipients = log.args.totalRecipients as bigint;

          return {
            payer: log.args.payer as string,
            totalRecipients: Number(totalRecipients),
            totalAmount: totalAmount.toString(),
            totalAmountFormatted: formatUnits(totalAmount, 18),
            timestamp: Number(timestamp),
            txHash: log.transactionHash as string,
            blockNumber: log.blockNumber,
          };
        });

        parsedEvents.sort((a, b) => b.timestamp - a.timestamp);
        setEvents(parsedEvents);
      } catch (error) {
        console.error("Error fetching user payroll events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserEvents();
  }, [publicClient, userAddress]);

  return { events, isLoading };
}
