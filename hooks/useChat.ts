import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

export interface ChatMessage {
    id: number;
    content: string;
    senderId: string;
    senderName: string;
    mentions: string[];
    createdAt: string;
    isRead: boolean;
    isAI?: boolean;
}

export interface ChatUser {
    walletAddress: string;
    isOnline: boolean;
}

interface UseChatOptions {
    wsUrl?: string;
    room: string;
    autoConnect?: boolean;
}

interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

export function useChat({
    wsUrl = 'ws://localhost:8080',
    room,
    autoConnect = true
}: UseChatOptions) {
    const { address } = useAccount();
    const { signMessageAsync } = useSignMessage();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const currentRoomRef = useRef<string>(room);

    /**
     * Generate authentication signature
     */
    const generateAuthSignature = useCallback(async () => {
        if (!address) throw new Error('Wallet not connected');

        const timestamp = Date.now();
        const message = `Sign in to Rivo Chat\nTimestamp: ${timestamp}`;

        try {
            const signature = await signMessageAsync({ message });
            return {
                walletAddress: address,
                signature,
                message,
                timestamp,
            };
        } catch (error) {
            console.log('Signature declined by user');
            throw error;
        }
    }, [address, signMessageAsync]);

    /**
     * Connect to WebSocket server
     */
    const connect = useCallback(async () => {
        if (!address || isConnecting || isConnected) return;

        setIsConnecting(true);

        try {
            // Skip signature for dev mode - connect directly
            console.log('Connecting to chat in dev mode (no signature)...');
            const ws = new WebSocket(`${wsUrl}?address=${address}`);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setIsConnecting(false);
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);

                    switch (data.type) {
                        case 'auth_success':
                            console.log('Authenticated:', data.walletAddress);
                            // Join the room after authentication
                            ws.send(JSON.stringify({
                                type: 'join_room',
                                room,
                                walletAddress: address,
                            }));
                            break;

                        case 'room_history':
                            // Load historical messages
                            setMessages(data.messages.map((msg: any) => ({
                                id: msg.id,
                                content: msg.content,
                                senderId: msg.user.walletAddress,
                                senderName: msg.user.name || msg.user.walletAddress.slice(0, 6),
                                mentions: msg.mentions || [],
                                createdAt: msg.createdAt,
                                isRead: msg.isRead,
                                isAI: msg.isAI || false,
                                attachments: (msg.metadata as any)?.attachments || [],
                            })));
                            break;

                        case 'new_message':
                            // Add new message
                            setMessages((prev) => [...prev, {
                                ...data.message,
                                attachments: data.message.attachments || [],
                            }]);
                            break;

                        case 'user_joined':
                            setUsers((prev) => [
                                ...prev.filter((u) => u.walletAddress !== data.walletAddress),
                                { walletAddress: data.walletAddress, isOnline: true },
                            ]);
                            break;

                        case 'user_left':
                            setUsers((prev) =>
                                prev.map((u) =>
                                    u.walletAddress === data.walletAddress
                                        ? { ...u, isOnline: false }
                                        : u
                                )
                            );
                            break;

                        case 'typing':
                            // Add typing indicator
                            setTypingUsers((prev) => new Set(prev).add(data.walletAddress));

                            // Clear existing timeout
                            const existingTimeout = typingTimeoutRef.current.get(data.walletAddress);
                            if (existingTimeout) clearTimeout(existingTimeout);

                            // Set new timeout to remove typing indicator
                            const timeout = setTimeout(() => {
                                setTypingUsers((prev) => {
                                    const next = new Set(prev);
                                    next.delete(data.walletAddress);
                                    return next;
                                });
                                typingTimeoutRef.current.delete(data.walletAddress);
                            }, 3000);

                            typingTimeoutRef.current.set(data.walletAddress, timeout);
                            break;

                        case 'message_read':
                            // Update message read status
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === data.messageId ? { ...msg, isRead: true } : msg
                                )
                            );
                            break;

                        case 'error':
                            console.error('Server error:', data.message);
                            break;

                        default:
                            console.log('Unknown message type:', data.type);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                setIsConnecting(false);
                wsRef.current = null;

                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                } else {
                    console.error('Max reconnection attempts reached');
                }
            };
        } catch (error) {
            console.error('Connection error:', error);
            setIsConnecting(false);
        }
    }, [address, wsUrl, room, isConnecting, isConnected, generateAuthSignature]);

    /**
     * Disconnect from WebSocket
     */
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    /**
     * Send a message
     */
    const sendMessage = useCallback((content: string, mentions: string[] = [], isAI: boolean = false, attachments?: any[]) => {
        if (!wsRef.current || !isConnected || !address) {
            console.error('Cannot send message: not connected');
            return;
        }

        wsRef.current.send(JSON.stringify({
            type: 'message',
            room,
            walletAddress: address,
            content,
            mentions,
            isAI,
            attachments: attachments || [],
        }));
    }, [isConnected, room, address]);

    /**
     * Send typing indicator
     */
    const sendTyping = useCallback(() => {
        if (!wsRef.current || !isConnected || !address) return;

        wsRef.current.send(JSON.stringify({
            type: 'typing',
            room,
            walletAddress: address,
        }));
    }, [isConnected, room, address]);

    /**
     * Mark message as read
     */
    const markAsRead = useCallback((messageId: number) => {
        if (!wsRef.current || !isConnected || !address) return;

        wsRef.current.send(JSON.stringify({
            type: 'read',
            room,
            walletAddress: address,
            messageId,
        }));
    }, [isConnected, room, address]);

    /**
     * Handle room switching
     */
    useEffect(() => {
        // If room changes and we're connected, switch rooms
        if (isConnected && wsRef.current && currentRoomRef.current !== room) {
            const oldRoom = currentRoomRef.current;

            // Leave old room
            wsRef.current.send(JSON.stringify({
                type: 'leave_room',
                room: oldRoom,
                walletAddress: address,
            }));

            // Clear messages
            setMessages([]);

            // Join new room
            wsRef.current.send(JSON.stringify({
                type: 'join_room',
                room,
                walletAddress: address,
            }));

            // Update current room ref
            currentRoomRef.current = room;

            console.log(`Switched from room "${oldRoom}" to "${room}"`);
        }
    }, [room, isConnected, address]);

    /**
     * Auto-connect on mount if enabled
     */
    useEffect(() => {
        if (autoConnect && address) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, address]); // Only reconnect when address changes

    return {
        messages,
        users,
        typingUsers: Array.from(typingUsers),
        isConnected,
        isConnecting,
        connect,
        disconnect,
        sendMessage,
        sendTyping,
        markAsRead,
    };
}
