/**
 * AES Encryption/Decryption Utilities for RIVO
 * 
 * Uses Web Crypto API (AES-256-GCM) for authenticated encryption
 * Designed to work with keys derived from wallet signatures
 */

/**
 * Encrypt JSON data using AES-256-GCM
 * 
 * @param data - Object to encrypt (will be JSON stringified)
 * @param key - 32-byte encryption key (from signature derivation)
 * @returns Encrypted data with IV and auth tag as base64
 */
export async function encryptDataWithKey(
  data: Record<string, any>,
  key: Uint8Array
): Promise<string> {
  try {
    if (key.length !== 32) {
      throw new Error("Encryption key must be 32 bytes");
    }

    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Import key for use with Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key as unknown as BufferSource,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    // Convert data to JSON and then to bytes
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(jsonString);

    // Encrypt using AES-256-GCM
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      cryptoKey,
      plaintext
    );

    // Combine IV + ciphertext and encode as base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    const base64 = btoa(String.fromCharCode(...combined));

    console.log("✅ Data encrypted successfully");
    return base64;
  } catch (error) {
    console.error("❌ Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt AES-256-GCM encrypted data
 * 
 * @param encryptedBase64 - Encrypted data as base64 (IV + ciphertext)
 * @param key - 32-byte encryption key (from signature derivation)
 * @returns Decrypted object
 */
export async function decryptDataWithKey<T = Record<string, any>>(
  encryptedBase64: string,
  key: Uint8Array
): Promise<T> {
  try {
    if (key.length !== 32) {
      throw new Error("Encryption key must be 32 bytes");
    }

    // Decode base64
    const binaryString = atob(encryptedBase64);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }

    // Extract IV (first 12 bytes) and ciphertext (rest)
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    // Import key for use with Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key as unknown as BufferSource,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // Decrypt using AES-256-GCM
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      cryptoKey,
      ciphertext
    );

    // Convert bytes back to string and parse JSON
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(plaintext);
    const decrypted = JSON.parse(jsonString) as T;

    console.log("✅ Data decrypted successfully");
    return decrypted;
  } catch (error) {
    console.error("❌ Decryption failed:", error);
    throw new Error("Failed to decrypt data - key may be invalid");
  }
}

/**
 * Encrypt data to a File object (for IPFS upload)
 * 
 * @param data - Object to encrypt
 * @param key - 32-byte encryption key
 * @param filename - Filename for the encrypted file
 * @returns Encrypted File object
 */
export async function encryptDataToFile(
  data: Record<string, any>,
  key: Uint8Array,
  filename: string = "encrypted-data.enc"
): Promise<File> {
  try {
    const encryptedBase64 = await encryptDataWithKey(data, key);

    // Convert base64 to blob
    const binaryString = atob(encryptedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "application/octet-stream" });
    const file = new File([blob], filename, { type: "application/octet-stream" });

    console.log("✅ Encrypted file created");
    return file;
  } catch (error) {
    console.error("❌ Failed to create encrypted file:", error);
    throw error;
  }
}

/**
 * Validate if data appears to be encrypted (base64 with IV+ciphertext)
 * 
 * @param data - Data to validate
 * @returns true if appears to be valid encrypted data
 */
export function isEncryptedData(data: string): boolean {
  if (!data || typeof data !== "string") return false;

  try {
    // Try to decode base64
    const binaryString = atob(data);
    // Should be at least 12 bytes (IV) + 16 bytes (minimum ciphertext with auth tag)
    return binaryString.length >= 28;
  } catch {
    return false;
  }
}

/**
 * Encrypt multiple employee/supplier records as a batch
 * 
 * @param records - Array of records to encrypt
 * @param key - 32-byte encryption key
 * @returns Array of encrypted records as base64
 */
export async function encryptBatchRecords(
  records: Record<string, any>[],
  key: Uint8Array
): Promise<string[]> {
  try {
    const encrypted = await Promise.all(
      records.map((record) => encryptDataWithKey(record, key))
    );

    console.log(`✅ Encrypted ${encrypted.length} records`);
    return encrypted;
  } catch (error) {
    console.error("❌ Batch encryption failed:", error);
    throw error;
  }
}

/**
 * Decrypt multiple encrypted records as a batch
 * 
 * @param encryptedRecords - Array of encrypted records as base64
 * @param key - 32-byte encryption key
 * @returns Array of decrypted records
 */
export async function decryptBatchRecords<T = Record<string, any>>(
  encryptedRecords: string[],
  key: Uint8Array
): Promise<T[]> {
  try {
    const decrypted = await Promise.all(
      encryptedRecords.map((encrypted) => decryptDataWithKey<T>(encrypted, key))
    );

    console.log(`✅ Decrypted ${decrypted.length} records`);
    return decrypted;
  } catch (error) {
    console.error("❌ Batch decryption failed:", error);
    throw error;
  }
}
