"use client";

import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { useToast } from "@/hooks/use-toast";

export function useWallet() {
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      });
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const signMessage = async (message: string) => {
    try {
      const signature = await signMessageAsync({ message });
      return signature;
    } catch (error) {
      console.error("Failed to sign message:", error);
      toast({
        title: "Signature Failed",
        description: "Failed to sign message. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isPending,
    chain,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signMessage,
    connectors,
  };
}
