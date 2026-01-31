import { createConfig, http } from "wagmi";
import { baseSepolia } from "viem/chains";
import { coinbaseWallet, injected, metaMask } from "wagmi/connectors";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Rivo";
const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;

export const chain = baseSepolia;

export const config = createConfig({
  chains: [chain],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({
      appName,
    }),
  ],
  ssr: true,
  transports: {
    [chain.id]: baseRpcUrl ? http(baseRpcUrl) : http(),
  },
});
