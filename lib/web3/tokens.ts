/**
 * Token addresses for Lisk Sepolia Testnet
 */

export const TOKENS = {
  IDRX: {
    address: (process.env.NEXT_PUBLIC_IDRX_ADDRESS || "0x70df9208f44Ec74f800Caf803174F8C80Bc68162") as `0x${string}`,
    symbol: "IDRX",
    name: "Indonesian Rupiah X",
    decimals: 18,
  },
} as const;

export const DEFAULT_TOKEN = TOKENS.IDRX;

export type TokenName = keyof typeof TOKENS;
