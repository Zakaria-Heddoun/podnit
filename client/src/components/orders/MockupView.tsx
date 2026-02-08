"use client";

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface MockupViewProps {
    imageUrl: string | null;
    backgroundUrl?: string | null;
    viewName: string;
    viewKey?: string;
    templateId?: number | string;
    backgroundColor?: string;
    area?: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    savedOverride?: { x: number | string; y: number | string; width: number | string; height: number | string } | null;
    className?: string;
    forceDebug?: boolean;
    allowDebug?: boolean;
}

const MockupView: React.FC<MockupViewProps> = ({
    imageUrl,
    backgroundUrl,
    viewName,
    backgroundColor = "#ffffff",
    area,
    className = "",
    templateId,
    viewKey,
    savedOverride,
    allowDebug = true,
}) => {
    // The active area in percentages — savedOverride takes precedence over the product area
    const [manualArea, setManualArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [editMode, setEditMode] = useState(false);

    // Storage key for per-mockup overrides
    const overrideKey = (templateId && viewKey)
        ? `template_override:${templateId}:${viewKey}`
        : (backgroundUrl ? `mockup_override:${backgroundUrl}:${viewName}` : null);

    // Load saved override (server-provided savedOverride prop, or localStorage fallback)
    useEffect(() => {
        if (savedOverride && typeof savedOverride === 'object') {
            setManualArea({
                x: Number(savedOverride.x),
                y: Number(savedOverride.y),
                width: Number(savedOverride.width),
                height: Number(savedOverride.height),
            });
            return;
        }

        if (!overrideKey) return;
        try {
            const raw = localStorage.getItem(overrideKey);
            if (raw) {
                const saved = JSON.parse(raw);
                if (saved && typeof saved === 'object') setManualArea(saved);
            }
        } catch {
            // ignore
        }
    }, [overrideKey, savedOverride]);

    // The final area to use for positioning (manual override > original area)
    const activeArea = manualArea ?? area;

    // Save current manualArea to server / localStorage
    const saveManualArea = async () => {
        if (!manualArea) return;
        if (!overrideKey) return toast.error('No override key available');

        if (templateId && viewKey) {
            try {
                const token = localStorage.getItem('token');
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
                const res = await fetch(`${API_URL}/api/admin/templates/${templateId}/view-override`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                    },
                    body: JSON.stringify({ view_key: viewKey, override: manualArea }),
                });

                if (res.ok) {
                    const body = await res.json();
                    localStorage.setItem(overrideKey, JSON.stringify(manualArea));
                    if (body?.override) {
                        const o = body.override;
                        setManualArea({ x: Number(o.x), y: Number(o.y), width: Number(o.width), height: Number(o.height) });
                    }
                    return true;
                } else {
                    console.error('Failed to save override to server', res.status);
                    localStorage.setItem(overrideKey, JSON.stringify(manualArea));
                    return false;
                }
            } catch (err) {
                console.error('Error saving override', err);
                localStorage.setItem(overrideKey, JSON.stringify(manualArea));
                return false;
            }
        } else {
            localStorage.setItem(overrideKey, JSON.stringify(manualArea));
            return true;
        }
    };

    return (
        <div className={`relative rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark ${className}`}>
            <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-black dark:text-white uppercase text-sm tracking-wider">
                    {viewName}
                </h4>

                {allowDebug && (
                    <button
                        onClick={() => setEditMode(e => !e)}
                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                        title="Toggle manual placement editor"
                    >
                        {editMode ? 'Close editor' : 'Edit placement'}
                    </button>
                )}
            </div>

            <div className="relative flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 overflow-hidden min-h-[300px]">
                {imageUrl || backgroundUrl ? (
                    <div className="relative w-full flex items-center justify-center p-4">
                        {/*
                            The container uses an invisible image to automatically adopt the mockup's
                            aspect ratio. This means percentage-based positioning maps 1:1 to the
                            mockup image coordinates — no complex pixel calculations needed.
                        */}
                        <div className="relative w-full max-w-[500px] shadow-lg rounded-lg overflow-hidden" style={{ backgroundColor }}>
                            {backgroundUrl ? (
                                <>
                                    {/* Invisible image to set container height based on mockup aspect ratio */}
                                    <img
                                        src={backgroundUrl}
                                        alt=""
                                        className="w-full h-auto opacity-0 block"
                                        aria-hidden="true"
                                        draggable={false}
                                    />
                                    {/* Real background mockup — fills the aspect-ratio-matched container */}
                                    <img
                                        src={backgroundUrl}
                                        alt="Mockup"
                                        className="absolute inset-0 w-full h-full z-0"
                                        style={{
                                            objectFit: 'fill', // Container already matches aspect ratio, so fill is correct
                                        }}
                                        crossOrigin={backgroundUrl?.startsWith('/api/') ? undefined : 'anonymous'}
                                        draggable={false}
                                    />
                                </>
                            ) : (
                                <div className="aspect-[4/5] w-full" />
                            )}

                            {/*
                                Design overlay layer — positioned using simple percentages.
                                Since the container matches the mockup aspect ratio, the seller's
                                area percentages map directly to correct positions.
                            */}
                            <div className="absolute inset-0">
                                {imageUrl && activeArea && (
                                    <img
                                        src={imageUrl}
                                        alt={viewName}
                                        className="absolute z-10 pointer-events-none"
                                        style={{
                                            left: `${activeArea.x}%`,
                                            top: `${activeArea.y}%`,
                                            width: `${activeArea.width}%`,
                                            height: `${activeArea.height}%`,
                                            objectFit: 'contain',
                                            objectPosition: 'center',
                                            imageRendering: 'high-quality' as any,
                                        }}
                                        draggable={false}
                                    />
                                )}

                                {imageUrl && !activeArea && (
                                    <img
                                        src={imageUrl}
                                        alt={viewName}
                                        className="absolute z-10 pointer-events-none"
                                        style={{
                                            left: '10%',
                                            top: '10%',
                                            width: '80%',
                                            height: '80%',
                                            objectFit: 'contain',
                                            objectPosition: 'center',
                                        }}
                                        draggable={false}
                                    />
                                )}

                                {/* Print area dashed outline */}
                                {activeArea && (
                                    <div
                                        className="absolute border border-dashed border-blue-500/30 pointer-events-none z-20"
                                        style={{
                                            left: `${activeArea.x}%`,
                                            top: `${activeArea.y}%`,
                                            width: `${activeArea.width}%`,
                                            height: `${activeArea.height}%`,
                                        }}
                                    />
                                )}
                            </div>

                            {/* View name badge */}
                            <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase z-30">
                                {viewName}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">No Mockup Available</span>
                    </div>
                )}
            </div>

            {/* Manual placement editor panel */}
            {editMode && activeArea && (
                <div className="mt-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h5 className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Manual Placement (%)</h5>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                        {(['x', 'y', 'width', 'height'] as const).map((field) => (
                            <div key={field}>
                                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{field}</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="100"
                                    value={manualArea?.[field] ?? area?.[field] ?? 0}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setManualArea(prev => ({
                                            x: prev?.x ?? area?.x ?? 0,
                                            y: prev?.y ?? area?.y ?? 0,
                                            width: prev?.width ?? area?.width ?? 0,
                                            height: prev?.height ?? area?.height ?? 0,
                                            [field]: val,
                                        }));
                                    }}
                                    className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={async () => {
                                const ok = await saveManualArea();
                                if (ok) toast.success('Override saved');
                                else toast.info('Saved locally (server failed)');
                            }}
                            className="px-3 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700"
                        >
                            Save override
                        </button>
                        <button
                            onClick={() => {
                                setManualArea(null);
                                if (overrideKey) localStorage.removeItem(overrideKey);
                            }}
                            className="px-3 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600"
                        >
                            Reset to original
                        </button>
                        <button
                            onClick={() => {
                                if (area) {
                                    setManualArea({ x: Number(area.x), y: Number(area.y), width: Number(area.width), height: Number(area.height) });
                                }
                            }}
                            className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 text-xs dark:text-white hover:bg-gray-400"
                        >
                            Copy original values
                        </button>
                    </div>
                    {area && (
                        <div className="mt-2 text-[10px] text-gray-400">
                            Original: x={area.x}% y={area.y}% w={area.width}% h={area.height}%
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MockupView;
