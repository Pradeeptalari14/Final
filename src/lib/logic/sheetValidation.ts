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
    signatureState: SignatureState,
    lists: ValidationLists
) => {
    if (!sheet) return 'No sheet loaded';

    if (!signatureState.svName || signatureState.svName.trim() === '') {
        return 'Supervisor Name is required to complete the sheet';
    }

    const images = signatureState.capturedImages || [];
    const hasEvidence = images.some((img) => typeof img !== 'string' && img.caption === 'Evidence');
    const hasLoose = images.some((img) => typeof img !== 'string' && img.caption === 'Loose Returned');
    const hasExtra = images.some((img) => typeof img !== 'string' && img.caption === 'Extra Loaded');

    const needsLoose = lists.returnedItems.length > 0;
    const needsExtra = lists.overLoadedItems.length > 0 || lists.extraItemsWithQty.length > 0;

    if (!hasEvidence) return 'Missing Evidence Photo for the total sheet';
    if (needsLoose && !hasLoose) return 'Missing Evidence Photo for Loose Returned items';
    if (needsExtra && !hasExtra) return 'Missing Evidence Photo for Extra Loaded items';

    return null;
};
