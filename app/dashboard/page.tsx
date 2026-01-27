'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'react-icons/ri';

// Dummy data for dashboard
const stats = {
  totalEmployees: 15,
  totalSuppliers: 8,
  monthlyPayroll: "187.500.000 IDRX",
  pendingInvoices: 3,
  paidInvoices: 12,
  totalPaid: "2.750.000.000 IDRX",
};

const recentActivity = [
  {
    id: 1,
    type: "payroll",
    description: "Monthly payroll processed for 15 employees",
    amount: "187.500.000 IDRX",
    date: "2024-01-01",
    status: "completed"
  },
  {
    id: 2,
    type: "invoice",
    description: "Invoice paid by PT Global Supplies",
    amount: "15.500.000 IDRX",
    date: "2024-01-21",
    status: "completed"
  },
  {
    id: 3,
    type: "invoice",
    description: "New invoice created for Software Vendor Inc",
    amount: "25.000.000 IDRX",
    date: "2024-01-25",
    status: "pending"
  },
];

export default function DashboardPage() {
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
          Powered by Base + IDRX
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
              <h3 className="font-semibold mb-2">Create QR Invoice</h3>
              <p className="text-sm text-muted-foreground">Generate payment invoices for suppliers</p>
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
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <RiMoneyDollarCircleLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.monthlyPayroll}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
            <div className="flex items-center mt-2">
              <RiTeamLine className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm">{stats.totalEmployees} employees</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Status</CardTitle>
            <RiFileTextLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Paid this month
            </p>
            <div className="flex items-center mt-2">
              <RiTimeLine className="h-4 w-4 text-yellow-500 mr-2" />
              <span className="text-sm">{stats.pendingInvoices} pending</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <RiArrowUpLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.totalPaid}</div>
            <p className="text-xs text-muted-foreground">
              All time transactions
            </p>
            <div className="flex items-center mt-2">
              <RiStore2Line className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm">{stats.totalSuppliers} suppliers</span>
            </div>
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
                <CardDescription>Latest payments and invoice activities</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
                <RiArrowRightLine className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                    <Badge 
                      className={activity.status === 'completed' 
                        ? 'bg-green-500/10 text-green-700 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
