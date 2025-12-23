import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { SheetData, SheetStatus, Role, User } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { t } from "@/lib/i18n";

interface OperationalTableViewProps {
    sheets: SheetData[];
    activeSection: string;
    activeViewMode: string;
    onViewModeChange: (value: string) => void;
    currentUser: User | null;
    settings: any;
    refreshSheets: () => Promise<void>;
}

export function OperationalTableView({ sheets, activeSection, activeViewMode, onViewModeChange, currentUser, settings, refreshSheets }: OperationalTableViewProps) {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const isRejected = (s: SheetData) => !!s.rejectionReason;

    // --- Filter Logic ---
    // Debug log to confirm fresh params are arriving
    // console.log('OperationalTableView Debug:', { activeSection, activeViewMode });

    const filteredSheets = useMemo(() => {
        let relevantSheets = sheets;

        // 1. Context Filtering (Role/Tab specific)
        if (activeSection === 'loading_db') {
            // Loading tab only shows things ready to load or further
            relevantSheets = relevantSheets.filter(s =>
                s.status === SheetStatus.LOCKED ||
                s.status === SheetStatus.LOADING_VERIFICATION_PENDING ||
                s.status === SheetStatus.COMPLETED
            );
        }

        // 2. Search & Date Filter
        relevantSheets = relevantSheets.filter(sheet => {
            const matchesSearch = searchQuery === '' ||
                (sheet.supervisorName && sheet.supervisorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                sheet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sheet.shift && sheet.shift.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.destination && sheet.destination.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesDate = dateFilter === '' || (sheet.date && sheet.date.includes(dateFilter));
            return matchesSearch && matchesDate;
        });

        // 3. Sub Status Filtering using FRESH VIEW MODES
        let result = relevantSheets;

        if (activeSection === 'staging_db') {
            // VIEW_STAGING_DRAFT, VIEW_STAGING_VERIFY, VIEW_LOCKED, VIEW_COMPLETED, VIEW_STAGING_REJECTED
            // Also checking "DRAFT" etc as fallback if URL was manually typed, but aim for Constants.
            if (activeViewMode === 'VIEW_STAGING_DRAFT' || activeViewMode === 'DRAFT') result = relevantSheets.filter(s => s.status === SheetStatus.DRAFT && !isRejected(s));
            else if (activeViewMode === 'VIEW_STAGING_VERIFY' || activeViewMode === 'PENDING') result = relevantSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING);
            else if (activeViewMode === 'VIEW_LOCKED' || activeViewMode === 'LOCKED') result = relevantSheets.filter(s => s.status === SheetStatus.LOCKED);
            else if (activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED') result = relevantSheets.filter(s => s.status === SheetStatus.COMPLETED);
            else if (activeViewMode === 'VIEW_STAGING_REJECTED' || activeViewMode === 'REJECTED') result = relevantSheets.filter(s => s.status === SheetStatus.DRAFT && isRejected(s));
        }
        else if (activeSection === 'loading_db') {
            if (activeViewMode === 'VIEW_LOADING_READY' || activeViewMode === 'READY') result = relevantSheets.filter(s => s.status === SheetStatus.LOCKED);
            else if (activeViewMode === 'VIEW_LOADING_VERIFY' || activeViewMode === 'PENDING') result = relevantSheets.filter(s => s.status === SheetStatus.LOADING_VERIFICATION_PENDING);
            else if (activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED') result = relevantSheets.filter(s => s.status === SheetStatus.COMPLETED);
            else if (activeViewMode === 'VIEW_LOADING_REJECTED' || activeViewMode === 'REJECTED') result = relevantSheets.filter(s => (s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING) && isRejected(s));
        }
        else if (activeSection === 'shift_lead_db') {
            if (activeViewMode === 'VIEW_STAGING_VERIFY') result = relevantSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING);
            else if (activeViewMode === 'VIEW_LOADING_VERIFY') result = relevantSheets.filter(s => s.status === SheetStatus.LOADING_VERIFICATION_PENDING);
            else if (activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED') result = relevantSheets.filter(s => s.status === SheetStatus.COMPLETED);
            else if (activeViewMode === 'VIEW_STAGING_REJECTED') result = relevantSheets.filter(s => s.status === SheetStatus.DRAFT && isRejected(s));
            else if (activeViewMode === 'VIEW_LOADING_REJECTED') result = relevantSheets.filter(s => (s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING) && isRejected(s));
            else if (activeViewMode === 'ALL') {
                // Show everything relevant
            }
        }

        // 4. Final Sort
        return result.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    }, [sheets, activeSection, activeViewMode, searchQuery, dateFilter]);

    // Helpers
    const getDuration = (sheet: SheetData) => {
        if (sheet.status !== SheetStatus.COMPLETED || !sheet.updatedAt) return '-';
        const start = new Date(sheet.createdAt).getTime();
        const end = new Date(sheet.updatedAt).getTime();
        const diffMs = end - start;
        if (diffMs < 0) return '-';

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const handleDeleteSheet = async (sheetId: string) => {
        if (!confirm(t('delete_confirm', settings.language))) return;

        try {
            const { error } = await supabase.from('sheets').delete().eq('id', sheetId);
            if (error) throw error;
            addToast('success', t('sheet_deleted_successfully', settings.language));
            await refreshSheets();
        } catch (error: any) {
            addToast('error', t('failed_to_delete_sheet', settings.language) + ": " + error.message);
        }
    };

    // Quick Approve logic
    const handleQuickApprove = async (sheet: SheetData) => {
        if (!confirm(t('approve_confirm', settings.language))) return;
        setProcessingId(sheet.id);

        try {
            const nextStatus = sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING
                ? SheetStatus.LOCKED
                : SheetStatus.COMPLETED;

            const payload: Partial<SheetData> = {
                status: nextStatus,
                verifiedBy: currentUser?.username,
                verifiedAt: new Date().toISOString()
            };

            const { error } = await supabase.from('sheets').update(payload).eq('id', sheet.id);
            if (error) throw error;

            addToast('success', `${t('sheet_approved', settings.language)}: ${nextStatus.replace(/_/g, ' ')}`);
            await refreshSheets();
        } catch (err: any) {
            addToast('error', err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleQuickReject = async (sheet: SheetData) => {
        const reason = prompt(t('rejection_reason_prompt', settings.language));
        if (!reason) return;
        setProcessingId(sheet.id);

        try {
            const nextStatus = sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING
                ? SheetStatus.DRAFT
                : SheetStatus.LOCKED;

            const updates: Partial<SheetData> = {
                status: nextStatus,
                rejectionReason: reason,
                comments: [...(sheet.comments || []), {
                    id: crypto.randomUUID(),
                    text: `${t('rejected', settings.language)}: ${reason}`,
                    author: currentUser?.username || 'Admin',
                    timestamp: new Date().toISOString()
                }]
            };

            const { error } = await supabase.from('sheets').update(updates).eq('id', sheet.id);
            if (error) throw error;

            addToast('info', `${t('sheet_rejected_and_returned', settings.language)} ${nextStatus.replace(/_/g, ' ')}`);
            await refreshSheets();
        } catch (err: any) {
            addToast('error', err.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onViewModeChange('ALL')}
                        className={`text-xs ${activeViewMode === 'ALL' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'} uppercase`}
                    >
                        {t('all', settings.language)}
                    </Button>

                    {activeSection === 'staging_db' && (
                        <>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_STAGING_DRAFT')} className={`text-xs ${(activeViewMode === 'VIEW_STAGING_DRAFT' || activeViewMode === 'DRAFT') ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-blue-600 hover:bg-blue-50'} uppercase`}>{t('draft', settings.language)}</Button>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_STAGING_VERIFY')} className={`text-xs ${(activeViewMode === 'VIEW_STAGING_VERIFY' || activeViewMode === 'PENDING') ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-blue-600 hover:bg-blue-50'} uppercase border border-blue-100`}>{t('pending_verification', settings.language)}</Button>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_LOCKED')} className={`text-xs ${(activeViewMode === 'VIEW_LOCKED' || activeViewMode === 'LOCKED') ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-blue-600 hover:bg-blue-50'} uppercase`}>{t('locked_not_editable', settings.language)}</Button>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_COMPLETED')} className={`text-xs ${(activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED') ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-emerald-600 hover:bg-emerald-50'} uppercase`}>{t('completed', settings.language)}</Button>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_STAGING_REJECTED')} className={`text-xs ${(activeViewMode === 'VIEW_STAGING_REJECTED' || activeViewMode === 'REJECTED') ? 'bg-red-600 text-white font-bold shadow-sm' : 'text-red-600 hover:bg-red-50'} uppercase`}>{t('rejected', settings.language)}</Button>
                        </>
                    )}

                    {activeSection === 'loading_db' && (
                        <>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_LOADING_READY')} className={`text-xs ${(activeViewMode === 'VIEW_LOADING_READY' || activeViewMode === 'READY' || activeViewMode === 'LOCKED') ? 'bg-orange-600 text-white font-bold shadow-sm' : 'text-orange-600 hover:bg-orange-50'} uppercase border border-orange-100`}>{t('ready_to_load', settings.language)}</Button>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_LOADING_VERIFY')} className={`text-xs ${(activeViewMode === 'VIEW_LOADING_VERIFY' || activeViewMode === 'PENDING') ? 'bg-orange-600 text-white font-bold shadow-sm' : 'text-orange-600 hover:bg-orange-50'} uppercase border border-orange-100`}>{t('pending_verification', settings.language)}</Button>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_COMPLETED')} className={`text-xs ${(activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED') ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-emerald-600 hover:bg-emerald-50'} uppercase`}>{t('completed', settings.language)}</Button>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_LOADING_REJECTED')} className={`text-xs ${(activeViewMode === 'VIEW_LOADING_REJECTED' || activeViewMode === 'REJECTED') ? 'bg-red-600 text-white font-bold shadow-sm' : 'text-red-600 hover:bg-red-50'} uppercase`}>{t('rejected', settings.language)}</Button>
                        </>
                    )}

                    {activeSection === 'shift_lead_db' && (
                        <>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_STAGING_VERIFY')} className={`text-xs ${activeViewMode === 'VIEW_STAGING_VERIFY' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-blue-600 hover:bg-blue-50'} uppercase`}>{t('staging_approvals', settings.language)}</Button>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_LOADING_VERIFY')} className={`text-xs ${activeViewMode === 'VIEW_LOADING_VERIFY' ? 'bg-orange-600 text-white font-bold shadow-sm' : 'text-orange-600 hover:bg-orange-50'} uppercase`}>{t('loading_approvals', settings.language)}</Button>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_COMPLETED')} className={`text-xs ${(activeViewMode === 'VIEW_COMPLETED' || activeViewMode === 'COMPLETED') ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-emerald-600 hover:bg-emerald-50'} uppercase`}>{t('completed', settings.language)}</Button>

                            <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-1" />

                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_STAGING_REJECTED')} className={`text-xs ${activeViewMode === 'VIEW_STAGING_REJECTED' ? 'bg-red-600 text-white font-bold shadow-sm' : 'text-red-600 hover:bg-red-50'} uppercase`}>{t('staging_rejected', settings.language)}</Button>
                            <Button variant="ghost" onClick={() => onViewModeChange('VIEW_LOADING_REJECTED')} className={`text-xs ${activeViewMode === 'VIEW_LOADING_REJECTED' ? 'bg-red-600 text-white font-bold shadow-sm' : 'text-red-600 hover:bg-red-50'} uppercase`}>{t('loading_rejected', settings.language)}</Button>
                        </>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none w-40"
                            placeholder={t('search_placeholder', settings.language)}
                        />
                    </div>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none [color-scheme:dark] dark:[color-scheme:dark]"
                    />
                </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card/50">
                <table className="w-full text-left text-sm table-fixed">
                    <thead>
                        <tr className="bg-muted/50 text-muted-foreground border-b border-border sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <th className={`pl-4 font-medium w-[15%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('sheet_id', settings.language)}</th>
                            <th className={`font-medium w-[20%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('supervisor', settings.language)}</th>
                            <th className={`font-medium w-[26%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('shift_dest', settings.language)}</th>
                            <th className={`font-medium w-[10%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('duration', settings.language)}</th>
                            <th className={`font-medium w-[11%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('date', settings.language)}</th>
                            <th className={`font-medium w-[12%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('status', settings.language)}</th>
                            <th className={`pr-4 text-right w-[6%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('action', settings.language)}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredSheets.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-3">
                                            <Search size={32} strokeWidth={1.5} />
                                        </div>
                                        <div className="text-lg font-medium text-slate-900 dark:text-slate-200">{t('no_sheets_found', settings.language)}</div>
                                        <p className="text-sm mt-1 max-w-xs mx-auto">
                                            {searchQuery ? 'Try adjusting your search filters.' : 'There are no active tasks in this view.'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredSheets.map(sheet => (
                            <tr key={sheet.id} className="group hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => {
                                const isStagingUser = currentUser?.role === Role.STAGING_SUPERVISOR;
                                let target = `/sheets/staging/${sheet.id}`;

                                if (sheet.status === SheetStatus.COMPLETED) {
                                    target = `/sheets/loading/${sheet.id}`;
                                } else if ((sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING || sheet.status === SheetStatus.LOCKED) && !isStagingUser) {
                                    target = `/sheets/loading/${sheet.id}`;
                                }

                                navigate(target);
                            }}>
                                <td className={`pl-4 text-blue-600 dark:text-blue-400 font-mono text-[10px] truncate ${settings.density === 'compact' ? 'py-1' : 'py-3'}`} title={sheet.id}>#{sheet.id.slice(-8)}</td>
                                <td className={`text-foreground truncate pr-2 ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    <div className="truncate font-medium">{sheet.supervisorName}</div>
                                    <div className="text-[10px] text-muted-foreground truncate">{sheet.empCode}</div>
                                </td>
                                <td className={`text-xs text-muted-foreground truncate pr-2 ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    <div className="text-foreground/80 font-medium truncate">{sheet.shift}</div>
                                    <div className="text-[10px] text-muted-foreground truncate">{sheet.destination || sheet.loadingDoc || '-'}</div>
                                </td>
                                <td className={`text-[10px] text-slate-600 dark:text-slate-400 font-mono truncate ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>{getDuration(sheet)}</td>
                                <td className={`text-xs text-slate-600 dark:text-slate-400 truncate ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>{new Date(sheet.date).toLocaleDateString()}</td>
                                <td className={`${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    <Badge variant="outline" className={`
                                        ${sheet.status === SheetStatus.COMPLETED ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                            isRejected(sheet) ? 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10' :
                                                sheet.status.includes('PENDING') || sheet.status === SheetStatus.LOCKED ? 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10' :
                                                    'text-muted-foreground border-border'
                                        }
`}>
                                        {(() => {
                                            if (sheet.status === SheetStatus.LOCKED && (currentUser?.role === Role.LOADING_SUPERVISOR || currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD)) {
                                                return t('ready_to_load', settings.language);
                                            }
                                            return t(sheet.status.toLowerCase() as any, settings.language).replace(/_/g, ' ');
                                        })()}
                                    </Badge>
                                </td>
                                <td className={`pr-4 text-right flex justify-end gap-2 ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    {currentUser?.role === Role.SHIFT_LEAD && sheet.status.includes('PENDING') && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={processingId === sheet.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickReject(sheet);
                                                }}
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                title={t('quick_reject', settings.language)}
                                            >
                                                <XCircle size={18} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={processingId === sheet.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickApprove(sheet);
                                                }}
                                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors"
                                                title={t('quick_approve', settings.language)}
                                            >
                                                <CheckCircle size={18} />
                                            </Button>
                                        </div>
                                    )}

                                    {currentUser?.role === Role.ADMIN && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSheet(sheet.id);
                                            }}
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 opacity-60 group-hover:opacity-100"
                                            title={t('delete_sheet', settings.language)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const isStagingUser = currentUser?.role === Role.STAGING_SUPERVISOR;
                                            let target = `/sheets/staging/${sheet.id}`;
                                            if (sheet.status === SheetStatus.COMPLETED) {
                                                target = `/sheets/loading/${sheet.id}`;
                                            } else if ((sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING || sheet.status === SheetStatus.LOCKED) && !isStagingUser) {
                                                target = `/sheets/loading/${sheet.id}`;
                                            }
                                            navigate(target);
                                        }}
                                        title={t('view_details', settings.language)}
                                    >
                                        <ArrowRight size={16} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
