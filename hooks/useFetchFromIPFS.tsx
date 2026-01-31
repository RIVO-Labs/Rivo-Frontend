"use client";

import { useState } from "react";
import { decryptDataWithKey } from "@/lib/ipfs/aes-encryption";

interface UseFetchFromIPFSOptions {
  cid: string;
  encryptionKey: Uint8Array | null;
}

interface UseFetchFromIPFSResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

/**
 * Hook to fetch encrypted data from IPFS and decrypt it
 * @param cid - IPFS content identifier
 * @param encryptionKey - Encryption key from wallet signature
 * @returns Object with data, loading state, error, and fetch function
 */
export function useFetchFromIPFS<T = Record<string, any>>(
  cid: string | null,
  encryptionKey: Uint8Array | null
): UseFetchFromIPFSResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!cid || !encryptionKey) {
      setError("CID and encryption key are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch encrypted data from IPFS gateway (use env variable or fallback)
      const ipfsGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
      const response = await globalThis.fetch(`${ipfsGateway}${cid}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
      }

      const encryptedText = await response.text();

      // Decrypt the data
      const decryptedData = await decryptDataWithKey<T>(encryptedText, encryptionKey);

      setData(decryptedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error fetching from IPFS:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    fetch: fetchData,
  };
}
