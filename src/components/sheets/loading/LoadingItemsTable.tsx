import React, { useState } from 'react';
import { Box, AlertTriangle, Filter } from 'lucide-react';
import { SheetData, Role, SheetStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { RejectionReasonModal } from '../shared/RejectionReasonModal';

interface LoadingItemsTableProps {
    currentSheet: SheetData;
    isLocked: boolean;
    onCellChange: (skuSrNo: number, row: number, col: number, value: string) => void;
    onCellBlur: (skuSrNo: number, row: number, col: number, value: string) => void;
    onLooseChange: (skuSrNo: number, value: string) => void;
    onToggleRejection?: (skuSrNo: number, reason?: string) => void;
    currentRole?: Role;
}

export const LoadingItemsTable: React.FC<LoadingItemsTableProps> = ({
    currentSheet,
    isLocked,
    onCellChange,
    onCellBlur,
    onLooseChange,
    onToggleRejection,
    currentRole
}) => {
    const [showRejectedOnly, setShowRejectedOnly] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ id: number, name: string } | null>(null);

    const handleRejectClick = (skuSrNo: number, skuName: string) => {
        // Check if already rejected
        const item = currentSheet.loadingItems?.find(li => li.skuSrNo === skuSrNo);
        if (item?.isRejected) {
            onToggleRejection?.(skuSrNo);
        } else {
            setSelectedItem({ id: skuSrNo, name: skuName });
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

    const canReject = (currentRole === Role.SHIFT_LEAD || currentRole === Role.ADMIN) &&
        (currentSheet.status === SheetStatus.LOADING_VERIFICATION_PENDING);
    return (
        <div className="flex flex-col border-b border-slate-200">
            <RejectionReasonModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={confirmRejection}
                itemName={selectedItem?.name}
                type="loading"
            />
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Box size={14} /> LOADING SHEET
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRejectedOnly(!showRejectedOnly)}
                        className={cn(
                            "h-6 px-2 text-[10px] border border-slate-200 hover:bg-slate-50 transition-colors gap-1",
                            showRejectedOnly ? "bg-red-50 text-red-600 border-red-200" : "text-slate-500"
                        )}
                    >
                        <Filter size={10} />
                        {showRejectedOnly ? "Show All" : "Rejected"}
                    </Button>
                </div>
            </div>

            {/* Desktop View: Unified Table */}
            <div className="overflow-x-auto flex-1 custom-scrollbar hidden md:block">
                <table className="w-full text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                            <th rowSpan={2} className="p-3 text-center w-12 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 border-b">Sr.No</th>
                            {canReject && <th rowSpan={2} className="p-3 text-center w-8 sticky left-12 bg-slate-50 z-20 border-r border-slate-200 border-b">Act</th>}
                            <th rowSpan={2} className={`p-3 text-left min-w-[200px] sticky bg-slate-50 z-20 border-r border-slate-200 border-b ${canReject ? 'left-20' : 'left-12'}`}>SKU Name</th>

                            <th colSpan={4} className="p-2 text-center border-r border-b border-slate-200 text-slate-500 bg-slate-50 text-[10px] uppercase tracking-wider">STAGING QTY</th>
                            <th colSpan={13} className="p-2 text-center border-b border-slate-200 border-l-4 border-l-slate-800 text-slate-800 bg-slate-50 text-[10px] uppercase tracking-wider">LOADING QTY</th>
                        </tr>
                        <tr>
                            {/* Staging Info Header Sub-row */}
                            <th className="p-2 text-center w-20 border-r border-slate-200 text-slate-500 text-[10px] uppercase leading-tight">Cases/<br />Pallet</th>
                            <th className="p-2 text-center w-20 border-r border-slate-200 text-slate-500 text-[10px] uppercase leading-tight">Full<br />Pallets</th>
                            <th className="p-2 text-center w-20 border-r border-slate-200 text-slate-500 text-[10px] uppercase leading-tight">Loose<br />Cases</th>
                            <th className="p-2 text-center w-16 border-r border-slate-200 bg-blue-50/50 text-blue-700 text-[10px] font-bold uppercase">TOTAL</th>

                            <th className="p-2 text-center border-r border-slate-200 border-l-4 border-l-slate-800" colSpan={10}>Cells (1-10) - Enter Pallet #</th>
                            <th className="p-2 text-center w-16 border-r border-slate-200 text-[10px] uppercase">Loose</th>
                            <th className="p-2 text-center w-16 border-r border-slate-200 text-[10px] uppercase">Total</th>
                            <th className="p-2 text-center w-16 border-r border-slate-200 text-[10px] uppercase">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentSheet.loadingItems?.filter(li => !showRejectedOnly || li.isRejected).map((lItem, idx) => {
                            const sItem = currentSheet.stagingItems.find(s => s.srNo === lItem.skuSrNo);
                            if (!sItem || !sItem.skuName) return null;
                            const rowsNeeded = Math.max(1, Math.ceil(sItem.fullPlt / 10));
                            return Array.from({ length: rowsNeeded }).map((_, rIndex) => (
                                <tr key={`${lItem.skuSrNo}-${rIndex}`} className={cn(`hover:bg-blue-50/20 ${lItem.isRejected ? 'bg-red-50/50' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30')}`)}>
                                    {/* Shared Columns (Render only on first row of item) */}
                                    {rIndex === 0 && (
                                        <>
                                            <td rowSpan={rowsNeeded} className={cn("border-r border-b border-slate-200 p-3 text-center font-bold font-mono align-middle sticky left-0 z-10 w-12 text-slate-900 bg-inherit", lItem.isRejected ? "bg-red-50/90 text-red-700" : "")}>
                                                {lItem.skuSrNo}
                                            </td>
                                            {canReject && (
                                                <td rowSpan={rowsNeeded} className="border-r border-b border-slate-200 p-0 text-center align-middle sticky left-12 z-10 bg-inherit w-8">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRejectClick(lItem.skuSrNo, sItem.skuName)}
                                                        className={cn("h-6 w-6 rounded-full transition-all", lItem.isRejected ? "text-red-600 bg-red-100 hover:bg-red-200 scale-110" : "text-slate-300 hover:text-red-500 hover:bg-red-50")}
                                                    >
                                                        <AlertTriangle size={12} />
                                                    </Button>
                                                </td>
                                            )}
                                            <td rowSpan={rowsNeeded} className={cn(`border-r border-b border-slate-200 p-3 font-bold align-middle sticky z-10 bg-inherit min-w-[200px] text-slate-900 ${canReject ? 'left-20' : 'left-12'}`, lItem.isRejected ? 'text-red-700' : '')}>
                                                {sItem.skuName}
                                            </td>

                                            {/* Staging Info Columns */}
                                            <td rowSpan={rowsNeeded} className="border-r border-b border-slate-200 p-3 text-center text-slate-500">{sItem.casesPerPlt}</td>
                                            <td rowSpan={rowsNeeded} className="border-r border-b border-slate-200 p-3 text-center text-slate-500">{sItem.fullPlt}</td>
                                            <td rowSpan={rowsNeeded} className="border-r border-b border-slate-200 p-3 text-center text-slate-500">{sItem.loose}</td>
                                            <td rowSpan={rowsNeeded} className="border-r border-b border-slate-200 p-3 text-center font-bold bg-blue-50/30 text-blue-700">{sItem.ttlCases}</td>
                                        </>
                                    )}

                                    {/* Loading Cells (1-10) */}
                                    {Array.from({ length: 10 }).map((_, cIndex) => {
                                        const cellNum = rIndex * 10 + cIndex + 1;
                                        const isValid = cellNum <= sItem.fullPlt;
                                        const cell = lItem.cells.find(c => c.row === rIndex && c.col === cIndex);
                                        return (
                                            <td key={cIndex} className={`border-r border-b border-slate-100 p-0 text-center w-10 h-10 ${!isValid ? 'bg-slate-50' : ''} ${cIndex === 0 ? 'border-l-4 border-l-slate-800' : ''}`}>
                                                {isValid && (
                                                    <input
                                                        id={`cell-${lItem.skuSrNo}-${rIndex}-${cIndex}`}
                                                        type="number"
                                                        className="w-full h-full text-center outline-none bg-transparent focus:bg-blue-50 text-slate-900 font-bold disabled:bg-slate-50 disabled:text-slate-500"
                                                        value={(cell?.value !== undefined && cell.value !== 0) ? cell.value : ''}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCellChange(lItem.skuSrNo, rIndex, cIndex, e.target.value)}
                                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => onCellBlur(lItem.skuSrNo, rIndex, cIndex, e.target.value)}
                                                        disabled={isLocked}
                                                        placeholder=""
                                                    />
                                                )}
                                            </td>
                                        );
                                    })}

                                    {/* Summary Columns (RowSpan for first row only) */}
                                    {rIndex === 0 && (
                                        <>
                                            <td rowSpan={rowsNeeded} className="border-r border-b border-slate-100 p-0">
                                                <input
                                                    type="number"
                                                    placeholder=""
                                                    className="w-full h-full text-center outline-none bg-transparent focus:bg-blue-50 text-slate-900 font-medium disabled:bg-slate-50 disabled:text-slate-500"
                                                    value={lItem.looseInput !== undefined ? lItem.looseInput : ''}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onLooseChange(lItem.skuSrNo, e.target.value)}
                                                    disabled={isLocked}
                                                />
                                            </td>
                                            <td rowSpan={rowsNeeded} className="border-r border-b border-slate-100 p-3 text-center font-bold text-slate-900">{lItem.total}</td>
                                            <td rowSpan={rowsNeeded} className={`border-b border-slate-100 p-3 text-center font-bold ${lItem.balance !== 0 ? 'text-red-600' : 'text-green-600'}`}>{lItem.balance}</td>
                                        </>
                                    )}
                                </tr>
                            ));
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View (Loading) */}
            <div className="md:hidden divide-y divide-slate-100">
                {currentSheet.loadingItems?.map((lItem, idx) => {
                    const sItem = currentSheet.stagingItems.find(s => s.srNo === lItem.skuSrNo);
                    if (!sItem || !sItem.skuName) return null;
                    const rowsNeeded = Math.max(1, Math.ceil(sItem.fullPlt / 10));

                    return Array.from({ length: rowsNeeded }).map((_, rIndex) => (
                        <div key={`${lItem.skuSrNo}-${rIndex}`} className={`p-4 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">ITEM #{lItem.skuSrNo} {rowsNeeded > 1 && `(Row ${rIndex + 1})`}</div>
                                    <div className="text-sm font-bold text-slate-800 line-clamp-2">{sItem.skuName}</div>
                                </div>
                                {rIndex === 0 && (
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Balance</div>
                                        <div className={`text-sm font-bold ${lItem.balance === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                            {lItem.balance}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-5 gap-1 mb-3">
                                {Array.from({ length: 10 }).map((_, cIdx) => {
                                    const cell = lItem.cells.find(c => c.row === rIndex && c.col === cIdx);
                                    return (
                                        <div key={cIdx} className="space-y-0.5">
                                            <div className="text-[8px] text-center text-slate-400 font-bold">{rIndex * 10 + cIdx + 1}</div>
                                            <input
                                                type="text"
                                                value={cell?.value || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCellChange(lItem.skuSrNo, rIndex, cIdx, e.target.value)}
                                                disabled={isLocked}
                                                className="w-full p-1 text-center text-[10px] bg-white border border-slate-200 rounded focus:border-blue-300 outline-none"
                                                placeholder="P#"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {rIndex === rowsNeeded - 1 && (
                                <div className="flex justify-between items-center gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Loose</label>
                                        <input
                                            type="number"
                                            value={lItem.looseInput || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onLooseChange(lItem.skuSrNo, e.target.value)}
                                            disabled={isLocked}
                                            className="w-full p-1.5 text-xs bg-amber-50/50 border border-amber-100 rounded outline-none"
                                        />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total Loaded</div>
                                        <div className="text-lg font-black text-slate-900">{lItem.total}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ));
                })}
            </div>
        </div>
    );
};
