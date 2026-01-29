"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import { useUnlock } from "@/hooks/useUnlock";
import { useFetchFromIPFS } from "@/hooks/useFetchFromIPFS";
import { Permission } from "@/lib/roles";
import { encryptDataWithKey } from "@/lib/ipfs/aes-encryption";
import { uploadJSONToIPFS } from "@/lib/ipfs/upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  // Check role and permissions
  const { hasPermission: checkPermission } = useRole();
  const canGenerateInvoice = checkPermission(Permission.GENERATE_QR_INVOICE);
  const canPayInvoice = checkPermission(Permission.PAY_INVOICE);
  const { getEncryptionKey, isUnlocked } = useUnlock();

  // Hooks for smart contract interactions
  const { payInvoice, isPending, isConfirming, isSuccess, hash } = useRivoHub();
  const { balance, balanceFormatted, refetch: refetchBalance } = useIDRXBalance(address);
  const { allowance, refetch: refetchAllowance } = useIDRXAllowance(address);
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: isApproveSuccess } = useApproveIDRX();
  const { events: invoiceEvents, isLoading: isLoadingEvents } = useUserInvoiceEvents(address);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [invoiceFormMode, setInvoiceFormMode] = useState<'generate' | 'pay'>('pay');
  const [searchTerm, setSearchTerm] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  
  // Modal for viewing QR invoice details
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCID, setSelectedCID] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    invoiceId: "",
    vendorAddress: "",
    amount: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [permissionError, setPermissionError] = useState<string>("");
  
  // Hook for fetching QR invoice from IPFS
  const { data: decryptedQRInvoice, isLoading: isFetchingDetails, error: fetchError, fetch: fetchQRInvoiceDetails } = useFetchFromIPFS(
    selectedCID,
    isUnlocked ? getEncryptionKey() : null
  );

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

  // Handle generate QR invoice
  const handleGenerateQRInvoice = async () => {
    if (!validateForm()) return;

    // Check permission
    if (!canGenerateInvoice) {
      setPermissionError("Anda tidak memiliki izin untuk membuat QR invoice. Hanya SME Owner atau Supplier yang dapat melakukan ini.");
      return;
    }

    // Check if encryption key is available
    const encryptionKey = getEncryptionKey();
    if (!encryptionKey) {
      toast({
        title: "Encryption Key Not Available",
        description: "Please unlock your data storage first by clicking the Unlock button in the navbar.",
        variant: "destructive",
      });
      return;
    }

    setIsEncrypting(true);
    try {
      const qrInvoiceData = {
        invoiceId: formData.invoiceId,
        vendorAddress: formData.vendorAddress,
        amount: parseFloat(formData.amount),
        description: formData.description,
        createdAt: new Date().toISOString(),
        createdBy: address,
        status: 'generated',
        id: Math.random().toString(36).substr(2, 9),
      };

      // Encrypt QR invoice data
      const encryptedData = await encryptDataWithKey(qrInvoiceData, encryptionKey);

      // Upload encrypted data to IPFS
      const uploadResult = await uploadJSONToIPFS({
        encrypted: encryptedData,
        metadata: {
          type: 'qr_invoice',
          timestamp: Date.now(),
          walletAddress: address,
          invoiceId: formData.invoiceId,
        },
      });

      const cid = uploadResult.cid || uploadResult;

      // Store CID mapping to localStorage
      const mappingKey = `qr_invoice_${address}_${Date.now()}`;
      const mapping = {
        cid,
        timestamp: Date.now(),
        walletAddress: address,
        invoiceId: qrInvoiceData.id,
        invoiceNumber: formData.invoiceId,
      };
      localStorage.setItem(mappingKey, JSON.stringify(mapping));

      // Also store in wallet IPFS mapping for retrieval
      const qrInvoiceList = JSON.parse(localStorage.getItem(`qr_invoices_${address}`) || '[]');
      qrInvoiceList.push(mapping);
      localStorage.setItem(`qr_invoices_${address}`, JSON.stringify(qrInvoiceList));

      // Reset form
      setFormData({
        invoiceId: "",
        vendorAddress: "",
        amount: "",
        description: "",
      });
      setFormErrors({});
      setPermissionError("");
      setShowCreateForm(false);

      toast({
        title: "QR Invoice Generated Successfully",
        description: `QR Invoice "${formData.invoiceId}" has been encrypted and stored to IPFS.`,
      });
    } catch (error) {
      console.error("Error generating QR invoice:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEncrypting(false);
    }
  };

  // Handle viewing QR invoice full details from IPFS
  const handleViewQRInvoice = async (invoiceId: string) => {
    try {
      const storedQRInvoices = localStorage.getItem(`qr_invoices_${address}`);
      if (storedQRInvoices) {
        const mappings = JSON.parse(storedQRInvoices);
        const invoiceMapping = mappings.find((m: any) => m.invoiceNumber === invoiceId);
        
        if (invoiceMapping) {
          setSelectedCID(invoiceMapping.cid);
          setShowDetailsModal(true);
        } else {
          toast({
            title: "Not Found",
            description: "QR Invoice data not found in storage",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error viewing QR invoice:", error);
      toast({
        title: "Error",
        description: "Failed to view QR invoice details",
        variant: "destructive",
      });
    }
  };

  // Trigger fetch when modal opens with CID
  useEffect(() => {
    if (showDetailsModal && selectedCID && isUnlocked) {
      fetchQRInvoiceDetails();
    }
  }, [showDetailsModal, selectedCID]);

  // Handle pay invoice
  const handlePayInvoice = async () => {
    if (!validateForm()) return;

    // Check permission
    if (!canPayInvoice) {
      setPermissionError("Anda tidak memiliki izin untuk membayar invoice. Hanya SME Owner yang dapat melakukan ini.");
      return;
    }

    if (!isApproved) {
      toast({
        title: "Approval Required",
        description: "Please approve IDRX spending first",
        variant: "destructive",
      });
      return;
    }

    // Check if encryption key is available for encrypted logging
    const encryptionKey = getEncryptionKey();
    if (!encryptionKey) {
      toast({
        title: "Encryption Key Not Available",
        description: "Please unlock your data storage first by clicking the Unlock button in the navbar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Encrypt payment record before sending to blockchain
      const paymentRecord = {
        invoiceId: formData.invoiceId,
        vendorAddress: formData.vendorAddress,
        amount: parseFloat(formData.amount),
        description: formData.description,
        paymentInitiatedAt: new Date().toISOString(),
        payerAddress: address,
        status: 'initiated',
      };

      const encryptedData = await encryptDataWithKey(paymentRecord, encryptionKey);

      // Upload encrypted payment record to IPFS
      const uploadResult = await uploadJSONToIPFS({
        encrypted: encryptedData,
        metadata: {
          type: 'payment_record',
          timestamp: Date.now(),
          walletAddress: address,
          invoiceId: formData.invoiceId,
        },
      });

      const cid = uploadResult.cid || uploadResult;

      // Store payment record mapping
      const paymentMappingKey = `payment_${address}_${Date.now()}`;
      const paymentMapping = {
        cid,
        timestamp: Date.now(),
        walletAddress: address,
        invoiceId: formData.invoiceId,
        vendorAddress: formData.vendorAddress,
        amount: formData.amount,
      };
      localStorage.setItem(paymentMappingKey, JSON.stringify(paymentMapping));

      // Proceed with payment
      payInvoice(
        formData.invoiceId,
        formData.vendorAddress as `0x${string}`,
        formData.amount
      );
    } catch (error) {
      console.error("Error preparing payment:", error);
      toast({
        title: "Error",
        description: "Failed to prepare payment. Please try again.",
        variant: "destructive",
      });
    }
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
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button
            onClick={() => {
              setPermissionError("");
              setInvoiceFormMode('generate');
              setShowCreateForm(true);
            }}
            disabled={!address || !canGenerateInvoice}
            variant="outline"
          >
            <RiQrCodeLine className="mr-2 h-4 w-4" />
            Generate QR Invoice
          </Button>
          <Button
            onClick={() => {
              setPermissionError("");
              setInvoiceFormMode('pay');
              setShowCreateForm(true);
            }}
            disabled={!address || !canPayInvoice}
          >
            <RiAddLine className="mr-2 h-4 w-4" />
            Pay Invoice
          </Button>
        </div>
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

      {/* Generate QR Invoice or Pay Invoice Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {invoiceFormMode === 'generate' ? 'Generate QR Invoice' : 'Pay Invoice'}
            </h2>
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
              ×
            </Button>
          </div>

          {permissionError && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-700 border border-red-500/20 rounded-md text-sm">
              {permissionError}
            </div>
          )}

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
              <Label htmlFor="vendorAddress">
                {invoiceFormMode === 'generate' ? 'Vendor/Buyer Wallet Address' : 'Vendor Wallet Address'}
              </Label>
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
            {invoiceFormMode === 'generate' ? (
              <Button onClick={handleGenerateQRInvoice} disabled={isEncrypting}>
                {isEncrypting ? (
                  <>
                    <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                    Encrypting & Uploading...
                  </>
                ) : (
                  <>
                    <RiQrCodeLine className="mr-2 h-4 w-4" />
                    Generate QR Invoice
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={!isApproved ? handleApprove : handlePayInvoice}
                  disabled={isPending || isConfirming || isEncrypting}
                >
                  {isEncrypting || isPending || isConfirming ? (
                    <>
                      <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                      {isEncrypting ? 'Preparing Payment...' : 'Processing...'}
                    </>
                  ) : !isApproved ? (
                    <>
                      <RiCheckLine className="mr-2 h-4 w-4" />
                      Approve IDRX
                    </>
                  ) : (
                    <>
                      <RiMoneyDollarCircleLine className="mr-2 h-4 w-4" />
                      Pay Invoice
                    </>
                  )}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setShowCreateForm(false)} disabled={isEncrypting || isPending || isConfirming}>
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
                        variant="default"
                        size="sm"
                        onClick={() => handleViewQRInvoice(invoice.invoiceId)}
                        disabled={!isUnlocked}
                      >
                        <RiQrCodeLine className="h-4 w-4 mr-1" />
                        QR Details
                      </Button>
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

      {/* QR Invoice Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>QR Invoice Full Details</DialogTitle>
            <DialogDescription>
              {isFetchingDetails ? "Loading from IPFS..." : "Complete QR invoice information"}
            </DialogDescription>
          </DialogHeader>

          {isFetchingDetails ? (
            <div className="flex items-center justify-center py-8">
              <RiLoader4Line className="h-8 w-8 animate-spin mr-2" />
              <span>Fetching and decrypting from IPFS...</span>
            </div>
          ) : fetchError ? (
            <div className="p-4 bg-red-500/10 text-red-700 border border-red-500/20 rounded-md">
              <p className="font-semibold">Error loading details</p>
              <p className="text-sm">{fetchError}</p>
              <p className="text-sm mt-2">Make sure you have unlocked the data storage.</p>
            </div>
          ) : decryptedQRInvoice || selectedInvoiceData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Invoice ID</label>
                  <p className="text-base">{decryptedQRInvoice?.invoiceId || selectedInvoiceData?.invoiceId}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Amount</label>
                  <p className="text-base text-green-600 font-semibold">{decryptedQRInvoice?.amount || selectedInvoiceData?.amount} IDRX</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Vendor Address</label>
                  <p className="text-base font-mono text-sm">{decryptedQRInvoice?.vendorAddress || selectedInvoiceData?.vendorAddress}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Status</label>
                  <Badge>{decryptedQRInvoice?.status || selectedInvoiceData?.status}</Badge>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground">Description</label>
                  <p className="text-base">{decryptedQRInvoice?.description || selectedInvoiceData?.description || "No description"}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Created At</label>
                  <p className="text-base">{decryptedQRInvoice?.createdAt || selectedInvoiceData?.createdAt}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Created By</label>
                  <p className="text-base font-mono text-sm">{decryptedQRInvoice?.createdBy || selectedInvoiceData?.createdBy}</p>
                </div>
              </div>
              {decryptedQRInvoice && (
                <div className="p-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md text-sm">
                  <p>✅ Data decrypted from IPFS successfully</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No QR invoice data available</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setShowDetailsModal(false);
              setSelectedCID(null);
              setSelectedInvoiceData(null);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
