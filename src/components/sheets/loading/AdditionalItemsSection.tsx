import React from 'react';
import { Plus, Camera } from 'lucide-react';
import { SheetStatus, AdditionalItem, Role } from '@/types';
import { SkuSelector } from '../shared/SkuSelector';

interface AdditionalItemsSectionProps {
    additionalItems: AdditionalItem[];
    isLocked: boolean;
    status: SheetStatus;
    totalAdditional: number;
    onItemChange: (id: number, field: string, value: string | number, index?: number) => void;
    onAddPhoto: (label: string, skuName?: string) => void;
    currentRole?: Role;
}

export const AdditionalItemsSection: React.FC<AdditionalItemsSectionProps> = ({
    additionalItems,
    isLocked,
    status,
    totalAdditional,
    onItemChange,
    onAddPhoto,
    currentRole
}) => {
    const isReadOnly =
        status === SheetStatus.COMPLETED || status === SheetStatus.LOADING_VERIFICATION_PENDING;
    const itemsToDisplay = isReadOnly
        ? (additionalItems || []).filter(
            (item) => (item.skuName && item.skuName.trim() !== '') || item.total > 0
        )
        : additionalItems || [];

    return (
        <div className="p-4 border-b border-slate-200 bg-slate-50/30">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Plus size={14} /> Additional Items (Extras)
            </h3>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[600px] text-xs border border-slate-200 bg-white">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500">
                            <th className="p-2 text-left border-r w-8">Sr.no</th>
                            <th className="p-2 text-left border-r min-w-[120px]">SKU Name</th>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <th key={i} className="p-2 text-center border-r w-8">
                                    {i + 1}
                                </th>
                            ))}
                            <th className="p-2 text-center w-12">Total</th>
                            {!isLocked && currentRole !== Role.SHIFT_LEAD && <th className="p-2 text-center w-8">Img</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {itemsToDisplay.map((item) => (
                            <tr key={item.id} className="border-t border-slate-100">
                                <td className="p-2 text-center border-r text-slate-900 font-bold">
                                    {item.id}
                                </td>
                                <td className="p-0 border-r">
                                    <SkuSelector
                                        value={item.skuName || ''}
                                        onChange={(val) => onItemChange(item.id, 'skuName', val)}
                                        disabled={isLocked}
                                        placeholder="SKU Name"
                                    />
                                </td>
                                {item.counts.map((c, idx) => (
                                    <td key={idx} className="p-0 border-r">
                                        <input
                                            type="number"
                                            className="w-full p-2 text-center outline-none text-slate-900 font-medium"
                                            value={c || ''}
                                            onChange={(e) =>
                                                onItemChange(item.id, 'count', e.target.value, idx)
                                            }
                                            disabled={isLocked}
                                        />
                                    </td>
                                ))}
                                <td className="p-2 text-center font-bold text-slate-900">
                                    {item.total}
                                </td>
                                {!isLocked && currentRole !== Role.SHIFT_LEAD && (
                                    <td className="p-2 text-center border-r">
                                        <button
                                            onClick={() => onAddPhoto("Extra Loaded", item.skuName)}
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
                                            title="Add photo for extra items"
                                        >
                                            <Camera size={14} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                            <td colSpan={12} className="p-2 text-right border-r">
                                Total Extras:
                            </td>
                            <td className="p-2 text-center">{totalAdditional}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {itemsToDisplay.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-lg p-3 space-y-3"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400">
                                EXTRA #{item.id}
                            </span>
                            <span className="text-sm font-bold text-blue-600">
                                Total: {item.total}
                                {!isLocked && currentRole !== Role.SHIFT_LEAD && (
                                    <button
                                        onClick={() => onAddPhoto("Extra Loaded", item.skuName)}
                                        className="ml-2 inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100"
                                    >
                                        <Camera size={12} /> Photo
                                    </button>
                                )}
                            </span>
                        </div>
                        <SkuSelector
                            value={item.skuName || ''}
                            onChange={(val) => onItemChange(item.id, 'skuName', val)}
                            disabled={isLocked}
                            placeholder="Select SKU Name"
                            className="text-xs bg-slate-50 p-2 rounded border border-slate-100"
                        />
                        <div className="grid grid-cols-5 gap-1">
                            {item.counts.map((c, idx) => (
                                <input
                                    key={idx}
                                    type="number"
                                    className="w-full p-1 text-center text-[10px] bg-slate-50 border border-slate-100 rounded outline-none focus:border-blue-300"
                                    value={c || ''}
                                    onChange={(e) =>
                                        onItemChange(item.id, 'count', e.target.value, idx)
                                    }
                                    disabled={isLocked}
                                    placeholder={`P${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <div className="p-3 bg-slate-100 rounded-lg flex justify-between items-center font-bold text-slate-700 text-sm">
                    <span>Total Extras</span>
                    <span>{totalAdditional}</span>
                </div>
            </div>
        </div>
    );
};
