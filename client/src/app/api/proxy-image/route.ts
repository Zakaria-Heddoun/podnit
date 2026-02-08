import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
        }

        // Validate that the URL is from the API domain
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
        if (!imageUrl.startsWith(apiUrl) && !imageUrl.startsWith('/')) {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 403 });
        }

        // If relative path, prepend API URL
        const fullUrl = imageUrl.startsWith('/') ? `${apiUrl}${imageUrl}` : imageUrl;

        // Fetch the image from the backend
        const token = request.headers.get('authorization');
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = token;
        }

        const response = await fetch(fullUrl, { headers });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.statusText}` },
                { status: response.status }
            );
        }

        const buffer = await response.arrayBuffer();

        // Return with CORS headers
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'image/png',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Proxy image error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy image' },
            { status: 500 }
        );
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
