'use client';

import { useEffect, useState } from 'react';
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
import { Lock, Users, CheckCircle2, Plus, Wallet, BarChart3, FileText } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReviewWorkDialog } from '@/components/review-work-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSetEncryptionPublicKey } from '@/hooks/useRivoHub';
import { useAccount } from 'wagmi';
import type { Agreement } from '@/types/user';

interface CompanyDashboardProps {
    agreements: Agreement[];
    onRefresh?: () => void;
}

export function CompanyDashboard({ agreements, onRefresh }: CompanyDashboardProps) {
    const [reviewWorkOpen, setReviewWorkOpen] = useState(false);
    const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
    const { toast } = useToast();
    const { address } = useAccount();
    const { setEncryptionPublicKey, isPending: isKeyPending, isConfirming: isKeyConfirming, isSuccess: isKeySuccess } =
        useSetEncryptionPublicKey();

    // Filter agreements where user is company
    const teamAgreements = agreements.filter((a) => a.status !== 'completed' && a.status !== 'cancelled');

    const handleReviewWorkClick = (agreement: Agreement) => {
        setSelectedAgreement(agreement);
        setReviewWorkOpen(true);
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

    useEffect(() => {
        if (isKeySuccess) {
            toast({
                title: 'Encryption Key Published',
                description: 'Freelancers can now fetch your key from the contract.',
            });
        }
    }, [isKeySuccess, toast]);

    const handleCopyEncryptionKey = async () => {
        if (!address) {
            toast({
                title: 'Wallet Not Connected',
                description: 'Connect your wallet to get your encryption key.',
                variant: 'destructive',
            });
            return;
        }

        if (typeof window === 'undefined' || !window.ethereum?.request) {
            toast({
                title: 'Wallet Unavailable',
                description: 'Your wallet does not support encryption keys.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const publicKey = await window.ethereum.request({
                method: 'eth_getEncryptionPublicKey',
                params: [address],
            });

            if (typeof publicKey !== 'string') {
                throw new Error('Unexpected response from wallet.');
            }

            await navigator.clipboard.writeText(publicKey);
            toast({
                title: 'Encryption Key Copied',
                description: 'Share this key with the freelancer to unlock encrypted proofs.',
            });
        } catch (error) {
            toast({
                title: 'Failed to Get Key',
                description: error instanceof Error ? error.message : 'Unable to access encryption key.',
                variant: 'destructive',
            });
        }
    };

    const handlePublishEncryptionKey = async () => {
        if (!address) {
            toast({
                title: 'Wallet Not Connected',
                description: 'Connect your wallet to publish your encryption key.',
                variant: 'destructive',
            });
            return;
        }

        if (typeof window === 'undefined' || !window.ethereum?.request) {
            toast({
                title: 'Wallet Unavailable',
                description: 'Your wallet does not support encryption keys.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const publicKey = await window.ethereum.request({
                method: 'eth_getEncryptionPublicKey',
                params: [address],
            });

            if (typeof publicKey !== 'string') {
                throw new Error('Unexpected response from wallet.');
            }

            setEncryptionPublicKey(publicKey);
        } catch (error) {
            toast({
                title: 'Failed to Publish Key',
                description: error instanceof Error ? error.message : 'Unable to publish encryption key.',
                variant: 'destructive',
            });
        }
    };

    // Calculate company-specific stats
    // Status: created=waiting deposit, funded=deposited, proposed=review work, accepted=ready to pay, completed=done, cancelled=cancelled
    const stats = {
        activeAgreements: agreements.filter((a) => a.status === 'funded' || a.status === 'proposed' || a.status === 'accepted').length,
        totalEscrowed: agreements
            .filter((a) => a.status !== 'completed' && a.status !== 'cancelled')
            .reduce((sum, a) => sum + a.escrowAmount, 0),
        pendingApprovals: agreements.filter((a) => a.status === 'proposed').length,  // Work submitted, needs review
        teamMembers: new Set(agreements.map((a) => a.freelancer)).size,
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Company Dashboard</h1>
                    <p className="text-muted-foreground">Manage your team and agreements</p>
                </div>
                <Link href="/dashboard/agreements">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Agreement
                    </Button>
                </Link>
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
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeAgreements}</div>
                            <p className="text-xs text-muted-foreground">Currently executing</p>
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
                            <CardTitle className="text-sm font-medium">Total Escrowed</CardTitle>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats.totalEscrowed.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Locked in contracts</p>
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
                            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
                            <p className="text-xs text-muted-foreground">Awaiting your review</p>
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
                            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.teamMembers}</div>
                            <p className="text-xs text-muted-foreground">Active freelancers</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Team Agreements */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Team Agreements</CardTitle>
                                <CardDescription>Agreements with your freelancers</CardDescription>
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
                                    <TableHead>Escrow</TableHead>
                                    <TableHead>Deadline</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamAgreements.slice(0, 5).map((agreement) => (
                                    <TableRow key={agreement.id}>
                                        <TableCell className="font-medium">{agreement.projectName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {agreement.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    agreement.status === 'completed'
                                                        ? 'bg-success/10 text-success border-success/20'
                                                        : agreement.status === 'funded' || agreement.status === 'accepted'
                                                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                        : agreement.status === 'proposed'
                                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                        : agreement.status === 'created'
                                                            ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                            : agreement.status === 'disputed'
                                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                            : 'bg-muted/10 text-muted-foreground border-muted/20'
                                                }
                                            >
                                                {agreement.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            ${agreement.escrowAmount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {agreement.nextPaymentDate}
                                        </TableCell>
                                        <TableCell>
                                            {agreement.status === 'proposed' && (
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleReviewWorkClick(agreement)}
                                                    >
                                                        Review Work
                                                    </Button>
                                                    {agreement.type === 'milestone' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {getMilestoneLabel(agreement)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {agreement.status === 'created' && (
                                                <Link href="/dashboard/escrow">
                                                    <Button size="sm" variant="outline">
                                                        Deposit
                                                    </Button>
                                                </Link>
                                            )}
                                            {agreement.status === 'accepted' && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-muted-foreground">Ready for payment</span>
                                                    {agreement.type === 'milestone' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {getMilestoneLabel(agreement)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {agreement.status === 'funded' && (
                                                <div className="flex flex-col gap-1">
                                                    {agreement.type === 'monthly' ? (
                                                        <>
                                                            <span className="text-xs text-muted-foreground">Waiting proof submission</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Next eligible: {agreement.nextPaymentDate}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-xs text-muted-foreground">Waiting submission</span>
                                                            {agreement.type === 'milestone' && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {getMilestoneLabel(agreement)}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
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
                            <Link href="/dashboard/agreements">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create Agreement
                                </Button>
                            </Link>
                            <Link href="/dashboard/escrow">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Wallet className="h-4 w-4" />
                                    Manage Escrow
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={handlePublishEncryptionKey}
                                disabled={isKeyPending || isKeyConfirming}
                            >
                                <Lock className="h-4 w-4" />
                                {isKeyPending ? 'Confirm in Wallet...' : isKeyConfirming ? 'Publishing...' : 'Publish Encryption Key'}
                            </Button>
                            <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleCopyEncryptionKey}>
                                <Lock className="h-4 w-4" />
                                Copy Encryption Key
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Total Released</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-8 w-8 text-purple-500" />
                                <div>
                                    <div className="text-2xl font-bold">
                                        ${agreements
                                            .reduce((sum, a) => sum + a.amountReleased, 0)
                                            .toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">All-time released to freelancers</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Review Work Dialog */}
            {selectedAgreement && (
                <ReviewWorkDialog
                    open={reviewWorkOpen}
                    onOpenChange={setReviewWorkOpen}
                    agreementId={selectedAgreement.id}
                    projectName={selectedAgreement.projectName}
                    description={selectedAgreement.description}
                    proofUrl={selectedAgreement.currentProofURI || ''}
                    paymentAmount={selectedAgreement.nextPayment}
                    agreementType={selectedAgreement.type}
                    currentMilestone={selectedAgreement.currentMilestone}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
