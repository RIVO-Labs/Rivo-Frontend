"use client";

import { useEffect, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { chain } from "@/lib/web3/config";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RiAlertLine, RiExchangeLine } from "react-icons/ri";

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  // Use chainId from useAccount() - this returns the ACTUAL wallet chain, not config chain
  const { isConnected, chainId: walletChainId } = useAccount();
  const { switchChain, isPending, error } = useSwitchChain();
  const [showDialog, setShowDialog] = useState(false);

  // Check if wallet is on wrong network (wallet chain doesn't match required chain)
  const isWrongNetwork = isConnected && walletChainId !== undefined && walletChainId !== chain.id;

  useEffect(() => {
    if (isWrongNetwork) {
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [isWrongNetwork]);

  const handleSwitchNetwork = async () => {
    try {
      switchChain({ chainId: chain.id });
    } catch (err) {
      console.error("Failed to switch network:", err);
    }
  };

  return (
    <>
      {children}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <RiAlertLine className="h-5 w-5" />
              Wrong Network Detected
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are currently connected to the wrong network. Please switch to{" "}
              <span className="font-semibold text-primary">Base Sepolia</span> to use
              Rivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Current Network</p>
                <p className="font-medium text-red-500">
                  {walletChainId === 4202 ? "Lisk Sepolia" : `Chain ID: ${walletChainId}`}
                </p>
              </div>
              <RiExchangeLine className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Required Network</p>
                <p className="font-medium text-green-500">Base Sepolia</p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">
                Failed to switch network. Please switch manually in your wallet.
              </p>
            )}

            <Button
              onClick={handleSwitchNetwork}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-primary to-cyan-400"
            >
              {isPending ? (
                <>
                  <span className="animate-spin mr-2">&#9696;</span>
                  Switching...
                </>
              ) : (
                <>
                  <RiExchangeLine className="mr-2 h-4 w-4" />
                  Switch to Base Sepolia
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              If automatic switch doesn&apos;t work, please manually switch to Base
              Sepolia in your MetaMask wallet.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
