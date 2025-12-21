import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { SheetData, SheetStatus, Role, User } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { t } from "@/lib/i18n";

interface OperationalTableViewProps {
    sheets: SheetData[];
    activeTab: string;
    currentUser: User | null;
    settings: any;
    refreshSheets: () => Promise<void>;
}

export function OperationalTableView({ sheets, activeTab, currentUser, settings, refreshSheets }: OperationalTableViewProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { addToast } = useToast();

    // Local filter state
    const [subFilter, setSubFilter] = useState<string>('ALL');
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Sync subFilter from URL if present
    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (filterParam) {
            setSubFilter(filterParam);
        } else {
            setSubFilter('ALL');
        }
    }, [searchParams, activeTab]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // --- Filter Logic ---
    const filteredSheets = useMemo(() => {
        let relevantSheets = sheets;

        // 0. STRICT USER FILTERING (Security Layer)
        if (currentUser?.role !== Role.ADMIN) {
            relevantSheets = relevantSheets.filter(sheet => {
                if (currentUser?.role === Role.STAGING_SUPERVISOR) {
                    const sName = (sheet.supervisorName || '').toLowerCase().trim();
                    const uName = (currentUser.username || '').toLowerCase().trim();
                    const fName = (currentUser.fullName || '').toLowerCase().trim();
                    const isMine = sName === uName || sName === fName;

                    if (isMine) return true;
                    // Allow viewing Team's Pending/Locked/Completed sheets (Global Visibility)
                    return sheet.status !== SheetStatus.DRAFT;
                }
                if (currentUser?.role === Role.LOADING_SUPERVISOR) {
                    return sheet.status === SheetStatus.LOCKED ||
                        sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING ||
                        (sheet.status === SheetStatus.COMPLETED && (activeTab === 'database' || activeTab === 'loading_db'));
                }
                if (currentUser?.role === Role.SHIFT_LEAD) {
                    return sheet.status !== SheetStatus.DRAFT;
                }
                return false;
            });
        }

        // 1. Filter by Active Tab context
        if (activeTab === 'loading_db') {
            relevantSheets = relevantSheets.filter(s => s.status !== SheetStatus.DRAFT && s.status !== SheetStatus.STAGING_VERIFICATION_PENDING);
        }

        // 2. Global Search & Date
        relevantSheets = relevantSheets.filter(sheet => {
            const matchesSearch = searchQuery === '' ||
                (sheet.supervisorName && sheet.supervisorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                sheet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sheet.shift && sheet.shift.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.destination && sheet.destination.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesDate = dateFilter === '' || (sheet.date && sheet.date.includes(dateFilter));
            return matchesSearch && matchesDate;
        });

        // 3. Sub Filters
        const isRejected = (s: SheetData) => Array.isArray(s.comments) && s.comments.length > 0;

        if (activeTab === 'staging_db') {
            if (subFilter === 'ACTIVE') return relevantSheets.filter(s => s.status === SheetStatus.DRAFT || s.status === SheetStatus.STAGING_VERIFICATION_PENDING);
            if (subFilter === 'DRAFT') return relevantSheets.filter(s => s.status === SheetStatus.DRAFT && !isRejected(s));
            if (subFilter === 'PENDING') return relevantSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING);
            if (subFilter === 'LOCKED') return relevantSheets.filter(s => s.status === SheetStatus.LOCKED);
            if (subFilter === 'COMPLETED') return relevantSheets.filter(s => s.status === SheetStatus.COMPLETED);
            if (subFilter === 'REJECTED') return relevantSheets.filter(s => s.status === SheetStatus.DRAFT && isRejected(s));
        }
        else if (activeTab === 'loading_db') {
            if (subFilter === 'READY') return relevantSheets.filter(s => s.status === SheetStatus.LOCKED);
            if (subFilter === 'PENDING') return relevantSheets.filter(s => s.status === SheetStatus.LOADING_VERIFICATION_PENDING);
            if (subFilter === 'COMPLETED') return relevantSheets.filter(s => s.status === SheetStatus.COMPLETED);
            if (subFilter === 'REJECTED') return relevantSheets.filter(s => s.status === SheetStatus.LOCKED && isRejected(s));
        }
        else if (activeTab === 'shift_lead_db') {
            if (subFilter === 'STAGING_APPROVALS') return relevantSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING);
            if (subFilter === 'LOADING_APPROVALS') return relevantSheets.filter(s => s.status === SheetStatus.LOADING_VERIFICATION_PENDING);
            if (subFilter === 'COMPLETED') return relevantSheets.filter(s => s.status === SheetStatus.COMPLETED);

            if (subFilter === 'STAGING_REJECTED') return relevantSheets.filter(s => s.status === SheetStatus.DRAFT && isRejected(s));
            if (subFilter === 'LOADING_REJECTED') return relevantSheets.filter(s => (s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING) && isRejected(s));
        }

        return relevantSheets;
    }, [sheets, activeTab, subFilter, searchQuery, dateFilter, currentUser]);

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

    const FilterBar = () => (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
                <Button variant={subFilter === 'ALL' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('ALL')} className="text-xs">{t('all', settings.language)}</Button>

                {activeTab === 'staging_db' && (
                    <>
                        <Button variant={subFilter === 'DRAFT' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('DRAFT')} className={`text-xs ${subFilter === 'DRAFT' ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('draft', settings.language)}</Button>
                        <Button variant={subFilter === 'PENDING' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('PENDING')} className={`text-xs ${subFilter === 'PENDING' ? 'bg-orange-100 text-orange-900' : 'text-orange-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('pending_verification', settings.language)}</Button>
                        <Button variant={subFilter === 'LOCKED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOCKED')} className={`text-xs ${subFilter === 'LOCKED' ? 'bg-blue-100 text-blue-900' : 'text-blue-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('locked_not_editable', settings.language)}</Button>
                        <Button variant={subFilter === 'COMPLETED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('COMPLETED')} className={`text-xs ${subFilter === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900' : 'text-emerald-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('completed', settings.language)}</Button>
                        <Button variant={subFilter === 'REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('REJECTED')} className={`text-xs ${subFilter === 'REJECTED' ? 'bg-red-100 text-red-900' : 'text-red-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('rejected', settings.language)}</Button>
                    </>
                )}

                {activeTab === 'loading_db' && (
                    <>
                        <Button variant={subFilter === 'READY' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('READY')} className={`text-xs ${subFilter === 'READY' ? 'bg-blue-100 text-blue-900' : 'text-blue-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('ready_to_load', settings.language)}</Button>
                        <Button variant={subFilter === 'PENDING' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('PENDING')} className={`text-xs ${subFilter === 'PENDING' ? 'bg-orange-100 text-orange-900' : 'text-orange-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('pending_verification', settings.language)}</Button>
                        <Button variant={subFilter === 'COMPLETED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('COMPLETED')} className={`text-xs ${subFilter === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900' : 'text-emerald-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('completed', settings.language)}</Button>
                        <Button variant={subFilter === 'REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('REJECTED')} className={`text-xs ${subFilter === 'REJECTED' ? 'bg-red-100 text-red-900' : 'text-red-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('rejected', settings.language)}</Button>
                    </>
                )}

                {activeTab === 'shift_lead_db' && (
                    <>
                        <Button variant={subFilter === 'STAGING_APPROVALS' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('STAGING_APPROVALS')} className={`text-xs ${subFilter === 'STAGING_APPROVALS' ? 'bg-blue-100 text-blue-900' : 'text-blue-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('staging_approvals', settings.language)}</Button>
                        <Button variant={subFilter === 'LOADING_APPROVALS' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOADING_APPROVALS')} className={`text-xs ${subFilter === 'LOADING_APPROVALS' ? 'bg-orange-100 text-orange-900' : 'text-orange-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('loading_approvals', settings.language)}</Button>
                        <Button variant={subFilter === 'COMPLETED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('COMPLETED')} className={`text-xs ${subFilter === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900' : 'text-emerald-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('completed', settings.language)}</Button>

                        <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-1" />

                        <Button variant={subFilter === 'STAGING_REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('STAGING_REJECTED')} className={`text-xs ${subFilter === 'STAGING_REJECTED' ? 'bg-red-100 text-red-900' : 'text-red-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('staging_rejected', settings.language)}</Button>
                        <Button variant={subFilter === 'LOADING_REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOADING_REJECTED')} className={`text-xs ${subFilter === 'LOADING_REJECTED' ? 'bg-red-100 text-red-900' : 'text-red-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white uppercase`}>{t('loading_rejected', settings.language)}</Button>
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
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {FilterBar()}

            <div className="rounded-xl border border-border overflow-hidden bg-card/50 overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[800px]">
                    <thead>
                        <tr className="bg-muted/50 text-muted-foreground border-b border-border sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <th className={`pl-4 font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('sheet_id', settings.language)}</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('supervisor', settings.language)}</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('shift_dest', settings.language)}</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('duration', settings.language)}</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('date', settings.language)}</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('status', settings.language)}</th>
                            <th className={`pr-4 text-right ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('action', settings.language)}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredSheets.length === 0 ? (
                            <tr><td colSpan={7} className="py-8 text-center text-slate-500">{t('no_sheets_found', settings.language)}</td></tr>
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
                                <td className={`pl-4 text-blue-600 dark:text-blue-400 font-mono text-xs ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>{sheet.id}</td>
                                <td className={`text-foreground ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    {sheet.supervisorName}
                                    <div className="text-xs text-muted-foreground">{sheet.empCode}</div>
                                </td>
                                <td className={`text-xs text-muted-foreground ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    {sheet.shift}
                                    <div className="text-xs text-muted-foreground">{sheet.destination || sheet.loadingDoc || '-'}</div>
                                </td>
                                <td className={`text-xs text-slate-600 dark:text-slate-400 font-mono ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>{getDuration(sheet)}</td>
                                <td className={`text-slate-600 dark:text-slate-400 ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>{new Date(sheet.date).toLocaleDateString()}</td>
                                <td className={`${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    <Badge variant="outline" className={`
                                        ${sheet.status === SheetStatus.COMPLETED ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                            sheet.status.includes('REJECTED') || (sheet.comments && sheet.comments.length > 0 && sheet.status === SheetStatus.DRAFT) ? 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10' :
                                                sheet.status.includes('PENDING') || sheet.status === SheetStatus.LOCKED ? 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10' :
                                                    'text-muted-foreground border-border'
                                        }
`}>
                                        {t(sheet.status.toLowerCase() as any, settings.language).replace(/_/g, ' ')}
                                    </Badge>
                                </td>
                                <td className={`pr-4 text-right flex justify-end gap-2 ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    {currentUser?.role === Role.SHIFT_LEAD && sheet.status.includes('PENDING') && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={processingId === sheet.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickReject(sheet);
                                                }}
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 bg-white shadow-sm ring-1 ring-slate-200"
                                                title={t('quick_reject', settings.language)}
                                            >
                                                <XCircle size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={processingId === sheet.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickApprove(sheet);
                                                }}
                                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10 bg-white shadow-sm ring-1 ring-slate-200"
                                                title={t('quick_approve', settings.language)}
                                            >
                                                <CheckCircle size={16} />
                                            </Button>
                                        </>
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
