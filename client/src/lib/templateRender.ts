/**
 * Shared utilities for template design viewing and downloading.
 * Re-renders fabric canvas states client-side and creates composite images
 * to avoid CORS/auth issues with direct API image URLs.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';

/** Load image natural dimensions */
export function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
    });
}

/**
 * Re-render a design from saved fabric canvas state using an offscreen canvas.
 * This ensures correct positioning regardless of how the original PNG was exported.
 */
export async function renderDesignFromState(
    fabricState: string | object,
    viewPrintArea: { x: number; y: number; width: number; height: number },
    mockupUrl: string | null,
    savedDimensions?: { width: number; height: number } | null
): Promise<string | null> {
    if (!fabricState) return null;

    try {
        const stateObj = typeof fabricState === 'string' ? JSON.parse(fabricState) : fabricState;

        // Check if state has any content
        if ((!stateObj.objects || stateObj.objects.length === 0) &&
            !stateObj.backgroundImage && !stateObj.backgroundColor) {
            return null;
        }

        // Dynamically import fabric.js
        const fabric = await import('fabric');
        const CANVAS_MARGIN = 40;

        // Determine canvas dimensions
        let canvasWidth: number, canvasHeight: number;

        if (savedDimensions && savedDimensions.width > 0 && savedDimensions.height > 0) {
            canvasWidth = savedDimensions.width;
            canvasHeight = savedDimensions.height;
        } else if (mockupUrl) {
            try {
                const dims = await loadImageDimensions(mockupUrl);
                const scale = Math.min(500 / dims.width, 600 / dims.height, 1);
                const contW = dims.width * scale;
                const contH = dims.height * scale;
                canvasWidth = (viewPrintArea.width / 100) * contW + (CANVAS_MARGIN * 2);
                canvasHeight = (viewPrintArea.height / 100) * contH + (CANVAS_MARGIN * 2);
            } catch {
                canvasWidth = 300;
                canvasHeight = 400;
            }
        } else {
            canvasWidth = 300;
            canvasHeight = 400;
        }

        const printWidth = canvasWidth - (CANVAS_MARGIN * 2);
        const printHeight = canvasHeight - (CANVAS_MARGIN * 2);

        const canvasEl = document.createElement('canvas');
        canvasEl.width = canvasWidth;
        canvasEl.height = canvasHeight;
        document.body.appendChild(canvasEl);

        const fabricCanvas = new fabric.Canvas(canvasEl, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: 'transparent',
            renderOnAddRemove: true,
        });

        fabricCanvas.setViewportTransform([1, 0, 0, 1, CANVAS_MARGIN, CANVAS_MARGIN]);

        fabricCanvas.clipPath = new fabric.Rect({
            left: 0,
            top: 0,
            width: printWidth,
            height: printHeight,
            absolutePositioned: false,
            fill: 'transparent',
            stroke: 'transparent',
            selectable: false,
            evented: false,
        });

        await new Promise<void>((resolve) => {
            fabricCanvas.loadFromJSON(stateObj, () => {
                fabricCanvas.renderAll();
                setTimeout(resolve, 100);
            });
        });

        const dataURL = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1.0,
            left: CANVAS_MARGIN,
            top: CANVAS_MARGIN,
            width: printWidth,
            height: printHeight,
            multiplier: Math.min(1000 / printWidth, 4),
        });

        fabricCanvas.dispose();
        if (canvasEl.parentNode) {
            canvasEl.parentNode.removeChild(canvasEl);
        }

        return dataURL;
    } catch (error) {
        console.error('renderDesignFromState error:', error);
        return null;
    }
}

/** Convert API URLs to proxy URLs for display (avoids CORS/auth) */
export function proxyMockupUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith(API_URL)) {
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
}

/** Load image with auth/proxy support for API URLs */
async function loadImageForComposite(url: string): Promise<HTMLImageElement> {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let fetchUrl = url;
    if (url.startsWith('/api/') || url.startsWith(API_URL)) {
        if (!url.startsWith('/api/')) {
            fetchUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        }
    }

    const response = await fetch(fetchUrl, { headers });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image load failed'));
        };
        img.src = objectUrl;
    });
}

/**
 * Create composite image (design + mockup) for download.
 * Uses proxy for API URLs to avoid CORS/auth issues.
 */
export async function createCleanCompositeImage(
    designUrl: string | null,
    mockupUrl: string | null,
    area: { x: number; y: number; width: number; height: number } | null,
    backgroundColor: string = '#ffffff'
): Promise<Blob | null> {
    if (!designUrl) return null;

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        let canvasWidth = 1200;
        let canvasHeight = 1400;
        let mockupImg: HTMLImageElement | null = null;

        // Use proxy for mockup if it's from API
        const effectiveMockupUrl = mockupUrl ? (mockupUrl.startsWith(API_URL) ? `/api/proxy-image?url=${encodeURIComponent(mockupUrl)}` : mockupUrl) : null;

        if (effectiveMockupUrl) {
            try {
                mockupImg = await loadImageForComposite(effectiveMockupUrl);
                canvasWidth = mockupImg.width;
                canvasHeight = mockupImg.height;
            } catch {
                // use defaults
            }
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        if (mockupImg) {
            ctx.drawImage(mockupImg, 0, 0, canvasWidth, canvasHeight);
        }

        // designUrl can be data: or blob: - loadImageForComposite handles fetch; for data/blob we use direct img load
        let designImg: HTMLImageElement;
        if (designUrl.startsWith('data:') || designUrl.startsWith('blob:')) {
            designImg = await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Design image load failed'));
                img.src = designUrl;
            });
        } else {
            designImg = await loadImageForComposite(designUrl);
        }

        if (area) {
            const printX = (area.x / 100) * canvasWidth;
            const printY = (area.y / 100) * canvasHeight;
            const printWidth = (area.width / 100) * canvasWidth;
            const printHeight = (area.height / 100) * canvasHeight;
            ctx.drawImage(designImg, printX, printY, printWidth, printHeight);
        } else {
            const dw = canvasWidth * 0.8;
            const dh = canvasHeight * 0.8;
            ctx.drawImage(designImg, (canvasWidth - dw) / 2, (canvasHeight - dh) / 2, dw, dh);
        }

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
        });
    } catch (error) {
        console.error('Composite creation error:', error);
        return null;
    }
}
