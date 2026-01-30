import RivoHubABI from "./abi/RivoHub.json";
import ERC20ABI from "./abi/ERC20.json";

export const CONTRACTS = {
  RivoHub: {
    address: (process.env.NEXT_PUBLIC_RIVOHUB_ADDRESS || "0x8E7667A5F90eA5c4A28bae9720a9fa16402D59A9") as `0x${string}`,
    abi: RivoHubABI,
  },
  IDRX: {
    address: (process.env.NEXT_PUBLIC_IDRX_ADDRESS || "0xa2F46F508406301566d652F14223d3557F0BB47B") as `0x${string}`,
    abi: ERC20ABI,
  },
} as const;

export type ContractName = keyof typeof CONTRACTS;
