'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEncryptionPublicKey, useSubmitWork } from '@/hooks/useRivoHub';
import { uploadJSONToIPFS, uploadToIPFS } from '@/lib/ipfs/upload';
import { encryptFileWithPassphrase, generatePassphrase } from '@/lib/ipfs/encryption';
import { encryptPassphraseForWallet } from '@/lib/ipfs/wallet-encryption';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface SubmitWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  projectName: string;
  description?: string;
  companyWallet?: string;
  paymentType?: string;
  currentMilestone?: number;
  totalMilestones?: number;
  milestoneDeadlines?: number[];
  onSuccess?: () => void;
}

export function SubmitWorkDialog({
  open,
  onOpenChange,
  agreementId,
  projectName,
  description,
  companyWallet,
  paymentType,
  currentMilestone,
  totalMilestones,
  milestoneDeadlines,
  onSuccess,
}: SubmitWorkDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsUrl, setIpfsUrl] = useState<string>('');
  const [companyPublicKey, setCompanyPublicKey] = useState('');
  const [generatedPassphrase, setGeneratedPassphrase] = useState<string>('');
  const { key: onChainPublicKey, isLoading: isKeyLoading } = useEncryptionPublicKey(
    companyWallet ? (companyWallet as `0x${string}`) : undefined,
  );

  const { submitWork, isPending, isConfirming, isSuccess } = useSubmitWork();
  const currentDeadline = typeof currentMilestone === 'number'
    ? milestoneDeadlines?.[currentMilestone]
    : undefined;
  const formattedDeadline = currentDeadline
    ? new Date(currentDeadline * 1000).toLocaleDateString()
    : 'No deadline set';

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFile(null);
      setNotes('');
      setIpfsUrl('');
      setCompanyPublicKey('');
      setGeneratedPassphrase('');
    }
  }, [open]);

  useEffect(() => {
    if (onChainPublicKey && onChainPublicKey.length > 0) {
      setCompanyPublicKey((prev) => (prev && prev.length > 0 ? prev : onChainPublicKey));
    }
  }, [onChainPublicKey]);

  // Close dialog and call onSuccess when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Work Submitted Successfully',
        description: 'Your proof of work has been recorded on the blockchain.',
      });
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isSuccess, onOpenChange, onSuccess, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 100MB for Pinata free tier)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 100MB.',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to upload as proof of work.',
        variant: 'destructive',
      });
      return;
    }

    if (companyPublicKey.trim().length === 0) {
      toast({
        title: 'Company Key Required',
        description: 'Company has not published their encryption key yet. Please ask them to publish it from their profile.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Step 1: Auto-generate secure passphrase
      const passphrase = generatePassphrase(32);
      setGeneratedPassphrase(passphrase); // Store for display to freelancer

      // Step 2: Upload encrypted file to IPFS
      setIsUploading(true);
      toast({
        title: 'Encrypting & Uploading',
        description: 'Encrypting your proof and uploading to decentralized storage...',
      });

      const { encryptedFile, metadata } = await encryptFileWithPassphrase(file, passphrase);
      const encryptedUpload = await uploadToIPFS(encryptedFile);

      if (!encryptedUpload.success || !encryptedUpload.ipfsUrl) {
        throw new Error(encryptedUpload.error || 'Failed to upload encrypted file to IPFS');
      }

      // Step 3: Encrypt passphrase with company's public key
      console.log('🔐 Encryption Debug:');
      console.log('Company Public Key (used for encryption):', companyPublicKey.trim());
      console.log('Company Wallet Address:', companyWallet);
      console.log('Passphrase (will be encrypted):', passphrase);

      const encryptedPassphrase = encryptPassphraseForWallet(
        companyPublicKey.trim(),
        passphrase,
      );

      console.log('Encrypted Passphrase Payload:', encryptedPassphrase);

      // Step 4: Upload encryption metadata to IPFS
      const metadataUpload = await uploadJSONToIPFS({
        type: 'encrypted-proof',
        encryptedFileUrl: encryptedUpload.ipfsUrl,
        encryption: metadata,
        encryptedPassphrase,
        encryptionRecipient: companyWallet || null,
        encryptionPublicKey: companyPublicKey.trim(), // Store the public key used for encryption
      });

      if (!metadataUpload.success || !metadataUpload.ipfsUrl) {
        throw new Error(metadataUpload.error || 'Failed to upload encryption metadata to IPFS');
      }

      setIpfsUrl(metadataUpload.ipfsUrl);
      setIsUploading(false);

      toast({
        title: 'Upload Successful',
        description: 'Now submitting to blockchain...',
      });

      // Step 5: Submit work to smart contract
      submitWork(BigInt(agreementId), metadataUpload.ipfsUrl);
    } catch (error) {
      setIsUploading(false);
      console.error('Submit work error:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit work',
        variant: 'destructive',
      });
    }
  };

  const isProcessing = isUploading || isPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Proof of Work</DialogTitle>
          <DialogDescription>
            Upload your completed work for {projectName}
            {paymentType === 'milestone' && currentMilestone !== undefined && totalMilestones !== undefined && (
              <span> - Milestone {currentMilestone + 1}/{totalMilestones} (Due: {formattedDeadline})</span>
            )}
            . The file will be stored on IPFS and linked to the blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">Agreement Description</p>
            <p className="text-sm">{description?.trim() ? description : 'No description provided.'}</p>
          </div>

          {/* Milestone Progress */}
          {paymentType === 'milestone' && currentMilestone !== undefined && totalMilestones !== undefined && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Milestone Progress
                </span>
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  Due: {formattedDeadline}
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {currentMilestone + 1} / {totalMilestones}
                </span>
              </div>
              <div className="h-2 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${((currentMilestone + 1) / totalMilestones) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="proof-file">Upload Proof File *</Label>
            <div className="flex flex-col gap-2">
              <Input
                id="proof-file"
                type="file"
                onChange={handleFileChange}
                disabled={isProcessing}
                accept="image/*,.pdf,.doc,.docx,.zip,.rar"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="truncate">{file.name}</span>
                  <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported: Images, PDF, Documents, Archives (Max 100MB)
            </p>
          </div>

          {/* Encryption Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-600 p-2 text-white">
                <Lock className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  🔒 Automatic Encryption Enabled
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Your proof will be automatically encrypted for privacy. Only the company can decrypt it using their wallet.
                </p>
                <div className="mt-3 space-y-1.5 rounded-md bg-blue-100/50 p-2 text-xs text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Company:</span>
                    <code className="rounded bg-blue-200/50 px-1 py-0.5 dark:bg-blue-800/50">
                      {companyWallet?.slice(0, 6)}...{companyWallet?.slice(-4)}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Encryption Key:</span>
                    {isKeyLoading ? (
                      <span className="text-blue-700 dark:text-blue-300">Loading from contract...</span>
                    ) : companyPublicKey ? (
                      <span className="text-green-700 dark:text-green-300">✓ Loaded from blockchain</span>
                    ) : (
                      <span className="text-orange-700 dark:text-orange-300">⚠ Not published yet</span>
                    )}
                  </div>
                </div>
                {!companyPublicKey && !isKeyLoading && (
                  <p className="mt-2 text-xs text-orange-700 dark:text-orange-300">
                    ⚠ The company needs to publish their encryption key before you can submit encrypted work.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional information about your work..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isProcessing}
              rows={3}
            />
          </div>

          {/* IPFS URL Preview */}
          {ipfsUrl && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    File uploaded to IPFS
                  </p>
                  <a
                    href={ipfsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 dark:text-green-400 hover:underline truncate block"
                  >
                    {ipfsUrl}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading to IPFS...</span>
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for wallet confirmation...</span>
            </div>
          )}

          {isConfirming && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Confirming on blockchain...</span>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p className="font-medium">What happens next:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Your file is uploaded to IPFS (decentralized storage)</li>
                  <li>The IPFS link is submitted to the smart contract</li>
                  <li>The company reviews your work</li>
                  <li>Once approved, you can claim your payment</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing || !file}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isProcessing && <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? 'Uploading...' : isPending ? 'Confirm in Wallet...' : isConfirming ? 'Submitting...' : 'Submit Work'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
