'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  RiMoneyDollarCircleLine,
  RiDownloadLine,
  RiSearchLine,
  RiFilterLine,
  RiExternalLinkLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiQrCodeLine,
  RiTeamLine,
} from 'react-icons/ri';

// Payment data - replace with API call
const payments: any[] = [];

const statusColors = {
  completed: "bg-green-500/10 text-green-700 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  failed: "bg-red-500/10 text-red-700 border-red-500/20",
};

const typeColors = {
  payroll: "bg-blue-500/10 text-blue-700 border-blue-500/20", 
  invoice: "bg-purple-500/10 text-purple-700 border-purple-500/20",
};

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || payment.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => 
    sum + parseFloat(p.amount.replace(/[^\d.]/g, '')), 0
  );

  const thisMonthPayments = payments.filter(p => 
    p.status === 'completed' && p.date.startsWith('2024-01')
  ).reduce((sum, p) => 
    sum + parseFloat(p.amount.replace(/[^\d.]/g, '')), 0
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
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground">
            Track all IDRX payments and transactions
          </p>
        </div>
        <Button>
          <RiDownloadLine className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </motion.div>

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
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Types</option>
          <option value="payroll">Payroll</option>
          <option value="invoice">Invoices</option>
        </select>
      </motion.div>

      {/* Payment Statistics */}
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
                <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{(totalPayments / 1000000).toFixed(1)}M IDRX</p>
              </div>
              <RiMoneyDollarCircleLine className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{(thisMonthPayments / 1000000).toFixed(1)}M IDRX</p>
              </div>
              <RiCheckboxCircleLine className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{payments.filter(p => p.status === 'completed').length}</p>
              </div>
              <RiTimeLine className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredPayments.map((payment, index) => (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {payment.type === 'payroll' ? (
                      <RiTeamLine className="h-8 w-8 text-blue-500" />
                    ) : (
                      <RiQrCodeLine className="h-8 w-8 text-purple-500" />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{payment.id}</h3>
                        <Badge className={typeColors[payment.type as keyof typeof typeColors]}>
                          {payment.type}
                        </Badge>
                        <Badge className={statusColors[payment.status as keyof typeof statusColors]}>
                          {payment.status}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        To: {payment.recipient}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.date}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-primary mb-2">
                      {payment.amount}
                    </p>
                    
                    {payment.txHash && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {payment.txHash.slice(0, 10)}...{payment.txHash.slice(-8)}
                        </span>
                        <Button variant="outline" size="sm">
                          <RiExternalLinkLine className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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
