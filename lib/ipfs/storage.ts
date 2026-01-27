/**
 * Storage utility for mapping wallet addresses to IPFS CIDs
 * In production, this should be stored on-chain via smart contract
 * For development, we use localStorage
 */

const IPFS_MAPPING_KEY = "ipfs_wallet_mapping";

interface IPFSMapping {
  [walletAddress: string]: string; // walletAddress -> IPFS CID
}

/**
 * Store wallet address to IPFS CID mapping
 * @param walletAddress - Ethereum wallet address
 * @param cid - IPFS Content Identifier
 */
export function storeWalletIPFSMapping(walletAddress: string, cid: string): void {
  try {
    const mapping = getIPFSMapping();
    mapping[walletAddress.toLowerCase()] = cid;
    localStorage.setItem(IPFS_MAPPING_KEY, JSON.stringify(mapping));
    console.log(`Stored IPFS mapping: ${walletAddress} -> ${cid}`);
  } catch (error) {
    console.error("Error storing IPFS mapping:", error);
  }
}

/**
 * Get IPFS CID for a wallet address
 * @param walletAddress - Ethereum wallet address
 * @returns IPFS CID or null if not found
 */
export function getWalletIPFSCID(walletAddress: string): string | null {
  try {
    const mapping = getIPFSMapping();
    return mapping[walletAddress.toLowerCase()] || null;
  } catch (error) {
    console.error("Error getting IPFS CID:", error);
    return null;
  }
}

/**
 * Get all wallet to IPFS mappings
 */
function getIPFSMapping(): IPFSMapping {
  try {
    const stored = localStorage.getItem(IPFS_MAPPING_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error parsing IPFS mapping:", error);
    return {};
  }
}

/**
 * Check if wallet has IPFS profile
 * @param walletAddress - Ethereum wallet address
 */
export function hasIPFSProfile(walletAddress: string): boolean {
  return !!getWalletIPFSCID(walletAddress);
}

/**
 * Remove wallet to IPFS mapping
 * @param walletAddress - Ethereum wallet address
 */
export function removeWalletIPFSMapping(walletAddress: string): void {
  try {
    const mapping = getIPFSMapping();
    delete mapping[walletAddress.toLowerCase()];
    localStorage.setItem(IPFS_MAPPING_KEY, JSON.stringify(mapping));
    console.log(`Removed IPFS mapping for: ${walletAddress}`);
  } catch (error) {
    console.error("Error removing IPFS mapping:", error);
  }
}
