'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ApproveMilestoneDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agreementId: string;
    agreementTitle: string;
    milestoneNumber: number;
    freelancerName: string;
    amount: number;
}

export function ApproveMilestoneDialog({
    open,
    onOpenChange,
    agreementId,
    agreementTitle,
    milestoneNumber,
    freelancerName,
    amount,
}: ApproveMilestoneDialogProps) {
    const { toast } = useToast();
    const [feedback, setFeedback] = useState('');
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);

    const handleApprove = () => {
        setAction('approve');
    };

    const handleReject = () => {
        setAction('reject');
    };

    const handleConfirm = () => {
        if (action === 'approve') {
            // TODO: Backend integration - Approve milestone on smart contract
            toast({
                title: 'Milestone Approved! ✅',
                description: `Payment of $${amount.toLocaleString()} will be released to ${freelancerName}.`,
            });
        } else if (action === 'reject') {
            // TODO: Backend integration - Request revision
            toast({
                title: 'Revision Requested',
                description: `${freelancerName} has been notified of the required changes.`,
            });
        }

        setFeedback('');
        setAction(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Review Milestone {milestoneNumber}</DialogTitle>
                    <DialogDescription>
                        {agreementTitle} - {freelancerName}
                    </DialogDescription>
                </DialogHeader>

                {!action ? (
                    <div className="grid gap-4 py-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm font-medium mb-2">Payment Amount</p>
                            <p className="text-2xl font-bold">${amount.toLocaleString()} USDC</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={handleApprove}
                                className="gap-2 bg-success hover:bg-success/90"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Approve & Release Payment
                            </Button>
                            <Button
                                onClick={handleReject}
                                variant="outline"
                                className="gap-2 border-error text-error hover:bg-error/10"
                            >
                                <XCircle className="h-4 w-4" />
                                Request Revision
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className={`p-4 rounded-lg ${action === 'approve'
                                ? 'bg-success/10 border border-success/20'
                                : 'bg-warning/10 border border-warning/20'
                            }`}>
                            <p className="font-medium">
                                {action === 'approve'
                                    ? '✅ Approving Milestone'
                                    : '⚠️ Requesting Revision'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {action === 'approve'
                                    ? `This will release $${amount.toLocaleString()} USDC to ${freelancerName}`
                                    : 'The freelancer will be asked to make changes'}
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="feedback">
                                {action === 'approve' ? 'Feedback (Optional)' : 'Required Changes'}
                            </Label>
                            <Textarea
                                id="feedback"
                                placeholder={
                                    action === 'approve'
                                        ? 'Great work! Everything looks good.'
                                        : 'Please describe what needs to be changed...'
                                }
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAction(null);
                            setFeedback('');
                            onOpenChange(false);
                        }}
                    >
                        Cancel
                    </Button>
                    {action && (
                        <Button
                            onClick={handleConfirm}
                            disabled={action === 'reject' && !feedback.trim()}
                        >
                            Confirm {action === 'approve' ? 'Approval' : 'Revision'}
                        </Button>
                    )}
                </DialogFooter>

                <p className="text-xs text-muted-foreground">
                    {/* TODO: Backend integration - Smart contract execution */}
                    {action === 'approve' && 'Payment will be released automatically from escrow.'}
                </p>
            </DialogContent>
        </Dialog>
    );
}
