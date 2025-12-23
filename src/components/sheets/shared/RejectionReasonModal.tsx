import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RejectionReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    itemName?: string;
    type?: 'staging' | 'loading' | 'header';
}

const QUICK_REASONS = {
    staging: ['Wrong Cases/PLT', 'Full PLT Error', 'Loose Qty Missing', 'SKU Mismatch', 'Packaging Damage'],
    loading: ['Pallet # Missing', 'Balance !0', 'Total Error', 'Entry Mistake', 'Wrong Pallet #'],
    header: ['Missing Trucker', 'Driver Name?', 'Seal No?', 'Serial No?', 'Vehicle #?', 'Dock Error', 'Sign Missing']
};

export const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    type = 'staging'
}) => {
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        onConfirm(reason);
        setReason('');
        onClose();
    };

    const addReason = (r: string) => {
        setReason(prev => prev ? `${prev}, ${r}` : r);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Reject {type === 'header' ? 'Sheet' : 'Item'}
                    </DialogTitle>
                    <DialogDescription>
                        {type === 'header'
                            ? "Explain why the entire sheet is being sent back."
                            : `Explain why ${itemName ? itemName : 'this item'} is being rejected.`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="flex flex-wrap gap-1.5 mb-1">
                        {QUICK_REASONS[type].map(r => (
                            <button
                                key={r}
                                onClick={() => addReason(r)}
                                className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold uppercase tracking-wider"
                            >
                                + {r}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reason" className="sr-only">Reason</Label>
                        <Textarea
                            id="reason"
                            placeholder="Type or select a reason above..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="h-24 resize-none focus-visible:ring-red-500 text-sm"
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={!reason.trim()}
                        className="font-bold"
                    >
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
