import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { SheetData, SheetStatus, Role, User } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useAppState } from '@/contexts/AppStateContext';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { t } from '@/lib/i18n';
import { VirtualDatabaseTable } from '@/components/admin/VirtualDatabaseTable';

interface OperationalTableViewProps {
    sheets: SheetData[];
    activeSection: string;
    activeViewMode: string;
    onViewModeChange: (value: string) => void;
    currentUser: User | null;
    refreshSheets: () => Promise<void>;
    isLoading?: boolean;
}

export function OperationalTableView({
    sheets,
    activeSection,
    activeViewMode,
    onViewModeChange,
    currentUser,
    refreshSheets,
    isLoading = false
}: OperationalTableViewProps) {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { settings } = useAppState();
    const isCompact = settings?.density === 'compact';
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const isRejected = (s: SheetData) => !!s.rejectionReason;

    // --- Filter Logic ---

    const filteredSheets = useMemo(() => {
        let relevantSheets = [...sheets];

        // 1. Context Filtering (Role/Tab specific)
        if (activeSection === 'loading_db') {
            relevantSheets = relevantSheets.filter(
                (s) => {
                    const status = (s.status || '').toUpperCase();
                    return status === SheetStatus.LOCKED ||
                        status === SheetStatus.LOADING_VERIFICATION_PENDING ||
                        status === SheetStatus.COMPLETED;
                }
            );
        }

        // 2. Search & Date Filter
        relevantSheets = relevantSheets.filter((sheet) => {
            const matchesSearch =
                searchQuery === '' ||
                (sheet.supervisorName &&
                    sheet.supervisorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                sheet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sheet.shift && sheet.shift.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.destination &&
                    sheet.destination.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesDate =
                dateFilter === '' || (sheet.date && sheet.date.includes(dateFilter));
            return matchesSearch && matchesDate;
        });

        // 3. Sub Status Filtering
        let result = relevantSheets;

        if (activeSection === 'staging_db') {
            if (activeViewMode === 'VIEW_STAGING_DRAFT' || activeViewMode === 'DRAFT')
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'DRAFT' && !isRejected(s));
            else if (activeViewMode === 'VIEW_STAGING_VERIFY' || activeViewMode === 'PENDING')
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'STAGING_VERIFICATION_PENDING');
            else if (activeViewMode === 'VIEW_LOCKED' || activeViewMode === 'LOCKED')
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'LOCKED');
            else if (activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED')
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'COMPLETED');
            else if (activeViewMode === 'VIEW_STAGING_REJECTED' || activeViewMode === 'REJECTED')
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'DRAFT' && isRejected(s));
        } else if (activeSection === 'loading_db') {
            const currentMode = activeViewMode.toUpperCase();
            if (currentMode === 'VIEW_LOADING_READY' || currentMode === 'READY' || currentMode === 'LOCKED') {
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'LOCKED');
            } else if (currentMode === 'VIEW_LOADING_VERIFY' || currentMode === 'PENDING') {
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'LOADING_VERIFICATION_PENDING');
            } else if (currentMode === 'VIEW_COMPLETED' || currentMode === 'COMPLETED') {
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'COMPLETED');
            } else if (currentMode === 'VIEW_LOADING_REJECTED' || currentMode === 'REJECTED') {
                result = relevantSheets.filter((s) => ((s.status || '').toUpperCase() === 'LOCKED' || (s.status || '').toUpperCase() === 'LOADING_VERIFICATION_PENDING') && isRejected(s));
            }
        } else if (activeSection === 'shift_lead_db') {
            if (activeViewMode === 'VIEW_STAGING_VERIFY')
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'STAGING_VERIFICATION_PENDING');
            else if (activeViewMode === 'VIEW_LOADING_VERIFY')
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'LOADING_VERIFICATION_PENDING');
            else if (activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED')
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'COMPLETED');
            else if (activeViewMode === 'VIEW_STAGING_REJECTED')
                result = relevantSheets.filter((s) => (s.status || '').toUpperCase() === 'DRAFT' && isRejected(s));
            else if (activeViewMode === 'VIEW_LOADING_REJECTED')
                result = relevantSheets.filter((s) => ((s.status || '').toUpperCase() === 'LOCKED' || (s.status || '').toUpperCase() === 'LOADING_VERIFICATION_PENDING') && isRejected(s));
        }

        // 4. Final Sort
        const sorted = [...result].sort(
            (a, b) =>
                new Date(b.updatedAt || b.createdAt || 0).getTime() -
                new Date(a.updatedAt || a.createdAt || 0).getTime()
        );

        return sorted;
    }, [sheets, activeSection, activeViewMode, searchQuery, dateFilter]);
    const handleDeleteSheet = async (sheetId: string) => {
        if (!confirm(t('delete_confirm', settings.language))) return;

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase.from('sheets').delete().eq('id', sheetId);
            if (error) throw error;
            addToast('success', t('sheet_deleted_successfully', settings.language));
            await refreshSheets();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            addToast(
                'error',
                t('failed_to_delete_sheet', settings.language) + ': ' + msg
            );
        }
    };

    // Quick Approve logic
    const handleQuickApprove = async (sheet: SheetData) => {
        if (!confirm(t('approve_confirm', settings.language))) return;
        setProcessingId(sheet.id);

        try {
            const nextStatus =
                sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING
                    ? SheetStatus.LOCKED
                    : SheetStatus.COMPLETED;

            const payload: Partial<SheetData> = {
                status: nextStatus,
                verifiedBy: currentUser?.username,
                verifiedAt: new Date().toISOString()
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase.from('sheets').update(payload).eq('id', sheet.id);
            if (error) throw error;

            addToast(
                'success',
                `${t('sheet_approved', settings.language)}: ${nextStatus.replace(/_/g, ' ')}`
            );
            await refreshSheets();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            addToast('error', msg);
        } finally {
            setProcessingId(null);
        }
    };

    const handleQuickReject = async (sheet: SheetData) => {
        const reason = prompt(t('rejection_reason_prompt', settings.language));
        if (!reason) return;
        setProcessingId(sheet.id);

        try {
            const nextStatus =
                sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING
                    ? SheetStatus.DRAFT
                    : SheetStatus.LOCKED;

            const updates: Partial<SheetData> = {
                status: nextStatus,
                rejectionReason: reason,
                comments: [
                    ...(sheet.comments || []),
                    {
                        id: crypto.randomUUID(),
                        text: `${t('rejected', settings.language)}: ${reason}`,
                        author: currentUser?.username || 'Admin',
                        timestamp: new Date().toISOString()
                    }
                ]
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase.from('sheets').update(updates).eq('id', sheet.id);
            if (error) throw error;

            addToast(
                'info',
                `${t('sheet_rejected_and_returned', settings.language)} ${nextStatus.replace(/_/g, ' ')}`
            );
            await refreshSheets();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            addToast('error', msg);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className={`flex flex-col h-full ${isCompact ? 'space-y-3' : 'space-y-6'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isCompact ? 'mb-2' : 'mb-6'}`}>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onViewModeChange('ALL')}
                        className={`${isCompact ? 'text-[10px] px-2 h-7' : 'text-xs px-4 h-9'} rounded-lg transition-all ${activeViewMode === 'ALL'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black shadow-md ring-1 ring-slate-200 dark:ring-white/10 scale-105'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                            } uppercase tracking-wider`}
                    >
                        {t('all', settings.language)}
                    </Button>

                    {activeSection === 'staging_db' && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_STAGING_DRAFT')}
                                className={`${isCompact ? 'text-[10px] px-2 h-7' : 'text-xs px-4 h-9'} rounded-lg transition-all ${activeViewMode === 'VIEW_STAGING_DRAFT' || activeViewMode === 'DRAFT'
                                    ? 'bg-blue-600 text-white font-black shadow-md scale-105'
                                    : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('draft', settings.language)}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_STAGING_VERIFY')}
                                className={`${isCompact ? 'text-[10px] px-2 h-7' : 'text-xs px-4 h-9'} rounded-lg transition-all ${activeViewMode === 'VIEW_STAGING_VERIFY' || activeViewMode === 'PENDING'
                                    ? 'bg-blue-600 text-white font-black shadow-md scale-105'
                                    : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    } uppercase tracking-wider border border-blue-100/50`}
                            >
                                {t('pending_verification', settings.language)}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_LOCKED')}
                                className={`${isCompact ? 'text-[10px] px-2 h-7' : 'text-xs px-4 h-9'} rounded-lg transition-all ${activeViewMode === 'VIEW_LOCKED' || activeViewMode === 'LOCKED'
                                    ? 'bg-blue-600 text-white font-black shadow-md scale-105'
                                    : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('locked_not_editable', settings.language)}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_COMPLETED')}
                                className={`${isCompact ? 'text-[10px] px-2 h-7' : 'text-xs px-4 h-9'} rounded-lg transition-all ${activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED'
                                    ? 'bg-emerald-600 text-white font-black shadow-md scale-105'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('completed', settings.language)}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_STAGING_REJECTED')}
                                className={`${isCompact ? 'text-[10px] px-2 h-7' : 'text-xs px-4 h-9'} rounded-lg transition-all ${activeViewMode === 'VIEW_STAGING_REJECTED' || activeViewMode === 'REJECTED'
                                    ? 'bg-red-600 text-white font-black shadow-md scale-105'
                                    : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('rejected', settings.language)}
                            </Button>
                        </>
                    )}

                    {activeSection === 'loading_db' && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_LOADING_READY')}
                                className={`text-xs px-4 rounded-lg transition-all ${activeViewMode === 'VIEW_LOADING_READY' || activeViewMode === 'READY' || activeViewMode === 'LOCKED'
                                    ? 'bg-orange-600 text-white font-black shadow-md scale-105'
                                    : 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                    } uppercase tracking-wider border border-orange-100/50`}
                            >
                                {t('ready_to_load', settings.language)}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_LOADING_VERIFY')}
                                className={`text-xs px-4 rounded-lg transition-all ${activeViewMode === 'VIEW_LOADING_VERIFY' || activeViewMode === 'PENDING'
                                    ? 'bg-orange-600 text-white font-black shadow-md scale-105'
                                    : 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                    } uppercase tracking-wider border border-orange-100/50`}
                            >
                                {t('pending_verification', settings.language)}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_COMPLETED')}
                                className={`text-xs px-4 rounded-lg transition-all ${activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED'
                                    ? 'bg-emerald-600 text-white font-black shadow-md scale-105'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('completed', settings.language)}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_LOADING_REJECTED')}
                                className={`text-xs px-4 rounded-lg transition-all ${activeViewMode === 'VIEW_LOADING_REJECTED' || activeViewMode === 'REJECTED'
                                    ? 'bg-red-600 text-white font-black shadow-md scale-105'
                                    : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('rejected', settings.language)}
                            </Button>
                        </>
                    )}

                    {activeSection === 'shift_lead_db' && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_STAGING_VERIFY')}
                                className={`text-xs px-4 rounded-lg transition-all ${activeViewMode === 'VIEW_STAGING_VERIFY'
                                    ? 'bg-blue-600 text-white font-black shadow-md scale-105'
                                    : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('staging_approvals', settings.language)}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_LOADING_VERIFY')}
                                className={`text-xs px-4 rounded-lg transition-all ${activeViewMode === 'VIEW_LOADING_VERIFY'
                                    ? 'bg-orange-600 text-white font-black shadow-md scale-105'
                                    : 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('loading_approvals', settings.language)}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_COMPLETED')}
                                className={`text-xs px-4 rounded-lg transition-all ${activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED'
                                    ? 'bg-emerald-600 text-white font-black shadow-md scale-105'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('completed', settings.language)}
                            </Button>

                            <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-1" />

                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_STAGING_REJECTED')}
                                className={`text-xs px-4 rounded-lg transition-all ${activeViewMode === 'VIEW_STAGING_REJECTED'
                                    ? 'bg-red-600 text-white font-black shadow-md scale-105'
                                    : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('staging_rejected', settings.language)}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onViewModeChange('VIEW_LOADING_REJECTED')}
                                className={`text-xs px-4 rounded-lg transition-all ${activeViewMode === 'VIEW_LOADING_REJECTED'
                                    ? 'bg-red-600 text-white font-black shadow-md scale-105'
                                    : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    } uppercase tracking-wider`}
                            >
                                {t('loading_rejected', settings.language)}
                            </Button>
                        </>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search
                            size={isCompact ? 12 : 14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`bg-muted/50 border border-border rounded-lg pl-9 pr-3 ${isCompact ? 'py-1 text-[10px]' : 'py-2 text-sm'} text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none w-40`}
                            placeholder={t('search_placeholder', settings.language)}
                        />
                    </div>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className={`bg-muted/50 border border-border rounded-lg px-3 ${isCompact ? 'py-1 text-[10px]' : 'py-2 text-sm'} text-foreground focus:border-primary/50 focus:outline-none [color-scheme:dark] dark:[color-scheme:dark]`}
                    />
                </div>
            </div>

            <div className="flex-1 relative border border-red-500/20 rounded-xl overflow-hidden shadow-inner bg-slate-100/30 dark:bg-slate-900/10 min-h-[600px]">
                {isLoading ? (
                    <div className="flex w-full h-full items-center justify-center flex-col gap-3 text-slate-500 animate-pulse">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                        <span className="font-bold uppercase tracking-widest text-xs">Loading operations data...</span>
                    </div>
                ) : (
                    <VirtualDatabaseTable
                        data={filteredSheets}
                        settings={settings}
                        currentUser={currentUser}
                        processingId={processingId}
                        searchQuery={searchQuery}
                        onDelete={handleDeleteSheet}
                        onQuickApprove={handleQuickApprove}
                        onQuickReject={handleQuickReject}
                        onRowClick={(sheet) => {
                            const isStagingUser = currentUser?.role === Role.STAGING_SUPERVISOR;
                            let target = `/sheets/staging/${sheet.id}`;

                            if (sheet.status === SheetStatus.COMPLETED) {
                                target = `/sheets/loading/${sheet.id}`;
                            } else if (
                                (sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING ||
                                    sheet.status === SheetStatus.LOCKED) &&
                                !isStagingUser
                            ) {
                                target = `/sheets/loading/${sheet.id}`;
                            }

                            navigate(target);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
