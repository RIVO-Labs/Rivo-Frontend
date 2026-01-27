'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useReleasePayment } from '@/hooks/useRivoHub';
import { DollarSign, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReleasePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  projectName: string;
  paymentAmount: number;
  paymentType: string;
  onSuccess?: () => void;
}

export function ReleasePaymentDialog({
  open,
  onOpenChange,
  agreementId,
  projectName,
  paymentAmount,
  paymentType,
  onSuccess,
}: ReleasePaymentDialogProps) {
  const { toast } = useToast();
  const { releasePayment, isPending, isConfirming, isSuccess } = useReleasePayment();

  // Close dialog and call onSuccess when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Payment Released Successfully',
        description: `$${paymentAmount.toLocaleString()} USDC has been transferred to your wallet.`,
      });
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isSuccess, onOpenChange, onSuccess, paymentAmount, toast]);

  const handleRelease = () => {
    releasePayment(BigInt(agreementId));
  };

  const isProcessing = isPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Claim Payment</DialogTitle>
          <DialogDescription>
            Release payment for {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Amount Display */}
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 p-6">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Payment Amount</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                  ${paymentAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">USDC</p>
              </div>
            </div>
          </div>

          {/* Agreement Details */}
          <div className="space-y-2 border rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Project:</span>
              <span className="font-medium">{projectName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Type:</span>
              <span className="font-medium capitalize">{paymentType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Agreement ID:</span>
              <span className="font-mono text-xs">#{agreementId}</span>
            </div>
          </div>

          {/* Status Messages */}
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for wallet confirmation...</span>
            </div>
          )}

          {isConfirming && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing transaction on blockchain...</span>
            </div>
          )}

          {/* Success State */}
          {isSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span>Payment released successfully!</span>
            </div>
          )}

          {/* Info Box */}
          {!isSuccess && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-medium mb-1">Before you claim:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {paymentType !== 'monthly' && <li>Your work must be accepted by the company</li>}
                    {paymentType === 'monthly' && <li>Proof of work must be submitted before claiming</li>}
                    {paymentType === 'monthly' && <li>Payment cycle must have reached (30 days since last payment)</li>}
                    <li>Funds will be transferred directly to your wallet</li>
                    <li>This action cannot be undone</li>
                    {paymentType === 'one-time' && <li>This will complete the agreement</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleRelease} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isProcessing && <DollarSign className="mr-2 h-4 w-4" />}
            {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Processing...' : `Claim $${paymentAmount.toLocaleString()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
