import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { SheetData, SheetStatus, Role } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useSheetHeader } from './useSheetHeader';
import { useSheetGrid } from './useSheetGrid';
import { useSheetSignatures } from './useSheetSignatures';

export const useLoadingSheetLogic = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        sheets,
        refreshSheets,
        fetchSheetById,
        updateSheet,
        currentUser,
        users,
        loading: dataLoading
    } = useData();
    const { addToast } = useToast();
    const [currentSheet, setCurrentSheet] = useState<SheetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [errors] = useState<string[]>([]);
    const isDirty = useRef(false);
    const prevId = useRef(id);

    // Reset dirty state if navigating to a different sheet
    useEffect(() => {
        if (id !== prevId.current) {
            isDirty.current = false;
            prevId.current = id;
        }
    }, [id]);

    // --- Sub-Hooks ---
    const { headerState, handleHeaderChange } = useSheetHeader(currentSheet, currentUser, users);

    // Wrap setCurrentSheet to track dirty state
    const setSheetData = (data: React.SetStateAction<SheetData | null>) => {
        setCurrentSheet(data);
        isDirty.current = true;
    };

    const {
        validationError,
        dismissValidationError,
        handlers: gridHandlers
    } = useSheetGrid(currentSheet, setSheetData);
    const { signatureState, camera } = useSheetSignatures(currentSheet, currentUser);

    const { setEndTime } = headerState; // Exposed setter for submit logic

    // --- Initial Data Load ---
    useEffect(() => {
        if (!id) return;

        const loadSheet = async () => {
            // Already loaded this sheet? Don't overwrite to avoid resetting sub-hook states
            if (currentSheet && currentSheet.id === id) {
                return;
            }

            // CRITICAL: If we have local unsaved changes, DO NOT let background sync overwrite them
            if (isDirty.current) {
                return;
            }

            setLoading(true);

            const foundInCache = sheets.find((s) => s.id === id);

            if (foundInCache) {
                setCurrentSheet(foundInCache);
                setLoading(false);
                return;
            }

            // 2. Fallback to direct fetch
            const fetched = await fetchSheetById(id);
            if (fetched) {
                setCurrentSheet(fetched);
            } else {
                // 3. Fallback to refreshing all if direct fetch failed
                if (!dataLoading) {
                    await refreshSheets();
                }
            }
            setLoading(false);
        };

        loadSheet();
    }, [id, sheets, dataLoading, refreshSheets, fetchSheetById, currentSheet]);

    // --- Role-based Redirect ---
    useEffect(() => {
        if (!currentSheet || !currentUser) return;
        const isStagingUser = currentUser.role === Role.STAGING_SUPERVISOR;
        if (
            isStagingUser &&
            (currentSheet.status === SheetStatus.DRAFT ||
                currentSheet.status === SheetStatus.STAGING_VERIFICATION_PENDING)
        ) {
            navigate(`/sheets/staging/${currentSheet.id}`, { replace: true });
        }
    }, [currentSheet, currentUser, navigate]);

    // Initial Grid Generation if needed
    useEffect(() => {
        if (!currentSheet) return;
        const hasStagingData = currentSheet.stagingItems.some((i) => i.ttlCases > 0);
        const hasLoadingData = currentSheet.loadingItems && currentSheet.loadingItems.length > 0;
        const hasAdditionalData =
            currentSheet.additionalItems && currentSheet.additionalItems.length > 0;

        if (hasStagingData && (!hasLoadingData || !hasAdditionalData)) {
            queueMicrotask(() => gridHandlers.generateLoadingItems(currentSheet));
        }
    }, [currentSheet, gridHandlers]);

    // --- High-Level Actions (Save, Submit, Verify) ---

    // Derived Helper: Build Sheet Object from State
    const buildSheetData = (status: SheetStatus): SheetData => {
        if (!currentSheet) throw new Error('No sheet');
        return {
            ...currentSheet,
            status,
            shift: headerState.shift,
            destination: headerState.destination,
            supervisorName: headerState.supervisorName,
            empCode: headerState.empCode,
            transporter: headerState.transporter,
            loadingDockNo: headerState.loadingDock,
            loadingStartTime: headerState.startTime,
            loadingEndTime: headerState.endTime,
            pickingBy: headerState.pickingBy,
            pickingByEmpCode: headerState.pickingByEmpCode,
            pickingCrosscheckedBy: headerState.pickingCrosscheckedBy,
            pickingCrosscheckedByEmpCode: headerState.pickingCrosscheckedByEmpCode,
            vehicleNo: headerState.vehicleNo,
            driverName: headerState.driverName,
            sealNo: headerState.sealNo,
            regSerialNo: headerState.regSerialNo,
            loadingSvName: signatureState.svName,
            loadingSupervisorSign: signatureState.svSign,
            slSign: signatureState.slSign,
            deoSign: signatureState.deoSign,
            capturedImages: signatureState.capturedImages || [],
            completedBy: status === SheetStatus.COMPLETED ? currentUser?.username : undefined,
            completedAt: status === SheetStatus.COMPLETED ? new Date().toISOString() : undefined,
            comments: signatureState.remarks
                ? [
                    ...(currentSheet.comments || []),
                    {
                        id: Date.now().toString(),
                        author: currentUser?.username || 'User',
                        text: signatureState.remarks,
                        timestamp: new Date().toISOString()
                    }
                ]
                : currentSheet.comments || []
        };
    };

    const handleSaveProgress = async () => {
        if (!currentSheet || actionLoading) return;
        setActionLoading(true);
        try {
            const data = buildSheetData(currentSheet.status);
            const hasStartedLog = currentSheet.history?.some((h) => h.action === 'LOADING_STARTED');
            if (!hasStartedLog && data.loadingStartTime) {
                data.history = [
                    ...(data.history || []),
                    {
                        id: Date.now().toString(),
                        actor: currentUser?.username || 'Unknown',
                        action: 'LOADING_STARTED',
                        timestamp: new Date().toISOString(),
                        details: 'Loading Process Started'
                    }
                ];
            }
            await updateSheet(data);
            isDirty.current = false;
            addToast('success', 'Progress saved successfully');
        } catch (e) {
            console.error(e);
            addToast('error', 'Failed to save progress');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!currentSheet || actionLoading) return;
        if (!signatureState.svName || signatureState.svName.trim() === '') {
            addToast('error', 'Supervisor Name is required to complete the sheet');
            return;
        }

        // Strict Photo Validation
        const images = signatureState.capturedImages || [];
        const hasEvidence = images.some(img => typeof img !== 'string' && img.caption === 'Evidence');
        const hasLoose = images.some(img => typeof img !== 'string' && img.caption === 'Loose Returned');
        const hasExtra = images.some(img => typeof img !== 'string' && img.caption === 'Extra Loaded');

        const needsLoose = lists.returnedItems.length > 0;
        const needsExtra = lists.overLoadedItems.length > 0 || lists.extraItemsWithQty.length > 0;

        if (!hasEvidence) {
            addToast('error', 'Missing Evidence Photo for the total sheet');
            return;
        }
        if (needsLoose && !hasLoose) {
            addToast('error', 'Missing Evidence Photo for Loose Returned items');
            return;
        }
        if (needsExtra && !hasExtra) {
            addToast('error', 'Missing Evidence Photo for Extra Loaded items');
            return;
        }
        setActionLoading(true);
        const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setEndTime(timeNow); // Update local hook state
        const tempSheet = buildSheetData(SheetStatus.LOADING_VERIFICATION_PENDING);

        // Override buildSheetData result with definitive submission time
        const finalSheet = {
            ...tempSheet,
            loadingEndTime: timeNow,
            rejectionReason: undefined,
            history: [
                ...(currentSheet.history || []),
                {
                    id: Date.now().toString(),
                    actor: currentUser?.username || 'Unknown',
                    action: 'LOADING_SUBMITTED',
                    timestamp: new Date().toISOString(),
                    details: 'Submitted for Final Verification'
                }
            ]
        };
        try {
            await updateSheet(finalSheet);
            setCurrentSheet(finalSheet);
            isDirty.current = false;
            addToast('success', 'Submitted for final verification');
            navigate('/database');
        } catch (e) {
            console.error(e);
            addToast('error', 'Failed to submit');
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerificationAction = async (approve: boolean, reason?: string) => {
        if (!currentSheet || actionLoading) return;
        setActionLoading(true);
        try {
            if (approve) {
                const finalSheet: SheetData = {
                    ...currentSheet,
                    status: SheetStatus.COMPLETED,
                    loadingApprovedBy: currentUser?.username,
                    loadingApprovedAt: new Date().toISOString(),
                    loadingEndTime:
                        currentSheet.loadingEndTime ||
                        new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    slSign: currentUser?.fullName,
                    completedBy: currentUser?.username,
                    completedAt: new Date().toISOString(),
                    history: [
                        ...(currentSheet.history || []),
                        {
                            id: Date.now().toString(),
                            actor: currentUser?.username || 'Unknown',
                            action: 'COMPLETED',
                            timestamp: new Date().toISOString(),
                            details: 'Final Approval Granted - Dispatched'
                        }
                    ]
                };
                await updateSheet(finalSheet);
                setCurrentSheet(finalSheet);
                addToast('success', 'Sheet approved and completed');
                navigate('/database');
            } else {
                if (reason) {
                    const rejectedSheet: SheetData = {
                        ...currentSheet,
                        status: SheetStatus.LOCKED,
                        rejectionReason: reason,
                        comments: [
                            ...(currentSheet.comments || []),
                            {
                                id: Date.now().toString(),
                                author: currentUser?.username || 'Shift Lead',
                                text: `REJECTED: ${reason}`,
                                timestamp: new Date().toISOString()
                            }
                        ],
                        history: [
                            ...(currentSheet.history || []),
                            {
                                id: Date.now().toString(),
                                actor: currentUser?.username || 'Unknown',
                                action: 'REJECTED_LOADING',
                                timestamp: new Date().toISOString(),
                                details: `Rejected: ${reason}`
                            }
                        ]
                    };
                    await updateSheet(rejectedSheet);
                    setCurrentSheet(rejectedSheet);
                    addToast('error', 'Sheet rejected');
                    navigate('/database');
                }
            }
        } catch (e) {
            console.error(e);
            addToast('error', 'Failed to perform verification action');
        } finally {
            setActionLoading(false);
        }
    };

    // --- Computed States (Totals, Lists, Access) ---
    const totals = useMemo(() => {
        if (!currentSheet)
            return {
                totalLoadedMain: 0,
                totalAdditional: 0,
                grandTotalLoaded: 0,
                totalStaging: 0,
                balance: 0
            };
        const totalLoadedMain =
            currentSheet.loadingItems?.reduce((acc, li) => acc + li.total, 0) || 0;
        const totalAdditional =
            currentSheet.additionalItems?.reduce((acc, ai) => acc + ai.total, 0) || 0;
        const grandTotalLoaded = totalLoadedMain + totalAdditional;
        const totalStaging = currentSheet.stagingItems.reduce((acc, si) => acc + si.ttlCases, 0);
        const balance =
            currentSheet.loadingItems?.reduce((acc, li) => acc + Math.max(0, li.balance), 0) || 0;
        return { totalLoadedMain, totalAdditional, grandTotalLoaded, totalStaging, balance };
    }, [currentSheet]);

    const lists = useMemo(() => {
        if (!currentSheet)
            return {
                extraItemsWithQty: [],
                returnedItems: [],
                overLoadedItems: [],
                displayedStagingItems: []
            };
        const extraItemsWithQty = (currentSheet.additionalItems || []).filter(
            (item) => item.total > 0 && item.skuName
        );
        const returnedItems = (currentSheet.loadingItems || [])
            .filter((li) => li.balance > 0)
            .map(li => ({
                ...li,
                skuName: currentSheet.stagingItems.find(si => si.srNo === li.skuSrNo)?.skuName || 'Unknown SKU'
            }));
        const overLoadedItems = currentSheet.loadingItems?.filter((li) => li.balance < 0) || [];
        const displayedStagingItems = currentSheet.stagingItems.filter(
            (i) => i.skuName && i.skuName.trim() !== ''
        );
        return { extraItemsWithQty, returnedItems, overLoadedItems, displayedStagingItems };
    }, [currentSheet]);

    const isDataComplete = useMemo(() => {
        if (!currentSheet) return false;
        // Relaxed complete check: As long as something is loaded, we allow submission.
        // Discrepancies (Returns/Overloads) are warnings, not blockers.
        return totals.grandTotalLoaded > 0 || currentSheet.stagingItems.length === 0;
    }, [currentSheet, totals.grandTotalLoaded]);

    const states = {
        isCompleted: currentSheet?.status === SheetStatus.COMPLETED,
        isPendingVerification: currentSheet?.status === SheetStatus.LOADING_VERIFICATION_PENDING,
        isDataComplete,
        isPhotoComplete: true, // Unblock button to allow click-validation feedback
        isLocked:
            currentSheet?.status === SheetStatus.COMPLETED ||
            (currentSheet?.status === SheetStatus.LOADING_VERIFICATION_PENDING &&
                currentUser?.role !== Role.ADMIN &&
                currentUser?.role !== Role.SHIFT_LEAD)
    };

    return {
        id,
        currentSheet,
        loading,
        actionLoading,
        currentUser,
        states,
        errors,
        validationError,
        dismissValidationError,
        header: headerState,
        footer: signatureState,
        camera,
        totals,
        lists,
        handlers: {
            handleHeaderChange,
            ...gridHandlers,
            handleSaveProgress,
            handleSubmit,
            handleVerificationAction,
            refreshSheets,
            setRemarks: signatureState.setRemarks,
            setSvName: signatureState.setSvName,
            setSvSign: signatureState.setSvSign,
            setSlSign: signatureState.setSlSign,
            setDeoSign: signatureState.setDeoSign
        }
    };
};
