/**
 * API Route: Room Management
 * GET /api/chat/rooms - List all rooms for a user
 * POST /api/chat/rooms - Create a new room
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { walletAddress },
        });

        if (!user) {
            return NextResponse.json({ rooms: [] });
        }

        // Get all rooms where:
        // 1. User is a participant (for private rooms)
        // 2. Room is public
        // 3. User has sent messages (for backward compatibility)
        const rooms = await prisma.room.findMany({
            where: {
                OR: [
                    // Public rooms
                    { isPublic: true },
                    // Private rooms where user is a participant
                    {
                        isPublic: false,
                        participants: {
                            some: {
                                userId: user.id,
                            },
                        },
                    },
                ],
            },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                walletAddress: true,
                                name: true,
                            },
                        },
                    },
                },
                participants: {
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
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                userId: { not: user.id },
                                isRead: false,
                            },
                        },
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // Format response
        const formattedRooms = rooms.map((room: typeof rooms[0]) => ({
            id: room.id,
            name: room.name,
            type: room.type,
            isPublic: room.isPublic,
            participants: room.participants.map((p) => ({
                id: p.user.id,
                walletAddress: p.user.walletAddress,
                name: p.user.name,
                avatar: p.user.avatar,
                role: p.role,
                joinedAt: p.joinedAt.toISOString(),
            })),
            lastMessage: room.messages[0]
                ? {
                    content: room.messages[0].content,
                    senderName:
                        room.messages[0].user.name ||
                        room.messages[0].user.walletAddress.slice(0, 6),
                    createdAt: room.messages[0].createdAt.toISOString(),
                }
                : null,
            unreadCount: room._count.messages,
            updatedAt: room.updatedAt.toISOString(),
        }));

        return NextResponse.json({ rooms: formattedRooms });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            type = 'agreement',
            isPublic = true,
            metadata,
            creatorWalletAddress,
            participantWalletAddresses = []
        } = body;

        // Validate room name
        if (!name || typeof name !== 'string') {
            return NextResponse.json(
                { error: 'Room name is required and must be a string' },
                { status: 400 }
            );
        }

        // Validate room name format (alphanumeric, hyphens, underscores)
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            return NextResponse.json(
                { error: 'Room name can only contain letters, numbers, hyphens, and underscores' },
                { status: 400 }
            );
        }

        // Validate type
        const validTypes = ['agreement', 'direct', 'group', 'support'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid room type. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate creator wallet address for private rooms
        if (!isPublic && !creatorWalletAddress) {
            return NextResponse.json(
                { error: 'Creator wallet address is required for private rooms' },
                { status: 400 }
            );
        }

        // Check if room already exists
        const existingRoom = await prisma.room.findUnique({
            where: { name },
        });

        if (existingRoom) {
            return NextResponse.json(
                { error: 'Room with this name already exists' },
                { status: 409 }
            );
        }

        // Create room with participants in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the room
            const room = await tx.room.create({
                data: {
                    name,
                    type,
                    isPublic,
                    metadata: metadata || undefined,
                },
            });

            // If private room, add participants
            if (!isPublic && creatorWalletAddress) {
                // Find or create creator user
                const creator = await tx.user.upsert({
                    where: { walletAddress: creatorWalletAddress },
                    update: {},
                    create: { walletAddress: creatorWalletAddress },
                });

                // Add creator as owner
                await tx.roomParticipant.create({
                    data: {
                        roomId: room.id,
                        userId: creator.id,
                        role: 'owner',
                    },
                });

                // Add other participants as members
                if (participantWalletAddresses.length > 0) {
                    for (const walletAddress of participantWalletAddresses) {
                        // Skip if it's the creator
                        if (walletAddress === creatorWalletAddress) continue;

                        // Find or create user
                        const user = await tx.user.upsert({
                            where: { walletAddress },
                            update: {},
                            create: { walletAddress },
                        });

                        // Add as participant
                        await tx.roomParticipant.create({
                            data: {
                                roomId: room.id,
                                userId: user.id,
                                role: 'member',
                            },
                        });
                    }
                }
            }

            // Fetch room with participants
            return await tx.room.findUnique({
                where: { id: room.id },
                include: {
                    participants: {
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
                    },
                },
            });
        });

        return NextResponse.json({
            success: true,
            room: {
                id: result!.id,
                name: result!.name,
                type: result!.type,
                isPublic: result!.isPublic,
                metadata: result!.metadata,
                participants: result!.participants.map((p) => ({
                    id: p.user.id,
                    walletAddress: p.user.walletAddress,
                    name: p.user.name,
                    avatar: p.user.avatar,
                    role: p.role,
                    joinedAt: p.joinedAt.toISOString(),
                })),
                createdAt: result!.createdAt.toISOString(),
                updatedAt: result!.updatedAt.toISOString(),
            },
        });
    } catch (error: any) {
        console.error('Error creating room:', error);
        console.error('Error details:', {
            message: error?.message,
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack,
        });

        // Handle Prisma-specific errors
        if (error?.code === 'P2002') {
            return NextResponse.json(
                { error: 'Room with this name already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error?.message || 'Unknown error',
                code: error?.code || 'UNKNOWN'
            },
            { status: 500 }
        );
    }
}
