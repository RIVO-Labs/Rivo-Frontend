'use client';



import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmojiPicker } from '@/components/emoji-picker';
import { AttachmentPicker } from '@/components/attachment-picker';
import { RichAttachmentCard } from '@/components/rich-attachment-card';
import { useToast } from '@/hooks/use-toast';
import {
    Send,
    Paperclip,
    Image as ImageIcon,
    File,
    MoreHorizontal,
    MoreVertical,
    Check,
    CheckCheck,
    Sparkles,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { AIAssistantMessage, generateAIResponse } from '@/components/ai-assistant';
import type { ChatMessage, ChatParticipant } from '@/types/chat';
import type { RichAttachment } from '@/types/attachments';

interface ChatInterfaceProps {
    agreementId: string;
    agreementTitle: string;
    participants: ChatParticipant[];
    messages: ChatMessage[];
    onSendMessage: (content: string, mentions: string[], isAI?: boolean, attachments?: any[]) => void;
    onAttachFile?: (file: File) => void;
}

export function ChatInterface({
    agreementId,
    agreementTitle,
    participants,
    messages,
    onSendMessage,
    onAttachFile,
}: ChatInterfaceProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const role = user?.role || 'freelancer';
    const [messageInput, setMessageInput] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [isAITyping, setIsAITyping] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [richAttachments, setRichAttachments] = useState<RichAttachment[]>([]);
    const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
    const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Add AI to participants list
    const allParticipants = [
        ...participants,
        {
            id: 'ai-assistant',
            name: 'AI',
            role: 'freelancer' as const,
            isOnline: true,
            avatar: '',
        },
    ];

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isAITyping]);

    // Detect @ mentions
    const handleInputChange = (value: string) => {
        setMessageInput(value);

        // Check for @ mentions
        const lastWord = value.split(' ').pop() || '';
        if (lastWord.startsWith('@')) {
            setShowMentions(true);
            setMentionSearch(lastWord.substring(1));
        } else {
            setShowMentions(false);
        }
    };

    // Insert mention
    const insertMention = (participant: ChatParticipant) => {
        const words = messageInput.split(' ');
        words[words.length - 1] = `@${participant.name} `;
        setMessageInput(words.join(' '));
        setShowMentions(false);
        inputRef.current?.focus();
    };

    // Insert emoji
    const handleEmojiSelect = (emoji: string) => {
        setMessageInput(messageInput + emoji);
        inputRef.current?.focus();
    };

    // Handle file attachment
    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files);
            setAttachedFiles([...attachedFiles, ...newFiles]);

            toast({
                title: 'Files attached',
                description: `${newFiles.length} file(s) ready to send`,
            });

            e.target.value = '';
        }
    };

    // Handle image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const imageFiles = Array.from(files).filter(file =>
                file.type.startsWith('image/')
            );

            if (imageFiles.length > 0) {
                setAttachedFiles([...attachedFiles, ...imageFiles]);

                toast({
                    title: 'Images attached',
                    description: `${imageFiles.length} image(s) ready to send`,
                });
            }

            e.target.value = '';
        }
    };

    // Remove attached file
    const removeAttachedFile = (index: number) => {
        setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
    };

    // Handle rich attachment selection
    const handleRichAttachment = (attachment: RichAttachment) => {
        setRichAttachments([...richAttachments, attachment]);
        toast({
            title: 'Attachment added',
            description: `${attachment.type} attached to message`,
        });
    };

    // Remove rich attachment
    const removeRichAttachment = (index: number) => {
        setRichAttachments(richAttachments.filter((_, i) => i !== index));
    };

    // Extract mentions from message
    const extractMentions = (text: string): string[] => {
        const mentionRegex = /@(\w+)/g;
        const matches = text.match(mentionRegex);
        return matches ? matches.map(m => m.substring(1)) : [];
    };

    // Check if message mentions AI
    const mentionsAI = (text: string): boolean => {
        return text.toLowerCase().includes('@ai');
    };

    // Upload files to IPFS
    const uploadFilesToIPFS = async (files: File[]): Promise<any[]> => {
        const uploadPromises = files.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/chat/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }

                const data = await response.json();
                return data.attachment;
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                throw error;
            }
        });

        return Promise.all(uploadPromises);
    };

    // Send message
    const handleSend = async () => {
        if (messageInput.trim() || attachedFiles.length > 0 || richAttachments.length > 0) {
            const mentions = extractMentions(messageInput);
            let uploadedAttachments: any[] = [];

            // Upload files to IPFS if any
            if (attachedFiles.length > 0) {
                try {
                    toast({
                        title: 'Uploading attachments',
                        description: `Uploading ${attachedFiles.length} file(s) to IPFS...`,
                    });

                    uploadedAttachments = await uploadFilesToIPFS(attachedFiles);

                    toast({
                        title: 'Attachments uploaded',
                        description: `Successfully uploaded ${uploadedAttachments.length} file(s)`,
                    });
                } catch (error) {
                    console.error('Error uploading files:', error);
                    toast({
                        title: 'Upload failed',
                        description: 'Failed to upload some files. Please try again.',
                        variant: 'destructive',
                    });
                    return; // Don't send message if upload fails
                }
            }

            // Combine rich attachments with uploaded files
            const allAttachments = [
                ...uploadedAttachments,
                ...richAttachments.map((att, idx) => {
                    // Handle different attachment types
                    let name = 'Reference';
                    let url = '';
                    
                    if (att.type === 'milestone') {
                        name = att.title || `Milestone ${att.number}`;
                        url = `#milestone-${att.id}`;
                    } else if (att.type === 'payment') {
                        name = `Payment ${att.amount} ${att.currency}`;
                        url = `#payment-${att.id}`;
                    } else if (att.type === 'agreement') {
                        name = att.title || 'Agreement';
                        url = `#agreement-${att.id}`;
                    }
                    
                    return {
                        id: att.id || idx.toString(),
                        name,
                        type: att.type || 'file',
                        url: url || '#',
                        size: 0,
                    };
                }),
            ];

            // Send message with attachments
            onSendMessage(messageInput, mentions, false, allAttachments);

            // If AI is mentioned, call AI with attachments
            if (mentionsAI(messageInput)) {
                setIsAITyping(true);

                // Call AI API with attachments
                generateAIResponse(messageInput, {
                    agreementTitle,
                    role,
                    attachments: allAttachments,
                })
                    .then((aiResponse) => {
                        onSendMessage(aiResponse, [], true);
                        setIsAITyping(false);
                    })
                    .catch((error) => {
                        console.error('AI response error:', error);
                        onSendMessage(
                            'Sorry, I encountered an error. Please try again later. 🔧',
                            [],
                            true
                        );
                        setIsAITyping(false);
                    });
            }

            setMessageInput('');
            setAttachedFiles([]);
            setRichAttachments([]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const otherParticipant = participants.find(p => p.role !== role);

    const isAIMessage = (message: ChatMessage) => {
        return message.isAI || message.senderName === 'AI Assistant' || message.senderId === 'ai-assistant';
    };

    const formatWalletAddress = (address?: string) => {
        if (!address) return 'N/A';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <Card className="flex flex-col h-[600px]">
            <CardHeader className="border-b">
                <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors rounded-md p-2 -ml-2"
                    onClick={() => setShowParticipantsDialog(true)}
                >
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={otherParticipant?.avatar} />
                            <AvatarFallback>
                                {otherParticipant?.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base">{otherParticipant?.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {agreementTitle}
                                {otherParticipant?.isOnline && (
                                    <Badge variant="outline" className="ml-2 bg-success/10 text-success border-success/20">
                                        Online
                                    </Badge>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 bg-purple-500/10 text-purple-500 border-purple-500/20">
                            <Sparkles className="h-3 w-3" />
                            AI Enabled
                        </Badge>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map((message) => {
                        if (isAIMessage(message)) {
                            return (
                                <AIAssistantMessage
                                    key={message.id}
                                    content={message.content}
                                    isTyping={false}
                                />
                            );
                        }

                        const isOwnMessage = !!(user?.address && 
                            message.senderId.toLowerCase() === user.address.toLowerCase());

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    'flex gap-2',
                                    isOwnMessage ? 'justify-start' : 'justify-end'
                                )}
                            >
                                {!isOwnMessage && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                            {message.senderName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                )}

                                <div
                                    className={cn(
                                        'max-w-[70%] rounded-lg px-4 py-2',
                                        isOwnMessage
                                            ? 'bg-muted text-primary-foreground'
                                            : 'bg-muted'
                                    )}
                                >
                                    {!isOwnMessage && (
                                        <p className="text-xs font-medium mb-1">{message.senderName}</p>
                                    )}
                                    <div className="text-sm markdown-prose">
                                        <FormattedMessage content={message.content} />
                                    </div>

                                    {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            {message.attachments.map((attachment: any) => (
                                                <div
                                                    key={attachment.id}
                                                    className="rounded-md overflow-hidden"
                                                >
                                                    {attachment.type === 'image' ? (
                                                        <a
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block"
                                                        >
                                                            <img
                                                                src={attachment.url}
                                                                alt={attachment.name}
                                                                className="max-w-full max-h-64 rounded-md object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                                loading="lazy"
                                                            />
                                                        </a>
                                                    ) : (
                                                        <a
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 p-2 rounded bg-background/10 hover:bg-background/20 transition-colors"
                                                        >
                                                            <File className="h-4 w-4 shrink-0" />
                                                            <span className="text-xs truncate flex-1">{attachment.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatFileSize(attachment.size)}
                                                            </span>
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                                        {isOwnMessage && (
                                            message.isRead ? (
                                                <CheckCheck className="h-3 w-3 opacity-70" />
                                            ) : (
                                                <Check className="h-3 w-3 opacity-70" />
                                            )
                                        )}
                                    </div>
                                </div>

                                {isOwnMessage && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                            {message.senderName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        );
                    })}

                    {isAITyping && (
                        <AIAssistantMessage
                            content="Let me help you with that..."
                            isTyping={true}
                        />
                    )}
                </div>
            </ScrollArea>

            {
                showMentions && (
                    <div className="border-t p-2">
                        <div className="text-xs text-muted-foreground mb-2">Mention someone:</div>
                        <div className="space-y-1">
                            {allParticipants
                                .filter(p =>
                                    p.name.toLowerCase().includes(mentionSearch.toLowerCase())
                                )
                                .map(participant => (
                                    <Button
                                        key={participant.id}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start gap-2"
                                        onClick={() => insertMention(participant)}
                                    >
                                        {participant.id === 'ai-assistant' ? (
                                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                <Sparkles className="h-3 w-3 text-white" />
                                            </div>
                                        ) : (
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={participant.avatar} />
                                                <AvatarFallback className="text-xs">
                                                    {participant.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <span>{participant.name}</span>
                                        {participant.id === 'ai-assistant' ? (
                                            <Badge variant="outline" className="ml-auto text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
                                                AI Assistant
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="ml-auto text-xs">
                                                {participant.role}
                                            </Badge>
                                        )}
                                    </Button>
                                ))}
                        </div>
                    </div>
                )
            }

            {/* Rich Attachments Preview */}
            {
                richAttachments.length > 0 && (
                    <div className="border-t p-2 bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-2">Attached references:</div>
                        <div className="space-y-2">
                            {richAttachments.map((attachment, index) => (
                                <div key={index} className="relative">
                                    <RichAttachmentCard attachment={attachment} />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
                                        onClick={() => removeRichAttachment(index)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Attached Files Preview */}
            {
                attachedFiles.length > 0 && (
                    <div className="border-t p-2 bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-2">Attached files:</div>
                        <div className="flex flex-wrap gap-2">
                            {attachedFiles.map((file, index) => {
                                const isImage = file.type.startsWith('image/');
                                const previewUrl = isImage ? URL.createObjectURL(file) : null;
                                
                                return (
                                    <div
                                        key={index}
                                        className="relative flex items-center gap-2 bg-background rounded px-2 py-1 text-sm"
                                    >
                                        {isImage && previewUrl ? (
                                            <>
                                                <img
                                                    src={previewUrl}
                                                    alt={file.name}
                                                    className="h-12 w-12 object-cover rounded"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs truncate">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <File className="h-4 w-4 shrink-0" />
                                                <span className="max-w-[150px] truncate">{file.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({formatFileSize(file.size)})
                                                </span>
                                            </>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 p-0 shrink-0"
                                            onClick={() => {
                                                if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                removeAttachedFile(index);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            }

            <CardContent className="border-t p-4">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileAttach}
                />
                <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                />

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setShowAttachmentPicker(true)}
                        title="Attach milestone, payment, or agreement"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach file"
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => imageInputRef.current?.click()}
                        title="Attach image"
                    >
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                        <Input
                            ref={inputRef}
                            placeholder="Type a message... (use @AI for help, @ to mention)"
                            value={messageInput}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="pr-10"
                        />
                    </div>
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    <Button onClick={handleSend} size="icon" className="shrink-0">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    💡 Tip: Type <span className="font-mono bg-muted px-1 rounded">@AI</span> to get instant help from AI assistant
                </p>
            </CardContent>

            {/* Attachment Picker Dialog */}
            <AttachmentPicker
                open={showAttachmentPicker}
                onOpenChange={setShowAttachmentPicker}
                onAttach={handleRichAttachment}
                agreementId={agreementId}
            />

            {/* Participants Dialog */}
            <Dialog open={showParticipantsDialog} onOpenChange={setShowParticipantsDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Room Members ({participants.length})</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[400px] pr-4">
                        <div className="space-y-3">
                            {participants.map((participant) => {
                                const isCurrentUser = participant.id === user?.id || 
                                    (user?.address && participant.walletAddress && 
                                     participant.walletAddress.toLowerCase() === user.address.toLowerCase());
                                
                                return (
                                    <div
                                        key={participant.id}
                                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                                    >
                                        <Avatar>
                                            <AvatarImage src={participant.avatar} />
                                            <AvatarFallback>
                                                {participant.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">
                                                    {participant.name}
                                                </p>
                                                {isCurrentUser && (
                                                    <Badge variant="outline" className="text-xs">
                                                        You
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {participant.role}
                                                </Badge>
                                                {participant.walletAddress && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {formatWalletAddress(participant.walletAddress)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </Card >
    );
}

// Simple Markdown Formatter Component
function FormattedMessage({ content }: { content: string }) {
    if (!content) return null;

    // Handle newlines first
    const lines = content.split('\n');

    return (
        <div className="text-sm whitespace-pre-wrap">
            {lines.map((line, lineIndex) => {
                // Split by bold (**text**)
                const parts = line.split(/(\*\*.*?\*\*)/g);

                return (
                    <div key={lineIndex} className={line.trim() === '' ? 'h-4' : ''}>
                        {parts.map((part, partIndex) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={partIndex} className="font-bold">{part.slice(2, -2)}</strong>;
                            }

                            // Handle italics (*text*)
                            const subParts = part.split(/(\*.*?\*)/g);
                            return subParts.map((subPart, subIndex) => {
                                if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
                                    return <em key={`${partIndex}-${subIndex}`} className="italic">{subPart.slice(1, -1)}</em>;
                                }
                                return subPart;
                            });
                        })}
                    </div>
                );
            })}
        </div>
    );
}
