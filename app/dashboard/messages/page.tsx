'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { useChat } from '@/hooks/useChat';
import { useRole } from '@/hooks/useRole';
import { ConversationList } from '@/components/conversation-list';
import { ChatInterface } from '@/components/chat-interface';
import { generateAIResponse } from '@/components/ai-assistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatConversation, ChatMessage, ChatParticipant } from '@/types/chat';

export default function MessagesPage() {
    const { toast } = useToast();
    const { address } = useAccount();
    const { role } = useRole();
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string>('general');
    const [participants, setParticipants] = useState<ChatParticipant[]>([]);
    const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomIsPublic, setNewRoomIsPublic] = useState(true);
    const [newRoomParticipants, setNewRoomParticipants] = useState('');
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);

    const {
        messages: chatMessages,
        users,
        typingUsers,
        isConnected,
        connect,
        sendMessage,
        sendTyping,
    } = useChat({
        wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
        room: selectedConversationId,
        autoConnect: false,
    });

    // Convert chat messages to UI format
    const messages: ChatMessage[] = chatMessages.map((msg) => ({
        id: msg.id.toString(),
        agreementId: selectedConversationId,
        senderId: msg.isAI ? 'ai-assistant' : msg.senderId,
        senderName: msg.isAI ? 'AI Assistant' : msg.senderName,
        senderRole: role || 'freelancer',
        content: msg.content,
        mentions: msg.mentions,
        timestamp: msg.createdAt,
        isRead: msg.isRead,
        isAI: msg.isAI,
        attachments: (msg as any).attachments || [],
    }));

    // Create participants from connected users
    useEffect(() => {
        const connectedParticipants: ChatParticipant[] = users.map((user) => ({
            id: user.walletAddress,
            name: user.walletAddress.slice(0, 6) + '...' + user.walletAddress.slice(-4),
            role: 'freelancer',
            isOnline: user.isOnline,
            avatar: '',
        }));
        setParticipants(connectedParticipants);
    }, [users]);

    const loadRooms = async () => {
        if (!address) return;

        try {
            const res = await fetch(`/api/chat/rooms?walletAddress=${address}`);
            const data = await res.json();

            if (data.rooms) {
                const userRooms: ChatConversation[] = data.rooms.map((room: any) => {
                    return {
                        agreementId: room.name,
                        agreementTitle: room.name,
                        participants: room.participants ? room.participants.map((p: any) => ({
                            id: p.walletAddress,
                            name: p.name || p.walletAddress.slice(0, 6) + '...' + p.walletAddress.slice(-4),
                            role: p.role || 'freelancer',
                            isOnline: false,
                            avatar: p.avatar || '',
                        })) : [],
                        lastMessage: room.lastMessage ? {
                            id: room.lastMessage.id?.toString() || '0', 
                            agreementId: room.name,
                            senderId: room.lastMessage.senderName || 'unknown',
                            senderName: room.lastMessage.senderName || 'Unknown',
                            senderRole: 'freelancer',
                            content: room.lastMessage.content || '',
                            mentions: [],
                            timestamp: room.lastMessage.createdAt || new Date().toISOString(),
                            isRead: false,
                        } : undefined,
                        unreadCount: room.unreadCount || 0,
                    };
                });
                console.log('[Debug] Mapped rooms:', userRooms);
                setConversations(userRooms);
            } else {
                console.warn('[Debug] No rooms in data');
                setConversations([]);
            }
        } catch (err) {
            console.error('Failed to load rooms:', err);
            setConversations([]);
        }
    };

    useEffect(() => {
        loadRooms();
    }, [address]);

    // Connect to chat when user is ready
    useEffect(() => {
        if (address && !isConnected) {
            // Auto connect tanpa signature (dev mode)
            const timer = setTimeout(() => {
                connect().catch(err => {
                    console.error('Failed to connect to chat:', err);
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [address, isConnected, connect]);

    const handleSendMessage = (content: string, mentions: string[], isAI: boolean = false, attachments?: any[]) => {
        if (!isConnected) {
            toast({
                title: 'Not connected',
                description: 'Please wait for the connection to establish.',
                variant: 'destructive',
            });
            return;
        }

        const selectedConversation = conversations.find(
            (c) => c.agreementId === selectedConversationId
        );

        // Include attachments in message metadata
        const messageContent = content;
        if (attachments && attachments.length > 0) {
            // Attachments are already uploaded to IPFS, just send the message with attachment metadata
            // The WebSocket server will handle storing attachment metadata in message.metadata
        }

        if (isAI) {
            // Content is already the AI response provided by chat-interface
            sendMessage(messageContent, mentions, true);
        } else {
            // Send regular message with attachments
            sendMessage(messageContent, mentions, false, attachments);
            
            // Note: Attachments metadata should be stored in message.metadata field
            // This will be handled by the WebSocket server when it receives the message

            toast({
                title: 'Message sent',
                description: attachments && attachments.length > 0 
                    ? `Message with ${attachments.length} attachment(s) delivered.`
                    : 'Your message has been delivered.',
            });
        }
    };

    const handleAttachFile = (file: File) => {
        toast({
            title: 'File attachment',
            description: `File "${file.name}" upload to IPFS will be implemented.`,
        });
    };

    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) {
            toast({
                title: 'Room name required',
                description: 'Please enter a room name',
                variant: 'destructive',
            });
            return;
        }

        if (!address) {
            toast({
                title: 'Wallet not connected',
                description: 'Please connect your wallet first',
                variant: 'destructive',
            });
            return;
        }

        setIsCreatingRoom(true);

        try {
            // Parse participant wallet addresses
            const participantWalletAddresses = newRoomParticipants
                .split(',')
                .map(addr => addr.trim())
                .filter(addr => addr.length > 0);

            // Call backend API to create room
            const response = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newRoomName,
                    type: 'group',
                    isPublic: newRoomIsPublic,
                    creatorWalletAddress: address,
                    participantWalletAddresses: newRoomIsPublic ? [] : participantWalletAddresses,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create room');
            }

            // Reload rooms from database to ensure sync
            await loadRooms();

            // Select the newly created room
            setSelectedConversationId(newRoomName);
            setShowNewRoomDialog(false);
            setNewRoomName('');
            setNewRoomIsPublic(true);
            setNewRoomParticipants('');

            toast({
                title: 'Room created',
                description: `Room "${newRoomName}" created successfully!`,
            });
        } catch (error: any) {
            console.error('Failed to create room:', error);
            toast({
                title: 'Failed to create room',
                description: error.message || 'An error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsCreatingRoom(false);
        }
    };

    if (!address) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                    <p className="text-muted-foreground">Please connect your wallet to start messaging</p>
                </div>
            </div>
        );
    }

    const selectedConversation = conversations.find(
        (c) => c.agreementId === selectedConversationId
    ) || conversations[0];

    return (
        <div className="flex flex-col gap-8 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                    <p className="text-muted-foreground">
                        {isConnected ? (
                            <span className="text-green-500">● Connected to chat server</span>
                        ) : (
                            <span className="text-yellow-500">● Connecting...</span>
                        )}
                    </p>
                </div>
                <Button onClick={() => setShowNewRoomDialog(true)}>
                    <span className="mr-2">+</span> New Room
                </Button>
            </div>

            {showNewRoomDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-2">Create New Room</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create a public room or a private room with specific participants.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Room Name</label>
                                <Input
                                    placeholder="Enter room name (e.g., project-abc)"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !isCreatingRoom) handleCreateRoom();
                                    }}
                                    disabled={isCreatingRoom}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    checked={newRoomIsPublic}
                                    onChange={(e) => setNewRoomIsPublic(e.target.checked)}
                                    disabled={isCreatingRoom}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isPublic" className="text-sm font-medium">
                                    Public Room
                                </label>
                            </div>

                            {!newRoomIsPublic && (
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Participant Wallet Addresses
                                    </label>
                                    <Input
                                        placeholder="Enter wallet addresses separated by commas"
                                        value={newRoomParticipants}
                                        onChange={(e) => setNewRoomParticipants(e.target.value)}
                                        disabled={isCreatingRoom}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Example: 0x123..., 0x456..., 0x789...
                                    </p>
                                </div>
                            )}

                            <div className="bg-muted p-3 rounded-md text-xs">
                                <p className="font-medium mb-1">💡 Tips:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    {newRoomIsPublic ? (
                                        <>
                                            <li>• Anyone can join and see messages in public rooms</li>
                                            <li>• Share the room name with people you want to chat with</li>
                                            <li>• Room names are case-sensitive</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>• Only invited participants can access private rooms</li>
                                            <li>• You will be added as the room owner automatically</li>
                                            <li>• You can add more participants later</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowNewRoomDialog(false);
                                    setNewRoomName('');
                                    setNewRoomIsPublic(true);
                                    setNewRoomParticipants('');
                                }}
                                disabled={isCreatingRoom}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateRoom}
                                disabled={isCreatingRoom}
                            >
                                {isCreatingRoom ? 'Creating...' : 'Create'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <ConversationList
                        conversations={conversations}
                        selectedConversationId={selectedConversationId}
                        onSelectConversation={setSelectedConversationId}
                    />
                </div>

                <div className="lg:col-span-2">
                    {selectedConversation ? (
                        <ChatInterface
                            agreementId={selectedConversation.agreementId}
                            agreementTitle={selectedConversation.agreementTitle}
                            participants={participants.length > 0 ? participants : selectedConversation.participants}
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            onAttachFile={handleAttachFile}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-[600px] border rounded-lg">
                            <p className="text-muted-foreground">Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
