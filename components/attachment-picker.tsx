'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, DollarSign, FileText, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { useUserAgreementsList } from '@/hooks/useAgreements';
import { usePaymentReleasedEvents } from '@/hooks/usePaymentReleasedEvents';
import type { RichAttachment, MilestoneAttachment, PaymentAttachment, AgreementAttachment } from '@/types/attachments';

interface AttachmentPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAttach: (attachment: RichAttachment) => void;
    agreementId: string;
}

export function AttachmentPicker({
    open,
    onOpenChange,
    onAttach,
    agreementId,
}: AttachmentPickerProps) {
    const { address } = useAccount();
    const [searchQuery, setSearchQuery] = useState('');
    
    // Fetch agreements from contract
    const { agreements, isLoading: isLoadingAgreements } = useUserAgreementsList();
    
    // Get agreement IDs for payment events
    const agreementIds = useMemo(() => {
        return agreements.map(ag => ag.id);
    }, [agreements]);
    
    // Fetch payment events
    const { payments, isLoading: isLoadingPayments } = usePaymentReleasedEvents(agreementIds);

    // Convert agreements to AgreementAttachment format
    const agreementAttachments: AgreementAttachment[] = useMemo(() => {
        return agreements.map(ag => ({
            type: 'agreement',
            id: ag.id,
            title: ag.projectName || `Agreement ${ag.id}`,
            parties: [ag.companyWallet, ag.freelancerWallet],
            totalAmount: ag.totalBudget,
            status: ag.status,
            createdAt: ag.createdAt,
        }));
    }, [agreements]);

    // Extract milestones from agreements
    const milestoneAttachments: MilestoneAttachment[] = useMemo(() => {
        const milestones: MilestoneAttachment[] = [];
        
        agreements.forEach(ag => {
            if (ag.type === 'milestone' && ag.totalMilestones > 0) {
                for (let i = 1; i <= ag.totalMilestones; i++) {
                    const deadline = ag.milestoneDeadlines[i - 1];
                    const milestoneAmount = ag.totalBudget / ag.totalMilestones;
                    
                    let status: 'pending' | 'submitted' | 'approved' | 'rejected' = 'pending';
                    if (i < ag.currentMilestone) {
                        status = 'approved';
                    } else if (i === ag.currentMilestone) {
                        if (ag.status === 'proposed') {
                            status = 'submitted';
                        } else if (ag.status === 'accepted') {
                            status = 'approved';
                        }
                    }
                    
                    milestones.push({
                        type: 'milestone',
                        id: `${ag.id}-${i}`,
                        agreementId: ag.id,
                        title: `${ag.projectName} - Milestone ${i}`,
                        number: i,
                        amount: milestoneAmount,
                        status,
                        dueDate: deadline ? new Date(deadline * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    });
                }
            }
        });
        
        return milestones;
    }, [agreements]);

    // Convert payment events to PaymentAttachment format
    const paymentAttachments: PaymentAttachment[] = useMemo(() => {
        return payments.map((payment, index) => {
            const agreement = agreements.find(ag => ag.id === payment.agreementId);
            const recipientWallet = agreement?.freelancerWallet || agreement?.companyWallet || 'Unknown';
            return {
                type: 'payment',
                id: `PAY-${payment.agreementId}-${index}`,
                agreementId: payment.agreementId,
                amount: payment.amount,
                currency: 'USDC',
                status: 'completed',
                date: payment.timestamp,
                recipient: recipientWallet,
            };
        });
    }, [payments, agreements]);

    const isLoading = isLoadingAgreements || isLoadingPayments;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
            case 'approved':
                return <CheckCircle2 className="h-4 w-4 text-success" />;
            case 'pending':
            case 'submitted':
                return <Clock className="h-4 w-4 text-warning" />;
            case 'rejected':
            case 'failed':
                return <XCircle className="h-4 w-4 text-error" />;
            default:
                return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'approved':
                return 'bg-success/10 text-success border-success/20';
            case 'pending':
            case 'submitted':
                return 'bg-warning/10 text-warning border-warning/20';
            case 'rejected':
            case 'failed':
                return 'bg-error/10 text-error border-error/20';
            default:
                return 'bg-muted/10 text-muted-foreground border-muted/20';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Attach to Message</DialogTitle>
                    <DialogDescription>
                        Share milestones, payments, or agreements in your conversation
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Tabs defaultValue="milestones" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="milestones">
                            <Calendar className="h-4 w-4 mr-2" />
                            Milestones
                        </TabsTrigger>
                        <TabsTrigger value="payments">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Payments
                        </TabsTrigger>
                        <TabsTrigger value="agreements">
                            <FileText className="h-4 w-4 mr-2" />
                            Agreements
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="milestones">
                        <ScrollArea className="h-[300px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : milestoneAttachments.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    No milestones found
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {milestoneAttachments.filter(m =>
                                        m.title.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map((milestone) => (
                                    <button
                                        key={milestone.id}
                                        onClick={() => {
                                            onAttach(milestone);
                                            onOpenChange(false);
                                        }}
                                        className="w-full p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                <span className="font-medium">Milestone {milestone.number}</span>
                                            </div>
                                            <Badge variant="outline" className={getStatusColor(milestone.status)}>
                                                {getStatusIcon(milestone.status)}
                                                <span className="ml-1 capitalize">{milestone.status}</span>
                                            </Badge>
                                        </div>
                                        <p className="text-sm mb-2">{milestone.title}</p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>${milestone.amount.toLocaleString()} USDC</span>
                                            <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="payments">
                        <ScrollArea className="h-[300px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : paymentAttachments.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    No payments found
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {paymentAttachments.filter(p =>
                                        p.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        p.agreementId.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map((payment) => (
                                    <button
                                        key={payment.id}
                                        onClick={() => {
                                            onAttach(payment);
                                            onOpenChange(false);
                                        }}
                                        className="w-full p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-success" />
                                                <span className="font-medium">{payment.id}</span>
                                            </div>
                                            <Badge variant="outline" className={getStatusColor(payment.status)}>
                                                {getStatusIcon(payment.status)}
                                                <span className="ml-1 capitalize">{payment.status}</span>
                                            </Badge>
                                        </div>
                                        <p className="text-sm mb-2">
                                            To: {payment.recipient && payment.recipient.length > 10 
                                                ? `${payment.recipient.slice(0, 6)}...${payment.recipient.slice(-4)}`
                                                : payment.recipient}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">
                                                ${payment.amount.toLocaleString()} {payment.currency}
                                            </span>
                                            <span>{new Date(payment.date).toLocaleDateString()}</span>
                                        </div>
                                    </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="agreements">
                        <ScrollArea className="h-[300px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : agreementAttachments.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    No agreements found
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {agreementAttachments.filter(a =>
                                        a.title.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map((agreement) => (
                                    <button
                                        key={agreement.id}
                                        onClick={() => {
                                            onAttach(agreement);
                                            onOpenChange(false);
                                        }}
                                        className="w-full p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span className="font-medium">{agreement.id}</span>
                                            </div>
                                            <Badge variant="outline" className={getStatusColor(agreement.status)}>
                                                {getStatusIcon(agreement.status)}
                                                <span className="ml-1 capitalize">{agreement.status}</span>
                                            </Badge>
                                        </div>
                                        <p className="text-sm mb-2">{agreement.title}</p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>${agreement.totalAmount.toLocaleString()} USDC</span>
                                            <span>Created: {new Date(agreement.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
