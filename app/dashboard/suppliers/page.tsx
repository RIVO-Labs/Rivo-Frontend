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

  const categories = ["all", ...Array.from(new Set(suppliers.map(s => s.category)))];

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || supplier.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          onClick={() => setShowCreateForm(true)}
          className="mt-4 md:mt-0"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name</Label>
              <Input id="name" placeholder="Enter supplier name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="e.g., Office Equipment" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="supplier@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+62 21 xxxx xxxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet Address</Label>
              <Input id="wallet" placeholder="0x..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="Supplier address" />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button>
              <RiStore2Line className="mr-2 h-4 w-4" />
              Add Supplier
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
                <p className="text-2xl font-bold">{suppliers.length}</p>
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
                <p className="text-2xl font-bold">{suppliers.filter(s => s.status === 'active').length}</p>
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
        {filteredSuppliers.map((supplier, index) => (
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
        ))}
      </motion.div>
    </div>
  );
}