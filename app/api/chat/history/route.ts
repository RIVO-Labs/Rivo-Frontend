/**
 * API Route: Get Chat History
 * GET /api/chat/history?room=<roomName>&limit=50&before=<messageId>
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const room = searchParams.get('room');
        const walletAddress = searchParams.get('walletAddress');
        const limit = parseInt(searchParams.get('limit') || '50');
        const before = searchParams.get('before'); // For pagination

        if (!room) {
            return NextResponse.json(
                { error: 'Room name is required' },
                { status: 400 }
            );
        }

        // Find room
        const roomData = await prisma.room.findUnique({
            where: { name: room },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!roomData) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        // For private rooms, verify user is a participant
        if (!roomData.isPublic && walletAddress) {
            const user = await prisma.user.findUnique({
                where: { walletAddress },
            });

            if (!user) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            const isParticipant = roomData.participants.some(
                (p) => p.userId === user.id
            );

            if (!isParticipant) {
                return NextResponse.json(
                    { error: 'Access denied. You are not a participant of this room.' },
                    { status: 403 }
                );
            }
        }

        // Build query
        const whereClause: any = { roomId: roomData.id };
        if (before) {
            whereClause.id = { lt: parseInt(before) };
        }

        // Fetch messages
        const messages = await prisma.message.findMany({
            where: whereClause,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        walletAddress: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        // Transform to frontend format
        const formattedMessages = messages.reverse().map((msg: typeof messages[0]) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.user.walletAddress,
            senderName: msg.user.name || msg.user.walletAddress.slice(0, 6),
            mentions: msg.mentions,
            createdAt: msg.createdAt.toISOString(),
            isRead: msg.isRead,
            isAI: msg.isAI,
            metadata: msg.metadata,
            attachments: (msg.metadata as any)?.attachments || [],
        }));

        return NextResponse.json({
            room: room,
            messages: formattedMessages,
            hasMore: messages.length === limit,
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
