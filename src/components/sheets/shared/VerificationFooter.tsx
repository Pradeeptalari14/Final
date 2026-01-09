import React, { useState } from 'react';
import { CheckCircle, Lock, AlertTriangle, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetStatus } from '@/types';

import { RejectionReasonModal } from './RejectionReasonModal';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';

interface VerificationFooterProps {
    status: SheetStatus;
    isShiftLead: boolean;
    onApprove: (approve: boolean, reason?: string) => void;
    isStaging?: boolean;
}

export const VerificationFooter: React.FC<VerificationFooterProps> = ({
    status,
    isShiftLead,
    onApprove,
    isStaging = false
}) => {
    const [checks, setChecks] = useState({ qty: false, condition: false });
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const handleConfirm = () => {
        onApprove(true);
        setIsConfirmModalOpen(false);
    };

    const isPending = isStaging
        ? status === SheetStatus.STAGING_VERIFICATION_PENDING
        : status === SheetStatus.LOADING_VERIFICATION_PENDING;

    if (isPending && isShiftLead) {
        return (
            <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center justify-end px-4 z-50 pointer-events-none print:hidden animate-in slide-in-from-bottom-4">
                <RejectionReasonModal
                    isOpen={isRejectModalOpen}
                    onClose={() => setIsRejectModalOpen(false)}
                    onConfirm={(reason) => onApprove(false, reason)}
                    type="header"
                />

                <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Verification</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to verify and lock this sheet? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-purple-600 hover:bg-purple-500 text-white" onClick={handleConfirm}>
                                Confirm & Lock
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div
                    className={`w-full max-w-3xl pointer-events-auto ${isStaging ? 'bg-purple-50/95 border-purple-200' : 'bg-blue-50/95 border-blue-200'} backdrop-blur-sm border rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row items-center gap-4`}
                >
                    <div className="flex-1 w-full flex flex-col items-center justify-center text-center">
                        <h4
                            className={`text-xs font-bold ${isStaging ? 'text-purple-700' : 'text-blue-700'} uppercase tracking-wider mb-2 flex items-center justify-center gap-2`}
                        >
                            <ClipboardList size={14} /> Verification Checklist (
                            {isStaging ? 'Staging' : 'Loading'} Level)
                        </h4>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {['Qty Matches', 'Pallet OK'].map((label, idx) => {
                                const key = ['qty', 'condition'][
                                    idx
                                ] as keyof typeof checks;
                                return (
                                    <label
                                        key={key}
                                        className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1.5 hover:bg-white/50 rounded-lg transition-colors border border-transparent hover:border-purple-100"
                                    >
                                        <div
                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checks[key] ? (isStaging ? 'bg-purple-600 border-purple-600' : 'bg-blue-600 border-blue-600') + ' text-white' : 'bg-white border-slate-300'}`}
                                        >
                                            {checks[key] && (
                                                <CheckCircle size={10} strokeWidth={4} />
                                            )}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={checks[key]}
                                            onChange={() =>
                                                setChecks((prev) => ({
                                                    ...prev,
                                                    [key]: !prev[key]
                                                }))
                                            }
                                        />
                                        <span className="font-medium text-xs md:text-sm whitespace-nowrap">
                                            {label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-200/50 pt-3 md:pt-0 md:pl-4 w-full md:w-auto justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setIsRejectModalOpen(true)}
                            className="text-red-500 border-red-200 hover:bg-red-50 h-10"
                        >
                            <AlertTriangle className="mr-2" size={16} /> Reject
                        </Button>
                        <Button
                            onClick={() => setIsConfirmModalOpen(true)}
                            disabled={!Object.values(checks).every(Boolean)}
                            className={`${isStaging ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-600'} text-white gap-2 transition-all h-10 ${!Object.values(checks).every(Boolean) ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:scale-105'}`}
                        >
                            <Lock size={16} />{' '}
                            {isStaging ? 'Verify & Lock Sheet' : 'Verify & Complete'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
