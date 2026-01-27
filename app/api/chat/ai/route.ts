import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function to fetch and convert image to base64
async function fetchImageAsBase64(url: string): Promise<{ mimeType: string; data: string }> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        
        // Try to determine MIME type from response headers or URL
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        return {
            mimeType: contentType,
            data: base64,
        };
    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
}

// Helper function to fetch and extract text from document
async function fetchDocumentText(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch document: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        
        // For PDFs, we'll need to use a PDF parser (simplified for now)
        if (contentType.includes('pdf')) {
            // For PDF, return a note that PDF parsing needs special library
            return '[PDF Document - Content extraction requires special processing]';
        }
        
        // For text-based documents, try to get text
        if (contentType.includes('text') || contentType.includes('json')) {
            return await response.text();
        }
        
        // For images, return note that it will be processed as image
        if (contentType.startsWith('image/')) {
            return '[Image - Will be analyzed visually]';
        }
        
        return '[Document - Content type not directly readable]';
    } catch (error) {
        console.error('Error fetching document:', error);
        return '[Error loading document]';
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, context, attachments = [] } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required and must be a string' },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not configured');
            return NextResponse.json(
                { error: 'AI service is not configured' },
                { status: 500 }
            );
        }

        // Use vision model if there are image attachments
        const hasImages = attachments.some((att: any) => att.type === 'image');
        const modelName = hasImages ? 'gemini-2.0-flash-exp' : 'gemini-2.5-flash-lite';
        const model = genAI.getGenerativeModel({ model: modelName });

        const systemContext = `You are an AI assistant for Rivo, a platform for programmable work agreements with blockchain-based escrow and milestone payments.

Context:
- Agreement: ${context?.agreementTitle || 'Work Agreement'}
- User Role: ${context?.role || 'user'}

Your role is to help users with:
- Milestone submission and approval processes
- Payment and escrow questions
- Dispute resolution guidance
- Platform features and functionality
- Agreement management
- Analyzing documents, images, and files shared in chat

Provide helpful, concise, and friendly responses. Use emojis where appropriate to make responses engaging.`;

        // Prepare content parts
        const parts: any[] = [systemContext + `\n\nUser Question: ${message}\n\nProvide a helpful response:`];

        // Process attachments
        if (attachments && attachments.length > 0) {
            for (const attachment of attachments) {
                try {
                    if (attachment.type === 'image' && attachment.url) {
                        // Fetch and convert image to base64
                        const imageData = await fetchImageAsBase64(attachment.url);
                        parts.push({
                            inlineData: {
                                mimeType: imageData.mimeType,
                                data: imageData.data,
                            },
                        });
                    } else if (attachment.type === 'document' && attachment.url) {
                        // Try to extract text from document
                        const docText = await fetchDocumentText(attachment.url);
                        if (docText && !docText.startsWith('[')) {
                            parts.push(`\n\nDocument "${attachment.name}" content:\n${docText}`);
                        } else if (attachment.url.includes('.pdf')) {
                            // For PDF, try to process as image if possible
                            try {
                                const imageData = await fetchImageAsBase64(attachment.url);
                                parts.push({
                                    inlineData: {
                                        mimeType: imageData.mimeType,
                                        data: imageData.data,
                                    },
                                });
                            } catch (e) {
                                parts.push(`\n\nDocument "${attachment.name}" attached (PDF - content extraction limited)`);
                            }
                        } else {
                            parts.push(`\n\nDocument "${attachment.name}" attached`);
                        }
                    } else {
                        parts.push(`\n\nFile "${attachment.name}" attached (${attachment.type})`);
                    }
                } catch (error) {
                    console.error(`Error processing attachment ${attachment.name}:`, error);
                    parts.push(`\n\nNote: Could not process attachment "${attachment.name}"`);
                }
            }
        }

        // Generate content with attachments
        const result = await model.generateContent(parts);
        const response = await result.response;
        const aiMessage = response.text();

        return NextResponse.json({
            message: aiMessage,
            success: true,
        });
    } catch (error: any) {
        console.error('Error generating AI response:', error);

        if (error?.message?.includes('API key')) {
            return NextResponse.json(
                { error: 'AI service authentication failed' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                error: 'Failed to generate AI response',
                details: error?.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
