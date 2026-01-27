'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DollarSign, Download, ArrowUpRight } from 'lucide-react';
import { useUserAgreementsList } from '@/hooks/useAgreements';
import { usePaymentReleasedEvents } from '@/hooks/usePaymentReleasedEvents';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentsPage() {
  const { user } = useAuth();
  const { agreements, isLoading: isAgreementsLoading, agreementIds } = useUserAgreementsList();
  const agreementIdStrings = agreementIds?.map((id) => id.toString());
  const { payments, isLoading: isPaymentsLoading } = usePaymentReleasedEvents(agreementIdStrings);
  const isLoading = isAgreementsLoading || isPaymentsLoading;

  const formatAddress = (address?: string) => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calculate payment statistics
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  const now = new Date();
  const thisMonthPayments = payments
    .filter((payment) => {
      const date = new Date(payment.timestamp);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const agreementMap = new Map(agreements.map((agreement) => [agreement.id, agreement]));
  const paymentHistory = payments;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="text-muted-foreground">All payment transactions across agreements</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${thisMonthPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Released this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agreements.filter(a => a.status === 'funded' || a.status === 'proposed' || a.status === 'accepted').length}</div>
            <p className="text-xs text-muted-foreground">Currently ongoing</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment history yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>{user?.role === 'freelancer' ? 'From' : 'To'}</TableHead>
                  <TableHead>Amount Released</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => {
                  const agreement = agreementMap.get(payment.agreementId);
                  const counterparty =
                    user?.role === 'freelancer' ? agreement?.companyWallet : agreement?.freelancerWallet;
                  const status = agreement?.status ?? 'unknown';
                  return (
                  <TableRow key={`${payment.agreementId}-${payment.txHash ?? payment.blockNumber.toString()}`}>
                    <TableCell className="font-mono text-xs">#{payment.agreementId}</TableCell>
                    <TableCell className="font-medium">{agreement?.projectName || `Agreement #${payment.agreementId}`}</TableCell>
                    <TableCell>
                      {formatAddress(counterparty)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {agreement?.type || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          status === 'completed'
                            ? 'bg-success/10 text-success border-success/20'
                            : status === 'funded' || status === 'proposed' || status === 'accepted'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : status === 'created'
                            ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                            : 'bg-muted/10 text-muted-foreground border-muted/20'
                        }
                      >
                        {status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
