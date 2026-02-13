import { SheetData, LoadingItem, AdditionalItem } from '@/types';
import { calculateTotals, generateLists } from './sheetCalculations';

interface HeaderState {
    transporter?: string;
    loadingDock?: string;
    shift?: string;
    destination?: string;
    vehicleNo?: string;
    driverName?: string;
    sealNo?: string;
}

interface CapturedImage {
    caption: string;
    [key: string]: unknown;
}

interface SignatureState {
    svName?: string;
    svSign?: string;
    deoSign?: string;
    capturedImages?: (string | CapturedImage)[];
}

/**
 * Validates if the sheet is complete and ready for submission.
 */
export const validateSheetCompleteness = (
    sheet: SheetData | null,
    headerState: HeaderState,
    signatureState: SignatureState
) => {
    if (!sheet) return false;

    const totals = calculateTotals(sheet);
    const lists = generateLists(sheet);

    // 1. Header Validation
    const hasHeader =
        headerState.transporter?.trim() &&
        headerState.loadingDock?.trim() &&
        headerState.shift?.trim() &&
        headerState.destination?.trim() &&
        headerState.vehicleNo?.trim() &&
        headerState.driverName?.trim() &&
        headerState.sealNo?.trim();

    // 2. Items Validation
    const hasItems = totals.grandTotalLoaded > 0;

    // 3. Signature Validation
    const hasSignatures =
        signatureState.svName?.trim() &&
        signatureState.svSign?.trim() &&
        signatureState.deoSign?.trim();

    // 4. Photo Validation
    const images = signatureState.capturedImages || [];
    const hasEvidence = images.some((img) => typeof img !== 'string' && img.caption === 'Evidence');

    const needsLoose = lists.returnedItems.length > 0;
    const hasLoose = !needsLoose || images.some((img) => typeof img !== 'string' && img.caption.includes('Loose Returned'));

    const needsExtra = lists.overLoadedItems.length > 0 || lists.extraItemsWithQty.length > 0;
    const hasExtra = !needsExtra || images.some((img) => typeof img !== 'string' && img.caption.includes('Extra Loaded'));

    return !!(hasHeader && hasItems && hasSignatures && hasEvidence && hasLoose && hasExtra);
};

interface ValidationLists {
    returnedItems: (LoadingItem & { skuName: string })[];
    overLoadedItems: LoadingItem[];
    extraItemsWithQty: AdditionalItem[];
}

/**
 * Performs strict validation before submission and returns an error message if invalid.
 */
export const getSubmissionValidationError = (
    sheet: SheetData | null,
    headerState: HeaderState,
    signatureState: SignatureState,
    lists: ValidationLists
) => {
    if (!sheet) return 'No sheet loaded';

    // 1. Header Checks
    const missingHeaders: string[] = [];
    if (!headerState.shift?.trim()) missingHeaders.push('Shift');
    if (!headerState.destination?.trim()) missingHeaders.push('Destination');
    if (!headerState.loadingDock?.trim()) missingHeaders.push('Loading Dock');
    if (!headerState.transporter?.trim()) missingHeaders.push('Transporter');
    if (!headerState.vehicleNo?.trim()) missingHeaders.push('Vehicle No');
    if (!headerState.driverName?.trim()) missingHeaders.push('Driver Name');
    if (!headerState.sealNo?.trim()) missingHeaders.push('Seal No');

    if (missingHeaders.length > 0) {
        return `Missing Header Details: ${missingHeaders.join(', ')}`;
    }

    // 2. Items Check
    const totals = calculateTotals(sheet);
    if (totals.grandTotalLoaded <= 0) {
        return 'Sheet must have at least one loaded item';
    }

    // 3. Signature Validation
    if (!signatureState.svName?.trim()) return 'Supervisor Name is required';
    if (!signatureState.svSign?.trim()) return 'Supervisor Signature is required';
    if (!signatureState.deoSign?.trim()) return 'DEO Signature is required';

    // 4. Photo Validation
    const images = signatureState.capturedImages || [];
    const hasEvidence = images.some((img) => typeof img !== 'string' && img.caption === 'Evidence');
    const hasLoose = images.some((img) => typeof img !== 'string' && img.caption.includes('Loose Returned'));
    const hasExtra = images.some((img) => typeof img !== 'string' && img.caption.includes('Extra Loaded'));

    const needsLoose = lists.returnedItems.length > 0;
    const needsExtra = lists.overLoadedItems.length > 0 || lists.extraItemsWithQty.length > 0;

    if (!hasEvidence) return 'Missing Photo: Evidence (Required)';
    if (needsLoose && !hasLoose) return 'Missing Photo: Loose Returned Items';
    if (needsExtra && !hasExtra) return 'Missing Photo: Extra Loaded Items';

    return null;
};

/**
 * Validates Staging Sheet before requesting verification.
 */
export const getStagingValidationError = (sheet: Partial<SheetData>) => {
    const missing: string[] = [];
    if (!sheet.shift?.trim()) missing.push('Shift');
    if (!sheet.destination?.trim()) missing.push('Destination');
    if (!sheet.loadingDockNo?.trim()) missing.push('Loading Dock');

    if (missing.length > 0) {
        return `Missing Mandatory Fields: ${missing.join(', ')}`;
    }

    const hasItems = sheet.stagingItems?.some(i => i.ttlCases > 0);
    if (!hasItems) {
        return 'Staging Sheet must have at least one item with quantity';
    }

    return null;
};
