'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAssistantMessageProps {
    content: string;
    isTyping?: boolean;
}

export function AIAssistantMessage({ content, isTyping = false }: AIAssistantMessageProps) {
    const [displayedContent, setDisplayedContent] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Typing animation effect
    useEffect(() => {
        if (isTyping && currentIndex < content.length) {
            const timeout = setTimeout(() => {
                setDisplayedContent(content.substring(0, currentIndex + 1));
                setCurrentIndex(currentIndex + 1);
            }, 20); // Typing speed

            return () => clearTimeout(timeout);
        } else if (!isTyping) {
            setDisplayedContent(content);
        }
    }, [content, currentIndex, isTyping]);

    return (
        <div className="flex gap-2 justify-start">
            <Avatar className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500">
                <AvatarFallback className="bg-transparent">
                    <Sparkles className="h-4 w-4 text-white" />
                </AvatarFallback>
            </Avatar>

            <div className="max-w-[70%] rounded-lg px-4 py-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Assistant
                    </Badge>
                </div>
                <p className="text-sm whitespace-pre-wrap">
                    {displayedContent}
                    {isTyping && currentIndex < content.length && (
                        <span className="inline-block w-1 h-4 ml-1 bg-purple-500 animate-pulse" />
                    )}
                </p>
                {isTyping && currentIndex >= content.length && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Thinking...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// AI Assistant Response Generator - Now using real Gemini AI
export async function generateAIResponse(userMessage: string, context: {
    agreementTitle?: string;
    role?: 'sme_owner' | 'vendor';
    attachments?: any[];
}): Promise<string> {
    try {
        const response = await fetch('/api/chat/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                context,
                attachments: context.attachments || [],
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        return data.message || 'Sorry, I could not generate a response.';
    } catch (error) {
        console.error('Error calling AI API:', error);
        // Fallback to helpful error message
        return `I'm having trouble connecting right now. Please try again or contact support if the issue persists. 🔧`;
    }
}
