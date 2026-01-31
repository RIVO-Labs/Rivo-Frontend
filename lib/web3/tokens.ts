/**
 * Token addresses for Base Sepolia Testnet
 */

export const TOKENS = {
  IDRX: {
    address: (process.env.NEXT_PUBLIC_IDRX_ADDRESS || "0xa2F46F508406301566d652F14223d3557F0BB47B") as `0x${string}`,
    symbol: "IDRX",
    name: "Indonesian Rupiah X",
    decimals: 18,
  },
} as const;

export const DEFAULT_TOKEN = TOKENS.IDRX;

export type TokenName = keyof typeof TOKENS;
