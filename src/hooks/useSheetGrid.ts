import { useState } from 'react';
import { SheetData } from '@/types';

export const useSheetGrid = (
    currentSheet: SheetData | null,
    setCurrentSheet: React.Dispatch<React.SetStateAction<SheetData | null>>
) => {
    const [validationError, setValidationError] = useState<{
        title: string;
        message: string;
        onAck: () => void;
    } | null>(null);

    const generateLoadingItems = (sheet: SheetData) => {
        const updatedLoadingItems = sheet.stagingItems
            .filter((item) => item.skuName && item.ttlCases > 0)
            .map((item) => ({
                skuSrNo: item.srNo,
                cells: [],
                looseInput: undefined,
                total: 0,
                balance: item.ttlCases
            }));

        const updatedAdditionalItems =
            sheet.additionalItems && sheet.additionalItems.length > 0
                ? sheet.additionalItems
                : Array.from({ length: 5 }, (_, i) => ({
                    id: i + 1,
                    skuName: '',
                    counts: Array(10).fill(0),
                    total: 0
                }));

        setCurrentSheet((prev) =>
            prev
                ? {
                    ...prev,
                    loadingItems: updatedLoadingItems,
                    additionalItems: updatedAdditionalItems
                }
                : null
        );
    };

    const handleLoadingCellChange = (skuSrNo: number, row: number, col: number, val: string) => {
        if (!currentSheet) return;
        const value = val === '' ? 0 : parseInt(val);
        if (isNaN(value)) return;
        const stagingItem = currentSheet.stagingItems.find((s) => s.srNo === skuSrNo);
        const safeLoadingItems = currentSheet.loadingItems || [];

        const updatedLoadingItems = safeLoadingItems.map((li) => {
            if (li.skuSrNo !== skuSrNo) return li;
            const existingCellIndex = (li.cells || []).findIndex((c) => c.row === row && c.col === col);
            const newCells = [...(li.cells || [])];
            if (existingCellIndex >= 0) {
                newCells[existingCellIndex] = { row, col, value };
            } else {
                newCells.push({ row, col, value });
            }
            const cellSum = newCells.reduce((acc, c) => acc + c.value, 0);
            const total = cellSum + (li.looseInput || 0);
            const totalCases = stagingItem?.ttlCases || 0;
            const balance = totalCases - total;
            return { ...li, cells: newCells, total, balance };
        });
        setCurrentSheet((prev) => (prev ? { ...prev, loadingItems: updatedLoadingItems } : null));
    };

    const handleCellBlur = (skuSrNo: number, row: number, col: number, val: string) => {
        if (!val || val === '') return;
        const value = parseInt(val);
        const stagingItem = currentSheet?.stagingItems.find((s) => s.srNo === skuSrNo);
        if (
            stagingItem &&
            Number(stagingItem.casesPerPlt) > 0 &&
            value !== Number(stagingItem.casesPerPlt)
        ) {
            // Trigger custom modal instead of native alert
            setValidationError({
                title: 'INCORRECT QUANTITY!',
                message: `Allowed: ${stagingItem.casesPerPlt}\nEntered: ${value}\n\nThe value must match the standard Cases/Pallet.`,
                onAck: () => {
                    // Strictly clear the invalid value
                    handleLoadingCellChange(skuSrNo, row, col, '');

                    // Force refocus on the specific cell to prevent leaving
                    setTimeout(() => {
                        const element = document.getElementById(`cell-${skuSrNo}-${row}-${col}`);
                        if (element) {
                            element.focus();
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (element as any).select?.();
                        }
                    }, 100);
                }
            });
        }
    };

    const handleLooseChange = (skuSrNo: number, val: string) => {
        if (!currentSheet) return;
        const value = val === '' ? undefined : parseInt(val);
        if (value !== undefined && isNaN(value)) return;
        const stagingItem = currentSheet.stagingItems.find((s) => s.srNo === skuSrNo);

        const updatedLoadingItems = (currentSheet.loadingItems || []).map((li) => {
            if (li.skuSrNo !== skuSrNo) return li;
            const cellSum = (li.cells || []).reduce((acc, c) => acc + c.value, 0);
            const total = cellSum + (value || 0);
            const totalCases = stagingItem?.ttlCases || 0;
            const balance = totalCases - total;
            return { ...li, looseInput: value, total, balance };
        });
        setCurrentSheet((prev) => (prev ? { ...prev, loadingItems: updatedLoadingItems } : null));
    };

    const handleAdditionalChange = (id: number, field: string, value: string | number, colIndex?: number) => {
        if (!currentSheet) return;
        const updatedAdditional = (currentSheet.additionalItems || []).map((item) => {
            if (item.id !== id) return item;
            if (field === 'skuName') {
                return { ...item, skuName: String(value) };
            } else if (field === 'count' && colIndex !== undefined) {
                const newCounts = [...item.counts];
                newCounts[colIndex] = value === '' ? 0 : parseInt(String(value)) || 0;
                const newTotal = newCounts.reduce((sum, v) => sum + v, 0);
                return { ...item, counts: newCounts, total: newTotal };
            }
            return item;
        });
        setCurrentSheet((prev) => (prev ? { ...prev, additionalItems: updatedAdditional } : null));
    };

    const handleToggleRejection = (skuSrNo: number, reason?: string) => {
        if (!currentSheet) return;
        const updatedLoadingItems = (currentSheet.loadingItems || []).map((li) => {
            if (li.skuSrNo !== skuSrNo) return li;
            return {
                ...li,
                isRejected: !li.isRejected,
                rejectionReason: !li.isRejected ? reason : undefined
            };
        });
        setCurrentSheet((prev) => (prev ? { ...prev, loadingItems: updatedLoadingItems } : null));
    };

    return {
        validationError,
        dismissValidationError: () => {
            if (validationError?.onAck) {
                validationError.onAck();
            }
            setValidationError(null);
        },
        handlers: {
            generateLoadingItems,
            handleLoadingCellChange,
            handleCellBlur,
            handleLooseChange,
            handleAdditionalChange,
            handleToggleRejection
        }
    };
};
