import { StagingItem, SheetStatus } from '@/types';
import { SkuSelector } from '../shared/SkuSelector';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StagingMobileCardsProps {
    items: StagingItem[];
    status: SheetStatus;
    onUpdateItem: (index: number, field: keyof StagingItem, value: string | number) => void;
    onRemoveItem: (index: number) => void;
}

export const StagingMobileCards: React.FC<StagingMobileCardsProps> = ({
    items,
    status,
    onUpdateItem,
    onRemoveItem
}) => {
    // Helper to determine read-only state
    const isReadOnly =
        status === SheetStatus.LOCKED ||
        status === SheetStatus.STAGING_VERIFICATION_PENDING ||
        status === SheetStatus.COMPLETED;

    const displayItems =
        isReadOnly && items
            ? items.filter((item) => item.skuName || item.ttlCases > 0)
            : items || [];

    return (
        <div className="md:hidden border-t border-slate-200">
            <div className="divide-y divide-slate-100">
                {displayItems.map((item, index) => (
                    <div key={index} className="p-4 bg-white space-y-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                                ITEM #{isReadOnly ? index + 1 : item.srNo}
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="text-blue-700 font-bold flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                                        Total:
                                    </span>
                                    <span className="text-lg leading-none">{item.ttlCases || 0}</span>
                                </div>
                                {!isReadOnly && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm('Delete this row?')) {
                                                onRemoveItem(item.srNo);
                                            }
                                        }}
                                        className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <SkuSelector
                            value={item.skuName}
                            onChange={(val) =>
                                onUpdateItem(item.srNo, 'skuName', val)
                            }
                            disabled={isReadOnly}
                            placeholder="Select SKU Description"
                            className="text-sm bg-slate-50/50 p-3 rounded-lg border border-slate-200"
                        />

                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 uppercase font-bold px-1">
                                    Cs/Plt
                                </label>
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
                                    className="w-full p-2 text-center bg-slate-50/50 rounded-lg border border-slate-200 outline-none text-sm transition-all focus:border-blue-300 focus:bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 uppercase font-bold px-1">
                                    Full Plt
                                </label>
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
                                    className="w-full p-2 text-center bg-slate-50/50 rounded-lg border border-slate-200 outline-none text-sm transition-all focus:border-blue-300 focus:bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 uppercase font-bold px-1 text-amber-600">
                                    Loose
                                </label>
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
                                    className="w-full p-2 text-center bg-amber-50/50 rounded-lg border border-amber-200 outline-none text-sm transition-all focus:border-amber-300 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Mobile Grand Total Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Grand Total
                </span>
                <div className="text-2xl font-black text-blue-700">
                    {items?.reduce((sum, i) => sum + (Number(i.ttlCases) || 0), 0)}
                </div>
            </div>
        </div>
    );
};
