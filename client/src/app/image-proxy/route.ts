import { NextRequest, NextResponse } from 'next/server';

/**
 * Image proxy - must live outside /api/ to avoid being rewritten to Laravel.
 * Proxies image requests from the API to avoid CORS when loading into canvas.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        let fullUrl: string;

        if (imageUrl.startsWith('/')) {
            // Relative path — resolve against API backend or same origin
            const base = apiUrl || `http://localhost:8000`;
            fullUrl = `${base.replace(/\/$/, '')}${imageUrl}`;
        } else if (imageUrl.startsWith('http')) {
            // Only allow same-origin or API host
            if (apiUrl) {
                try {
                    const apiHost = new URL(apiUrl).hostname;
                    const parsed = new URL(imageUrl);
                    if (parsed.hostname !== apiHost) {
                        return NextResponse.json({ error: 'Invalid URL domain' }, { status: 403 });
                    }
                } catch {
                    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
                }
            }
            fullUrl = imageUrl;
        } else {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 403 });
        }
        const token = request.headers.get('authorization');
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = token;
        }

	const response = await fetch(fullUrl, {
    		headers,
    		redirect: "manual",
	});

	if (response.status >= 300 && response.status < 400) {
    		return NextResponse.json(
        		{ error: "Redirects are not allowed" },
        		{ status: 400 }
    		);
	}

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.statusText}` },
                { status: response.status }
            );
        }
	
	const contentType = response.headers.get('content-type') || '';

	if (!contentType.startsWith('image/')) {
    		return NextResponse.json(
        		{ error: 'Only images are allowed' },
        		{ status: 400 }
    		);
	}

        const buffer = await response.arrayBuffer();

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
        console.error('Image proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy image' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
