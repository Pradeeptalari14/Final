import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { SheetData, SheetStatus, Role } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useSheetHeader } from './useSheetHeader';
import { useSheetGrid } from './useSheetGrid';
import { useSheetSignatures } from './useSheetSignatures';
import { calculateTotals, generateLists } from '@/lib/logic/sheetCalculations';
import { validateSheetCompleteness, getSubmissionValidationError } from '@/lib/logic/sheetValidation';

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
    const editRevision = useRef(0);
    const prevId = useRef(id);

    const markDirty = () => {
        isDirty.current = true;
        editRevision.current++;
    };

    // Reset dirty state if navigating to a DIFFERENT existing sheet
    useEffect(() => {
        if (id !== prevId.current) {
            // Protect dirty state during ID assignments or transitions
            if (prevId.current && id) {
                isDirty.current = false;
            }
            prevId.current = id;
        }
    }, [id]);

    // --- Sub-Hooks ---
    const { headerState, handleHeaderChange } = useSheetHeader(currentSheet, currentUser, users, markDirty);

    // Wrap setCurrentSheet to track dirty state
    const setSheetData = (data: React.SetStateAction<SheetData | null>) => {
        setCurrentSheet(data);
        markDirty();
    };

    const {
        validationError,
        dismissValidationError,
        handlers: gridHandlers
    } = useSheetGrid(currentSheet, setSheetData);
    const { signatureState, camera } = useSheetSignatures(currentSheet, currentUser, markDirty);

    const { setEndTime } = headerState; // Exposed setter for submit logic

    // --- Initial Data Load ---
    useEffect(() => {
        if (!id) return;

        const loadSheet = async () => {
            // Already loaded this sheet? Don't overwrite to avoid resetting sub-hook states
            // 2. Allow background updates IF we don't have local unsaved changes
            if (currentSheet && currentSheet.id === id && isDirty.current) {
                return;
            }

            // CRITICAL: If we have local unsaved changes, DO NOT let background sync overwrite them
            if (isDirty.current) {
                prevId.current = id;
                return;
            }

            setLoading(true);

            const foundInCache = sheets.find((s) => s.id === id);

            if (foundInCache) {
                setCurrentSheet(foundInCache);
                setLoading(false);
                prevId.current = id;
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
            prevId.current = id;
        };

        loadSheet();
    }, [id, sheets, currentUser, dataLoading, refreshSheets, fetchSheetById]);

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
    const buildSheetData = useCallback((status: SheetStatus): SheetData => {
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
    }, [currentSheet, headerState, signatureState, currentUser]);

    const handleSaveProgress = useCallback(async (quiet = false) => {
        if (!currentSheet || actionLoading) return;
        if (!quiet) setActionLoading(true);
        const startRev = editRevision.current;
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
            if (editRevision.current === startRev) {
                isDirty.current = false;
            }
            if (!quiet) addToast('success', 'Progress saved successfully');
        } catch (e) {
            console.error(e);
            if (!quiet) addToast('error', 'Failed to save progress');
        } finally {
            if (!quiet) setActionLoading(false);
        }
    }, [currentSheet, actionLoading, currentUser, updateSheet, addToast, buildSheetData]); // Added dependencies

    // Auto-Save Interval
    useEffect(() => {
        const interval = setInterval(() => {
            if (
                isDirty.current &&
                currentSheet?.status === SheetStatus.LOCKED &&
                !actionLoading
            ) {
                handleSaveProgress(true); // Quiet save
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [handleSaveProgress, currentSheet, actionLoading]);

    const handleSubmit = async () => {
        if (!currentSheet || actionLoading) return;

        const validationError = getSubmissionValidationError(currentSheet, headerState, signatureState, lists);
        if (validationError) {
            addToast('error', validationError);
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
    const totals = useMemo(() => calculateTotals(currentSheet), [currentSheet]);

    const lists = useMemo(() => generateLists(currentSheet), [currentSheet]);

    // Strict Verification Logic
    const isDataComplete = useMemo(() =>
        validateSheetCompleteness(currentSheet, headerState, signatureState),
        [currentSheet, headerState, signatureState]);

    const states = {
        isCompleted: currentSheet?.status === SheetStatus.COMPLETED,
        isPendingVerification: currentSheet?.status === SheetStatus.LOADING_VERIFICATION_PENDING,
        isDataComplete,
        isPhotoComplete: true, // Deprecated in favor of isDataComplete handling everything
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
