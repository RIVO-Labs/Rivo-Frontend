/**
 * API Route: Room Participant Management
 * GET /api/chat/rooms/[roomId]/participants - List all participants in a room
 * POST /api/chat/rooms/[roomId]/participants - Add participants to a room
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const parsedRoomId = parseInt(roomId);

        if (isNaN(parsedRoomId)) {
            return NextResponse.json(
                { error: 'Invalid room ID' },
                { status: 400 }
            );
        }

        // Find room
        const room = await prisma.room.findUnique({
            where: { id: parsedRoomId },
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

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        // Format response
        const participants = room.participants.map((p) => ({
            id: p.user.id,
            walletAddress: p.user.walletAddress,
            name: p.user.name,
            avatar: p.user.avatar,
            role: p.role,
            joinedAt: p.joinedAt.toISOString(),
        }));

        return NextResponse.json({ participants });
    } catch (error) {
        console.error('Error fetching participants:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const parsedRoomId = parseInt(roomId);

        if (isNaN(parsedRoomId)) {
            return NextResponse.json(
                { error: 'Invalid room ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { walletAddresses, requesterWalletAddress } = body;

        if (!Array.isArray(walletAddresses) || walletAddresses.length === 0) {
            return NextResponse.json(
                { error: 'Wallet addresses array is required' },
                { status: 400 }
            );
        }

        if (!requesterWalletAddress) {
            return NextResponse.json(
                { error: 'Requester wallet address is required' },
                { status: 400 }
            );
        }

        // Find room
        const room = await prisma.room.findUnique({
            where: { id: parsedRoomId },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        // Verify requester is an owner or admin
        const requesterUser = await prisma.user.findUnique({
            where: { walletAddress: requesterWalletAddress },
        });

        if (!requesterUser) {
            return NextResponse.json(
                { error: 'Requester not found' },
                { status: 404 }
            );
        }

        const requesterParticipant = room.participants.find(
            (p) => p.userId === requesterUser.id
        );

        if (!requesterParticipant || !['owner', 'admin'].includes(requesterParticipant.role)) {
            return NextResponse.json(
                { error: 'Only room owners and admins can add participants' },
                { status: 403 }
            );
        }

        // Add participants
        const addedParticipants = [];
        for (const walletAddress of walletAddresses) {
            // Find or create user
            const user = await prisma.user.upsert({
                where: { walletAddress },
                update: {},
                create: { walletAddress },
            });

            // Check if already a participant
            const existingParticipant = room.participants.find(
                (p) => p.userId === user.id
            );

            if (existingParticipant) {
                continue; // Skip if already a participant
            }

            // Add as participant
            const participant = await prisma.roomParticipant.create({
                data: {
                    roomId: room.id,
                    userId: user.id,
                    role: 'member',
                },
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

            addedParticipants.push({
                id: participant.user.id,
                walletAddress: participant.user.walletAddress,
                name: participant.user.name,
                avatar: participant.user.avatar,
                role: participant.role,
                joinedAt: participant.joinedAt.toISOString(),
            });
        }

        return NextResponse.json({
            success: true,
            addedParticipants,
        });
    } catch (error) {
        console.error('Error adding participants:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
