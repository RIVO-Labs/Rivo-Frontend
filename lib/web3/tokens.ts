/**
 * Token addresses for Lisk Sepolia Testnet
 */

export const TOKENS = {
  MockUSDC: {
    address: "0xadCf27CB81007962F01E543e2984fdbf299742d6" as `0x${string}`,
    symbol: "USDC",
    name: "USDC",
    decimals: 18,
  },
} as const;

export const DEFAULT_TOKEN = TOKENS.MockUSDC;

export type TokenName = keyof typeof TOKENS;
