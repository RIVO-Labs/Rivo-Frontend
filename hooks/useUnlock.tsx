"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import {
  signUnlockMessage,
  deriveKeyFromSignature,
  storeEncryptionKeyInSession,
  getEncryptionKeyFromSession,
  clearEncryptionKey,
  isEncryptionKeyAvailable,
} from "@/lib/ipfs/signature-key-derivation";

interface UnlockContextType {
  // State
  isUnlocked: boolean;
  isUnlocking: boolean;
  error: string | null;

  // Functions
  unlockEncryption: () => Promise<void>;
  getEncryptionKey: () => Uint8Array | null;
  lock: () => void;
}

const UnlockContext = createContext<UnlockContextType | undefined>(undefined);

export function UnlockProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if key exists in sessionStorage on mount
  useEffect(() => {
    const keyExists = isEncryptionKeyAvailable();
    if (keyExists) {
      setIsUnlocked(true);
      console.log("🔓 Encryption key found in session");
    }
  }, []);

  // Clear key on wallet disconnect
  useEffect(() => {
    if (!isConnected) {
      lock();
    }
  }, [isConnected]);

  // Unlock encryption by signing a message and deriving key
  const unlockEncryption = useCallback(async () => {
    if (!address) {
      const msg = "Wallet not connected";
      setError(msg);
      toast({
        title: "Unlock Failed",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    setIsUnlocking(true);
    setError(null);

    try {
      // Request user to sign message
      const signature = await signUnlockMessage(address);

      // Derive encryption key from signature
      const key = await deriveKeyFromSignature(signature);

      // Store key in session storage
      storeEncryptionKeyInSession(key);

      setIsUnlocked(true);
      toast({
        title: "🔓 Data Unlocked",
        description:
          "Your private data is now accessible. Key will be cleared on logout.",
      });

      console.log("✅ Encryption unlocked successfully");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to unlock encryption";
      setError(errorMsg);

      toast({
        title: "Unlock Failed",
        description: errorMsg,
        variant: "destructive",
      });

      console.error("❌ Unlock failed:", err);
    } finally {
      setIsUnlocking(false);
    }
  }, [address, toast]);

  // Get current encryption key from session
  const getEncryptionKey = useCallback((): Uint8Array | null => {
    if (!isUnlocked) {
      console.warn("⚠️ Encryption not unlocked yet");
      return null;
    }

    return getEncryptionKeyFromSession();
  }, [isUnlocked]);

  // Lock and clear encryption key
  const lock = useCallback(() => {
    clearEncryptionKey();
    setIsUnlocked(false);
    setError(null);
    console.log("🔒 Encryption locked");
  }, []);

  return (
    <UnlockContext.Provider
      value={{
        isUnlocked,
        isUnlocking,
        error,
        unlockEncryption,
        getEncryptionKey,
        lock,
      }}
    >
      {children}
    </UnlockContext.Provider>
  );
}

export function useUnlock() {
  const context = useContext(UnlockContext);
  if (context === undefined) {
    throw new Error("useUnlock must be used within UnlockProvider");
  }
  return context;
}
