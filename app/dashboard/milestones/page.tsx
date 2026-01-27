'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Clock, Plus, ThumbsUp, X, Calendar, DollarSign, FileText, AlertCircle, List, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUserAgreementsList } from '@/hooks/useAgreements';
import { useAuth } from '@/hooks/useAuth';

export default function MilestonesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { agreements, isLoading } = useUserAgreementsList();
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [selectedAgreement, setSelectedAgreement] = useState<string | null>(null);
  const milestonesDisabled = true;

  if (milestonesDisabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-8 text-center">
        <h1 className="text-2xl font-bold">Milestones page is temporarily disabled</h1>
        <p className="text-muted-foreground">
          Use the Agreements page to submit work and track milestone progress.
        </p>
        <Button asChild>
          <a href="/dashboard/agreements">Go to Agreements</a>
        </Button>
      </div>
    );
  }

  // Filter milestone-based agreements
  const milestoneAgreements = agreements.filter(a => a.type === 'milestone');

  const handleSubmit = () => {
    // TODO: Smart contract call
    toast({ title: 'Submitting Milestone', description: 'Recording on-chain...' });
    setIsSubmitOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'funded': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'proposed': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'accepted': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'created': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'funded': return <Clock className="h-4 w-4" />;
      case 'proposed': return <AlertCircle className="h-4 w-4" />;
      case 'accepted': return <CheckCircle2 className="h-4 w-4" />;
      case 'created': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate statistics
  const totalMilestones = milestoneAgreements.reduce((sum, a) => sum + a.totalMilestones, 0);
  const completedMilestones = milestoneAgreements
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + a.currentMilestone, 0);
  const activeMilestones = milestoneAgreements
    .filter(a => a.status === 'funded' || a.status === 'proposed' || a.status === 'accepted')
    .reduce((sum, a) => sum + 1, 0);
  const totalValue = milestoneAgreements.reduce((sum, a) => sum + a.totalBudget, 0);
  const completedValue = milestoneAgreements.reduce((sum, a) => sum + a.amountReleased, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading milestones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Milestones Timeline</h1>
          <p className="text-muted-foreground">Track and manage project milestones with visual timeline</p>
        </div>
        <div className="flex gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'timeline' | 'table')} className="w-auto">
            <TabsList>
              <TabsTrigger value="timeline" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <List className="h-4 w-4" />
                Table
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Submit Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Milestone</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Agreement ID</Label>
                  <Input placeholder="AGR-001" />
                </div>
                <div className="grid gap-2">
                  <Label>Milestone Number</Label>
                  <Input type="number" placeholder="1" />
                </div>
                <div className="grid gap-2">
                  <Label>Deliverables</Label>
                  <Textarea placeholder="Describe completed work..." />
                </div>
                <div className="grid gap-2">
                  <Label>Proof of Work (URL)</Label>
                  <Input placeholder="https://github.com/..." />
                </div>
                <Button onClick={handleSubmit}>Submit for Approval</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">{completedMilestones} of {totalMilestones} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMilestones}</div>
            <p className="text-xs text-muted-foreground mt-1">${completedValue.toLocaleString()} earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMilestones}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agreements</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{milestoneAgreements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Milestone-based</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Contract value</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline/List View */}
      {viewMode === 'timeline' && (
        <div className="grid gap-6">
          {milestoneAgreements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No milestone-based agreements found</p>
              </CardContent>
            </Card>
          ) : (
            milestoneAgreements.map((agreement) => (
              <Card key={agreement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{agreement.id}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(agreement.status)}>
                          {getStatusIcon(agreement.status)}
                          <span className="ml-1 capitalize">{agreement.status}</span>
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{agreement.projectName}</CardTitle>
                      <CardDescription className="mt-1">{agreement.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${agreement.totalBudget.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Budget</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Milestone Progress</span>
                        <span className="font-medium">
                          {agreement.currentMilestone} / {agreement.totalMilestones} milestones
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{
                            width: `${agreement.totalMilestones > 0
                              ? (agreement.currentMilestone / agreement.totalMilestones) * 100
                              : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid gap-4 md:grid-cols-3 pt-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Amount Released</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${agreement.amountReleased.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {user?.role === 'freelancer' ? 'Company' : 'Freelancer'}
                        </p>
                        <p className="text-lg font-semibold">
                          {user?.role === 'freelancer' ? agreement.company : agreement.freelancer}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Next Payment</p>
                        <p className="text-lg font-semibold">${agreement.nextPayment.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{agreement.nextPaymentDate}</p>
                      </div>
                    </div>

                    {/* Proof of Work */}
                    {agreement.currentProofURI && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Current Proof:</span>
                          <a
                            href={agreement.currentProofURI}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            View Submission
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle>Milestone Agreements</CardTitle>
            <CardDescription>All milestone-based agreements</CardDescription>
          </CardHeader>
          <CardContent>
            {milestoneAgreements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No milestone-based agreements found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Released</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestoneAgreements.map((agreement) => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-mono">#{agreement.id}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {agreement.projectName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {agreement.currentMilestone}/{agreement.totalMilestones}
                          </div>
                          <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{
                                width: `${agreement.totalMilestones > 0
                                  ? (agreement.currentMilestone / agreement.totalMilestones) * 100
                                  : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${agreement.totalBudget.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${agreement.amountReleased.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(agreement.status)}>
                          {getStatusIcon(agreement.status)}
                          <span className="ml-1 capitalize">{agreement.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-sm">
                            ${agreement.nextPayment.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {agreement.nextPaymentDate}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
