'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Lock, MessageSquare } from 'lucide-react';

// TODO: Backend integration
export default function DisputesPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Dispute Management</h1>
        <p className="text-muted-foreground">View and manage agreement disputes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-error" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <Lock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Locked Funds</CardTitle>
            <Lock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,500</div>
            <p className="text-xs text-muted-foreground">In disputed agreements</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispute History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agreement</TableHead>
                <TableHead>Initiated By</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Locked Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">AGR-005</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Milestone not completed as specified</TableCell>
                <TableCell>$2,500</TableCell>
                <TableCell><Badge className="bg-error/10 text-error">Active</Badge></TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">AGR-004</TableCell>
                <TableCell>Freelancer</TableCell>
                <TableCell>Payment delay beyond auto-release</TableCell>
                <TableCell>$1,800</TableCell>
                <TableCell><Badge className="bg-success/10 text-success">Resolved</Badge></TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-warning/50 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Dispute Protection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            When a dispute is opened, all funds in the agreement are automatically locked on-chain. 
            No party can unilaterally withdraw funds. Disputes can be resolved manually off-platform 
            or through arbitration (coming soon).
          </p>
          <p className="text-sm font-medium">
            {/* TODO: Implement arbitration system */}
            Future: Decentralized arbitration via DAO voting
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
