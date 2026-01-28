import RivoHubABI from "./abi/RivoHub.json";
import ERC20ABI from "./abi/ERC20.json";

export const CONTRACTS = {
  RivoHub: {
    address: (process.env.NEXT_PUBLIC_RIVOHUB_ADDRESS || "0x4f4728A078B7d4F11930DF26a65a6c5BE6b4bEc5") as `0x${string}`,
    abi: RivoHubABI,
  },
  IDRX: {
    address: (process.env.NEXT_PUBLIC_IDRX_ADDRESS || "0x70df9208f44Ec74f800Caf803174F8C80Bc68162") as `0x${string}`,
    abi: ERC20ABI,
  },
} as const;

export type ContractName = keyof typeof CONTRACTS;
