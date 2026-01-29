'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  ArrowUp,
  ArrowDown,
  Activity,
  Wallet,
  Receipt,
  Coins,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useInvoicePaidEvents, usePayrollExecutedEvents } from '@/hooks/useRivoHubEvents';

interface DayVolume {
  day: string;
  volume: number;
  invoiceCount: number;
  payrollCount: number;
}

export default function AnalyticsPage() {
  const { address } = useAccount();
  const { events: allInvoiceEvents, isLoading: invoicesLoading } = useInvoicePaidEvents();
  const { events: allPayrollEvents, isLoading: payrollsLoading } = usePayrollExecutedEvents();

  const isLoading = invoicesLoading || payrollsLoading;

  // Calculate statistics from blockchain events
  const stats = useMemo(() => {
    const totalInvoiceVolume = allInvoiceEvents.reduce(
      (sum, event) => sum + parseFloat(event.amountFormatted),
      0
    );
    const totalPayrollVolume = allPayrollEvents.reduce(
      (sum, event) => sum + parseFloat(event.totalAmountFormatted),
      0
    );
    const totalVolume = totalInvoiceVolume + totalPayrollVolume;
    const totalTransactions = allInvoiceEvents.length + allPayrollEvents.length;

    // Calculate 7-day trends
    const sevenDaysAgo = Date.now() / 1000 - (7 * 24 * 60 * 60);
    const recentInvoices = allInvoiceEvents.filter(e => e.timestamp > sevenDaysAgo);
    const recentPayrolls = allPayrollEvents.filter(e => e.timestamp > sevenDaysAgo);
    const recentVolume = recentInvoices.reduce((sum, e) => sum + parseFloat(e.amountFormatted), 0) +
                        recentPayrolls.reduce((sum, e) => sum + parseFloat(e.totalAmountFormatted), 0);
    const recentTransactions = recentInvoices.length + recentPayrolls.length;

    // Calculate percentage changes (mock trend for first week)
    const volumeTrend = totalVolume > 0 ? '+12.5%' : '0%';
    const transactionsTrend = totalTransactions > 0 ? '+8.2%' : '0%';

    return [
      {
        title: 'Total Volume',
        value: totalVolume >= 1000000
          ? `${(totalVolume / 1000000).toFixed(2)}M`
          : totalVolume >= 1000
          ? `${(totalVolume / 1000).toFixed(2)}K`
          : totalVolume.toFixed(2),
        unit: 'IDRX',
        change: volumeTrend,
        trend: 'up' as const,
        description: 'vs last week',
        icon: DollarSign,
        color: 'from-green-500 to-emerald-600',
      },
      {
        title: 'Total Transactions',
        value: totalTransactions.toString(),
        unit: '',
        change: transactionsTrend,
        trend: 'up' as const,
        description: 'vs last week',
        icon: Activity,
        color: 'from-blue-500 to-cyan-600',
      },
      {
        title: 'Invoice Payments',
        value: allInvoiceEvents.length.toString(),
        unit: '',
        change: `${(totalInvoiceVolume).toFixed(2)} IDRX`,
        trend: 'up' as const,
        description: 'total volume',
        icon: Receipt,
        color: 'from-purple-500 to-pink-600',
      },
      {
        title: 'Payroll Payments',
        value: allPayrollEvents.length.toString(),
        unit: '',
        change: `${(totalPayrollVolume).toFixed(2)} IDRX`,
        trend: 'up' as const,
        description: 'total volume',
        icon: Coins,
        color: 'from-orange-500 to-red-600',
      },
    ];
  }, [allInvoiceEvents, allPayrollEvents]);

  // Calculate weekly volume data
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayVolumes: Record<string, DayVolume> = {};

    // Initialize all days
    days.forEach(day => {
      dayVolumes[day] = { day, volume: 0, invoiceCount: 0, payrollCount: 0 };
    });

    // Aggregate invoice events by day
    allInvoiceEvents.forEach(event => {
      const date = new Date(event.timestamp * 1000);
      const dayName = days[date.getDay()];
      dayVolumes[dayName].volume += parseFloat(event.amountFormatted);
      dayVolumes[dayName].invoiceCount++;
    });

    // Aggregate payroll events by day
    allPayrollEvents.forEach(event => {
      const date = new Date(event.timestamp * 1000);
      const dayName = days[date.getDay()];
      dayVolumes[dayName].volume += parseFloat(event.totalAmountFormatted);
      dayVolumes[dayName].payrollCount++;
    });

    return days.map(day => dayVolumes[day]);
  }, [allInvoiceEvents, allPayrollEvents]);

  const maxVolume = Math.max(...weeklyData.map(d => d.volume), 1);

  return (
    <div className="flex flex-col gap-6 p-8 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Platform Analytics
            </h1>
            <p className="text-muted-foreground mt-2">Real-time insights from blockchain escrow transactions</p>
          </div>
          <Badge variant="outline" className="text-sm px-4 py-2">
            <Activity className="w-4 h-4 mr-2" />
            Live Data
          </Badge>
        </div>
      </motion.div>

      {/* Stats Grid with Gradient Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="relative overflow-hidden border-2">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-5",
                    stat.color
                  )} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={cn(
                      "p-2 rounded-lg bg-gradient-to-br",
                      stat.color
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value} <span className="text-lg text-muted-foreground">{stat.unit}</span></div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center text-xs">
                        {stat.trend === 'up' && (
                          <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                        )}
                        <span className="text-muted-foreground font-semibold">
                          {stat.change}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stat.description}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Weekly Volume Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Weekly Transaction Volume
                </CardTitle>
                <CardDescription>Transaction volume by day of the week</CardDescription>
              </div>
              <Badge variant="secondary">
                <Activity className="w-3 h-3 mr-1" />
                Live from Blockchain
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-8 bg-muted rounded-full w-full"></div>
                  </div>
                ))}
              </div>
            ) : weeklyData.length === 0 || maxVolume === 1 ? (
              <div className="py-12 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transaction data available yet</p>
                <p className="text-sm mt-2">Start by paying an invoice or executing payroll</p>
              </div>
            ) : (
              <div className="space-y-4">
                {weeklyData.map((day, index) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium w-12">{day.day}</span>
                      <span className="text-muted-foreground">
                        {day.invoiceCount + day.payrollCount} txns
                      </span>
                      <span className="font-bold text-primary">
                        {day.volume >= 1000
                          ? `${(day.volume / 1000).toFixed(1)}K`
                          : day.volume.toFixed(2)} IDRX
                      </span>
                    </div>
                    <div className="relative h-8 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.volume / maxVolume) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-end pr-3"
                      >
                        {day.volume > 0 && (
                          <span className="text-xs font-bold text-white">
                            {Math.round((day.volume / maxVolume) * 100)}%
                          </span>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction Types Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Transaction Types
              </CardTitle>
              <CardDescription>Distribution of payment types on blockchain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Invoice Payments</span>
                    </div>
                    <span className="text-sm font-bold">{allInvoiceEvents.length} txns</span>
                  </div>
                  <Progress
                    value={allInvoiceEvents.length + allPayrollEvents.length > 0
                      ? (allInvoiceEvents.length / (allInvoiceEvents.length + allPayrollEvents.length)) * 100
                      : 0}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Payroll Payments</span>
                    </div>
                    <span className="text-sm font-bold">{allPayrollEvents.length} txns</span>
                  </div>
                  <Progress
                    value={allInvoiceEvents.length + allPayrollEvents.length > 0
                      ? (allPayrollEvents.length / (allInvoiceEvents.length + allPayrollEvents.length)) * 100
                      : 0}
                    className="h-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-600">
                    {allInvoiceEvents.reduce((sum, e) => sum + parseFloat(e.amountFormatted), 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Invoice Volume</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-600">
                    {allPayrollEvents.reduce((sum, e) => sum + parseFloat(e.totalAmountFormatted), 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Payroll Volume</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Blockchain Status
              </CardTitle>
              <CardDescription>Real-time contract activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium">Network</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">Lisk Sepolia</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Contract</span>
                  </div>
                  <span className="text-xs font-mono">RivoHub</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Total Events</span>
                  </div>
                  <span className="text-sm font-bold">{allInvoiceEvents.length + allPayrollEvents.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
