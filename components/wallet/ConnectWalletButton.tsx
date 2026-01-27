"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, Copy, LogOut, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConnectButton } from "@xellar/kit";

export function ConnectWalletButton() {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async (address: string) => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted) {
    return (
      <Button className="gap-2" disabled>
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <ConnectButton.Custom>
      {({ isConnected, account, chain, disconnect, openConnectModal }) => {
        const address = account?.address;

        if (isConnected && address) {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  {formatAddress(address)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => copyAddress(address)} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Address"}
                </DropdownMenuItem>
                {chain && (
                  <DropdownMenuItem className="gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      {chain.name}
                    </div>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnect} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <Button onClick={openConnectModal} className="gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
