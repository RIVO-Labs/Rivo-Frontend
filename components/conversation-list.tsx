'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatConversation } from '@/types/chat';

interface ConversationListProps {
    conversations: ChatConversation[];
    selectedConversationId?: string;
    onSelectConversation: (agreementId: string) => void;
}

export function ConversationList({
    conversations,
    selectedConversationId,
    onSelectConversation,
}: ConversationListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredConversations = conversations.filter(conv =>
        conv.agreementTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const formatLastMessageTime = (timestamp?: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Messages
                </CardTitle>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </CardHeader>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {filteredConversations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">No conversations yet</p>
                            <p className="text-xs mt-1">Click "+ New Room" to create one</p>
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => {
                            const otherParticipant = conversation.participants[0] || {
                                id: 'room',
                                name: conversation.agreementTitle,
                                role: 'freelancer' as const,
                                isOnline: true,
                                avatar: '',
                            };
                            const isSelected = conversation.agreementId === selectedConversationId;

                            return (
                                <button
                                    key={conversation.agreementId}
                                    onClick={() => onSelectConversation(conversation.agreementId)}
                                    className={cn(
                                        'w-full p-3 rounded-lg text-left transition-colors',
                                        'hover:bg-muted',
                                        isSelected && 'bg-muted'
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative">
                                            <Avatar>
                                                <AvatarImage src={otherParticipant.avatar} />
                                                <AvatarFallback>
                                                    {otherParticipant.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {otherParticipant.isOnline && (
                                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-sm truncate">
                                                    {otherParticipant.name}
                                                </p>
                                                {conversation.lastMessage && (
                                                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                        {formatLastMessageTime(conversation.lastMessage.timestamp)}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-muted-foreground truncate mb-1">
                                                {conversation.agreementTitle}
                                            </p>

                                            {conversation.lastMessage && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {conversation.lastMessage.content}
                                                </p>
                                            )}
                                        </div>

                                        {conversation.unreadCount > 0 && (
                                            <Badge className="shrink-0 h-5 min-w-5 flex items-center justify-center px-1.5">
                                                {conversation.unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}
