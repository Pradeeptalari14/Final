import React, { useState } from 'react';
import { CheckCircle, Lock, AlertTriangle, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetStatus } from '@/types';

import { RejectionReasonModal } from './RejectionReasonModal';

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
    const [checks, setChecks] = useState({ qty: false, condition: false, sign: false });
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const isPending = isStaging
        ? status === SheetStatus.STAGING_VERIFICATION_PENDING
        : status === SheetStatus.LOADING_VERIFICATION_PENDING;

    if (isPending && isShiftLead) {
        return (
            <div className={`fixed bottom-0 left-0 right-0 p-4 ${isStaging ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'} border-t shadow-2xl flex flex-col items-center gap-4 z-50 print:hidden animate-in slide-in-from-bottom-4`}>
                <RejectionReasonModal
                    isOpen={isRejectModalOpen}
                    onClose={() => setIsRejectModalOpen(false)}
                    onConfirm={(reason) => onApprove(false, reason)}
                    type="header"
                />

                <div className="w-full max-w-2xl bg-white border rounded-xl p-4 shadow-sm">
                    <h4 className={`text-xs font-bold ${isStaging ? 'text-purple-700' : 'text-blue-700'} uppercase tracking-wider mb-3 flex items-center gap-2`}>
                        <ClipboardList size={14} /> Verification Checklist ({isStaging ? 'Staging' : 'Loading'} Level)
                    </h4>
                    <div className="grid sm:grid-cols-3 gap-3">
                        {['Qty Matches', 'Pallet OK', 'Sup. Sign'].map((label, idx) => {
                            const key = ['qty', 'condition', 'sign'][idx] as keyof typeof checks;
                            return (
                                <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checks[key] ? (isStaging ? 'bg-purple-600 border-purple-600' : 'bg-blue-600 border-blue-600') + ' text-white' : 'bg-white border-slate-300'}`}>
                                        {checks[key] && <CheckCircle size={12} strokeWidth={4} />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={checks[key]} onChange={() => setChecks(prev => ({ ...prev, [key]: !prev[key] }))} />
                                    <span className="font-medium">{label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setIsRejectModalOpen(true)} className="text-red-500 border-red-200 hover:bg-red-50">
                        <AlertTriangle className="mr-2" size={16} /> Reject
                    </Button>
                    <Button
                        onClick={() => onApprove(true)}
                        disabled={!Object.values(checks).every(Boolean)}
                        className={`${isStaging ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-600'} text-white gap-2 transition-all ${!Object.values(checks).every(Boolean) ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:scale-105'}`}
                    >
                        <Lock size={16} /> {isStaging ? 'Verify & Lock Sheet' : 'Verify & Complete Shipment'}
                    </Button>
                </div>
            </div>
        );
    }

    return null;
};
