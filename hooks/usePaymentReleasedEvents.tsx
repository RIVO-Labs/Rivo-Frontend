'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits, parseAbiItem } from 'viem';
import { CONTRACTS } from '@/lib/web3/contracts';

const Rivo_HUB_ADDRESS = CONTRACTS.RivoHub.address;
const PAYMENT_RELEASED_EVENT = parseAbiItem('event PaymentReleased(uint256 indexed id, uint256 amount)');
const USD_DECIMALS = 6;
const CACHE_PREFIX = 'Rivo_payment_releases';
const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedPaymentEvent = Omit<PaymentReleaseEvent, 'blockNumber'> & {
  blockNumber: string;
};

const serializePayments = (events: PaymentReleaseEvent[]): CachedPaymentEvent[] =>
  events.map((event) => ({
    ...event,
    blockNumber: event.blockNumber.toString(),
  }));

const deserializePayments = (events: CachedPaymentEvent[]): PaymentReleaseEvent[] =>
  events.map((event) => ({
    ...event,
    blockNumber: BigInt(event.blockNumber),
  }));

export interface PaymentReleaseEvent {
  agreementId: string;
  amount: number;
  timestamp: string;
  blockNumber: bigint;
  txHash?: `0x${string}`;
}

interface UsePaymentReleasedEventsReturn {
  payments: PaymentReleaseEvent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePaymentReleasedEvents(agreementIds?: string[]): UsePaymentReleasedEventsReturn {
  const publicClient = usePublicClient();
  const [payments, setPayments] = useState<PaymentReleaseEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheMetaRef = useRef<{ key: string; updatedAt: number } | null>(null);

  const agreementIdKey = useMemo(() => {
    if (!agreementIds || agreementIds.length === 0) return null;
    const normalized = [...agreementIds].filter(Boolean).sort();
    return normalized.join(',');
  }, [agreementIds]);

  const agreementIdSet = useMemo(() => {
    if (!agreementIdKey) return null;
    return new Set(agreementIdKey.split(','));
  }, [agreementIdKey]);

  const cacheKey = useMemo(() => {
    if (!agreementIdKey || !publicClient?.chain?.id) return null;
    return `${CACHE_PREFIX}:${publicClient.chain.id}:${agreementIdKey}`;
  }, [agreementIdKey, publicClient?.chain?.id]);

  useEffect(() => {
    if (!cacheKey || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { updatedAt: number; payments: CachedPaymentEvent[] };
      if (!parsed?.payments || !parsed.updatedAt) return;
      setPayments(deserializePayments(parsed.payments));
      setIsLoading(false);
      cacheMetaRef.current = { key: cacheKey, updatedAt: parsed.updatedAt };
    } catch (err) {
      console.warn('[usePaymentReleasedEvents] Failed to read cache:', err);
    }
  }, [cacheKey]);

  const fetchPaymentEvents = async () => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }
    if (agreementIds && agreementIds.length === 0) {
      setPayments([]);
      setIsLoading(false);
      return;
    }
    if (!agreementIds) {
      setPayments([]);
      setIsLoading(false);
      return;
    }
    if (cacheMetaRef.current && cacheMetaRef.current.key === cacheKey) {
      const cacheAge = Date.now() - cacheMetaRef.current.updatedAt;
      if (cacheAge < CACHE_TTL_MS) {
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentBlock = await publicClient.getBlockNumber();
      // Lisk Sepolia RPC enforces a 100k block range limit for eth_getLogs.
      const maxBlockRange = 100000n;
      const maxChunkSize = 5000n;
      const fromBlock = currentBlock > maxBlockRange ? currentBlock - maxBlockRange : 0n;

      const logs = [];
      const uniqueAgreementIds = Array.from(new Set(agreementIds.filter(Boolean)));

      for (const agreementId of uniqueAgreementIds) {
        let startBlock = fromBlock;
        while (startBlock <= currentBlock) {
          const endBlock = startBlock + maxChunkSize > currentBlock
            ? currentBlock
            : startBlock + maxChunkSize;
          const chunkLogs = await publicClient.getLogs({
            address: Rivo_HUB_ADDRESS,
            event: PAYMENT_RELEASED_EVENT,
            args: { id: BigInt(agreementId) },
            fromBlock: startBlock,
            toBlock: endBlock,
          });
          logs.push(...chunkLogs);
          if (endBlock === currentBlock) {
            break;
          }
          startBlock = endBlock + 1n;
        }
      }

      const blockTimestampCache = new Map<bigint, string>();
      const events: PaymentReleaseEvent[] = [];

      for (const log of logs) {
        if (!log.args.id || log.args.amount === undefined) continue;

        const agreementId = log.args.id.toString();
        if (agreementIdSet && !agreementIdSet.has(agreementId)) continue;

        let timestamp = blockTimestampCache.get(log.blockNumber);
        if (!timestamp) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          timestamp = new Date(Number(block.timestamp) * 1000).toISOString();
          blockTimestampCache.set(log.blockNumber, timestamp);
        }

        events.push({
          agreementId,
          amount: Number(formatUnits(log.args.amount, USD_DECIMALS)),
          timestamp,
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
        });
      }

      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setPayments(events);
      if (cacheKey && typeof window !== 'undefined') {
        try {
          const updatedAt = Date.now();
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ updatedAt, payments: serializePayments(events) })
          );
          cacheMetaRef.current = { key: cacheKey, updatedAt };
        } catch (err) {
          console.warn('[usePaymentReleasedEvents] Failed to write cache:', err);
        }
      }
      setIsLoading(false);
    } catch (err) {
      console.error('[usePaymentReleasedEvents] Failed to fetch payment events:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentEvents();
  }, [publicClient, agreementIdKey]);

  useEffect(() => {
    if (!publicClient) return;

    if (!agreementIdSet) return;

    const unwatchers = Array.from(agreementIdSet).map((agreementId) =>
      publicClient.watchEvent({
        address: Rivo_HUB_ADDRESS,
        event: PAYMENT_RELEASED_EVENT,
        args: { id: BigInt(agreementId) },
        onLogs: async (logs) => {
          const newEvents: PaymentReleaseEvent[] = [];
          const blockTimestampCache = new Map<bigint, string>();

          for (const log of logs) {
            if (!log.args.id || log.args.amount === undefined) continue;

            let timestamp = blockTimestampCache.get(log.blockNumber);
            if (!timestamp) {
              const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
              timestamp = new Date(Number(block.timestamp) * 1000).toISOString();
              blockTimestampCache.set(log.blockNumber, timestamp);
            }

            newEvents.push({
              agreementId: log.args.id.toString(),
              amount: Number(formatUnits(log.args.amount, USD_DECIMALS)),
              timestamp,
              blockNumber: log.blockNumber,
              txHash: log.transactionHash,
            });
          }

          if (newEvents.length > 0) {
            setPayments((prev) => {
              const merged = [...newEvents, ...prev];
              merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              if (cacheKey && typeof window !== 'undefined') {
                try {
                  const updatedAt = Date.now();
                  localStorage.setItem(
                    cacheKey,
                    JSON.stringify({ updatedAt, payments: serializePayments(merged) })
                  );
                  cacheMetaRef.current = { key: cacheKey, updatedAt };
                } catch (err) {
                  console.warn('[usePaymentReleasedEvents] Failed to write cache:', err);
                }
              }
              return merged;
            });
          }
        },
      })
    );

    return () => {
      unwatchers.forEach((unwatch) => unwatch());
    };
  }, [publicClient, agreementIdKey]);

  return {
    payments,
    isLoading,
    error,
    refetch: fetchPaymentEvents,
  };
}
