import RivoHubABI from "./abi/RivoHub.json";
import ERC20ABI from "./abi/ERC20.json";

export const CONTRACTS = {
  RivoHub: {
    address: (process.env.NEXT_PUBLIC_RIVOHUB_ADDRESS || "0xe6052A2BA42485c39c8bbE723ed6fF22c93C6c01") as `0x${string}`,
    abi: RivoHubABI,
  },
  IDRX: {
    address: (process.env.NEXT_PUBLIC_IDRX_ADDRESS || "0xbD0A5945782442e904C1D50438FeCe7f9a53e1c7") as `0x${string}`,
    abi: ERC20ABI,
  },
} as const;

export type ContractName = keyof typeof CONTRACTS;
