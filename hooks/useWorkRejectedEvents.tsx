'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { RejectionHistory } from '@/types/user';
import { CONTRACTS } from '@/lib/web3/contracts';

const Rivo_HUB_ADDRESS = CONTRACTS.RivoHub.address;

// WorkRejected event from smart contract
// event WorkRejected(uint256 indexed id, string reason);
const WORK_REJECTED_EVENT = parseAbiItem('event WorkRejected(uint256 indexed id, string reason)');

interface UseWorkRejectedEventsReturn {
  rejectionHistory: { [agreementId: string]: RejectionHistory[] };
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useWorkRejectedEvents(): UseWorkRejectedEventsReturn {
  const publicClient = usePublicClient();
  const [rejectionHistory, setRejectionHistory] = useState<{ [agreementId: string]: RejectionHistory[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRejectionEvents = async () => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get current block number
      const currentBlock = await publicClient.getBlockNumber();

      // Lisk Sepolia RPC limits: max 100,000 blocks per query
      // Fetch last 50,000 blocks (safe limit)
      const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

      console.log('[useWorkRejectedEvents] Fetching events from block', fromBlock.toString(), 'to', currentBlock.toString());

      const logs = await publicClient.getLogs({
        address: Rivo_HUB_ADDRESS,
        event: WORK_REJECTED_EVENT,
        fromBlock: fromBlock,
        toBlock: currentBlock,
      });

      console.log('[useWorkRejectedEvents] Fetched logs:', logs.length, logs);

      // Group rejections by agreement ID
      const historyMap: { [agreementId: string]: RejectionHistory[] } = {};

      // Fetch block timestamps and milestone numbers for each event
      for (const log of logs) {
        if (!log.args.id || !log.args.reason) {
          console.log('[useWorkRejectedEvents] Skipping log (no id/reason):', log);
          continue;
        }

        const agreementId = log.args.id.toString();
        const reason = log.args.reason;

        console.log('[useWorkRejectedEvents] Processing rejection:', { agreementId, reason, blockNumber: log.blockNumber });

        // Fetch block to get timestamp
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        const timestamp = new Date(Number(block.timestamp) * 1000).toISOString();

        // Query agreement state at the time of rejection to get milestone number
        let milestoneNumber: number | undefined;
        try {
          const agreementData = await publicClient.readContract({
            address: Rivo_HUB_ADDRESS,
            abi: CONTRACTS.RivoHub.abi,
            functionName: 'getAgreementDetails',
            args: [BigInt(agreementId)],
            blockNumber: log.blockNumber,
          }) as any;

          // currentMilestone is the milestone that was just rejected
          milestoneNumber = Number(agreementData.currentMilestone);
          console.log('[useWorkRejectedEvents] Milestone number at rejection:', milestoneNumber);
        } catch (err) {
          console.warn('[useWorkRejectedEvents] Failed to fetch milestone number:', err);
        }

        const rejection: RejectionHistory = {
          timestamp,
          reason,
          milestoneNumber,
        };

        if (!historyMap[agreementId]) {
          historyMap[agreementId] = [];
        }

        historyMap[agreementId].push(rejection);
        console.log('[useWorkRejectedEvents] Added rejection to history:', { agreementId, rejection });
      }

      // Sort each agreement's rejections by timestamp (oldest first)
      Object.keys(historyMap).forEach((agreementId) => {
        historyMap[agreementId].sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      console.log('[useWorkRejectedEvents] Final rejection history:', historyMap);
      setRejectionHistory(historyMap);
      setIsLoading(false);
    } catch (err) {
      console.error('[useWorkRejectedEvents] Failed to fetch rejection events:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRejectionEvents();
  }, [publicClient]);

  // Subscribe to new WorkRejected events
  useEffect(() => {
    if (!publicClient) return;

    const unwatch = publicClient.watchEvent({
      address: Rivo_HUB_ADDRESS,
      event: WORK_REJECTED_EVENT,
      onLogs: async (logs) => {
        for (const log of logs) {
          if (!log.args.id || !log.args.reason) continue;

          const agreementId = log.args.id.toString();
          const reason = log.args.reason;

          // Fetch block to get timestamp
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          const timestamp = new Date(Number(block.timestamp) * 1000).toISOString();

          // Query agreement state to get milestone number
          let milestoneNumber: number | undefined;
          try {
            const agreementData = await publicClient.readContract({
              address: Rivo_HUB_ADDRESS,
              abi: CONTRACTS.RivoHub.abi,
              functionName: 'getAgreementDetails',
              args: [BigInt(agreementId)],
              blockNumber: log.blockNumber,
            }) as any;

            milestoneNumber = Number(agreementData.currentMilestone);
          } catch (err) {
            console.warn('[useWorkRejectedEvents] Failed to fetch milestone number for new event:', err);
          }

          const rejection: RejectionHistory = {
            timestamp,
            reason,
            milestoneNumber,
          };

          // Update state with new rejection
          setRejectionHistory((prev) => ({
            ...prev,
            [agreementId]: [...(prev[agreementId] || []), rejection],
          }));
        }
      },
    });

    return () => {
      unwatch();
    };
  }, [publicClient]);

  return {
    rejectionHistory,
    isLoading,
    error,
    refetch: fetchRejectionEvents,
  };
}

// Helper hook to get rejection history for a specific agreement
export function useAgreementRejectionHistory(agreementId: string) {
  const { rejectionHistory, isLoading, error } = useWorkRejectedEvents();

  const history = rejectionHistory[agreementId] || [];
  const latestRejection = history.length > 0 ? history[history.length - 1] : null;

  // Check if there's a recent rejection (within last 7 days)
  const hasRecentRejection = latestRejection
    ? (Date.now() - new Date(latestRejection.timestamp).getTime()) / (1000 * 60 * 60 * 24) < 7
    : false;

  return {
    history,
    latestRejection,
    hasRecentRejection,
    isLoading,
    error,
  };
}
