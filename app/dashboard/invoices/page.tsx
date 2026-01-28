"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRivoHub } from "@/hooks/useRivoHub";
import { useIDRXBalance, useIDRXAllowance, useApproveIDRX, hasSufficientAllowance, formatIDRX } from "@/hooks/useIDRXApproval";
import { useUserInvoiceEvents } from "@/hooks/useRivoHubEvents";
import {
  RiQrCodeLine,
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
  RiFileTextLine,
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiTimeLine as RiClockAltLine,
  RiEyeLine,
  RiDownloadLine,
  RiWalletLine,
  RiCheckLine,
  RiLoader4Line,
} from "react-icons/ri";
import { isAddress } from "viem";

export default function InvoicesPage() {
  const { address } = useAccount();
  const { toast } = useToast();

  // Hooks for smart contract interactions
  const { payInvoice, isPending, isConfirming, isSuccess, hash } = useRivoHub();
  const { balance, balanceFormatted, refetch: refetchBalance } = useIDRXBalance(address);
  const { allowance, refetch: refetchAllowance } = useIDRXAllowance(address);
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: isApproveSuccess } = useApproveIDRX();
  const { events: invoiceEvents, isLoading: isLoadingEvents } = useUserInvoiceEvents(address);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    invoiceId: "",
    vendorAddress: "",
    amount: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Check if IDRX is approved
  const isApproved = useMemo(() => {
    if (!allowance || !formData.amount) return false;
    return hasSufficientAllowance(allowance, formData.amount);
  }, [allowance, formData.amount]);

  // Refresh allowance when approval is successful
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      toast({
        title: "Approval Successful",
        description: "You can now pay invoices with IDRX",
      });
    }
  }, [isApproveSuccess]);

  // Refresh events and balance when payment is successful
  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
      toast({
        title: "Payment Successful",
        description: "Invoice has been paid successfully",
      });
      // Reset form
      setFormData({
        invoiceId: "",
        vendorAddress: "",
        amount: "",
        description: "",
      });
      setShowCreateForm(false);
    }
  }, [isSuccess]);

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.invoiceId.trim()) {
      errors.invoiceId = "Invoice ID is required";
    }

    if (!formData.vendorAddress.trim()) {
      errors.vendorAddress = "Vendor address is required";
    } else if (!isAddress(formData.vendorAddress)) {
      errors.vendorAddress = "Invalid Ethereum address";
    }

    if (!formData.amount.trim()) {
      errors.amount = "Amount is required";
    } else if (parseFloat(formData.amount) <= 0) {
      errors.amount = "Amount must be greater than 0";
    }

    // Check balance
    if (balance && formData.amount) {
      const amountBigInt = BigInt(parseFloat(formData.amount) * 10 ** 18);
      if (amountBigInt > balance) {
        errors.amount = "Insufficient IDRX balance";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle approve IDRX
  const handleApprove = () => {
    approve(); // Approve unlimited
  };

  // Handle pay invoice
  const handlePayInvoice = () => {
    if (!validateForm()) return;

    if (!isApproved) {
      toast({
        title: "Approval Required",
        description: "Please approve IDRX spending first",
        variant: "destructive",
      });
      return;
    }

    payInvoice(
      formData.invoiceId,
      formData.vendorAddress as `0x${string}`,
      formData.amount
    );
  };

  // Calculate statistics from events
  const stats = useMemo(() => {
    if (!address) return { totalPaid: "0", totalPending: "0", count: 0 };

    // Filter events where user is payer
    const userAsPayer = invoiceEvents.filter(
      (e) => e.payer.toLowerCase() === address.toLowerCase()
    );

    const totalPaid = userAsPayer.reduce((sum, event) => {
      return sum + parseFloat(event.amountFormatted);
    }, 0);

    return {
      totalPaid: totalPaid.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
      totalPending: "0", // Cannot determine pending invoices from blockchain
      count: userAsPayer.length,
    };
  }, [invoiceEvents, address]);

  // Filter events for display
  const filteredInvoices = useMemo(() => {
    return invoiceEvents.filter((invoice) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        invoice.vendor.toLowerCase().includes(searchLower) ||
        invoice.invoiceId.toLowerCase().includes(searchLower) ||
        invoice.txHash.toLowerCase().includes(searchLower)
      );
    });
  }, [invoiceEvents, searchTerm]);

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Invoices</h1>
          <p className="text-muted-foreground">
            Create and manage supplier invoices with blockchain payments
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="mt-4 md:mt-0"
          disabled={!address}
        >
          <RiAddLine className="mr-2 h-4 w-4" />
          Pay Invoice
        </Button>
      </motion.div>

      {/* Wallet Status */}
      {address && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <RiWalletLine className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">IDRX Balance</p>
                    <p className="text-2xl font-bold">{formatIDRX(balance)} IDRX</p>
                  </div>
                </div>
                {!isApproved && (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving || isApprovingConfirming}
                    variant="outline"
                  >
                    {isApproving || isApprovingConfirming ? (
                      <>
                        <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <RiCheckLine className="mr-2 h-4 w-4" />
                        Approve IDRX
                      </>
                    )}
                  </Button>
                )}
                {isApproved && (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                    <RiCheckboxCircleLine className="mr-1 h-4 w-4" />
                    IDRX Approved
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pay Invoice Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pay Invoice</h2>
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
              ×
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceId">Invoice ID</Label>
              <Input
                id="invoiceId"
                placeholder="INV-001"
                value={formData.invoiceId}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceId: e.target.value })
                }
              />
              {formErrors.invoiceId && (
                <p className="text-sm text-red-500">{formErrors.invoiceId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (IDRX)</Label>
              <Input
                id="amount"
                placeholder="0.00"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
              {formErrors.amount && (
                <p className="text-sm text-red-500">{formErrors.amount}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vendorAddress">Vendor Wallet Address</Label>
              <Input
                id="vendorAddress"
                placeholder="0x..."
                value={formData.vendorAddress}
                onChange={(e) =>
                  setFormData({ ...formData, vendorAddress: e.target.value })
                }
              />
              {formErrors.vendorAddress && (
                <p className="text-sm text-red-500">{formErrors.vendorAddress}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Invoice description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handlePayInvoice}
              disabled={isPending || isConfirming || !isApproved}
            >
              {isPending || isConfirming ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RiMoneyDollarCircleLine className="mr-2 h-4 w-4" />
                  Pay Invoice
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by vendor address, invoice ID, or tx hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Invoice Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">{stats.totalPaid} IDRX</p>
              </div>
              <RiCheckboxCircleLine className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.count}</p>
              </div>
              <RiFileTextLine className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Balance</p>
                <p className="text-2xl font-bold">{formatIDRX(balance)} IDRX</p>
              </div>
              <RiWalletLine className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Invoice List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold">Payment History</h2>

        {isLoadingEvents && (
          <Card>
            <CardContent className="p-12 text-center">
              <RiLoader4Line className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading invoice history...</p>
            </CardContent>
          </Card>
        )}

        {!isLoadingEvents && filteredInvoices.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <RiFileTextLine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? "No invoices found matching your search" : "No invoice payments yet"}
              </p>
              {!address && (
                <p className="text-sm text-muted-foreground mt-2">
                  Connect your wallet to view invoices
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {!isLoadingEvents &&
          filteredInvoices.map((invoice, index) => (
            <motion.div
              key={`${invoice.txHash}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {invoice.invoiceId.slice(0, 10)}...
                        </h3>
                        <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                          Paid
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Vendor: {invoice.vendor.slice(0, 6)}...{invoice.vendor.slice(-4)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tx: {invoice.txHash.slice(0, 10)}...{invoice.txHash.slice(-8)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">
                        {parseFloat(invoice.amountFormatted).toLocaleString("id-ID", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{" "}
                        IDRX
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(invoice.timestamp)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(
                            `https://sepolia-blockscout.lisk.com/tx/${invoice.txHash}`,
                            "_blank"
                          );
                        }}
                      >
                        <RiEyeLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </motion.div>
    </div>
  );
}
