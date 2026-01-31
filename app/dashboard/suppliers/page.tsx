"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import { useUnlock } from "@/hooks/useUnlock";
import { useToast } from "@/hooks/use-toast";
import { useFetchFromIPFS } from "@/hooks/useFetchFromIPFS";
import { useSuppliersList } from "@/hooks/usePinataList";
import { Permission } from "@/lib/roles";
import { encryptDataWithKey } from "@/lib/ipfs/aes-encryption";
import { uploadJSONToIPFS } from "@/lib/ipfs/upload";
import { useAccount } from "wagmi";
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
import {
  RiStore2Line,
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
  RiMapPinLine,
  RiPhoneLine,
  RiMailLine,
  RiEditLine,
  RiDeleteBinLine,
  RiQrCodeLine,
  RiMoneyDollarCircleLine,
  RiHistoryLine,
  RiLoader4Line,
  RiEyeLine,
} from "react-icons/ri";

// Supplier data - replace with API call
const suppliers: any[] = [];

const categoryColors = {
  "Office Equipment": "bg-blue-500/10 text-blue-700 border-blue-500/20",
  "Marketing Services": "bg-purple-500/10 text-purple-700 border-purple-500/20",
  "Software Licenses": "bg-green-500/10 text-green-700 border-green-500/20",
};

export default function SuppliersPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal for viewing full supplier details
  const [selectedSupplierData, setSelectedSupplierData] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCID, setSelectedCID] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    email: "",
    phone: "",
    wallet: "",
    address: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [permissionError, setPermissionError] = useState<string>("");
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Check role and permissions
  const { isSMEOwner, hasPermission } = useRole();
  const { getEncryptionKey, isUnlocked } = useUnlock();
  const { address } = useAccount();
  const { toast } = useToast();

  // Hook for fetching from IPFS
  const { data: decryptedSupplier, isLoading: isFetchingDetails, error: fetchError, fetch: fetchSupplierDetails } = useFetchFromIPFS(
    selectedCID,
    isUnlocked ? getEncryptionKey() : null
  );

  // Fetch supplier list from Pinata API (replaces localStorage)
  const { items: suppliersList, isLoading: isLoadingList, error: listError, refetch: refetchSuppliers } = useSuppliersList(address);

  const categories = ["all", ...Array.from(new Set(suppliersList.map(s => s.category)))];

  const filteredSuppliers = suppliersList.filter((supplier) => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || supplier.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Supplier name is required";
    }
    if (!formData.category.trim()) {
      errors.category = "Category is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone is required";
    }
    if (!formData.wallet.trim()) {
      errors.wallet = "Wallet address is required";
    } else if (!formData.wallet.startsWith("0x") || formData.wallet.length !== 42) {
      errors.wallet = "Invalid wallet address";
    }
    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle add supplier
  const handleAddSupplier = async () => {
    if (!validateForm()) return;

    // Check permission
    if (!hasPermission(Permission.ADD_SUPPLIER)) {
      setPermissionError("Anda tidak memiliki izin untuk menambahkan supplier. Hanya SME Owner yang dapat melakukan ini.");
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
      const newSupplier = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        category: formData.category,
        email: formData.email,
        phone: formData.phone,
        wallet: formData.wallet,
        address: formData.address,
        status: 'active',
        lastTransaction: new Date().toLocaleDateString('id-ID'),
        totalAmount: '0 IDRX',
        totalInvoices: 0,
        createdAt: new Date().toISOString(),
        createdBy: address,
      };

      // Encrypt supplier data
      const encryptedData = await encryptDataWithKey(newSupplier, encryptionKey);

      // Upload encrypted data to IPFS
      const uploadResult = await uploadJSONToIPFS({
        encrypted: encryptedData,
        metadata: {
          type: 'supplier',
          timestamp: Date.now(),
          walletAddress: address,
          supplierName: formData.name,
        },
      });

      const cid = uploadResult.cid || uploadResult;

      // Upload successful - metadata is stored in Pinata with walletAddress filter
      // Refetch supplier list from Pinata API to get updated list
      await refetchSuppliers();

      // Reset form
      setFormData({
        name: "",
        category: "",
        email: "",
        phone: "",
        wallet: "",
        address: "",
      });
      setFormErrors({});
      setPermissionError("");
      setShowCreateForm(false);

      toast({
        title: "Supplier Added Successfully",
        description: `Supplier "${formData.name}" has been encrypted and stored to IPFS.`,
      });
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast({
        title: "Error",
        description: "Failed to add supplier. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEncrypting(false);
    }
  };

  // Handle viewing supplier full details from IPFS
  const handleViewSupplier = async (supplier: any) => {
    // Supplier from Pinata API already has CID
    try {
      if (supplier.cid) {
        setSelectedCID(supplier.cid);
        setShowDetailsModal(true);
      } else {
        // Fallback to show current data if no CID
        setSelectedSupplierData(supplier);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error("Error viewing supplier:", error);
      toast({
        title: "Error",
        description: "Failed to view supplier details",
        variant: "destructive",
      });
    }
  };

  // Trigger fetch when modal opens with CID
  useEffect(() => {
    if (showDetailsModal && selectedCID && isUnlocked) {
      fetchSupplierDetails();
    }
  }, [showDetailsModal, selectedCID]);

  if (!isSMEOwner) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Akses Terbatas</CardTitle>
            <CardDescription>
              Halaman ini hanya untuk SME Owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Jika kamu adalah vendor, menu Suppliers tidak tersedia untuk role ini.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
          <p className="text-muted-foreground">
            Manage your suppliers and their payment details
          </p>
        </div>
        <Button
          onClick={() => {
            setPermissionError("");
            setShowCreateForm(true);
          }}
          className="mt-4 md:mt-0"
          disabled={!hasPermission(Permission.ADD_SUPPLIER)}
        >
          <RiAddLine className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </motion.div>

      {/* Add Supplier Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Add New Supplier</h2>
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
              <Label htmlFor="name">Supplier Name</Label>
              <Input
                id="name"
                placeholder="Enter supplier name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Office Equipment"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              {formErrors.category && (
                <p className="text-sm text-red-500">{formErrors.category}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="supplier@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+62 21 xxxx xxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {formErrors.phone && (
                <p className="text-sm text-red-500">{formErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet Address</Label>
              <Input
                id="wallet"
                placeholder="0x..."
                value={formData.wallet}
                onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
              />
              {formErrors.wallet && (
                <p className="text-sm text-red-500">{formErrors.wallet}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Supplier address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              {formErrors.address && (
                <p className="text-sm text-red-500">{formErrors.address}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddSupplier} disabled={isEncrypting}>
              {isEncrypting ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  Encrypting & Uploading...
                </>
              ) : (
                <>
                  <RiStore2Line className="mr-2 h-4 w-4" />
                  Add Supplier
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)} disabled={isEncrypting}>
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
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === "all" ? "All Categories" : category}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Supplier Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{suppliersList.length}</p>
              </div>
              <RiStore2Line className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">0 IDRX</p>
              </div>
              <RiMoneyDollarCircleLine className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <RiQrCodeLine className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{suppliersList.filter(s => s.status === 'active').length}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Supplier List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((supplier, index) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{supplier.name}</h3>
                        <Badge className={categoryColors[supplier.category as keyof typeof categoryColors]}>
                          {supplier.category}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <RiMailLine className="h-4 w-4" />
                          {supplier.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <RiPhoneLine className="h-4 w-4" />
                          {supplier.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <RiMapPinLine className="h-4 w-4" />
                          {supplier.address}
                        </div>
                        <div className="flex items-center gap-2">
                          <RiHistoryLine className="h-4 w-4" />
                          Last transaction: {supplier.lastTransaction}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-xl font-semibold text-primary">
                          {supplier.totalAmount}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Invoices</p>
                        <p className="text-lg font-medium">{supplier.totalInvoices}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => handleViewSupplier(supplier)}
                        disabled={!isUnlocked}
                      >
                        <RiEyeLine className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <RiQrCodeLine className="mr-2 h-4 w-4" />
                        Create Invoice
                      </Button>
                      <Button variant="outline" size="sm">
                        <RiEditLine className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <RiDeleteBinLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No suppliers found. Add your first supplier to get started.</p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Supplier Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Supplier Full Details</DialogTitle>
            <DialogDescription>
              {isFetchingDetails ? "Loading from IPFS..." : "Complete supplier information"}
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
          ) : decryptedSupplier || selectedSupplierData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Supplier Name</label>
                  <p className="text-base">{decryptedSupplier?.name || selectedSupplierData?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Category</label>
                  <p className="text-base">{decryptedSupplier?.category || selectedSupplierData?.category}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Email</label>
                  <p className="text-base">{decryptedSupplier?.email || selectedSupplierData?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Phone</label>
                  <p className="text-base">{decryptedSupplier?.phone || selectedSupplierData?.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground">Address</label>
                  <p className="text-base">{decryptedSupplier?.address || selectedSupplierData?.address}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Wallet Address</label>
                  <p className="text-base font-mono text-sm">{decryptedSupplier?.wallet || selectedSupplierData?.wallet}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Status</label>
                  <Badge>{decryptedSupplier?.status || selectedSupplierData?.status}</Badge>
                </div>
              </div>
              {decryptedSupplier && (
                <div className="p-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md text-sm">
                  <p>✅ Data decrypted from IPFS successfully</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No supplier data available</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setShowDetailsModal(false);
              setSelectedCID(null);
              setSelectedSupplierData(null);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}