import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
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
    const { addSheet, updateSheet, deleteSheet, sheets, refreshSheets, shift, currentUser, devRole, loading: dataLoading } = useData();

    // Determine effective role
    const currentRole = (devRole || currentUser?.role) as Role | undefined;

    const [formData, setFormData] = useState<Partial<SheetData>>({
        shift: shift || 'A',
        date: new Date().toISOString().split('T')[0],
        destination: '',
        supervisorName: currentUser?.fullName || currentUser?.username || '',
        empCode: currentUser?.empCode || '',
        loadingDockNo: '',
        loadingDoc: '',
        stagingItems: Array.from({ length: 5 }, (_, i) => ({ ...EMPTY_ITEM, srNo: i + 1 })),
        status: SheetStatus.DRAFT
    });

    const [loading, setLoading] = useState(false);
    const isDirty = useRef(false);
    const prevId = useRef(id);

    useEffect(() => {
        // Reset dirty state if navigating to a different sheet
        if (id !== prevId.current) {
            isDirty.current = false;
            prevId.current = id;
        }

        if (id && id !== 'new') {
            const existing = sheets.find(s => s.id === id);
            if (existing && !isDirty.current) {
                setFormData(existing);
            } else if (!existing && !dataLoading) {
                // If not found in current cache, try refreshing
                refreshSheets();
            }
        } else if (id === 'new' && currentUser && !isDirty.current) {
            setFormData(prev => ({
                ...prev,
                supervisorName: prev.supervisorName || currentUser.fullName || currentUser.username || '',
                empCode: prev.empCode || currentUser.empCode || ''
            }));
        }
    }, [id, sheets, currentUser, dataLoading, refreshSheets]);

    const handleHeaderChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        isDirty.current = true;
    };

    const handleSave = async (dataToSave: Partial<SheetData> = formData) => {
        if (loading) return; // Strict lock
        setLoading(true);
        try {
            // Determine ID: If previously saved (but nav pending), use that. Else if new, generate. Else existing.
            const isNew = id === 'new' && !formData.id;
            const targetId = isNew ? `SH-${Date.now()}` : (formData.id || id!);

            const sheetToSave: SheetData = {
                ...dataToSave as SheetData,
                id: targetId,
                updatedAt: new Date().toISOString(),
                status: dataToSave.status || SheetStatus.DRAFT
            };

            // If new, invoke addSheet (which does INSERT)
            if (isNew) {
                // Optimistically set ID to prevent double-save creating duplicates
                setFormData(prev => ({ ...prev, id: targetId }));

                const { error } = await addSheet(sheetToSave);
                if (error) throw error;
                // Navigate to the newly created sheet URL
                navigate(`/sheets/staging/${targetId}`, { replace: true });
            } else {
                // If update, invoke updateSheet (which does UPDATE)
                const { error } = await updateSheet(sheetToSave);
                if (error) throw error;
            }

        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this sheet? This cannot be undone.")) return;
        setLoading(true);
        try {
            const currentId = id === 'new' ? formData.id : id;
            if (currentId) {
                const { error } = await deleteSheet(currentId);
                if (error) throw error;
                navigate('/database');
            }
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestVerification = () => {
        // Clear rejection reason on resubmit so it doesn't show as rejected in Dashboard
        const updated: Partial<SheetData> = {
            ...formData,
            status: SheetStatus.STAGING_VERIFICATION_PENDING,
            rejectionReason: undefined
        };
        setFormData(updated);
        handleSave(updated);
    };

    const updateItem = (index: number, field: keyof StagingItem, value: string | number) => {
        if (formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.COMPLETED) return;

        const newItems = [...(formData.stagingItems || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        isDirty.current = true;

        // Auto-calc Total
        if (field === 'fullPlt' || field === 'casesPerPlt' || field === 'loose') {
            const item = newItems[index];
            const cases = Number(item.casesPerPlt) || 0;
            const full = Number(item.fullPlt) || 0;
            const loose = Number(item.loose) || 0;
            newItems[index].ttlCases = (cases * full) + loose;
        }

        setFormData({ ...formData, stagingItems: newItems });
    };

    const addItem = () => {
        if (formData.status !== SheetStatus.LOCKED && formData.status !== SheetStatus.STAGING_VERIFICATION_PENDING) {
            setFormData({
                ...formData,
                stagingItems: [...(formData.stagingItems || []), { ...EMPTY_ITEM, srNo: (formData.stagingItems?.length || 0) + 1 }]
            });
        }
    };

    const handleVerificationAction = (approve: boolean, reason?: string) => {
        if (approve) {
            if (confirm("Are you sure you want to verify and lock this sheet?")) {
                const updated = {
                    ...formData,
                    status: SheetStatus.LOCKED,
                    lockedBy: currentUser?.username,
                    lockedAt: new Date().toISOString(),
                    slSign: currentUser?.fullName,
                    history: [...(formData.history || []), {
                        id: Date.now().toString(),
                        actor: currentUser?.username || 'Unknown',
                        action: 'STAGING_VERIFIED',
                        timestamp: new Date().toISOString(),
                        details: 'Verified and Locked State'
                    }]
                };
                setFormData(updated);
                handleSave(updated);
            }
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
                    history: [...(formData.history || []), {
                        id: Date.now().toString(),
                        actor: currentUser?.username || 'Unknown',
                        action: 'STAGING_REJECTED',
                        timestamp: new Date().toISOString(),
                        details: `Rejected: ${reason}`
                    }]
                };
                setFormData(updated);
                handleSave(updated);
            }
        }
    };

    const handleToggleRejection = (srNo: number, reason?: string) => {
        setFormData(prev => {
            const newItems = prev.stagingItems?.map(item =>
                item.srNo === srNo
                    ? { ...item, isRejected: !item.isRejected, rejectionReason: !item.isRejected ? reason : undefined }
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
