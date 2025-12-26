import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { SheetData, SheetStatus, Role, User } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Printer, Trash2, Layers, Package, CheckCircle, LayoutGrid, XCircle, List, Calendar, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { OperationsMonitor } from "./OperationsMonitor";
import { t } from "@/lib/i18n";

interface DatabaseViewProps {
    sheets: SheetData[];
    currentUser: User | null;
    settings: any;
    refreshSheets: () => Promise<void>;
}

export function DatabaseView({ sheets, currentUser, settings, refreshSheets }: DatabaseViewProps) {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { updateSheet, deleteSheet } = useData();

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState<'ALL' | 'STAGING' | 'LOADING' | 'COMPLETED'>('ALL');
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [timeFilter, setTimeFilter] = useState<'ALL' | '30D' | '90D' | 'CUSTOM'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'updatedAt', direction: 'desc' });

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const filteredSheets = useMemo(() => {
        let relevantSheets = [...sheets];

        // 0. Time Filtering
        if (timeFilter !== 'ALL') {
            if (timeFilter === 'CUSTOM') {
                if (startDate) {
                    const start = new Date(startDate);
                    relevantSheets = relevantSheets.filter(s => new Date(s.createdAt) >= start);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    relevantSheets = relevantSheets.filter(s => new Date(s.createdAt) <= end);
                }
            } else {
                const now = new Date();
                const days = timeFilter === '30D' ? 30 : 90;
                const threshold = new Date(now.setDate(now.getDate() - days));
                relevantSheets = relevantSheets.filter(s => new Date(s.createdAt) >= threshold);
            }
        }

        // 1. Stage Filtering (Grouping Statuses)
        if (stageFilter !== 'ALL') {
            relevantSheets = relevantSheets.filter(sheet => {
                if (stageFilter === 'STAGING') return sheet.status === SheetStatus.DRAFT || sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING;
                if (stageFilter === 'LOADING') return sheet.status === SheetStatus.LOCKED || sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING;
                if (stageFilter === 'COMPLETED') return sheet.status === SheetStatus.COMPLETED;
                return true;
            });
        }

        // 1. Global Search
        relevantSheets = relevantSheets.filter(sheet => {
            const matchesSearch = searchQuery === '' ||
                (sheet.supervisorName && sheet.supervisorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.loadingSvName && sheet.loadingSvName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.verifiedBy && sheet.verifiedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
                sheet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sheet.shift && sheet.shift.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.destination && sheet.destination.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesSearch;
        });

        return relevantSheets.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof SheetData];
            const bValue = b[sortConfig.key as keyof SheetData];

            const getTimeSafe = (d: any) => {
                const t = new Date(d).getTime();
                return isNaN(t) ? 0 : t;
            };

            // 1. ID Sorting (Numeric)
            if (sortConfig.key === 'id') {
                const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
                return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
            }

            // 2. Date Sorting
            if (sortConfig.key === 'date' || sortConfig.key === 'updatedAt') {
                const dateA = getTimeSafe(a.date || a.createdAt);
                const dateB = getTimeSafe(b.date || b.createdAt);
                const diff = sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;

                // Tie-breaker: If dates are same, sort by created time desc
                if (diff === 0) {
                    return getTimeSafe(b.updatedAt || b.createdAt) - getTimeSafe(a.updatedAt || a.createdAt);
                }
                return diff;
            }

            if ((aValue || '') < (bValue || '')) return sortConfig.direction === 'asc' ? -1 : 1;
            if ((aValue || '') > (bValue || '')) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sheets, stageFilter, searchQuery, sortConfig]);

    // Duration Helper
    const getDuration = (sheet: any) => {
        if (sheet.status !== SheetStatus.COMPLETED || !sheet.updatedAt) return '-';
        const start = new Date(sheet.createdAt).getTime();
        const end = new Date(sheet.updatedAt).getTime();
        const diffMs = end - start;
        if (diffMs < 0) return '-';

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const formatDate = (date: any) => {
        if (!date) return '---';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '---' : d.toLocaleString();
    };

    const handleDeleteSheet = async (sheetId: string) => {
        if (!confirm(t('delete_confirm', settings.language))) return;

        try {
            const { error } = await deleteSheet(sheetId);
            if (error) throw error;
            addToast('success', t('sheet_deleted_successfully', settings.language));
            await refreshSheets();
        } catch (error: any) {
            addToast('error', t('failed_to_delete_sheet', settings.language) + ": " + error.message);
        }
    };

    const handleUpdateStatus = async (sheetId: string, newStatus: SheetStatus) => {
        try {
            const currentSheet = sheets.find(s => s.id === sheetId);
            if (!currentSheet) return;

            const updatedSheet = {
                ...currentSheet,
                status: newStatus,
                verifiedBy: currentUser?.fullName,
                verifiedAt: new Date().toISOString()
            };

            const { error } = await updateSheet(updatedSheet);
            if (error) throw error;
            addToast('success', `${t('status_updated', settings.language)}: ${newStatus}`);
            await refreshSheets();
        } catch (error: any) {
            addToast('error', t('failed_to_update_status', settings.language) + ": " + error.message);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm backdrop-blur-xl">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Layers className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{t('full_database', settings.language)}</h3>

                    </div>
                    <p className="text-sm text-muted-foreground/80 font-medium">{t('database_desc', settings.language)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Time Filtering Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                        {(['ALL', '30D', '90D', 'CUSTOM'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeFilter(range)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-black transition-all ${timeFilter === range ? 'bg-white dark:bg-slate-600 text-primary shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {range === 'ALL' ? 'All Time' : range === '30D' ? '30 Days' : range === '90D' ? '3 Months' : 'Custom'}
                            </button>
                        ))}
                    </div>

                    {/* Custom DateTime Inputs */}
                    {timeFilter === 'CUSTOM' && (
                        <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-300">
                            <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100 dark:border-white/5">
                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                    <div className="flex flex-col">
                                        <span className="text-[7px] uppercase font-bold text-slate-400 leading-tight">Start Time</span>
                                        <input
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold outline-none w-[145px] cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5">
                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                    <div className="flex flex-col">
                                        <span className="text-[7px] uppercase font-bold text-slate-400 leading-tight">End Time</span>
                                        <input
                                            type="datetime-local"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold outline-none w-[145px] cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modern Stage Filters */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                        <FilterButton
                            active={stageFilter === 'ALL'}
                            onClick={() => setStageFilter('ALL')}
                            icon={<LayoutGrid size={14} />}
                            label={t('all', settings.language)}
                        />
                        <FilterButton
                            active={stageFilter === 'STAGING'}
                            onClick={() => setStageFilter('STAGING')}
                            icon={<Layers size={14} />}
                            label={t('staging', settings.language)}
                        />
                        <FilterButton
                            active={stageFilter === 'LOADING'}
                            onClick={() => setStageFilter('LOADING')}
                            icon={<Package size={14} />}
                            label={t('loading', settings.language)}
                        />
                        <FilterButton
                            active={stageFilter === 'COMPLETED'}
                            onClick={() => setStageFilter('COMPLETED')}
                            icon={<CheckCircle size={14} />}
                            label={t('completed', settings.language)}
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner ml-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white shadow text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Board View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>

                    <div className="relative group flex-grow md:flex-grow-0">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none w-full md:w-64 transition-all shadow-sm"
                            placeholder={t('search_placeholder', settings.language)}
                        />
                    </div>
                </div>
            </div>

            {viewMode === 'board' ? (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <OperationsMonitor sheets={filteredSheets} onRefresh={refreshSheets} />
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden bg-white dark:bg-slate-900/20 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="w-full">
                        <div className="bg-slate-50/80 dark:bg-slate-950/50 text-slate-500 border-b border-slate-200 dark:border-white/5 backdrop-blur-sm sticky top-0 z-10 flex font-bold text-[9px] uppercase tracking-widest px-4">
                            <div
                                className={`w-[10%] ${settings.density === 'compact' ? 'py-2' : 'py-3'} cursor-pointer hover:text-primary transition-colors flex items-center gap-1 group`}
                                onClick={() => handleSort('id')}
                            >
                                {t('id', settings.language)}
                                {sortConfig.key === 'id' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                )}
                                {sortConfig.key !== 'id' && <ArrowDown size={12} className="opacity-0 group-hover:opacity-50" />}
                            </div>
                            <div className={`w-[12%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>
                                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" />{t('staging_sv', settings.language)}</span>
                            </div>
                            <div className={`w-[12%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>
                                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />{t('loading_sv', settings.language)}</span>
                            </div>
                            <div className={`w-[12%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>
                                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-400" />{t('approval_sv', settings.language)}</span>
                            </div>
                            <div className={`w-[14%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('destination', settings.language)}</div>
                            <div
                                className={`w-[12%] ${settings.density === 'compact' ? 'py-2' : 'py-3'} cursor-pointer hover:text-primary transition-colors flex items-center gap-1 group`}
                                onClick={() => handleSort('date')}
                            >
                                Date
                                {sortConfig.key === 'date' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                )}
                                {sortConfig.key !== 'date' && <ArrowDown size={12} className="opacity-0 group-hover:opacity-50" />}
                            </div>
                            <div className={`w-[8%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('duration', settings.language)}</div>
                            <div className={`w-[10%] ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>{t('status', settings.language)}</div>
                            <div className={`w-[10%] text-right font-medium px-4 ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>{t('actions', settings.language)}</div>
                        </div>

                        {filteredSheets.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 animate-pulse">{t('no_sheets_found_matching', settings.language)}</div>
                        ) : (
                            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                {filteredSheets.map((sheet) => {
                                    const isCompleted = sheet.status === SheetStatus.COMPLETED;

                                    return (
                                        <div
                                            key={sheet.id}
                                            className="flex items-center px-4 hover:bg-slate-50 dark:hover:bg-primary/5 transition-all cursor-pointer border-b border-slate-100 dark:border-white/5 group text-sm relative min-h-[68px]"
                                            onClick={() => {
                                                const useLoadingSheet =
                                                    sheet.status === SheetStatus.LOCKED ||
                                                    sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING ||
                                                    sheet.status === SheetStatus.COMPLETED;

                                                navigate(useLoadingSheet ? `/sheets/loading/${sheet.id}` : `/sheets/staging/${sheet.id}`);
                                            }}
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                                            <div className="w-[10%] font-mono text-[10px] font-bold text-slate-500 group-hover:text-primary transition-colors truncate pr-2">#{sheet.id.slice(-8)}</div>

                                            {/* Timeline Columns */}
                                            <div className="w-[12%] font-medium text-slate-900 dark:text-slate-200 truncate pr-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span className="truncate text-xs">{sheet.supervisorName || '-'}</span>
                                                </div>
                                            </div>

                                            <div className="w-[12%] text-slate-600 dark:text-slate-400 truncate pr-4">
                                                {sheet.loadingSvName ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                        <span className="truncate text-xs">{sheet.loadingSvName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 ml-3">—</span>
                                                )}
                                            </div>

                                            <div className="w-[12%] text-slate-600 dark:text-slate-400 truncate pr-4">
                                                {(() => {
                                                    const approver = sheet.verifiedBy || sheet.completedBy || sheet.loadingApprovedBy;
                                                    return approver ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                                                            <span className="truncate text-xs">{approver}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600 ml-3">—</span>
                                                    );
                                                })()}
                                            </div>

                                            <div className="w-[14%] truncate text-slate-500 pr-4">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-medium truncate">{sheet.destination || '-'}</span>
                                                    <div className="flex items-center gap-2 text-[10px] opacity-60">
                                                        <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded uppercase tracking-tighter">{sheet.shift}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-[12%] truncate text-slate-600 dark:text-slate-400 text-xs font-medium pr-4">
                                                {formatDate(sheet.date || sheet.createdAt)}
                                            </div>

                                            <div className="w-[8%] text-[10px] font-mono text-slate-400 font-medium">{getDuration(sheet)}</div>

                                            <div className="w-[10%]">
                                                <Badge variant="outline" className={`
                                                text-[10px] font-extrabold uppercase tracking-tight px-3 py-1 rounded-full whitespace-nowrap border-2
                                                ${isCompleted ? 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10 dark:text-emerald-400' :
                                                        sheet.status.includes('PENDING') ? 'text-amber-600 border-amber-500/20 bg-amber-500/10 dark:text-amber-400' :
                                                            sheet.status === SheetStatus.LOCKED ? 'text-indigo-600 border-indigo-500/20 bg-indigo-500/10 dark:text-indigo-400' :
                                                                'text-slate-500 border-slate-200 bg-slate-50 dark:text-slate-400 dark:border-white/10 dark:bg-white/5'}`}>
                                                    {(() => {
                                                        // Custom Override: Show "READY TO LOAD" for Loading Team when status is LOCKED
                                                        if (sheet.status === SheetStatus.LOCKED && (currentUser?.role === Role.LOADING_SUPERVISOR || currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD)) {
                                                            return t('ready_to_load', settings.language);
                                                        }
                                                        return t(sheet.status.toLowerCase() as any, settings.language).replace(/_/g, ' ');
                                                    })()}
                                                </Badge>
                                            </div>

                                            <div className="w-[10%] flex justify-end gap-1 px-4" onClick={e => e.stopPropagation()}>
                                                {/* Quick Actions for Admin */}
                                                {currentUser?.role === Role.ADMIN && (
                                                    <>
                                                        {(sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING || sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING) && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10 transition-all"
                                                                    title={t('approve', settings.language)}
                                                                    onClick={() => handleUpdateStatus(sheet.id, sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING ? SheetStatus.LOCKED : SheetStatus.COMPLETED)}
                                                                >
                                                                    <CheckCircle size={14} />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10 transition-all"
                                                                    title={t('reject', settings.language)}
                                                                    onClick={() => handleUpdateStatus(sheet.id, sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING ? SheetStatus.DRAFT : SheetStatus.LOCKED)}
                                                                >
                                                                    <XCircle size={14} />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all" onClick={() => navigate(isCompleted ? `/sheets/loading/${sheet.id}` : `/sheets/staging/${sheet.id}`)}>
                                                    <Printer size={14} className="opacity-70 group-hover:opacity-100" />
                                                </Button>
                                                {currentUser?.role === Role.ADMIN && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500 transition-all" onClick={() => handleDeleteSheet(sheet.id)}>
                                                        <Trash2 size={14} className="opacity-70 group-hover:opacity-100" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all 
                ${active
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary ring-1 ring-slate-200 dark:ring-white/10 scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-white/5'
                }
            `}
        >
            {icon}
            {label}
        </button>
    );
}
