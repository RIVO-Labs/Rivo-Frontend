/**
 * Token addresses for Base Sepolia Testnet
 */

export const TOKENS = {
  IDRX: {
    address: (process.env.NEXT_PUBLIC_IDRX_ADDRESS || "0xbD0A5945782442e904C1D50438FeCe7f9a53e1c7") as `0x${string}`,
    symbol: "IDRX",
    name: "Indonesian Rupiah X",
    decimals: 18,
  },
} as const;

export const DEFAULT_TOKEN = TOKENS.IDRX;

export type TokenName = keyof typeof TOKENS;
