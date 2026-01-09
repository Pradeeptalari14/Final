import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';
import { useToast } from '@/contexts/ToastContext';
import { SheetData, SheetStatus, Role, StagingItem } from '@/types';

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
    const isDirty = useRef(false);
    const prevId = useRef(id);

    // Reset dirty state if navigating to a different sheet
    useEffect(() => {
        if (id !== prevId.current) {
            isDirty.current = false;
            prevId.current = id;
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
            if (isDirty.current) {
                return;
            }

            setLoading(true);

            // 1. Try local cache first
            const foundInCache = sheets.find((s) => s.id === id);
            if (foundInCache) {
                setFormData(foundInCache);
                setLoading(false);
                return;
            }

            // 2. Fallback to direct fetch
            const fetched = await fetchSheetById(id);
            if (fetched) {
                setFormData(fetched);
            } else if (!dataLoading) {
                // 3. Last resort
                await refreshSheets();
            }
            setLoading(false);
        };

        loadSheet();
    }, [id, sheets, currentUser, dataLoading, refreshSheets, fetchSheetById]);

    const handleHeaderChange = (field: string, value: string | number | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        isDirty.current = true;
    };

    const handleSave = async (dataToSave: Partial<SheetData> = formData) => {
        if (loading) return; // Strict lock
        setLoading(true);
        try {
            // Determine ID: If previously saved (but nav pending), use that. Else if new, generate. Else existing.
            const isNew = id === 'new' && !formData.id;
            const targetId = isNew ? `SH-${Date.now()}` : formData.id || id!;

            const sheetToSave: SheetData = {
                ...(dataToSave as SheetData),
                id: targetId,
                updatedAt: new Date().toISOString(),
                status: dataToSave.status || SheetStatus.DRAFT
            };

            // If new, invoke addSheet (which does INSERT)
            if (isNew) {
                // Optimistically set ID to prevent double-save creating duplicates
                setFormData((prev) => ({ ...prev, id: targetId }));

                const { error } = await addSheet(sheetToSave);
                if (error) throw error;
                addToast('success', 'New sheet created successfully');
                // Navigate to the newly created sheet URL
                navigate(`/sheets/staging/${targetId}`, { replace: true });
            } else {
                // If update, invoke updateSheet (which does UPDATE)
                const { error } = await updateSheet(sheetToSave);
                if (error) throw error;
                // Only show toast if not being called by handleRequestVerification
                if (formData.status === dataToSave.status) {
                    addToast('success', 'Draft saved successfully');
                }
            }
        } catch (err: unknown) {
            console.error(err);
            addToast('error', 'Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

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

    const updateItem = (index: number, field: keyof StagingItem, value: string | number) => {
        if (formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.COMPLETED)
            return;

        const newItems = [...(formData.stagingItems || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        isDirty.current = true;

        // Auto-calc Total
        if (field === 'fullPlt' || field === 'casesPerPlt' || field === 'loose') {
            const item = newItems[index];
            const cases = Number(item.casesPerPlt) || 0;
            const full = Number(item.fullPlt) || 0;
            const loose = Number(item.loose) || 0;
            newItems[index].ttlCases = cases * full + loose;
        }

        setFormData({ ...formData, stagingItems: newItems });
    };

    const addItem = (count: number = 1) => {
        if (
            formData.status !== SheetStatus.LOCKED &&
            formData.status !== SheetStatus.STAGING_VERIFICATION_PENDING
        ) {
            const currentLength = formData.stagingItems?.length || 0;
            const newItems = Array.from({ length: count }, (_, i) => ({
                ...EMPTY_ITEM,
                srNo: currentLength + i + 1
            }));

            setFormData({
                ...formData,
                stagingItems: [
                    ...(formData.stagingItems || []),
                    ...newItems
                ]
            });
        }
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
        handleVerificationAction,
        handleToggleRejection,
        currentRole,
        navigate, // Exposed for back button
        id,
        dataLoading,
        refreshSheets
    };
};
