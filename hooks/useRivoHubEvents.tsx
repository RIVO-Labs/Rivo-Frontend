"use client";

import { useEffect, useState } from "react";
import { usePublicClient, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/web3/contracts";
import { formatUnits } from "viem";

/**
 * InvoiceSettled event from RIVOHub contract
 * Event signature: InvoiceSettled(bytes32 indexed invoiceId, address indexed vendor, uint256 amount, uint256 fee, uint256 timestamp)
 */
export interface InvoiceSettledEvent {
  invoiceId: string;
  vendor: string;
  amount: string;
  amountFormatted: string;
  fee: string;
  feeFormatted: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
}

/**
 * Hook to fetch InvoiceSettled events from RivoHub contract
 * @param fromBlock - Starting block number (default: 0 for all history)
 * @param toBlock - Ending block number (default: 'latest')
 */
export function useInvoiceSettledEvents(
  fromBlock: bigint = 0n,
  toBlock: "latest" | bigint = "latest"
) {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<InvoiceSettledEvent[]>([]);
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
          name: "InvoiceSettled",
          inputs: [
            { type: "bytes32", indexed: true, name: "invoiceId" },
            { type: "address", indexed: true, name: "vendor" },
            { type: "uint256", indexed: false, name: "amount" },
            { type: "uint256", indexed: false, name: "fee" },
            { type: "uint256", indexed: false, name: "timestamp" },
          ],
        },
        fromBlock,
        toBlock,
      });

      const parsedEvents: InvoiceSettledEvent[] = logs.map((log) => {
        const amount = log.args.amount as bigint;
        const fee = log.args.fee as bigint;
        const timestamp = log.args.timestamp as bigint;

        return {
          invoiceId: log.args.invoiceId as string,
          vendor: log.args.vendor as string,
          amount: amount.toString(),
          amountFormatted: formatUnits(amount, 18),
          fee: fee.toString(),
          feeFormatted: formatUnits(fee, 18),
          timestamp: Number(timestamp),
          txHash: log.transactionHash as string,
          blockNumber: log.blockNumber,
        };
      });

      // Sort by timestamp descending (newest first)
      parsedEvents.sort((a, b) => b.timestamp - a.timestamp);

      setEvents(parsedEvents);
    } catch (err) {
      console.error("Error fetching InvoiceSettled events:", err);
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
 * Hook to get contract owner address
 */
export function useContractOwner() {
  const { data: owner, isLoading } = useReadContract({
    address: CONTRACTS.RivoHub.address,
    abi: CONTRACTS.RivoHub.abi,
    functionName: "owner",
  });

  return {
    owner: owner as `0x${string}` | undefined,
    isLoading,
  };
}

/**
 * Hook to fetch user-specific invoice events
 * - If user is contract owner (SME Owner): fetch all events (they made all payments)
 * - If user is vendor: fetch events where they received payment
 */
export function useUserInvoiceEvents(userAddress?: `0x${string}`) {
  const publicClient = usePublicClient();
  const { owner: contractOwner } = useContractOwner();
  const [events, setEvents] = useState<InvoiceSettledEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!publicClient || !userAddress) return;

    const fetchUserEvents = async () => {
      setIsLoading(true);
      try {
        // Get current block and calculate safe fromBlock (last 100k blocks for Base Sepolia)
        const currentBlock = await publicClient.getBlockNumber();
        const maxBlockRange = 100000n;
        const fromBlock = currentBlock > maxBlockRange ? currentBlock - maxBlockRange : 0n;

        const isOwner = contractOwner?.toLowerCase() === userAddress.toLowerCase();

        if (isOwner) {
          // User is contract owner (SME Owner) - fetch ALL events
          // They are the payer for all transactions
          const allLogs = await publicClient.getLogs({
            address: CONTRACTS.RivoHub.address,
            event: {
              type: "event",
              name: "InvoiceSettled",
              inputs: [
                { type: "bytes32", indexed: true, name: "invoiceId" },
                { type: "address", indexed: true, name: "vendor" },
                { type: "uint256", indexed: false, name: "amount" },
                { type: "uint256", indexed: false, name: "fee" },
                { type: "uint256", indexed: false, name: "timestamp" },
              ],
            },
            fromBlock,
          });

          const parsedEvents: InvoiceSettledEvent[] = allLogs.map((log) => {
            const amount = log.args.amount as bigint;
            const fee = log.args.fee as bigint;
            const timestamp = log.args.timestamp as bigint;

            return {
              invoiceId: log.args.invoiceId as string,
              vendor: log.args.vendor as string,
              amount: amount.toString(),
              amountFormatted: formatUnits(amount, 18),
              fee: fee.toString(),
              feeFormatted: formatUnits(fee, 18),
              timestamp: Number(timestamp),
              txHash: log.transactionHash as string,
              blockNumber: log.blockNumber,
            };
          });

          parsedEvents.sort((a, b) => b.timestamp - a.timestamp);
          setEvents(parsedEvents);
        } else {
          // User is vendor - fetch events where they received payment
          const vendorLogs = await publicClient.getLogs({
            address: CONTRACTS.RivoHub.address,
            event: {
              type: "event",
              name: "InvoiceSettled",
              inputs: [
                { type: "bytes32", indexed: true, name: "invoiceId" },
                { type: "address", indexed: true, name: "vendor" },
                { type: "uint256", indexed: false, name: "amount" },
                { type: "uint256", indexed: false, name: "fee" },
                { type: "uint256", indexed: false, name: "timestamp" },
              ],
            },
            args: {
              vendor: userAddress,
            },
            fromBlock,
          });

          const parsedEvents: InvoiceSettledEvent[] = vendorLogs.map((log) => {
            const amount = log.args.amount as bigint;
            const fee = log.args.fee as bigint;
            const timestamp = log.args.timestamp as bigint;

            return {
              invoiceId: log.args.invoiceId as string,
              vendor: log.args.vendor as string,
              amount: amount.toString(),
              amountFormatted: formatUnits(amount, 18),
              fee: fee.toString(),
              feeFormatted: formatUnits(fee, 18),
              timestamp: Number(timestamp),
              txHash: log.transactionHash as string,
              blockNumber: log.blockNumber,
            };
          });

          parsedEvents.sort((a, b) => b.timestamp - a.timestamp);
          setEvents(parsedEvents);
        }
      } catch (error) {
        console.error("Error fetching user invoice events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserEvents();
  }, [publicClient, userAddress, contractOwner]);

  return { events, isLoading };
}

// Legacy export for backward compatibility
export type InvoicePaidEvent = InvoiceSettledEvent;
