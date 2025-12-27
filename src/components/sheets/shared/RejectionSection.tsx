import React from 'react';
import { AlertTriangle, ListX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RejectedItemDisplay {
    id: string | number;
    name: string;
    reason?: string;
}

interface RejectionSectionProps {
    reason?: string | null;
    rejectedItems?: RejectedItemDisplay[];
}

export const RejectionSection: React.FC<RejectionSectionProps> = ({
    reason,
    rejectedItems = []
}) => {
    if (!reason && rejectedItems.length === 0) return null;

    return (
        <div className="mb-6 bg-white border border-red-100 rounded-xl shadow-[0_2px_15px_-3px_rgba(239,68,68,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-2 print:hidden relative group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-500 to-red-600" />
            <div className="p-6">
                <div className="flex items-start gap-5">
                    <div className="p-3 bg-red-50 rounded-xl text-red-600 shrink-0 shadow-sm border border-red-100">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    Sheet Verification Failed
                                </h3>
                                <p className="text-slate-500 text-sm mt-0.5">
                                    Please address the issues below and resubmit for verification.
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-red-600 border-red-200 bg-red-50 animate-pulse"
                            >
                                Action Required
                            </Badge>
                        </div>

                        {/* Global Reason */}
                        {reason && (
                            <div className="mt-5 bg-slate-50 p-4 rounded-lg border border-slate-100 relative">
                                <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border border-slate-100 rounded-full">
                                    Rejection Logic
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {reason}
                                </p>
                            </div>
                        )}

                        {/* Rejected Items List */}
                        {rejectedItems.length > 0 && (
                            <div className="mt-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-2">
                                    <ListX size={14} /> Affected Items ({rejectedItems.length})
                                </h4>
                                <ScrollArea className="h-full max-h-[150px] w-full rounded-md border border-red-100 bg-red-50/30">
                                    <div className="p-2 space-y-1">
                                        {rejectedItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex flex-col gap-1 bg-white p-2 rounded border border-red-100 text-sm shadow-sm group hover:border-red-300 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-red-50 text-red-700 border-red-100 font-mono text-[10px] min-w-[2rem] justify-center"
                                                    >
                                                        #{item.id}
                                                    </Badge>
                                                    <span
                                                        className="font-medium text-slate-700 line-clamp-1"
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </span>
                                                </div>
                                                {item.reason && (
                                                    <div className="pl-[3.25rem] text-xs text-red-500 italic">
                                                        &quot;{item.reason}&quot;
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
