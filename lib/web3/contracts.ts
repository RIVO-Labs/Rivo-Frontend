import RivoHubABI from "./abi/RivoHub.json";

export const CONTRACTS = {
  RivoHub: {
    address: "0x2040C1AB25d6B92fD6C84c04088D52dB11d8b857" as `0x${string}`,
    abi: RivoHubABI,
  },
} as const;

export type ContractName = keyof typeof CONTRACTS;
