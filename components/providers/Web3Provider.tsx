"use client";

import React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { config, chain } from "@/lib/web3/config";
import { useTheme } from "next-themes";

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID;
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={apiKey}
          projectId={projectId}
          chain={chain}
          config={{
            wallet: {
              display: "modal",
            },
            appearance: {
              mode,
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
