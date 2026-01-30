"use client";

import React from "react";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";
import { Avatar, Name } from "@coinbase/onchainkit/identity";

export function ConnectWalletButton() {
  return (
    <Wallet>
      <ConnectWallet className="gap-2" disconnectedLabel="Connect Wallet">
        <Avatar className="h-5 w-5" />
        <Name />
      </ConnectWallet>
    </Wallet>
  );
}
