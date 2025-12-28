import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { SheetData, SheetStatus, Role } from '@/types';
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
    const [currentSheet, setCurrentSheet] = useState<SheetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [errors] = useState<string[]>([]);

    // --- Sub-Hooks ---
    const { headerState, handleHeaderChange } = useSheetHeader(currentSheet, currentUser, users);
    const {
        validationError,
        dismissValidationError,
        handlers: gridHandlers
    } = useSheetGrid(currentSheet, setCurrentSheet);
    const { signatureState, camera } = useSheetSignatures(currentSheet, currentUser);

    const { setEndTime } = headerState; // Exposed setter for submit logic

    // --- Initial Data Load ---
    useEffect(() => {
        if (!id) return;

        const loadSheet = async () => {
            // 1. Try local cache first
            if (currentSheet && currentSheet.id === id) return; // Don't overwrite local unsaved changes

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
            setLoading(false); // End loading even if not found to show "Sheet Not Found"
        };

        loadSheet();
    }, [id, sheets, dataLoading, refreshSheets, fetchSheetById]);

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
            capturedImages: signatureState.capturedImage ? [signatureState.capturedImage] : [],
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
        if (!currentSheet) return;
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
            alert('Progress Saved Successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save progress.');
        }
    };

    const handleSubmit = async () => {
        if (!currentSheet) return;
        if (!signatureState.svName || signatureState.svName.trim() === '') {
            alert('Supervisor Name is required to complete the sheet.');
            return;
        }
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
            alert('Submitted for Shift Lead Verification!');
            navigate('/database');
        } catch (e) {
            console.error(e);
            alert('Failed to submit.');
        }
    };

    const handleVerificationAction = async (approve: boolean, reason?: string) => {
        if (!currentSheet) return;
        if (approve) {
            if (confirm('Confirm final approval? This sheet will be marked as COMPLETED.')) {
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
                navigate('/database');
            }
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
                navigate('/database');
            }
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

    const states = {
        isCompleted: currentSheet?.status === SheetStatus.COMPLETED,
        isPendingVerification: currentSheet?.status === SheetStatus.LOADING_VERIFICATION_PENDING,
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
            setRemarks: signatureState.setRemarks,
            setSvName: signatureState.setSvName,
            setSvSign: signatureState.setSvSign,
            setSlSign: signatureState.setSlSign,
            setDeoSign: signatureState.setDeoSign
        }
    };
};
