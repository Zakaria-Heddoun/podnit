"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

interface TemplateDesignViewerProps {
    isOpen: boolean;
    onClose: () => void;
    template: {
        id: number;
        title: string;
        design_config: any;
    } | null;
}

interface DesignSide {
    name: string;
    key: string;
    canvas: fabric.Canvas | null;
}

export function TemplateDesignViewer({ isOpen, onClose, template }: TemplateDesignViewerProps) {
    const [designs, setDesigns] = useState<DesignSide[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
    const fabricCanvasesRef = useRef<{ [key: string]: fabric.Canvas }>({});

    useEffect(() => {
        if (isOpen && template) {
            loadDesigns();
        }

        return () => {
            // Cleanup canvases when modal closes
            Object.values(fabricCanvasesRef.current).forEach(canvas => {
                if (canvas) {
                    canvas.dispose();
                }
            });
            fabricCanvasesRef.current = {};
            setDesigns([]);
        };
    }, [isOpen, template?.id]);

    const loadDesigns = async () => {
        alert(`Template ID: ${template?.id}\nHas design_config: ${!!template?.design_config}\nType: ${typeof template?.design_config}`);

        if (!template?.design_config) {
            console.log('No design_config found:', template);
            return;
        }

        setIsLoading(true);
        try {
            const config = typeof template.design_config === 'string'
                ? JSON.parse(template.design_config)
                : template.design_config;

            console.log('Parsed config:', config);

            const sides: DesignSide[] = [
                { name: 'Big Front', key: 'big-front', canvas: null },
                { name: 'Small Front', key: 'small-front', canvas: null },
                { name: 'Back', key: 'back', canvas: null },
                { name: 'Left Sleeve', key: 'left', canvas: null },
                { name: 'Right Sleeve', key: 'right', canvas: null },
            ];

            // Wait a bit for canvas elements to be rendered
            await new Promise(resolve => setTimeout(resolve, 100));

            const loadedDesigns: DesignSide[] = [];

            for (const side of sides) {
                const canvasState = config.states?.[side.key];
                if (canvasState && canvasState !== '') {
                    const canvasEl = canvasRefs.current[side.key];
                    if (canvasEl) {
                        const width = side.key === 'small-front' ? 176 : 220;
                        const height = side.key === 'small-front' ? 96 : 270;

                        const canvas = new fabric.Canvas(canvasEl, {
                            width,
                            height,
                            backgroundColor: 'transparent',
                        });

                        try {
                            await new Promise<void>((resolve, reject) => {
                                canvas.loadFromJSON(canvasState, () => {
                                    canvas.renderAll();
                                    resolve();
                                }, (error: any) => {
                                    console.error('Error loading canvas:', error);
                                    reject(error);
                                });
                            });

                            fabricCanvasesRef.current[side.key] = canvas;
                            loadedDesigns.push({ ...side, canvas });
                        } catch (error) {
                            console.error(`Error loading ${side.key}:`, error);
                            canvas.dispose();
                        }
                    }
                }
            }

            setDesigns(loadedDesigns);
        } catch (error) {
            console.error('Error loading designs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (design: DesignSide) => {
        if (!design.canvas) return;

        const dataURL = design.canvas.toDataURL({
            format: 'png',
            multiplier: 2,
        });

        const link = document.createElement('a');
        link.download = `${template?.title || 'template'}-${design.key}.png`;
        link.href = dataURL;
        link.click();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white dark:bg-boxdark shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark">
                    <div>
                        <h3 className="text-xl font-semibold text-black dark:text-white">
                            Template Designs
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {template?.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                        </div>
                    ) : designs.length === 0 ? (
                        <div className="py-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-4 text-gray-500 dark:text-gray-400">
                                No designs found for this template
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {designs.map((design) => (
                                <div
                                    key={design.key}
                                    className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-gray-900"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h4 className="font-medium text-black dark:text-white">
                                            {design.name}
                                        </h4>
                                        <button
                                            onClick={() => handleDownload(design)}
                                            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
                                            title="Download"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span>Download</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-center rounded bg-white p-4 dark:bg-gray-800 min-h-[200px]">
                                        <canvas
                                            ref={(el) => { canvasRefs.current[design.key] = el; }}
                                            className="max-w-full"
                                            style={{ border: '1px solid #e5e7eb' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
