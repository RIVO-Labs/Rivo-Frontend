import { PinataSDK } from "pinata-web3";
import { decryptFileWithPassphrase, encryptFileWithPassphrase, type EncryptionMetadata } from "@/lib/ipfs/encryption";
import { decryptPassphraseWithWallet, type WalletEncryptedPayload } from "@/lib/ipfs/wallet-encryption";

// Initialize Pinata client
const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";
const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

if (!pinataJWT) {
  console.warn("NEXT_PUBLIC_PINATA_JWT is not set. IPFS functionality will not work.");
}

const pinata = new PinataSDK({
  pinataJwt: pinataJWT,
  pinataGateway: pinataGateway,
});

export interface UserProfileMetadata {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  businessCategory?: string;
  role: 'sme_owner' | 'vendor';
  walletAddress: string;
  createdAt: string;
  updatedAt?: string;
}

type EncryptedProfilePayload = {
  type: 'encrypted-profile';
  encryptedFileUrl: string;
  encryption: EncryptionMetadata;
  encryptedPassphrases: Record<string, WalletEncryptedPayload>;
  recipients: string[];
};

/**
 * Upload user profile metadata to IPFS via Pinata
 * @param profileData - User profile data to upload
 * @returns IPFS CID (Content Identifier)
 */
export async function uploadProfileToIPFS(profileData: UserProfileMetadata): Promise<string> {
  try {
    if (!pinataJWT) {
      throw new Error("Pinata JWT not configured");
    }

    // Generate descriptive filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const username = profileData.username || 'user';
    const walletShort = profileData.walletAddress.slice(0, 6) + '...' + profileData.walletAddress.slice(-4);
    const filename = `profile_${username}_${walletShort}_${timestamp}.json`;

    // Upload JSON data to IPFS with metadata
    const upload = await pinata.upload.json(profileData).addMetadata({
      name: filename,
    });

    console.log("Profile uploaded to IPFS:", upload.IpfsHash);
    return upload.IpfsHash; // This is the CID
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error("Failed to upload profile to IPFS");
  }
}

export async function uploadEncryptedProfileToIPFS(
  profileData: UserProfileMetadata,
  passphrase: string,
  encryptedPassphrases: Record<string, WalletEncryptedPayload>,
  recipients: string[],
): Promise<string> {
  try {
    if (!pinataJWT) {
      throw new Error("Pinata JWT not configured");
    }

    const jsonPayload = JSON.stringify(profileData);
    const profileFile = new File([jsonPayload], "profile.json", { type: "application/json" });

    const { encryptedFile, metadata } = await encryptFileWithPassphrase(profileFile, passphrase);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const walletShort = profileData.walletAddress.slice(0, 6) + '...' + profileData.walletAddress.slice(-4);
    const encryptedFilename = `profile_encrypted_${walletShort}_${timestamp}.enc`;

    const fileUpload = await pinata.upload.file(encryptedFile).addMetadata({
      name: encryptedFilename,
    });

    const encryptedFileUrl = `https://${pinataGateway}/ipfs/${fileUpload.IpfsHash}`;

    const metadataPayload: EncryptedProfilePayload = {
      type: 'encrypted-profile',
      encryptedFileUrl,
      encryption: metadata,
      encryptedPassphrases,
      recipients,
    };

    const metaFilename = `profile_metadata_${walletShort}_${timestamp}.json`;
    const metaUpload = await pinata.upload.json(metadataPayload).addMetadata({
      name: metaFilename,
    });

    console.log("Encrypted profile uploaded to IPFS:", metaUpload.IpfsHash);
    return metaUpload.IpfsHash;
  } catch (error) {
    console.error("Error uploading encrypted profile:", error);
    throw new Error("Failed to upload encrypted profile to IPFS");
  }
}

function isEncryptedProfilePayload(data: unknown): data is EncryptedProfilePayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as any).type === 'encrypted-profile'
  );
}


/**
 * Fetch user profile metadata from IPFS
 * @param cid - IPFS CID (Content Identifier)
 * @returns User profile data
 */
export async function fetchProfileFromIPFS(
  cid: string,
  walletAddress?: string,
  options?: { allowDecrypt?: boolean },
): Promise<UserProfileMetadata | null> {
  try {
    if (!cid) {
      throw new Error("CID is required");
    }

    // Fetch data from IPFS via Pinata gateway
    const response = await fetch(`https://${pinataGateway}/ipfs/${cid}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.status} ${response.statusText}`);
    }

    const raw = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (parseError) {
      throw new Error("Profile CID is not a JSON metadata file.");
    }
    console.log("Profile fetched from IPFS:", cid);

    if (isEncryptedProfilePayload(data)) {
      if (options?.allowDecrypt === false) {
        console.warn("Encrypted profile requires wallet decrypt. Skipping auto-decrypt.");
        return null;
      }
      if (!walletAddress) {
        throw new Error("Wallet address required to decrypt profile.");
      }

      const addressKey = walletAddress.toLowerCase();
      const payload = data as EncryptedProfilePayload;
      const encryptedPassphrase = payload.encryptedPassphrases?.[addressKey];

      if (!encryptedPassphrase) {
        throw new Error("No access to decrypt this profile.");
      }

      const passphrase = await decryptPassphraseWithWallet(encryptedPassphrase, walletAddress);
      const decryptedBlob = await decryptFileWithPassphrase(payload.encryptedFileUrl, payload.encryption, passphrase);
      const profileJson = await decryptedBlob.text();
      return JSON.parse(profileJson) as UserProfileMetadata;
    }

    return data as UserProfileMetadata;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error fetching from IPFS:", {
      cid,
      gateway: pinataGateway,
      message,
      error,
    });
    return null;
  }
}

/**
 * Update user profile by uploading new version to IPFS
 * This creates a new CID - IPFS is immutable
 * @param profileData - Updated profile data
 * @returns New IPFS CID
 */
export async function updateProfileOnIPFS(profileData: UserProfileMetadata): Promise<string> {
  try {
    // Add updated timestamp
    const updatedProfile = {
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    return await uploadProfileToIPFS(updatedProfile);
  } catch (error) {
    console.error("Error updating profile on IPFS:", error);
    throw new Error("Failed to update profile on IPFS");
  }
}

/**
 * Check if Pinata is properly configured
 */
export function isPinataConfigured(): boolean {
  return !!pinataJWT && pinataJWT !== "your_pinata_jwt_here";
}
