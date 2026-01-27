'use client';

import { Calendar, DollarSign, FileText, ExternalLink, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RichAttachment } from '@/types/attachments';

interface RichAttachmentCardProps {
    attachment: RichAttachment;
    onView?: () => void;
}

export function RichAttachmentCard({ attachment, onView }: RichAttachmentCardProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
            case 'approved':
                return <CheckCircle2 className="h-3 w-3" />;
            case 'pending':
            case 'submitted':
                return <Clock className="h-3 w-3" />;
            case 'rejected':
            case 'failed':
                return <XCircle className="h-3 w-3" />;
            default:
                return <Clock className="h-3 w-3" />;
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

    if (attachment.type === 'milestone') {
        return (
            <Card className="p-3 bg-primary/5 border-primary/20">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Milestone {attachment.number}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(attachment.status)}`}>
                        {getStatusIcon(attachment.status)}
                        <span className="ml-1 capitalize">{attachment.status}</span>
                    </Badge>
                </div>
                <p className="text-sm mb-2">{attachment.title}</p>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">${attachment.amount.toLocaleString()} USDC</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onView}>
                        View <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            </Card>
        );
    }

    if (attachment.type === 'payment') {
        return (
            <Card className="p-3 bg-success/5 border-success/20">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="font-medium text-sm">{attachment.id}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(attachment.status)}`}>
                        {getStatusIcon(attachment.status)}
                        <span className="ml-1 capitalize">{attachment.status}</span>
                    </Badge>
                </div>
                <p className="text-sm mb-2">To: {attachment.recipient}</p>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                        ${attachment.amount.toLocaleString()} {attachment.currency}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onView}>
                        View <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            </Card>
        );
    }

    if (attachment.type === 'agreement') {
        return (
            <Card className="p-3 bg-purple-500/5 border-purple-500/20">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-500" />
                        <span className="font-medium text-sm">{attachment.id}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(attachment.status)}`}>
                        {getStatusIcon(attachment.status)}
                        <span className="ml-1 capitalize">{attachment.status}</span>
                    </Badge>
                </div>
                <p className="text-sm mb-2">{attachment.title}</p>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">${attachment.totalAmount.toLocaleString()} USDC</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onView}>
                        View <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            </Card>
        );
    }

    return null;
}
