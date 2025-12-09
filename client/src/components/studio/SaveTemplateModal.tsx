"use client";

import React, { useState } from 'react';
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface SaveTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, price: number) => void;
    isSaving: boolean;
}

export function SaveTemplateModal({ isOpen, onClose, onSave, isSaving }: SaveTemplateModalProps) {
    const [name, setName] = useState('');

    const handleSave = () => {
        if (name.trim()) {
            onSave(name, 0);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[425px]">
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Save Template</h2>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Template Name
                        </label>
                        <input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="e.g. Summer Vibes T-Shirt"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isSaving} className="border-gray-300 dark:border-gray-600">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
