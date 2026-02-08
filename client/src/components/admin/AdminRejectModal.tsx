"use client";

import React, { useState } from 'react';
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface AdminRejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isProcessing: boolean;
}

export function AdminRejectModal({ isOpen, onClose, onConfirm, isProcessing }: AdminRejectModalProps) {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px]">
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Reject Template</h2>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Please provide a reason for rejecting this template. This will be visible to the seller.
                    </p>

                    <div className="space-y-2">
                        <label htmlFor="reason" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Rejection Reason
                        </label>
                        <textarea
                            id="reason"
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                            placeholder="e.g. Design content violates policy, Image resolution too low..."
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing} className="border-gray-300 dark:border-gray-600">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!reason.trim() || isProcessing}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
