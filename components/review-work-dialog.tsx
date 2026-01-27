'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAcceptWork, useRejectWork } from '@/hooks/useRivoHub';
import { ExternalLink, CheckCircle2, XCircle, Loader2, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { decryptFileWithPassphrase, type EncryptionMetadata } from '@/lib/ipfs/encryption';
import { decryptPassphraseWithWallet, type WalletEncryptedPayload } from '@/lib/ipfs/wallet-encryption';
import { useAccount } from 'wagmi';

interface ReviewWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  projectName: string;
  description?: string;
  proofUrl: string;
  paymentAmount: number;
  agreementType?: 'one-time' | 'milestone' | 'monthly';
  currentMilestone?: number;
  onSuccess?: () => void;
}

export function ReviewWorkDialog({
  open,
  onOpenChange,
  agreementId,
  projectName,
  description,
  proofUrl,
  paymentAmount,
  agreementType,
  currentMilestone,
  onSuccess,
}: ReviewWorkDialogProps) {
  const { toast } = useToast();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [encryptedFileUrl, setEncryptedFileUrl] = useState<string | null>(null);
  const [encryptionMetadata, setEncryptionMetadata] = useState<EncryptionMetadata | null>(null);
  const [encryptedPassphrase, setEncryptedPassphrase] = useState<WalletEncryptedPayload | null>(null);
  const [encryptionRecipient, setEncryptionRecipient] = useState<string | null>(null);
  const [encryptionPublicKey, setEncryptionPublicKey] = useState<string | null>(null);
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const { address } = useAccount();

  const { acceptWork, isPending: isAcceptPending, isConfirming: isAcceptConfirming, isSuccess: isAcceptSuccess } = useAcceptWork();
  const { rejectWork, isPending: isRejectPending, isConfirming: isRejectConfirming, isSuccess: isRejectSuccess } = useRejectWork();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setRejectionReason('');
      setShowRejectForm(false);
      setEncryptedFileUrl(null);
      setEncryptionMetadata(null);
      setEncryptedPassphrase(null);
      setEncryptionRecipient(null);
      setEncryptionPublicKey(null);
      setDecryptPassphrase('');
      setIsDecrypting(false);
      setIsLoadingMetadata(false);
      if (decryptedUrl) {
        URL.revokeObjectURL(decryptedUrl);
      }
      setDecryptedUrl(null);
    }
  }, [open, decryptedUrl]);

  useEffect(() => {
    if (!open || !proofUrl) return;

    let isMounted = true;

    async function loadEncryptedMetadata() {
      try {
        setIsLoadingMetadata(true);
        const response = await fetch(proofUrl);
        if (!response.ok) return;
        const data = await response.json();
        if (!isMounted) return;

        if (data?.type === 'encrypted-proof' && data?.encryptedFileUrl && data?.encryption) {
          setEncryptedFileUrl(data.encryptedFileUrl);
          setEncryptionMetadata(data.encryption as EncryptionMetadata);
          if (data.encryptedPassphrase) {
            setEncryptedPassphrase(data.encryptedPassphrase as WalletEncryptedPayload);
          }
          if (data.encryptionRecipient) {
            setEncryptionRecipient(data.encryptionRecipient);
          }
          if (data.encryptionPublicKey) {
            setEncryptionPublicKey(data.encryptionPublicKey);
          }
        }
      } catch {
        // Ignore non-JSON proofs.
      } finally {
        if (isMounted) {
          setIsLoadingMetadata(false);
        }
      }
    }

    loadEncryptedMetadata();

    return () => {
      isMounted = false;
    };
  }, [open, proofUrl]);

  const isEncryptedProof = useMemo(
    () => Boolean(encryptedFileUrl && encryptionMetadata),
    [encryptedFileUrl, encryptionMetadata],
  );

  // Close dialog and call onSuccess when transaction succeeds
  useEffect(() => {
    if (isAcceptSuccess) {
      toast({
        title: 'Work Accepted',
        description: 'The work has been approved. Freelancer can now claim payment.',
      });
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isAcceptSuccess, onOpenChange, onSuccess, toast]);

  useEffect(() => {
    if (isRejectSuccess) {
      toast({
        title: 'Work Rejected',
        description: 'The freelancer has been notified to resubmit their work. Rejection recorded on blockchain.',
      });
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isRejectSuccess, onOpenChange, onSuccess, toast]);

  const handleAccept = () => {
    acceptWork(BigInt(agreementId));
  };

  const handleRejectClick = () => {
    setShowRejectForm(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting the work.',
        variant: 'destructive',
      });
      return;
    }
    rejectWork(BigInt(agreementId), rejectionReason);
  };

  const handleDecrypt = async () => {
    if (!encryptedFileUrl || !encryptionMetadata) return;
    if (decryptPassphrase.trim().length < 8) {
      toast({
        title: 'Passphrase Too Short',
        description: 'Enter the passphrase shared by the freelancer.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDecrypting(true);
      if (decryptedUrl) {
        URL.revokeObjectURL(decryptedUrl);
      }

      const decryptedBlob = await decryptFileWithPassphrase(
        encryptedFileUrl,
        encryptionMetadata,
        decryptPassphrase.trim(),
      );
      const url = URL.createObjectURL(decryptedBlob);
      setDecryptedUrl(url);
    } catch (error) {
      toast({
        title: 'Decryption Failed',
        description: error instanceof Error ? error.message : 'Unable to decrypt the proof file.',
        variant: 'destructive',
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleWalletDecrypt = async () => {
    if (!encryptedFileUrl || !encryptionMetadata || !encryptedPassphrase) return;
    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Connect your company wallet to decrypt the passphrase.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDecrypting(true);
      if (decryptedUrl) {
        URL.revokeObjectURL(decryptedUrl);
      }

      console.log('🔍 Decrypt Debug Info:');
      console.log('Address from wagmi:', address);
      console.log('Encrypted passphrase payload:', encryptedPassphrase);
      console.log('Payload type:', typeof encryptedPassphrase);
      console.log('Payload structure:', JSON.stringify(encryptedPassphrase, null, 2));

      // Verify wallet address matches
      if (encryptionRecipient) {
        console.log('🔐 This proof was encrypted for wallet:', encryptionRecipient);
        console.log('👛 Current connected wallet:', address);
        const addressMatch = encryptionRecipient.toLowerCase() === address.toLowerCase();
        console.log('✓ Addresses match:', addressMatch);

        if (!addressMatch) {
          throw new Error(
            `Wrong wallet: This proof was encrypted for ${encryptionRecipient.slice(0, 6)}...${encryptionRecipient.slice(-4)}, ` +
            `but you're connected as ${address.slice(0, 6)}...${address.slice(-4)}`
          );
        }
      }

      // Get current account's public key (this will trigger MetaMask "Provide" popup)
      if (window.ethereum?.request) {
        try {
          const currentPublicKey = await window.ethereum.request({
            method: 'eth_getEncryptionPublicKey',
            params: [address],
          }) as string;
          console.log('✅ Current wallet public key:', currentPublicKey);

          if (encryptionPublicKey) {
            console.log('🔑 Public key used during encryption:', encryptionPublicKey);
            console.log('🔑 Current wallet public key:', currentPublicKey);

            if (encryptionPublicKey !== currentPublicKey) {
              throw new Error(
                'Public key mismatch: The file was encrypted with a different encryption key. ' +
                'You may have reset MetaMask or restored from a different seed phrase.'
              );
            }
          }
        } catch (pkError: any) {
          if (pkError?.message?.includes('Public key mismatch')) {
            throw pkError;
          }
          console.error('❌ Could not get public key:', pkError);
          throw new Error('Failed to get encryption public key from wallet. Please try again.');
        }
      }

      console.log('✅ Wallet verification passed. Attempting decrypt...');

      console.log('Attempting to decrypt with wallet...');

      const walletPassphrase = await decryptPassphraseWithWallet(encryptedPassphrase, address);
      console.log('✅ Passphrase decrypted successfully:', walletPassphrase.substring(0, 10) + '...');

      setDecryptPassphrase(walletPassphrase);

      const decryptedBlob = await decryptFileWithPassphrase(
        encryptedFileUrl,
        encryptionMetadata,
        walletPassphrase,
      );
      const url = URL.createObjectURL(decryptedBlob);
      setDecryptedUrl(url);

      toast({
        title: 'Decryption Successful',
        description: 'File has been decrypted. You can now download it.',
      });
    } catch (error) {
      console.error('❌ Decrypt error:', error);
      toast({
        title: 'Wallet Decrypt Failed',
        description: error instanceof Error ? error.message : 'Unable to decrypt with wallet.',
        variant: 'destructive',
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  const isProcessing = isAcceptPending || isAcceptConfirming || isRejectPending || isRejectConfirming;
  // Can review work if:
  // 1. Not loading metadata AND
  // 2. Either not encrypted OR already decrypted
  const canReviewWork = !isLoadingMetadata && (!isEncryptedProof || decryptedUrl !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Proof of Work</DialogTitle>
          <DialogDescription>
            Review the submitted work for {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          {/* Agreement Info */}
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Project</p>
              <p className="font-medium">{projectName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Amount</p>
              <p className="font-medium text-green-600">${paymentAmount.toLocaleString()} USDC</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{description?.trim() ? description : 'No description provided.'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Agreement ID</p>
              <p className="font-mono text-xs">#{agreementId}</p>
            </div>
          </div>

          {/* Proof of Work */}
          <div className="space-y-2">
            <Label>Submitted Proof</Label>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">IPFS Document</span>
              </div>

              <div className="bg-muted/50 rounded p-2 break-all">
                <p className="text-xs font-mono text-muted-foreground">{proofUrl}</p>
              </div>

              {!isEncryptedProof && (
                <Link
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Proof in New Tab
                </Link>
              )}

              {isEncryptedProof && (
                <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-200">
                  <p className="font-medium text-sm">🔒 Encrypted Proof</p>

                  {!decryptedUrl && isLoadingMetadata && (
                    <div className="flex items-center gap-2 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Loading encryption data...</span>
                    </div>
                  )}

                  {!decryptedUrl && !isLoadingMetadata && encryptedPassphrase && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleWalletDecrypt}
                      disabled={isDecrypting}
                      className="w-full"
                    >
                      {isDecrypting ? 'Decrypting...' : '🔓 Decrypt With Wallet'}
                    </Button>
                  )}

                  {decryptedUrl && (
                    <div className="rounded-md bg-green-100 border border-green-300 p-2 dark:bg-green-900/20 dark:border-green-700">
                      <p className="text-green-800 dark:text-green-200 font-medium text-xs mb-1">
                        ✅ Decryption Successful!
                      </p>
                      <a
                        href={decryptedUrl}
                        download={encryptionMetadata?.originalName}
                        className="inline-flex items-center gap-2 text-xs text-green-700 hover:underline dark:text-green-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Download: {encryptionMetadata?.originalName}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reject Form (conditional) */}
          {showRejectForm && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please explain what needs to be fixed or improved..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isProcessing}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                The freelancer will see this feedback and can resubmit their work.
              </p>
            </div>
          )}

          {/* Status Messages */}
          {isAcceptPending && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for wallet confirmation...</span>
            </div>
          )}

          {isAcceptConfirming && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Confirming acceptance on blockchain...</span>
            </div>
          )}

          {isRejectPending && (
            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for wallet confirmation...</span>
            </div>
          )}

          {isRejectConfirming && (
            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Confirming rejection on blockchain...</span>
            </div>
          )}

          {/* Loading Metadata Notice */}
          {isLoadingMetadata && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex gap-2">
                <Loader2 className="h-4 w-4 text-blue-600 mt-0.5 animate-spin" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Checking proof encryption status...</p>
                  <p className="text-xs mt-1">Please wait while we verify if this proof requires decryption.</p>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!showRejectForm && !isProcessing && !isLoadingMetadata && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Accept:</strong> Freelancer can claim ${paymentAmount.toLocaleString()} USDC</li>
                    <li><strong>Reject:</strong> Freelancer must resubmit the work</li>
                    <li>Review carefully before making a decision</li>
                    {isEncryptedProof && !decryptedUrl && (
                      <li className="text-red-600 dark:text-red-400 font-semibold">⚠️ You must decrypt and review the proof before accepting or rejecting</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {!showRejectForm ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectClick}
                disabled={isProcessing || !canReviewWork}
                title={
                  isLoadingMetadata
                    ? 'Checking encryption status...'
                    : !canReviewWork
                      ? 'Decrypt the proof before rejecting'
                      : undefined
                }
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Work
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isProcessing || !canReviewWork}
                title={
                  isLoadingMetadata
                    ? 'Checking encryption status...'
                    : !canReviewWork
                      ? 'Decrypt the proof before accepting'
                      : undefined
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {isAcceptPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAcceptConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isAcceptPending && !isAcceptConfirming && <CheckCircle2 className="mr-2 h-4 w-4" />}
                {isAcceptPending ? 'Confirm in Wallet...' : isAcceptConfirming ? 'Processing...' : 'Accept Work'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowRejectForm(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={isProcessing || !rejectionReason.trim()}
              >
                {isRejectPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRejectConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isRejectPending && !isRejectConfirming && <XCircle className="mr-2 h-4 w-4" />}
                {isRejectPending ? 'Confirm in Wallet...' : isRejectConfirming ? 'Processing...' : 'Confirm Rejection'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
