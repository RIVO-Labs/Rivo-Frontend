'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { useRaiseDispute } from '@/hooks/useRivoHub';

interface OpenDisputeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agreementId: string;
    agreementTitle: string;
    otherPartyName: string;
    arbitratorAddress?: string;
    onSuccess?: () => void;
}

export function OpenDisputeDialog({
    open,
    onOpenChange,
    agreementId,
    agreementTitle,
    otherPartyName,
    arbitratorAddress,
    onSuccess,
}: OpenDisputeDialogProps) {
    const { toast } = useToast();
    const [reason, setReason] = useState<string>('');
    const [description, setDescription] = useState('');
    const { raiseDispute, isPending, isConfirming, isSuccess } = useRaiseDispute();

    const disputeReasons = [
        { value: 'missed-deadline', label: 'Missed deadline or late delivery' },
        { value: 'incomplete-work', label: 'Incomplete or unsatisfactory work' },
        { value: 'scope-change', label: 'Scope change without agreement' },
        { value: 'lack-of-communication', label: 'Unresponsive or poor communication' },
        { value: 'other', label: 'Other reason' },
    ];

    const reasonLabel = useMemo(() => {
        const matched = disputeReasons.find((item) => item.value === reason);
        return matched?.label || reason;
    }, [reason]);

    const handleSubmit = () => {
        const trimmedDescription = description.trim();
        if (!reason || !trimmedDescription) return;
        const payload = `${reasonLabel} - ${trimmedDescription}`;
        if (typeof window !== 'undefined') {
            const cacheKey = `dispute:${agreementId}`;
            const cached = {
                agreementId,
                reason: payload,
                timestamp: new Date().toISOString(),
            };
            window.localStorage.setItem(cacheKey, JSON.stringify(cached));
        }
        raiseDispute(Number(agreementId), payload);
    };

    useEffect(() => {
        if (!isSuccess) return;
        toast({
            title: 'Dispute Opened',
            description: 'Agreement has been locked. Both parties will be notified.',
            variant: 'destructive',
        });
        setReason('');
        setDescription('');
        onOpenChange(false);
        onSuccess?.();
    }, [isSuccess, onOpenChange, onSuccess, toast]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-error" />
                        Open Dispute
                    </DialogTitle>
                    <DialogDescription>
                        {agreementTitle} with {otherPartyName}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="bg-error/10 border border-error/20 p-4 rounded-lg">
                        <p className="text-sm font-medium text-error">⚠️ Important</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Opening a dispute will lock the agreement and freeze all payments until resolved.
                            Try to resolve issues through communication first.
                        </p>
                    </div>

                    <div className="rounded-lg border border-muted p-4 text-sm text-muted-foreground space-y-2">
                        <p className="font-medium text-foreground">What a dispute does</p>
                        <p>
                            A dispute pauses the agreement on-chain and locks all escrowed funds. No payments
                            can be released while the dispute is active.
                        </p>
                        <p className="font-medium text-foreground">When to open</p>
                        <p>
                            Use this only if communication fails or there is a serious issue (e.g., unpaid work,
                            incomplete delivery, or scope mismatch).
                        </p>
                        <p className="font-medium text-foreground">How it gets resolved</p>
                        <p>
                            The agreement’s arbitrator can resolve the dispute on-chain. Until resolved, funds
                            stay locked.
                        </p>
                        {arbitratorAddress && (
                            <div className="space-y-1">
                                <p className="font-medium text-foreground">Arbitrator</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                    {arbitratorAddress}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>Reason for Dispute</Label>
                        <RadioGroup value={reason} onValueChange={setReason}>
                            {disputeReasons.map((item) => (
                                <div key={item.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={item.value} id={item.value} />
                                    <Label htmlFor={item.value} className="font-normal cursor-pointer">
                                        {item.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Detailed Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Please provide a detailed explanation of the issue..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                        />
                        <p className="text-xs text-muted-foreground">
                            Be specific and provide evidence if possible. This will help with resolution.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                disabled={!reason || !description.trim() || isPending || isConfirming}
                                variant="destructive"
                            >
                                {isPending && 'Submitting...'}
                                {isConfirming && 'Confirming...'}
                                {!isPending && !isConfirming && 'Open Dispute'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm dispute</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will lock the agreement and pause all payments until the arbitrator resolves it.
                                    Make sure you have tried resolving this via communication first. Continue?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSubmit}>
                                    Open Dispute
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
