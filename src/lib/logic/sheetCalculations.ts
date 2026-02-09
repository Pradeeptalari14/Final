import { SheetData } from '@/types';

/**
 * Pure logic for calculating sheet totals.
 */
export const calculateTotals = (sheet: SheetData | null) => {
    if (!sheet) {
        return {
            totalLoadedMain: 0,
            totalAdditional: 0,
            grandTotalLoaded: 0,
            totalStaging: 0,
            balance: 0
        };
    }

    const totalLoadedMain = sheet.loadingItems?.reduce((acc, li) => acc + li.total, 0) || 0;
    const totalAdditional = sheet.additionalItems?.reduce((acc, ai) => acc + ai.total, 0) || 0;
    const grandTotalLoaded = totalLoadedMain + totalAdditional;
    const totalStaging = sheet.stagingItems.reduce((acc, si) => acc + si.ttlCases, 0);
    const balance = sheet.loadingItems?.reduce((acc, li) => acc + Math.max(0, li.balance), 0) || 0;

    return { totalLoadedMain, totalAdditional, grandTotalLoaded, totalStaging, balance };
};

/**
 * Pure logic for generating derived lists from sheet data.
 */
export const generateLists = (sheet: SheetData | null) => {
    if (!sheet) {
        return {
            extraItemsWithQty: [],
            returnedItems: [],
            overLoadedItems: [],
            displayedStagingItems: []
        };
    }

    const extraItemsWithQty = (sheet.additionalItems || []).filter(
        (item) => item.total > 0 && item.skuName
    );

    const returnedItems = (sheet.loadingItems || [])
        .filter((li) => li.balance > 0)
        .map(li => ({
            ...li,
            skuName: sheet.stagingItems.find(si => si.srNo === li.skuSrNo)?.skuName || 'Unknown SKU'
        }));

    const overLoadedItems = sheet.loadingItems?.filter((li) => li.balance < 0) || [];

    const displayedStagingItems = sheet.stagingItems.filter(
        (i) => i.skuName && i.skuName.trim() !== ''
    );

    return { extraItemsWithQty, returnedItems, overLoadedItems, displayedStagingItems };
};

/**
 * Calculates total cases for a staging item.
 */
export const calculateStagingItemTotal = (casesPerPlt: number, fullPlt: number, loose: number) => {
    return (Number(casesPerPlt) || 0) * (Number(fullPlt) || 0) + (Number(loose) || 0);
};
