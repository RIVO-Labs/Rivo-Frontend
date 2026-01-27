import { defaultConfig } from "@xellar/kit";
import { Config } from "wagmi";
import { liskSepolia } from "viem/chains";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "";
const xellarAppId = process.env.NEXT_PUBLIC_XELLAR_APP_ID || "";
const xellarEnv = (process.env.NEXT_PUBLIC_XELLAR_ENV as "sandbox" | "production") || "sandbox";
const appName = process.env.NEXT_PUBLIC_APP_NAME || "Rivo";

if (!walletConnectProjectId) {
  console.warn("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set");
}

export const config = defaultConfig({
  appName,
  walletConnectProjectId,
  xellarAppId,
  xellarEnv,
  chains: [liskSepolia],
}) as Config;
