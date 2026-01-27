import type { Agreement } from '@/types/user';

// Rich attachment types for chat
export interface MilestoneAttachment {
    type: 'milestone';
    id: string;
    agreementId: string;
    title: string;
    number: number;
    amount: number;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    dueDate: string;
}

export interface PaymentAttachment {
    type: 'payment';
    id: string;
    agreementId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    date: string;
    recipient: string;
}

export interface AgreementAttachment {
    type: 'agreement';
    id: string;
    title: string;
    parties: string[];
    totalAmount: number;
    status: Agreement['status'];
    createdAt: string;
}

export type RichAttachment = MilestoneAttachment | PaymentAttachment | AgreementAttachment;
