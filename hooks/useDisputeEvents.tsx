'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { CONTRACTS } from '@/lib/web3/contracts';

const Rivo_HUB_ADDRESS = CONTRACTS.RivoHub.address;
const AGREEMENT_DISPUTED_EVENT = parseAbiItem('event AgreementDisputed(uint256 indexed id, string reason)');

export interface DisputeEvent {
  agreementId: string;
  reason: string;
  timestamp: string;
  blockNumber?: string;
  txHash?: `0x${string}`;
}

interface UseAgreementDisputeReturn {
  dispute: DisputeEvent | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAgreementDispute(agreementId?: string, enabled = true): UseAgreementDisputeReturn {
  const publicClient = usePublicClient();
  const [dispute, setDispute] = useState<DisputeEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDisputeEvent = async () => {
    if (!publicClient || !agreementId || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const cacheKey = `dispute:${agreementId}`;
      if (typeof window !== 'undefined') {
        const cached = window.localStorage.getItem(cacheKey);
        if (cached) {
          setDispute(JSON.parse(cached) as DisputeEvent);
          setIsLoading(false);
          return;
        }
      }

      const currentBlock = await publicClient.getBlockNumber();
      const step = 5000n;
      const maxScan = 200000n;
      let scanned = 0n;
      let toBlock = currentBlock;

      while (true) {
        const fromBlock = toBlock > step ? toBlock - step : 0n;

        const logs = await publicClient.getLogs({
          address: Rivo_HUB_ADDRESS,
          event: AGREEMENT_DISPUTED_EVENT,
          args: { id: BigInt(agreementId) },
          fromBlock,
          toBlock,
        });

        if (logs.length > 0) {
          const latest = logs[logs.length - 1];
          const block = await publicClient.getBlock({ blockNumber: latest.blockNumber });
          const timestamp = new Date(Number(block.timestamp) * 1000).toISOString();
          const result: DisputeEvent = {
            agreementId,
            reason: latest.args.reason || '',
            timestamp,
            blockNumber: latest.blockNumber.toString(),
            txHash: latest.transactionHash,
          };
          setDispute(result);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(cacheKey, JSON.stringify(result));
          }
          setIsLoading(false);
          return;
        }

        if (fromBlock === 0n || scanned >= maxScan) {
          break;
        }

        scanned += step;
        toBlock = fromBlock;
      }

      setDispute(null);
      setIsLoading(false);
    } catch (err) {
      console.error('[useAgreementDispute] Failed to fetch dispute event:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputeEvent();
  }, [publicClient, agreementId, enabled]);

  return {
    dispute,
    isLoading,
    error,
    refetch: fetchDisputeEvent,
  };
}
