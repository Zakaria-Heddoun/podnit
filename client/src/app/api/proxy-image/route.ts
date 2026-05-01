import { NextRequest, NextResponse } from 'next/server';

// Only allow fetching from your own backend
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');
        if (!imageUrl) {
            return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
        }

        let fullUrl: string;
        if (imageUrl.startsWith('/')) {
            const base = ALLOWED_ORIGINS[0].replace(/\/$/, '');
            fullUrl = `${base}${imageUrl}`;
        } else {
            // Block ALL external URLs - no http:// allowed
            return NextResponse.json({ error: 'External URLs not allowed' }, { status: 403 });
        }

        const token = request.headers.get('authorization');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = token;

        const response = await fetch(fullUrl, { headers });
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || '';

        // Only allow image content types
        if (!contentType.startsWith('image/')) {
            return NextResponse.json({ error: 'Not an image' }, { status: 403 });
        }

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
    }
}
