// Chat and messaging types for Rivo platform

export interface ChatMessage {
    id: string;
    agreementId: string;
    senderId: string;
    senderName: string;
    senderRole: 'freelancer' | 'company';
    content: string;
    mentions: string[]; // Array of mentioned user IDs
    attachments?: ChatAttachment[];
    timestamp: string;
    isRead: boolean;
    isAI?: boolean;
}

export interface ChatAttachment {
    id: string;
    name: string;
    type: string; // 'image' | 'document' | 'file'
    url: string;
    size: number;
}

export interface ChatConversation {
    agreementId: string;
    agreementTitle: string;
    participants: ChatParticipant[];
    lastMessage?: ChatMessage;
    unreadCount: number;
}

export interface ChatParticipant {
    id: string;
    name: string;
    role: 'freelancer' | 'company';
    avatar?: string;
    isOnline: boolean;
    lastSeen?: string;
    walletAddress?: string;
}

export interface TypingIndicator {
    userId: string;
    userName: string;
    isTyping: boolean;
}
