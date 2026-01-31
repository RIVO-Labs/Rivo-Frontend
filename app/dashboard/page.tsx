'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserInvoiceEvents, useContractOwner } from '@/hooks/useRivoHubEvents';
import { useIDRXBalance, formatIDRX } from '@/hooks/useIDRXApproval';
import {
  RiQrCodeLine,
  RiMoneyDollarCircleLine,
  RiBarChartLine,
  RiArrowRightLine,
  RiStore2Line,
  RiFileTextLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiArrowUpLine,
  RiLoader4Line,
} from 'react-icons/ri';

export default function DashboardPage() {
  const { address } = useAccount();
  const { events: invoiceEvents, isLoading: isLoadingInvoices } = useUserInvoiceEvents(address);
  const { balance } = useIDRXBalance(address);
  const { owner: contractOwner } = useContractOwner();

  // Check if current user is the contract owner (SME Owner/payer)
  const isContractOwner = address && contractOwner &&
    address.toLowerCase() === contractOwner.toLowerCase();

  // Calculate statistics from blockchain data
  const stats = useMemo(() => {
    if (!address) {
      return {
        paidInvoices: 0,
        totalPaid: "0",
        totalReceived: "0",
        walletBalance: "0",
      };
    }

    // All events returned are relevant to the user
    // - If user is owner: all payments they made
    // - If user is vendor: all payments they received
    const totalAmount = invoiceEvents.reduce((sum, event) => {
      return sum + parseFloat(event.amountFormatted);
    }, 0);

    return {
      paidInvoices: invoiceEvents.length,
      totalPaid: isContractOwner ? totalAmount.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }) : "0",
      totalReceived: !isContractOwner ? totalAmount.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }) : "0",
      walletBalance: formatIDRX(balance),
    };
  }, [invoiceEvents, address, balance, isContractOwner]);

  // Combine and sort recent activity
  const recentActivity = useMemo(() => {
    const activities: any[] = [];

    // Add invoice events
    invoiceEvents.slice(0, 5).forEach((event) => {
      // Determine description based on role
      const description = isContractOwner
        ? `Invoice payment to ${event.vendor.slice(0, 6)}...${event.vendor.slice(-4)}`
        : `Payment received from contract owner`;

      activities.push({
        id: `invoice-${event.txHash}`,
        type: "invoice",
        description,
        amount: parseFloat(event.amountFormatted).toLocaleString("id-ID", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }) + " IDRX",
        date: new Date(event.timestamp * 1000).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        timestamp: event.timestamp,
        status: "completed",
      });
    });

    // Sort by timestamp descending
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [invoiceEvents, isContractOwner]);

  const isLoading = isLoadingInvoices;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RIVO Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your business payments with IDRX
          </p>
        </div>
        <Badge className="mt-4 md:mt-0 bg-primary/10 text-primary border-primary/20">
          Powered by Base Sepolia + IDRX
        </Badge>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Link href="/dashboard/invoices">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20 hover:border-primary/40">
            <CardContent className="p-6 text-center">
              <RiQrCodeLine className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Pay Invoice</h3>
              <p className="text-sm text-muted-foreground">Pay vendor invoices with IDRX</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/suppliers">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-500/20 hover:border-blue-500/40">
            <CardContent className="p-6 text-center">
              <RiStore2Line className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Manage Suppliers</h3>
              <p className="text-sm text-muted-foreground">Add and manage supplier information</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-500/20 hover:border-purple-500/40">
            <CardContent className="p-6 text-center">
              <RiBarChartLine className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">View Analytics</h3>
              <p className="text-sm text-muted-foreground">Track payment performance metrics</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <RiMoneyDollarCircleLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <RiLoader4Line className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">
                  {stats.walletBalance || "0"} IDRX
                </div>
                <p className="text-xs text-muted-foreground">
                  Available balance
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isContractOwner ? "Invoices Paid" : "Payments Received"}
            </CardTitle>
            <RiFileTextLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <RiLoader4Line className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{stats.paidInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  {isContractOwner ? "Total invoices paid" : "Total payments received"}
                </p>
                <div className="flex items-center mt-2">
                  <RiCheckboxCircleLine className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">All completed</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isContractOwner ? "Total Paid" : "Total Received"}
            </CardTitle>
            <RiArrowUpLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <RiLoader4Line className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-success">
                  {isContractOwner ? stats.totalPaid : stats.totalReceived} IDRX
                </div>
                <p className="text-xs text-muted-foreground">
                  All time transactions
                </p>
                <div className="flex items-center mt-2">
                  <RiCheckboxCircleLine className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm">On-chain verified</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest payments from blockchain</CardDescription>
              </div>
              <Link href="/dashboard/invoices">
                <Button variant="outline" size="sm">
                  View All
                  <RiArrowRightLine className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RiLoader4Line className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading activity...</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <RiFileTextLine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No activity yet</p>
                {!address && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Connect your wallet to view activity
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <RiQrCodeLine className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-primary">{activity.amount}</p>
                      <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                        {activity.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
