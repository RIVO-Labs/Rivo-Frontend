/**
 * Signature-based Key Derivation for RIVO Data Encryption
 * 
 * Flow:
 * 1. User signs a message: "Unlock RIVO Private Data Storage"
 * 2. Signature is hashed using SHA-256 to derive 32-byte encryption key
 * 3. Key is stored in-memory (React state) for session duration
 * 4. Key is automatically cleared on logout or tab close
 */

/**
 * Derive 32-byte AES key from wallet signature
 * Uses SHA-256 hash of signature bytes
 * 
 * @param signature - Raw signature from user (0x-prefixed hex string)
 * @returns 32-byte key as Uint8Array suitable for AES-256
 */
export async function deriveKeyFromSignature(signature: string): Promise<Uint8Array> {
  try {
    // Remove 0x prefix if present
    const hexString = signature.startsWith("0x") ? signature.slice(2) : signature;

    // Convert hex string to bytes
    const signatureBytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      signatureBytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }

    // Hash signature using SHA-256 to get 32-byte key
    const hashBuffer = await crypto.subtle.digest("SHA-256", signatureBytes);
    const keyArray = new Uint8Array(hashBuffer);

    console.log("✅ Derived 32-byte encryption key from signature");
    return keyArray;
  } catch (error) {
    console.error("❌ Failed to derive key from signature:", error);
    throw new Error("Failed to derive encryption key from signature");
  }
}

/**
 * Sign message to get encryption key
 * This is a one-time operation per session
 * 
 * @param walletAddress - User's wallet address
 * @returns Signature string (0x-prefixed hex)
 */
export async function signUnlockMessage(walletAddress: string): Promise<string> {
  if (!window.ethereum) {
    throw new Error("Wallet not detected. Please install MetaMask or similar.");
  }

  const message = "Unlock RIVO Private Data Storage";

  try {
    // Request signature from wallet
    const signature = await (window.ethereum as any).request({
      method: "personal_sign",
      params: [message, walletAddress],
    });

    console.log("✅ User signed unlock message");
    return signature as string;
  } catch (error) {
    console.error("❌ User rejected signature:", error);
    throw new Error("Signature required to unlock data encryption");
  }
}

/**
 * Validate that signature can be converted to key
 * Does not require wallet interaction
 * 
 * @param signature - Signature to validate
 * @returns true if valid
 */
export function isValidSignature(signature: string): boolean {
  // Check format: should start with 0x and be 130 chars (65 bytes * 2)
  if (!signature || typeof signature !== "string") return false;
  if (!signature.startsWith("0x")) return false;
  if (signature.length !== 132) return false; // 0x + 130 hex chars = 65 bytes

  // Try to convert to bytes
  try {
    const hexString = signature.slice(2);
    for (let i = 0; i < hexString.length; i += 2) {
      parseInt(hexString.substr(i, 2), 16);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Storage key for encrypted key in sessionStorage
 * Using sessionStorage so key is automatically cleared when tab/session closes
 */
const ENCRYPTION_KEY_SESSION_KEY = "rivo_encryption_key_v1";

/**
 * Store derived key in sessionStorage (volatile - clears on session end)
 * 
 * @param key - 32-byte encryption key as Uint8Array
 */
export function storeEncryptionKeyInSession(key: Uint8Array): void {
  try {
    // Convert Uint8Array to hex string for storage
    const hexKey = Array.from(key)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    sessionStorage.setItem(ENCRYPTION_KEY_SESSION_KEY, hexKey);
    console.log("✅ Encryption key stored in session");
  } catch (error) {
    console.error("❌ Failed to store encryption key:", error);
    throw new Error("Failed to store encryption key in session");
  }
}

/**
 * Retrieve encryption key from sessionStorage
 * Returns null if not found (key not unlocked yet)
 * 
 * @returns 32-byte encryption key as Uint8Array, or null
 */
export function getEncryptionKeyFromSession(): Uint8Array | null {
  try {
    const hexKey = sessionStorage.getItem(ENCRYPTION_KEY_SESSION_KEY);
    if (!hexKey) {
      console.warn("⚠️ Encryption key not found in session");
      return null;
    }

    // Convert hex string back to Uint8Array
    const key = new Uint8Array(hexKey.length / 2);
    for (let i = 0; i < hexKey.length; i += 2) {
      key[i / 2] = parseInt(hexKey.substr(i, 2), 16);
    }

    return key;
  } catch (error) {
    console.error("❌ Failed to retrieve encryption key:", error);
    return null;
  }
}

/**
 * Clear encryption key from sessionStorage (on logout)
 */
export function clearEncryptionKey(): void {
  try {
    sessionStorage.removeItem(ENCRYPTION_KEY_SESSION_KEY);
    console.log("✅ Encryption key cleared from session");
  } catch (error) {
    console.error("❌ Failed to clear encryption key:", error);
  }
}

/**
 * Check if encryption key is available (user already unlocked)
 */
export function isEncryptionKeyAvailable(): boolean {
  const key = sessionStorage.getItem(ENCRYPTION_KEY_SESSION_KEY);
  return !!key;
}
