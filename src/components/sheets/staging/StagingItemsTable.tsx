import { useState } from 'react';
import { ClipboardList, AlertTriangle, Filter, Trash2 } from 'lucide-react';
import { StagingItem, SheetStatus, Role } from '@/types';
import { SkuSelector } from '../shared/SkuSelector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StagingItemsTableProps {
    items: StagingItem[];
    status: SheetStatus;
    onUpdateItem: (index: number, field: keyof StagingItem, value: string | number) => void;
    onRemoveItem: (index: number) => void;
    currentRole?: Role;
    onToggleRejection?: (srNo: number, reason?: string) => void;
}

import { RejectionReasonModal } from '../shared/RejectionReasonModal';

export const StagingItemsTable: React.FC<StagingItemsTableProps> = ({
    items,
    status,
    onUpdateItem,
    onRemoveItem,
    currentRole,
    onToggleRejection
}) => {
    const [showRejectedOnly, setShowRejectedOnly] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ id: number; name: string } | null>(null);

    // Helper to determine read-only state
    const isReadOnly =
        status === SheetStatus.LOCKED ||
        status === SheetStatus.STAGING_VERIFICATION_PENDING ||
        status === SheetStatus.COMPLETED;

    const canReject =
        (currentRole === Role.SHIFT_LEAD || currentRole === Role.ADMIN) &&
        status === SheetStatus.STAGING_VERIFICATION_PENDING;

    const displayItems = (
        isReadOnly && items
            ? items.filter((item) => item.skuName || item.ttlCases > 0)
            : items || []
    ).filter((item) => !showRejectedOnly || item.isRejected);

    const handleRejectClick = (item: StagingItem) => {
        if (item.isRejected) {
            onToggleRejection?.(item.srNo);
        } else {
            setSelectedItem({ id: item.srNo, name: item.skuName });
            setModalOpen(true);
        }
    };

    const confirmRejection = (reason: string) => {
        if (selectedItem) {
            onToggleRejection?.(selectedItem.id, reason);
        }
        setModalOpen(false);
        setSelectedItem(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden flex flex-col">
            <RejectionReasonModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={confirmRejection}
                itemName={selectedItem?.name}
                type="staging"
            />

            <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
                <span className="font-bold tracking-wide text-sm flex items-center gap-2">
                    <ClipboardList size={16} /> STAGING SHEET
                </span>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRejectedOnly(!showRejectedOnly)}
                        className={cn(
                            'h-7 px-2 text-xs border border-white/20 hover:bg-white/10 hover:text-white transition-colors gap-1',
                            showRejectedOnly
                                ? 'bg-red-500/20 text-red-100 border-red-500/50'
                                : 'text-slate-300'
                        )}
                    >
                        <Filter size={12} />
                        {showRejectedOnly ? 'Show All' : 'Rejected Only'}
                    </Button>
                    <span className="text-xs text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded border border-white/10">
                        {items?.length || 0} Items
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto hidden md:block rounded-b-xl">
                <table className="w-full text-sm min-w-[800px]">
                    <thead className="bg-slate-950 text-white">
                        <tr>
                            <th className="py-4 px-3 w-16 text-center font-bold text-[11px] uppercase tracking-wider text-slate-400 border-r border-slate-800">
                                Sr.No
                            </th>
                            <th className="py-4 px-3 text-left font-bold text-[11px] uppercase tracking-wider border-r border-slate-800 text-slate-200">
                                SKU Name
                            </th>
                            <th className="py-4 px-3 w-32 text-center font-bold text-[11px] uppercase tracking-wider border-r border-slate-800 text-slate-300">
                                Cases/PLT
                            </th>
                            <th className="py-4 px-3 w-32 text-center font-bold text-[11px] uppercase tracking-wider border-r border-slate-800 text-slate-300">
                                Full PLT
                            </th>
                            <th className="py-4 px-3 w-32 text-center font-bold text-[11px] uppercase tracking-wider border-r border-slate-800 text-slate-300">
                                Loose
                            </th>
                            <th className="py-4 px-3 w-32 text-center font-bold text-[11px] uppercase tracking-wider bg-indigo-950/50 border-l border-slate-800 text-indigo-200">
                                Total
                            </th>
                            {canReject && (
                                <th className="py-4 px-3 w-12 text-center font-bold text-[11px] uppercase tracking-wider">
                                    Act
                                </th>
                            )}
                            {!isReadOnly && (
                                <th className="py-4 px-3 w-12 text-center font-bold text-[11px] uppercase tracking-wider">
                                    Del
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {displayItems.map((item, index) => (
                            <tr
                                key={index}
                                className={cn(
                                    'group transition-colors',
                                    item.isRejected ? 'bg-red-50' : 'hover:bg-slate-50/80'
                                )}
                            >
                                <td className="p-2">
                                    <div
                                        className={cn(
                                            'h-8 w-8 mx-auto flex items-center justify-center rounded-full font-mono text-xs font-bold',
                                            item.isRejected
                                                ? 'bg-red-100 text-red-600'
                                                : 'bg-slate-100 text-slate-500'
                                        )}
                                    >
                                        {index + 1}
                                    </div>
                                </td>
                                <td className="p-2 border-r border-slate-100 relative">
                                    <SkuSelector
                                        value={item.skuName}
                                        onChange={(val) =>
                                            onUpdateItem(
                                                item.srNo,
                                                'skuName',
                                                val
                                            )
                                        }
                                        disabled={isReadOnly}
                                        placeholder="Select SKU..."
                                        className="bg-transparent border-transparent shadow-none hover:bg-slate-50 h-9 px-2 focus:ring-0 focus:bg-white transition-colors"
                                    />
                                    {item.rejectionReason && (
                                        <div className="absolute top-1 right-2 group-hover:opacity-100 opacity-0 transition-opacity z-10">
                                            <div className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm max-w-[150px] truncate">
                                                {item.rejectionReason}
                                            </div>
                                        </div>
                                    )}
                                    {item.isRejected && item.rejectionReason && (
                                        <div className="text-[10px] text-red-500 px-2 pb-1 italic leading-tight max-w-[250px] truncate mt-1">
                                            Reason: {item.rejectionReason}
                                        </div>
                                    )}
                                </td>
                                <td className="p-2 border-r border-slate-100">
                                    <input
                                        type="number"
                                        value={item.casesPerPlt || ''}
                                        onChange={(e) =>
                                            onUpdateItem(
                                                item.srNo,
                                                'casesPerPlt',
                                                e.target.value
                                            )
                                        }
                                        disabled={isReadOnly}
                                        className="w-full h-9 p-2 text-center bg-transparent border-2 border-transparent hover:border-slate-100 focus:bg-white focus:border-indigo-500 focus:shadow-sm rounded outline-none transition-all text-slate-700 font-bold disabled:text-slate-400"
                                    />
                                </td>
                                <td className="p-2 border-r border-slate-100">
                                    <input
                                        type="number"
                                        value={item.fullPlt || ''}
                                        onChange={(e) =>
                                            onUpdateItem(
                                                item.srNo,
                                                'fullPlt',
                                                e.target.value
                                            )
                                        }
                                        disabled={isReadOnly}
                                        className="w-full h-9 p-2 text-center bg-transparent border-2 border-transparent hover:border-slate-100 focus:bg-white focus:border-indigo-500 focus:shadow-sm rounded outline-none transition-all text-slate-700 font-bold disabled:text-slate-400"
                                    />
                                </td>
                                <td className="p-2 border-r border-slate-100">
                                    <input
                                        type="number"
                                        value={item.loose || ''}
                                        onChange={(e) =>
                                            onUpdateItem(
                                                item.srNo,
                                                'loose',
                                                e.target.value
                                            )
                                        }
                                        disabled={isReadOnly}
                                        className="w-full h-9 p-2 text-center bg-transparent border-2 border-transparent hover:border-slate-100 focus:bg-white focus:border-indigo-500 focus:shadow-sm rounded outline-none transition-all text-slate-700 font-bold disabled:text-slate-400"
                                    />
                                </td>
                                <td className="p-2 text-center font-bold text-slate-700 bg-slate-50 border-l border-slate-100">
                                    <span
                                        className={cn(
                                            'px-3 py-1 rounded-full',
                                            item.ttlCases > 0
                                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                                : 'text-slate-300'
                                        )}
                                    >
                                        {item.ttlCases || '-'}
                                    </span>
                                </td>
                                {canReject && (
                                    <td className="p-2 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRejectClick(item)}
                                            className={cn(
                                                'h-8 w-8 p-0 rounded-full transition-all',
                                                item.isRejected
                                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                    : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                                            )}
                                            title={item.rejectionReason || 'Reject Item'}
                                        >
                                            <AlertTriangle size={15} />
                                        </Button>
                                    </td>
                                )}
                                {!isReadOnly && (
                                    <td className="p-2 text-center border-l border-slate-100">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm('Delete this row?')) {
                                                    onRemoveItem(item.srNo);
                                                }
                                            }}
                                            className="h-8 w-8 p-0 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                            title="Delete Row"
                                        >
                                            <Trash2 size={15} />
                                        </Button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        <tr>
                            <td
                                colSpan={5}
                                className="p-4 text-right text-slate-500 text-xs uppercase tracking-wider"
                            >
                                Grand Total (Cases)
                            </td>
                            <td className="p-4 text-center border-l border-slate-200 bg-indigo-50/50 text-indigo-700 text-xl font-bold">
                                {items?.reduce((sum, i) => sum + (Number(i.ttlCases) || 0), 0)}
                            </td>
                            {canReject && <td />}
                            {!isReadOnly && <td />}
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Mobile Cards Placeholder - To be rendered by parent or handled here? 
                Design Choice: The parent used to render both. Let's make this component JUST the table and have another for mobile to keep clean. 
            */}
        </div >
    );
};
