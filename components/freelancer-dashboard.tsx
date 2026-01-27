'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Briefcase,
    DollarSign,
    Clock,
    CheckCircle2,
    ArrowUpRight,
    Wallet,
    TrendingUp,
    Upload,
    AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SubmitWorkDialog } from '@/components/submit-work-dialog';
import { ReleasePaymentDialog } from '@/components/release-payment-dialog';
import { RejectionHistoryDialog } from '@/components/rejection-history-dialog';
import { useWorkRejectedEvents } from '@/hooks/useWorkRejectedEvents';
import { useToast } from '@/hooks/use-toast';
import type { Agreement } from '@/types/user';

interface FreelancerDashboardProps {
    agreements: Agreement[];
    onRefresh?: () => void;
}

export function FreelancerDashboard({ agreements, onRefresh }: FreelancerDashboardProps) {
    const [submitWorkOpen, setSubmitWorkOpen] = useState(false);
    const [releasePaymentOpen, setReleasePaymentOpen] = useState(false);
    const [rejectionHistoryOpen, setRejectionHistoryOpen] = useState(false);
    const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
    const [previousAgreements, setPreviousAgreements] = useState<Agreement[]>([]);

    const { toast } = useToast();
    const { rejectionHistory, isLoading: isLoadingRejections } = useWorkRejectedEvents();

    // Helper to get latest rejection for an agreement
    const getLatestRejection = (agreementId: string) => {
        const history = rejectionHistory[agreementId];
        if (!history || history.length === 0) return null;
        return history[history.length - 1];
    };

    // Detect rejected work: Check if agreement has rejection in history
    useEffect(() => {
        agreements.forEach(agreement => {
            // Check if this is a one-time, milestone, or monthly agreement in funded status
            if ((agreement.type === 'one-time' || agreement.type === 'milestone' || agreement.type === 'monthly') && agreement.status === 'funded') {
                const latestRejection = getLatestRejection(agreement.id);

                // If there's a recent rejection (within last 24 hours), show toast notification
                if (latestRejection) {
                    const rejectionTime = new Date(latestRejection.timestamp).getTime();
                    const now = Date.now();
                    const hoursSinceRejection = (now - rejectionTime) / (1000 * 60 * 60);

                    // Only show toast for rejections within last 24 hours and not already shown
                    if (hoursSinceRejection < 24) {
                        const prev = previousAgreements.find(a => a.id === agreement.id);
                        // Only show toast if status changed from proposed to funded (new rejection)
                        if (prev && prev.status === 'proposed' && agreement.status === 'funded') {
                            toast({
                                title: 'Work Rejected',
                                description: `Your work for "${agreement.projectName}" was rejected. Reason: ${latestRejection.reason}`,
                                variant: 'destructive',
                            });
                        }
                    }
                }
            }
        });

        setPreviousAgreements(agreements);
    }, [agreements]);

    const handleSubmitWorkClick = (agreement: Agreement) => {
        setSelectedAgreement(agreement);
        setSubmitWorkOpen(true);
    };

    const handleReleasePaymentClick = (agreement: Agreement) => {
        setSelectedAgreement(agreement);
        setReleasePaymentOpen(true);
    };

    const handleSuccess = () => {
        onRefresh?.();
    };

    const getMilestoneLabel = (agreement: Agreement) => {
        if (agreement.type !== 'milestone') return null;
        const current = agreement.currentMilestone + 1;
        const total = agreement.totalMilestones;
        return total ? `Milestone ${current} of ${total}` : `Milestone ${current}`;
    };

    // Helper to check if agreement is in rejected state (waiting for resubmit)
    const isAwaitingResubmit = (agreement: Agreement): boolean => {
        // Only show rejection notification if:
        // 1. Status is "funded" (work was rejected, back to funded state)
        // 2. currentProofURI is empty (freelancer hasn't resubmitted yet)
        // 3. There's a rejection in history FOR THE CURRENT MILESTONE
        if (agreement.status !== 'funded') return false;
        if (agreement.currentProofURI && agreement.currentProofURI.trim() !== '') return false;

        const latestRejection = getLatestRejection(agreement.id);
        if (!latestRejection) return false;

        if (agreement.type === 'milestone') {
            if (latestRejection.milestoneNumber !== undefined) {
                return latestRejection.milestoneNumber === agreement.currentMilestone;
            }
        }
        return true;
    };

    // Helper function to check if Monthly payment is available
    const isMonthlyPaymentAvailable = (agreement: Agreement): boolean => {
        if (agreement.type !== 'monthly') {
            return false;
        }
        if (agreement.status !== 'funded' && agreement.status !== 'accepted') {
            return false;
        }
        if (!agreement.currentProofURI || agreement.currentProofURI.trim() === '') {
            return false;
        }
        // if (agreement.status === 'proposed') {
        //     return false;
        // }

        const now = Math.floor(Date.now() / 1000);  // Current timestamp in seconds
        const lastPayment = agreement.lastPaymentTime;
        const nextEligible = lastPayment + (30 * 24 * 60 * 60);  // +30 days

        return now >= nextEligible;
    };

    // Filter agreements where user is freelancer
    const myAgreements = agreements.filter((a) => a.status !== 'completed' && a.status !== 'cancelled');

    // Calculate freelancer-specific stats
    // Status: created=waiting deposit, funded=can work, proposed=submitted, accepted=ready for payment, completed=done, cancelled=cancelled
    const stats = {
        activeAgreements: agreements.filter((a) => a.status === 'funded' || a.status === 'proposed' || a.status === 'accepted').length,
        totalEarned: agreements
            .reduce((sum, a) => sum + a.amountReleased, 0),  // Sum all amountReleased (including ongoing agreements)
        pendingPayments: agreements
            .filter((a) => a.status === 'proposed' || a.status === 'accepted')  // Work submitted/accepted, waiting payment
            .reduce((sum, a) => sum + a.nextPayment, 0),
        completedProjects: agreements.filter((a) => a.status === 'completed').length,
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Freelancer Dashboard</h1>
                <p className="text-muted-foreground">Track your agreements and earnings</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeAgreements}</div>
                            <p className="text-xs text-muted-foreground">Currently working on</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats.totalEarned.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All-time earnings</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats.pendingPayments.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Awaiting release</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completedProjects}</div>
                            <p className="text-xs text-muted-foreground">Successfully delivered</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* My Agreements */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>My Active Agreements</CardTitle>
                                <CardDescription>Agreements where you're the freelancer</CardDescription>
                            </div>
                            <Link href="/dashboard/agreements">
                                <Button variant="ghost" size="sm">
                                    View All
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Next Payment</TableHead>
                                    <TableHead>Deadline</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myAgreements.slice(0, 5).map((agreement) => (
                                    <TableRow key={agreement.id}>
                                        <TableCell className="font-medium">{agreement.projectName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {agreement.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        agreement.status === 'completed'
                                                            ? 'bg-success/10 text-success border-success/20'
                                                            : agreement.status === 'funded' || agreement.status === 'proposed' || agreement.status === 'accepted'
                                                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                            : agreement.status === 'created'
                                                            ? 'bg-warning/10 text-warning border-warning/20'
                                                            : 'bg-muted/10 text-muted-foreground border-muted/20'
                                                    }
                                                >
                                                    {agreement.status}
                                                </Badge>
                                                {/* Show rejection badge ONLY if work is rejected and not yet resubmitted */}
                                                {(agreement.type === 'one-time' || agreement.type === 'milestone' || agreement.type === 'monthly') &&
                                                 isAwaitingResubmit(agreement) && (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-destructive/10 text-destructive border-destructive/20"
                                                    >
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                        Work Rejected
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    ${agreement.nextPayment.toLocaleString()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {agreement.nextPaymentDate}
                                        </TableCell>
                                        <TableCell>
                                            {/* Monthly: Show Claim button only if proof submitted and payment cycle reached */}
                                            {agreement.type === 'monthly' &&
                                                (agreement.status === 'funded' || agreement.status === 'accepted') && (
                                                <div className="flex flex-col gap-1">
                                                    {isMonthlyPaymentAvailable(agreement) ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                className="bg-green-600 hover:bg-green-700"
                                                                onClick={() => handleReleasePaymentClick(agreement)}
                                                            >
                                                                <DollarSign className="h-4 w-4 mr-1" />
                                                                Claim ${agreement.nextPayment.toLocaleString()}
                                                            </Button>
                                                            <span className="text-xs text-green-600 dark:text-green-400">
                                                                Available now
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-xs text-muted-foreground">Next payment:</span>
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {agreement.nextPaymentDate}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Show "Submit Work" button for funded one-time, milestone, and monthly agreements */}
                                            {agreement.status === 'funded' &&
                                                (agreement.type === 'one-time' || agreement.type === 'milestone' || agreement.type === 'monthly') && (
                                                <div className="flex flex-col gap-1">
                                                    {isAwaitingResubmit(agreement) && (
                                                        <div className="flex items-center gap-1 text-xs text-destructive mb-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            <span className="font-medium">Needs resubmit</span>
                                                        </div>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant={isAwaitingResubmit(agreement) ? "destructive" : "outline"}
                                                        onClick={() => handleSubmitWorkClick(agreement)}
                                                    >
                                                        <Upload className="h-4 w-4 mr-1" />
                                                        {isAwaitingResubmit(agreement) ? 'Resubmit Work' : 'Submit Work'}
                                                    </Button>
                                                    {agreement.type === 'milestone' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {getMilestoneLabel(agreement)}
                                                        </span>
                                                    )}
                                                    {isAwaitingResubmit(agreement) && (
                                                        <span className="text-xs text-destructive">
                                                            {getLatestRejection(agreement.id)?.reason}
                                                        </span>
                                                    )}
                                                    {/* Always show rejection history link when available */}
                                                    {rejectionHistory[agreement.id] && rejectionHistory[agreement.id].length > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAgreement(agreement);
                                                                setRejectionHistoryOpen(true);
                                                            }}
                                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left"
                                                        >
                                                            View rejection history ({rejectionHistory[agreement.id].length})
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {/* Show "Claim Payment" button for accepted agreements (OneTime & Milestone) */}
                                            {agreement.status === 'accepted' && agreement.type !== 'monthly' && (
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleReleasePaymentClick(agreement)}
                                                    >
                                                        <DollarSign className="h-4 w-4 mr-1" />
                                                        Claim ${agreement.nextPayment.toLocaleString()}
                                                    </Button>
                                                    {agreement.type === 'milestone' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {getMilestoneLabel(agreement)}
                                                        </span>
                                                    )}
                                                    {/* Show rejection history link if exists */}
                                                    {(agreement.type === 'one-time' || agreement.type === 'milestone' || agreement.type === 'monthly') &&
                                                     rejectionHistory[agreement.id] && rejectionHistory[agreement.id].length > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAgreement(agreement);
                                                                setRejectionHistoryOpen(true);
                                                            }}
                                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left"
                                                        >
                                                            View rejection history ({rejectionHistory[agreement.id].length})
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {/* Show waiting status for other states */}
                                            {agreement.status === 'proposed' && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-muted-foreground">Awaiting review</span>
                                                    {agreement.type === 'milestone' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {getMilestoneLabel(agreement)}
                                                        </span>
                                                    )}
                                                    {/* Show rejection history link if exists */}
                                                    {(agreement.type === 'one-time' || agreement.type === 'milestone' || agreement.type === 'monthly') &&
                                                     rejectionHistory[agreement.id] && rejectionHistory[agreement.id].length > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAgreement(agreement);
                                                                setRejectionHistoryOpen(true);
                                                            }}
                                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left"
                                                        >
                                                            View rejection history ({rejectionHistory[agreement.id].length})
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {agreement.status === 'created' && (
                                                <span className="text-xs text-muted-foreground">Waiting deposit</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/dashboard/payments">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Wallet className="h-4 w-4" />
                                    View Earnings
                                </Button>
                            </Link>
                            <Link href="/dashboard/agreements">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    Browse Agreements
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Total Released</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-8 w-8 text-success" />
                                <div>
                                    <div className="text-2xl font-bold">
                                        ${agreements
                                            .reduce((sum, a) => sum + a.amountReleased, 0)
                                            .toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">All-time released payments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialogs */}
            {selectedAgreement && (
                <>
                    <SubmitWorkDialog
                        open={submitWorkOpen}
                        onOpenChange={setSubmitWorkOpen}
                        agreementId={selectedAgreement.id}
                        projectName={selectedAgreement.projectName}
                        description={selectedAgreement.description}
                        companyWallet={selectedAgreement.companyWallet}
                        paymentType={selectedAgreement.type}
                        currentMilestone={selectedAgreement.currentMilestone}
                        totalMilestones={selectedAgreement.totalMilestones}
                        milestoneDeadlines={selectedAgreement.milestoneDeadlines}
                        onSuccess={handleSuccess}
                    />
                    <ReleasePaymentDialog
                        open={releasePaymentOpen}
                        onOpenChange={setReleasePaymentOpen}
                        agreementId={selectedAgreement.id}
                        projectName={selectedAgreement.projectName}
                        paymentAmount={selectedAgreement.nextPayment}
                        paymentType={selectedAgreement.type}
                        onSuccess={handleSuccess}
                    />
                    <RejectionHistoryDialog
                        open={rejectionHistoryOpen}
                        onOpenChange={setRejectionHistoryOpen}
                        agreement={selectedAgreement}
                    />
                </>
            )}
        </div>
    );
}
