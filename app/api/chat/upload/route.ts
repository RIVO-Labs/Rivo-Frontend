/**
 * API Route: Upload File to IPFS for Chat Attachments
 * POST /api/chat/upload
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Check if API keys are configured
        const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
        const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

        if (!pinataApiKey || !pinataSecretKey) {
            return NextResponse.json(
                { error: 'IPFS service not configured' },
                { status: 500 }
            );
        }

        // Create FormData for Pinata
        const pinataFormData = new FormData();
        pinataFormData.append('file', file);

        // Add metadata
        const metadata = JSON.stringify({
            name: file.name,
            keyvalues: {
                uploadedAt: new Date().toISOString(),
                type: 'chat-attachment',
                mimeType: file.type,
            },
        });
        pinataFormData.append('pinataMetadata', metadata);

        // Upload to Pinata
        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                pinata_api_key: pinataApiKey,
                pinata_secret_api_key: pinataSecretKey,
            },
            body: pinataFormData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload to IPFS');
        }

        const data = await response.json();
        const ipfsHash = data.IpfsHash;
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        // Determine file type
        let fileType = 'file';
        if (file.type.startsWith('image/')) {
            fileType = 'image';
        } else if (file.type.includes('pdf') || file.type.includes('document') || 
                   file.type.includes('text') || file.type.includes('msword') ||
                   file.type.includes('spreadsheet') || file.type.includes('presentation')) {
            fileType = 'document';
        }

        return NextResponse.json({
            success: true,
            attachment: {
                id: ipfsHash,
                name: file.name,
                type: fileType,
                url: ipfsUrl,
                size: file.size,
                mimeType: file.type,
            },
        });
    } catch (error: any) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            {
                error: 'Failed to upload file',
                details: error?.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}

