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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Link as LinkIcon } from 'lucide-react';

interface SubmitMilestoneDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agreementId: string;
    agreementTitle: string;
    milestoneNumber: number;
}

export function SubmitMilestoneDialog({
    open,
    onOpenChange,
    agreementId,
    agreementTitle,
    milestoneNumber,
}: SubmitMilestoneDialogProps) {
    const { toast } = useToast();
    const [description, setDescription] = useState('');
    const [deliverableUrl, setDeliverableUrl] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = () => {
        // TODO: Backend integration - Submit milestone to smart contract
        toast({
            title: 'Milestone Submitted! 🎉',
            description: `Milestone ${milestoneNumber} has been submitted for approval.`,
        });

        // Reset form
        setDescription('');
        setDeliverableUrl('');
        setFiles([]);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Submit Milestone {milestoneNumber}</DialogTitle>
                    <DialogDescription>
                        {agreementTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="description">Work Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what you've completed for this milestone..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="deliverable">Deliverable URL (Optional)</Label>
                        <div className="flex gap-2">
                            <LinkIcon className="h-4 w-4 mt-3 text-muted-foreground" />
                            <Input
                                id="deliverable"
                                placeholder="https://github.com/yourrepo or demo link"
                                value={deliverableUrl}
                                onChange={(e) => setDeliverableUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="files">Attachments (Optional)</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                            <input
                                id="files"
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label htmlFor="files" className="cursor-pointer">
                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Click to upload files or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Images, documents, or code files
                                </p>
                            </label>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                        <FileText className="h-4 w-4" />
                                        <span>{file.name}</span>
                                        <span className="text-muted-foreground">
                                            ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!description.trim()}>
                        Submit Milestone
                    </Button>
                </DialogFooter>

                <p className="text-xs text-muted-foreground">
                    {/* TODO: Backend integration - Smart contract submission */}
                    Once submitted, the company will review and approve your work.
                </p>
            </DialogContent>
        </Dialog>
    );
}
