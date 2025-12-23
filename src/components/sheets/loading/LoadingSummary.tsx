import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { SheetData, LoadingItem, AdditionalItem } from '@/types';

interface LoadingSummaryProps {
    totalStaging: number;
    grandTotalLoaded: number;
    balance: number;
    remarks: string;
    onRemarksChange: (value: string) => void;
    isLocked: boolean;
    returnedItems: LoadingItem[];
    overLoadedItems: LoadingItem[];
    extraItemsWithQty: AdditionalItem[];
    currentSheet: SheetData;
}

export const LoadingSummary: React.FC<LoadingSummaryProps> = ({
    totalStaging,
    grandTotalLoaded,
    balance,
    remarks,
    onRemarksChange,
    isLocked,
    returnedItems,
    overLoadedItems,
    extraItemsWithQty,
    currentSheet
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
            <div className="p-4 md:p-6 border-r border-slate-200 bg-slate-50/30">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-4">Summary Totals</h3>
                <table className="w-full text-sm">
                    <tbody>
                        <tr className="border-b border-slate-200 border-dashed">
                            <td className="py-2.5 text-slate-500">Total Staging Qty</td>
                            <td className="py-2.5 text-right font-medium text-slate-800">{totalStaging}</td>
                        </tr>
                        <tr className="border-b border-slate-200 border-dashed">
                            <td className="py-2.5 text-slate-500">Total Loaded Cases (Main + Extras)</td>
                            <td className="py-2.5 text-right font-bold text-blue-600">{grandTotalLoaded}</td>
                        </tr>
                        <tr>
                            <td className="py-2.5 text-slate-500">Balance to be Returned</td>
                            <td className={`py-2.5 text-right font-bold ${balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {balance}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="p-4 md:p-6 bg-amber-50/20">
                <label className="block text-[10px] font-bold text-amber-600/80 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-500" /> Remarks & Adjustments
                </label>

                <div className="mb-3 space-y-1">
                    {returnedItems.map((item, idx) => (
                        <div key={`ret-${idx}`} className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                            For <strong>{currentSheet.stagingItems.find(s => s.srNo === item.skuSrNo)?.skuName}</strong> {item.balance} loose returned.
                        </div>
                    ))}
                    {overLoadedItems.map((item, idx) => (
                        <div key={`ol-${idx}`} className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                            For <strong>{currentSheet.stagingItems.find(s => s.srNo === item.skuSrNo)?.skuName}</strong> {Math.abs(item.balance)} Cases Extra loaded.
                        </div>
                    ))}
                    {extraItemsWithQty.map((item, idx) => (
                        <div key={`ext-${idx}`} className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                            For <strong>{item.skuName}</strong> {item.total} Cases Extra (Additional) loaded.
                        </div>
                    ))}
                </div>

                <textarea
                    className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm outline-none bg-white focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Enter other remarks regarding shortage/excess..."
                    value={remarks}
                    onChange={e => onRemarksChange(e.target.value)}
                    disabled={isLocked}
                />
            </div>
        </div>
    );
};
