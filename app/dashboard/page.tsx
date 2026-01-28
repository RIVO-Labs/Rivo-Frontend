'use client';

import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserInvoiceEvents, useUserPayrollEvents } from '@/hooks/useRivoHubEvents';
import { useIDRXBalance, formatIDRX } from '@/hooks/useIDRXApproval';
import {
  RiQrCodeLine,
  RiTeamLine,
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
  const { events: payrollEvents, isLoading: isLoadingPayroll } = useUserPayrollEvents(address);
  const { balance } = useIDRXBalance(address);
  const [employees, setEmployees] = useState<any[]>([]);

  // Load employees from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("rivo-employees");
    if (stored) {
      try {
        setEmployees(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to load employees:", error);
      }
    }
  }, []);

  // Calculate statistics from blockchain data
  const stats = useMemo(() => {
    if (!address) {
      return {
        totalEmployees: employees.length,
        monthlyPayroll: "0",
        paidInvoices: 0,
        totalPaid: "0",
      };
    }

    // Calculate invoice stats (where user is payer)
    const userAsPayerInvoices = invoiceEvents.filter(
      (e) => e.payer.toLowerCase() === address.toLowerCase()
    );

    const totalInvoicesPaid = userAsPayerInvoices.reduce((sum, event) => {
      return sum + parseFloat(event.amountFormatted);
    }, 0);

    // Calculate payroll stats
    const totalPayrollPaid = payrollEvents.reduce((sum, event) => {
      return sum + parseFloat(event.totalAmountFormatted);
    }, 0);

    // Get latest payroll amount for "monthly payroll"
    const latestPayroll = payrollEvents.length > 0 ? parseFloat(payrollEvents[0].totalAmountFormatted) : 0;

    const totalPaid = totalInvoicesPaid + totalPayrollPaid;

    return {
      totalEmployees: employees.length,
      monthlyPayroll: latestPayroll.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
      paidInvoices: userAsPayerInvoices.length,
      totalPaid: totalPaid.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    };
  }, [invoiceEvents, payrollEvents, address, employees]);

  // Combine and sort recent activity
  const recentActivity = useMemo(() => {
    const activities: any[] = [];

    // Add invoice events
    invoiceEvents.slice(0, 5).forEach((event) => {
      const isUserPayer = event.payer.toLowerCase() === address?.toLowerCase();
      activities.push({
        id: `invoice-${event.txHash}`,
        type: "invoice",
        description: isUserPayer
          ? `Invoice payment to ${event.vendor.slice(0, 6)}...${event.vendor.slice(-4)}`
          : `Invoice payment from ${event.payer.slice(0, 6)}...${event.payer.slice(-4)}`,
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

    // Add payroll events
    payrollEvents.slice(0, 5).forEach((event) => {
      activities.push({
        id: `payroll-${event.txHash}`,
        type: "payroll",
        description: `Payroll processed for ${event.totalRecipients} employees`,
        amount: parseFloat(event.totalAmountFormatted).toLocaleString("id-ID", {
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
  }, [invoiceEvents, payrollEvents, address]);

  const isLoading = isLoadingInvoices || isLoadingPayroll;

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
            Manage your business payments and payroll with IDRX
          </p>
        </div>
        <Badge className="mt-4 md:mt-0 bg-primary/10 text-primary border-primary/20">
          Powered by Lisk Sepolia + IDRX
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

        <Link href="/dashboard/payroll">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-success/20 hover:border-success/40">
            <CardContent className="p-6 text-center">
              <RiTeamLine className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Process Payroll</h3>
              <p className="text-sm text-muted-foreground">Execute batch payments to employees</p>
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
            <CardTitle className="text-sm font-medium">Latest Payroll</CardTitle>
            <RiMoneyDollarCircleLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <RiLoader4Line className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">
                  {stats.monthlyPayroll || "0"} IDRX
                </div>
                <p className="text-xs text-muted-foreground">
                  Last batch execution
                </p>
                <div className="flex items-center mt-2">
                  <RiTeamLine className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm">{stats.totalEmployees} employees</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Payments</CardTitle>
            <RiFileTextLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <RiLoader4Line className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{stats.paidInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  Total invoices paid
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
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <RiArrowUpLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <RiLoader4Line className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-success">{stats.totalPaid} IDRX</div>
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
                      {activity.type === 'payroll' ? (
                        <RiTeamLine className="h-8 w-8 text-success" />
                      ) : (
                        <RiQrCodeLine className="h-8 w-8 text-primary" />
                      )}
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
