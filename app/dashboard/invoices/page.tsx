"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "react-icons/ri";

// Dummy invoice data
const invoices = [
  {
    id: "INV-001",
    supplier: "PT Global Supplies",
    amount: "15.500.000 IDRX",
    description: "Office Equipment and Supplies",
    status: "paid",
    createdAt: "2024-01-20",
    paidAt: "2024-01-21",
    qrCode: "data:image/svg+xml,<svg></svg>",
  },
  {
    id: "INV-002",
    supplier: "Digital Marketing Agency",
    amount: "8.750.000 IDRX",
    description: "Q4 Marketing Campaign",
    status: "pending",
    createdAt: "2024-01-22",
    paidAt: null,
    qrCode: "data:image/svg+xml,<svg></svg>",
  },
  {
    id: "INV-003",
    supplier: "Software Vendor Inc",
    amount: "25.000.000 IDRX",
    description: "Annual Software License",
    status: "pending",
    createdAt: "2024-01-25",
    paidAt: null,
    qrCode: "data:image/svg+xml,<svg></svg>",
  },
];

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  paid: "bg-green-500/10 text-green-700 border-green-500/20",
  overdue: "bg-red-500/10 text-red-700 border-red-500/20",
};

export default function InvoicesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Create and manage supplier invoices with QR payment codes
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="mt-4 md:mt-0"
        >
          <RiAddLine className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </motion.div>

      {/* Create Invoice Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Create New Invoice</h2>
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
              ×
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier Name</Label>
              <Input id="supplier" placeholder="Enter supplier name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (IDRX)</Label>
              <Input id="amount" placeholder="0.00" type="number" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Invoice description" />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button>
              <RiQrCodeLine className="mr-2 h-4 w-4" />
              Generate QR Invoice
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
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <RiFilterLine className="mr-2 h-4 w-4" />
          Filter
        </Button>
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
                <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">33.750.000 IDRX</p>
              </div>
              <RiClockAltLine className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">15.500.000 IDRX</p>
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
                <p className="text-2xl font-bold">3</p>
              </div>
              <RiFileTextLine className="h-8 w-8 text-blue-500" />
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
        {filteredInvoices.map((invoice, index) => (
          <motion.div
            key={invoice.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{invoice.id}</h3>
                      <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {invoice.supplier}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.description}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary">
                      {invoice.amount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created: {invoice.createdAt}
                    </p>
                    {invoice.paidAt && (
                      <p className="text-sm text-green-600">
                        Paid: {invoice.paidAt}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <RiEyeLine className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <RiQrCodeLine className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <RiDownloadLine className="h-4 w-4" />
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