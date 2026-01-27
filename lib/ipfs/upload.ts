/**
 * IPFS Upload Utility using Pinata
 * Pinata is a popular IPFS pinning service
 */

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  error?: string;
}

/**
 * Upload file to IPFS via Pinata
 * For development, you can use Pinata's free tier
 * Get API keys from: https://www.pinata.cloud/
 */
export async function uploadToIPFS(file: File): Promise<IPFSUploadResult> {
  try {
    // Check if API keys are configured
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error(
        "Pinata API keys not configured. Please set NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_KEY in .env.local"
      );
    }

    // Create FormData
    const formData = new FormData();
    formData.append("file", file);

    // Optional: Add metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        type: "proof-of-work",
      },
    });
    formData.append("pinataMetadata", metadata);

    // Upload to Pinata
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload to IPFS");
    }

    const data = await response.json();
    const ipfsHash = data.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return {
      success: true,
      ipfsHash,
      ipfsUrl,
    };
  } catch (error) {
    console.error("IPFS upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Alternative: Upload JSON data to IPFS
 * Useful for storing structured proof data
 */
export async function uploadJSONToIPFS(data: Record<string, any>): Promise<IPFSUploadResult> {
  try {
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error("Pinata API keys not configured");
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretKey,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: "proof-of-work-metadata",
          keyvalues: {
            uploadedAt: new Date().toISOString(),
            type: "proof-metadata",
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload JSON to IPFS");
    }

    const result = await response.json();
    const ipfsHash = result.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return {
      success: true,
      ipfsHash,
      ipfsUrl,
    };
  } catch (error) {
    console.error("IPFS JSON upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
