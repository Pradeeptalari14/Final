import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';
import { useToast } from '@/contexts/ToastContext';
import { SheetData, SheetStatus, Role, StagingItem } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { calculateStagingItemTotal } from '@/lib/logic/sheetCalculations';

const EMPTY_ITEM: StagingItem = {
    srNo: 0,
    skuName: '',
    casesPerPlt: 0,
    fullPlt: 0,
    loose: 0,
    ttlCases: 0
};

export const useStagingSheetLogic = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        addSheet,
        updateSheet,
        deleteSheet,
        sheets,
        refreshSheets,
        fetchSheetById,
        currentUser,
        loading: dataLoading
    } = useData();
    const { devRole } = useAppState();
    const { addToast } = useToast();

    // Determine effective role
    const currentRole = (devRole || currentUser?.role) as Role | undefined;

    const [formData, setFormData] = useState<Partial<SheetData>>({
        shift: '',
        date: (() => {
            const d = new Date();
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().split('T')[0];
        })(), // Use local date instead of UTC
        destination: '',
        supervisorName: currentUser?.fullName || currentUser?.username || '',
        empCode: currentUser?.empCode || '',
        loadingDockNo: '',
        loadingDoc: '',
        loadingStartTime: '',
        loadingEndTime: '',
        stagingItems: Array.from({ length: 5 }, (_, i) => ({ ...EMPTY_ITEM, srNo: i + 1 })),
        status: SheetStatus.DRAFT
    });

    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Track visual save state
    const isDirty = useRef(false);
    const editRevision = useRef(0);
    const prevId = useRef(id);

    const markDirty = () => {
        isDirty.current = true;
        editRevision.current++;
    };

    // Auto-Save Logic
    const debouncedFormData = useDebounce(formData, 3000); // 3 seconds debounce

    // Reset dirty state if navigating to a DIFFERENT existing sheet
    useEffect(() => {
        if (id !== prevId.current) {
            // If we are moving from 'new' to an ID, we DON'T reset isDirty
            // because we want to preserve any typing that happened during the save
            if (prevId.current !== 'new' && id !== 'new') {
                isDirty.current = false;
            }
            // prevId is updated either here or inside the sync logic
            if (id !== 'new') prevId.current = id;
        }
    }, [id]);

    // --- Initial Data Load ---
    useEffect(() => {
        if (!id) return;

        const loadSheet = async () => {
            // New sheet logic
            if (id === 'new') {
                if (currentUser && !isDirty.current) {
                    setFormData((prev) => {
                        // Only set if not already set or it's a new session
                        if (prev.id) return prev;
                        return {
                            ...prev,
                            supervisorName: prev.supervisorName || currentUser.fullName || currentUser.username || '',
                            empCode: prev.empCode || currentUser.empCode || ''
                        };
                    });
                }
                setLoading(false);
                return;
            }

            // Existing sheet logic
            // CRITICAL: If we have local unsaved changes, DO NOT let background sync overwrite them
            // Exception: If we just finished a save that gave us a real ID, we might still be dirty
            if (isDirty.current) {
                prevId.current = id; // Sync the ID tracking so the next effect doesn't triggger a reset
                return;
            }

            setLoading(true);

            // 1. Try local cache first
            const foundInCache = sheets.find((s) => s.id === id);
            if (foundInCache) {
                // Sanitize items: Ensure they have srNo and are consistent
                const sanitizedItems = (foundInCache.stagingItems || []).map((item, i) => ({
                    ...EMPTY_ITEM,
                    ...item,
                    srNo: i + 1
                }));
                setFormData({ ...foundInCache, stagingItems: sanitizedItems });
                setLoading(false);
                prevId.current = id;
                return;
            }
            // 2. Direct fetch
            try {
                const data = await fetchSheetById(id);
                if (data) {
                    const sanitizedItems = (data.stagingItems || []).map((item, i) => ({
                        ...EMPTY_ITEM,
                        ...item,
                        srNo: i + 1
                    }));
                    setFormData({ ...data, stagingItems: sanitizedItems });
                }
            } catch (err) {
                console.error('Fetch failed', err);
            }
            setLoading(false);
            prevId.current = id;
        };

        loadSheet();
    }, [id, sheets, currentUser, dataLoading, refreshSheets, fetchSheetById]);

    // Use a ref for formData to handle reconciliation in handleSave without causing dependency cycles
    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const handleHeaderChange = (field: string, value: string | number | boolean) => {
        markDirty();
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = useCallback(async (dataToSave: Partial<SheetData> = formDataRef.current, quiet = false) => {
        if (loading) return; // Strict lock
        setLoading(true);
        if (!quiet) setIsSaving(true);

        const startRev = editRevision.current;

        try {
            const isNew = id === 'new' && !formDataRef.current.id;
            const targetId = isNew ? `SH-${Date.now()}` : formDataRef.current.id || id!;

            // RECONCILIATION: Always start with latest formDataRef, overlay dataToSave
            const sheetToSave: SheetData = {
                ...formDataRef.current,
                ...(dataToSave as SheetData),
                id: targetId,
                updatedAt: new Date().toISOString(),
                status: dataToSave.status || formDataRef.current.status || SheetStatus.DRAFT
            };

            // If new, invoke addSheet (which does INSERT)
            if (isNew) {
                setFormData((prev) => ({ ...prev, id: targetId }));
                const { error } = await addSheet(sheetToSave);
                if (error) throw error;
                if (!quiet) addToast('success', 'New sheet created successfully');
                navigate(`/sheets/staging/${targetId}`, { replace: true });
            } else {
                const { error } = await updateSheet(sheetToSave);
                if (error) throw error;
                if (!quiet && formDataRef.current.status === dataToSave.status) {
                    addToast('success', 'Draft saved successfully');
                }
            }

            if (editRevision.current === startRev) {
                isDirty.current = false;
            }
        } catch (err: unknown) {
            console.error(err);
            if (!quiet) addToast('error', 'Failed to save changes');
        } finally {
            setLoading(false);
            setIsSaving(false);
        }
    }, [id, addSheet, updateSheet, addToast, navigate, loading]);

    // Effect to trigger Auto-Save - DEPENDENCY STABILITY FIX
    useEffect(() => {
        if (
            formData.id &&
            isDirty.current &&
            formData.status !== SheetStatus.LOCKED &&
            formData.status !== SheetStatus.COMPLETED &&
            formData.status !== SheetStatus.STAGING_VERIFICATION_PENDING
        ) {
            handleSave(undefined, true); // Use absolute latest from formDataRef, quiet save
        }
    }, [debouncedFormData, formData.id, formData.status]); // REMOVED handleSave dependency to prevent keystroke-loops

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this sheet? This cannot be undone.')) return;
        setLoading(true);
        try {
            const currentId = id === 'new' ? formData.id : id;
            if (currentId) {
                const { error } = await deleteSheet(currentId);
                if (error) throw error;
                addToast('success', 'Sheet deleted successfully');
                navigate('/database');
            }
        } catch (error) {
            console.error('Delete failed', error);
            addToast('error', 'Failed to delete sheet');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestVerification = async () => {
        // Clear rejection reason on resubmit so it doesn't show as rejected in Dashboard
        const updated: Partial<SheetData> = {
            ...formData,
            status: SheetStatus.STAGING_VERIFICATION_PENDING,
            rejectionReason: undefined
        };
        setFormData(updated);
        await handleSave(updated);
        addToast('success', 'Verification requested successfully');
        // Clear dirty state before navigating
        isDirty.current = false;
        navigate('/database');
    };

    const updateItem = (srNo: number, field: keyof StagingItem, value: string | number) => {
        if (formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.COMPLETED)
            return;

        markDirty();
        setFormData((prev) => {
            const newItems = [...(prev.stagingItems || [])];
            const idx = newItems.findIndex(i => i.srNo === srNo);
            if (idx === -1) return prev;

            newItems[idx] = { ...newItems[idx], [field]: value };

            // Auto-calc Total
            if (field === 'fullPlt' || field === 'casesPerPlt' || field === 'loose') {
                const item = newItems[idx];
                newItems[idx].ttlCases = calculateStagingItemTotal(item.casesPerPlt, item.fullPlt, item.loose);
            }
            return { ...prev, stagingItems: newItems };
        });
    };

    const addItem = (count: number = 1) => {
        if (
            formData.status !== SheetStatus.LOCKED &&
            formData.status !== SheetStatus.STAGING_VERIFICATION_PENDING
        ) {
            markDirty();
            setFormData((prev) => {
                const currentLength = prev.stagingItems?.length || 0;
                const newItems = Array.from({ length: count }, (_, i) => ({
                    ...EMPTY_ITEM,
                    srNo: currentLength + i + 1
                }));

                return {
                    ...prev,
                    stagingItems: [
                        ...(prev.stagingItems || []),
                        ...newItems
                    ]
                };
            });
        }
    };

    const removeItem = (srNo: number) => {
        if (
            formData.status === SheetStatus.LOCKED ||
            formData.status === SheetStatus.COMPLETED ||
            formData.status === SheetStatus.STAGING_VERIFICATION_PENDING
        )
            return;

        markDirty();
        setFormData((prev) => {
            const newItems = (prev.stagingItems || []).filter((item) => item.srNo !== srNo);
            // Re-index
            const reindexedItems = newItems.map((item, i) => ({
                ...item,
                srNo: i + 1
            }));
            return {
                ...prev,
                stagingItems: reindexedItems
            };
        });
    };

    const handleVerificationAction = async (approve: boolean, reason?: string) => {
        if (approve) {
            // Confirmation is now handled by the UI component
            const updated = {
                ...formData,
                status: SheetStatus.LOCKED,
                lockedBy: currentUser?.username,
                lockedAt: new Date().toISOString(),
                slSign: currentUser?.fullName,
                history: [
                    ...(formData.history || []),
                    {
                        id: Date.now().toString(),
                        actor: currentUser?.username || 'Unknown',
                        action: 'STAGING_VERIFIED',
                        timestamp: new Date().toISOString(),
                        details: 'Verified and Locked State'
                    }
                ]
            };
            setFormData(updated);
            await handleSave(updated);
            addToast('success', 'Sheet verified and locked');
        } else {
            if (reason) {
                const newComment = {
                    id: Date.now().toString(),
                    author: currentUser?.fullName || 'Shift Lead',
                    text: `REJECTED: ${reason}`,
                    timestamp: new Date().toISOString()
                };
                const updated = {
                    ...formData,
                    status: SheetStatus.DRAFT,
                    rejectionReason: reason,
                    comments: [...(formData.comments || []), newComment],
                    history: [
                        ...(formData.history || []),
                        {
                            id: Date.now().toString(),
                            actor: currentUser?.username || 'Unknown',
                            action: 'STAGING_REJECTED',
                            timestamp: new Date().toISOString(),
                            details: `Rejected: ${reason}`
                        }
                    ]
                };
                setFormData(updated);
                await handleSave(updated);
                addToast('error', 'Sheet rejected');
            }
        }
    };

    const handleToggleRejection = (srNo: number, reason?: string) => {
        markDirty();
        setFormData((prev) => {
            const newItems = prev.stagingItems?.map((item) =>
                item.srNo === srNo
                    ? {
                        ...item,
                        isRejected: !item.isRejected,
                        rejectionReason: !item.isRejected ? reason : undefined
                    }
                    : item
            );
            return { ...prev, stagingItems: newItems };
        });
    };

    return {
        formData,
        setFormData, // Exposed for edge cases if any
        loading,
        handleHeaderChange,
        handleSave,
        handleDelete,
        handleRequestVerification,
        updateItem,
        addItem,
        removeItem,
        handleVerificationAction,
        handleToggleRejection,
        currentRole,
        navigate, // Exposed for back button
        id,
        dataLoading,
        refreshSheets,
        isSaving,
        addToast
    };
};
