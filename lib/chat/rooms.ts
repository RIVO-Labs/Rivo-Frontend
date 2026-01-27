/**
 * Utility functions for chat room management
 */

export interface CreateRoomParams {
    name: string;
    type?: 'agreement' | 'direct' | 'group' | 'support';
    metadata?: Record<string, any>;
}

export interface Room {
    id: number;
    name: string;
    type: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

/**
 * Create a new chat room
 */
export async function createRoom(params: CreateRoomParams): Promise<Room> {
    const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create room');
    }

    const data = await response.json();
    return data.room;
}

/**
 * Get all rooms for a user
 */
export async function getRooms(walletAddress: string): Promise<Room[]> {
    const response = await fetch(
        `/api/chat/rooms?walletAddress=${encodeURIComponent(walletAddress)}`
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch rooms');
    }

    const data = await response.json();
    return data.rooms;
}

/**
 * Create a room name from agreement ID
 */
export function createAgreementRoomName(agreementId: string): string {
    return `agreement-${agreementId}`;
}

/**
 * Create a room name for direct messaging between two users
 */
export function createDirectRoomName(user1: string, user2: string): string {
    // Sort addresses to ensure consistent room names
    const sorted = [user1, user2].sort();
    return `direct-${sorted[0]}-${sorted[1]}`;
}
