import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Search,
    RefreshCw,
    Download,
    X,
    XCircle,
    Layers,
    Package,
    CheckCircle,
    LayoutGrid,
    Database as DbIcon,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { SheetData, SheetStatus, Role } from '@/types';
import { t } from '@/lib/i18n';
import { exportToExcelGeneric } from '@/lib/excelExport';

export default function DatabasePage() {
    const { sheets, loading, refreshSheets, loadMoreArchived, currentUser, updateSheet } =
        useData();
    const { settings } = useAppState();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeFilter = searchParams.get('filter');

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [stageFilter, setStageFilter] = useState<'ALL' | 'STAGING' | 'LOADING' | 'COMPLETED'>(
        'ALL'
    );
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'date',
        direction: 'desc'
    });

    const handleSort = (key: string) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    // Filter Logic
    const filteredSheets = useMemo<SheetData[]>(() => {
        let relevantSheets = [...sheets];

        // 0. Role-Based Pre-filtering
        if (currentUser?.role !== Role.ADMIN) {
            // Supervisors see all sheets (read-only)
            // But we could add specific restrictions here if needed.
        }

        // 0. Stage Filtering
        if (stageFilter !== 'ALL') {
            relevantSheets = relevantSheets.filter((sheet) => {
                if (stageFilter === 'STAGING')
                    return (
                        sheet.status === SheetStatus.DRAFT ||
                        sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING
                    );
                if (stageFilter === 'LOADING')
                    return (
                        sheet.status === SheetStatus.LOCKED ||
                        sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING
                    );
                if (stageFilter === 'COMPLETED') return sheet.status === SheetStatus.COMPLETED;
                return true;
            });
        }

        // 1. Search Query Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            relevantSheets = relevantSheets.filter((s) => {
                const matchesId = s.id.toLowerCase().includes(query);
                const matchesSupervisor = s.supervisorName?.toLowerCase().includes(query);
                const matchesLoader = s.loadingSvName?.toLowerCase().includes(query);
                const matchesApprover = s.verifiedBy?.toLowerCase().includes(query);
                const matchesDest = s.destination?.toLowerCase().includes(query);
                return (
                    matchesId ||
                    matchesSupervisor ||
                    matchesLoader ||
                    matchesApprover ||
                    matchesDest
                );
            });
        }

        // 2. Tab/Status Filter
        if (activeFilter) {
            if (Object.values(SheetStatus).includes(activeFilter as SheetStatus)) {
                relevantSheets = relevantSheets.filter((s) => s.status === activeFilter);
            } else if (activeFilter === 'READY') {
                relevantSheets = relevantSheets.filter((s) => s.status === SheetStatus.LOCKED);
            }
        }

        return relevantSheets.sort((a, b) => {
            const getKey = (item: SheetData, key: string) => {
                if (key === 'date') return item.date || item.createdAt || '';
                const val = item[key as keyof SheetData];
                return val === undefined || val === null ? '' : val;
            };

            const aValue = getKey(a, sortConfig.key);
            const bValue = getKey(b, sortConfig.key);

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
            if (sortConfig.key === 'date') {
                const dateA = getTimeSafe(aValue);
                const dateB = getTimeSafe(bValue);
                const diff = sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;

                // Tie-breaker: sort by created time desc
                if (diff === 0) {
                    return (
                        getTimeSafe(b.updatedAt || b.createdAt) -
                        getTimeSafe(a.updatedAt || a.createdAt)
                    );
                }
                return diff;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sheets, stageFilter, searchQuery, activeFilter, sortConfig, currentUser?.role]);

    const clearFilter = () => {
        setSearchParams({});
        setSearchQuery('');
        setStageFilter('ALL');
    };

    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        await loadMoreArchived();
        setIsLoadingMore(false);
    };

    const handleUpdateStatus = async (sheetId: string, newStatus: SheetStatus) => {
        try {
            const currentSheet = sheets.find((s) => s.id === sheetId);
            if (!currentSheet) {
                console.error('Sheet not found for update');
                return;
            }

            const updatedSheet = {
                ...currentSheet,
                status: newStatus,
                verifiedBy: currentUser?.fullName,
                verifiedAt: new Date().toISOString()
            };

            await updateSheet(updatedSheet);
            // Context handles cache invalidation
        } catch (error: unknown) {
            console.error(
                'Failed to update status',
                error instanceof Error ? error.message : String(error)
            );
        }
    };

    const handleExport = () => {
        const exportData = filteredSheets.map((sheet) => ({
            ID: sheet.id,
            Date: new Date(sheet.date).toLocaleDateString(),
            Staging_SV: sheet.supervisorName,
            Loading_SV: sheet.loadingSvName || 'N/A',
            Approved_By: sheet.verifiedBy || 'N/A',
            Destination: sheet.destination,
            Status: sheet.status
        }));

        exportToExcelGeneric(exportData, 'Operations_Report', 'Operations');
    };

    const stats = useMemo(() => {
        return {
            total: sheets.length,
            staging: sheets.filter(
                (s) =>
                    s.status === SheetStatus.DRAFT ||
                    s.status === SheetStatus.STAGING_VERIFICATION_PENDING
            ).length,
            loading: sheets.filter(
                (s) =>
                    s.status === SheetStatus.LOCKED ||
                    s.status === SheetStatus.LOADING_VERIFICATION_PENDING
            ).length,
            completed: sheets.filter((s) => s.status === SheetStatus.COMPLETED).length
        };
    }, [sheets]);

    const getDuration = (sheet: SheetData) => {
        if (!sheet.createdAt || !sheet.updatedAt) return '-';
        const start = new Date(sheet.createdAt).getTime();
        const end = new Date(sheet.updatedAt).getTime();
        const diff = end - start;
        if (diff < 0) return '-';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (loading && sheets.length === 0)
        return (
            <div className="p-8 text-slate-400 font-medium animate-pulse">
                {t('loading_dots', settings.language)}
            </div>
        );

    return (
        <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 bg-slate-50/50 dark:bg-slate-950/20 min-h-screen">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <DbIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-extrabold text-foreground tracking-tight">
                                {t('database', settings.language)}
                            </h2>
                            <p className="text-muted-foreground text-lg font-medium">
                                {t('database_desc', settings.language)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        onClick={() => refreshSheets()}
                        className="border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground h-12 px-5 rounded-xl shadow-sm bg-white dark:bg-slate-900/50"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin mr-2' : 'mr-2'} />{' '}
                        {t('refresh', settings.language)}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="gap-2 border-slate-200 dark:border-white/10 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 h-12 px-5 rounded-xl font-bold shadow-sm bg-white dark:bg-slate-900/50"
                    >
                        <Download size={18} /> {t('export_excel', settings.language)}
                    </Button>
                    {(currentUser?.role === Role.ADMIN ||
                        currentUser?.role === Role.STAGING_SUPERVISOR) && (
                            <Button
                                onClick={() => navigate('/sheets/staging/new')}
                                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-xl shadow-lg shadow-primary/25 font-bold transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus size={18} /> {t('new_sheet', settings.language)}
                            </Button>
                        )}
                </div>
            </div>

            {/* Premium Filter Bar */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                        <FilterButton
                            active={stageFilter === 'ALL'}
                            onClick={() => setStageFilter('ALL')}
                            icon={<LayoutGrid size={16} />}
                            label={t('all', settings.language)}
                            count={stats.total}
                        />
                        <FilterButton
                            active={stageFilter === 'STAGING'}
                            onClick={() => setStageFilter('STAGING')}
                            icon={<Layers size={16} />}
                            label={t('staging', settings.language)}
                            count={stats.staging}
                        />
                        <FilterButton
                            active={stageFilter === 'LOADING'}
                            onClick={() => setStageFilter('LOADING')}
                            icon={<Package size={16} />}
                            label={t('loading', settings.language)}
                            count={stats.loading}
                        />
                        <FilterButton
                            active={stageFilter === 'COMPLETED'}
                            onClick={() => setStageFilter('COMPLETED')}
                            icon={<CheckCircle size={16} />}
                            label={t('completed', settings.language)}
                            count={stats.completed}
                        />
                    </div>

                    <div className="flex items-center gap-4 flex-1 max-w-xl group">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                                size={20}
                            />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-foreground placeholder-muted-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all font-medium shadow-sm"
                                placeholder={t('database_search_placeholder', settings.language)}
                            />
                        </div>
                        {(activeFilter || searchQuery || stageFilter !== 'ALL') && (
                            <Button
                                variant="ghost"
                                onClick={clearFilter}
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/5 font-bold h-12 rounded-xl group px-4"
                            >
                                <X
                                    size={20}
                                    className="mr-2 group-hover:rotate-90 transition-transform"
                                />{' '}
                                {t('clear', settings.language)}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden bg-white dark:bg-slate-900/50 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-white/10">
                            <TableHead
                                className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-6 h-14 w-[100px] cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleSort('id')}
                            >
                                <div className="flex items-center gap-1">
                                    {t('id', settings.language)}
                                    {sortConfig.key === 'id' &&
                                        (sortConfig.direction === 'asc' ? (
                                            <ArrowUp size={12} className="text-primary" />
                                        ) : (
                                            <ArrowDown size={12} className="text-primary" />
                                        ))}
                                </div>
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 w-[220px]">
                                {t('worker_timeline', settings.language)}
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 w-[180px]">
                                {t('destination', settings.language)}
                            </TableHead>
                            <TableHead
                                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 w-[120px] cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center gap-1">
                                    {t('date', settings.language)}
                                    {sortConfig.key === 'date' &&
                                        (sortConfig.direction === 'asc' ? (
                                            <ArrowUp size={12} className="text-primary" />
                                        ) : (
                                            <ArrowDown size={12} className="text-primary" />
                                        ))}
                                </div>
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 w-[100px]">
                                {t('duration', settings.language)}
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 w-[150px]">
                                {t('status', settings.language)}
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14 pr-6 w-[120px]">
                                {t('actions', settings.language)}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSheets.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center h-48 text-muted-foreground animate-pulse font-medium"
                                >
                                    {t('no_sheets_found_matching', settings.language)}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSheets.map((sheet) => (
                                <TableRow
                                    key={sheet.id}
                                    className="cursor-pointer hover:bg-primary/5 transition-all group border-b border-slate-100 dark:border-white/5 relative"
                                    onClick={() => {
                                        const isStaging =
                                            sheet.status === SheetStatus.DRAFT ||
                                            sheet.status ===
                                            SheetStatus.STAGING_VERIFICATION_PENDING;
                                        navigate(
                                            isStaging
                                                ? `/sheets/staging/${sheet.id}`
                                                : `/sheets/loading/${sheet.id}`
                                        );
                                    }}
                                >
                                    <TableCell className="pl-6 group-hover:pl-7 transition-all">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                                        <span className="font-mono text-xs text-muted-foreground group-hover:text-primary font-bold">
                                            #{sheet.id.slice(-6).toUpperCase()}
                                        </span>
                                    </TableCell>

                                    {/* Worker Timeline in Table Cells */}
                                    <TableCell>
                                        <div className="flex items-center gap-0 overflow-hidden py-1">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div
                                                    className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black border-2 border-slate-200"
                                                    title={`Staging: ${sheet.supervisorName}`}
                                                >
                                                    {sheet.supervisorName?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[7px] font-black uppercase tracking-tighter mt-1 opacity-40">
                                                    Staging
                                                </span>
                                            </div>
                                            <div className="w-2 h-0.5 bg-slate-200 mt-[-8px]" />
                                            <div className="flex flex-col items-center shrink-0">
                                                <div
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${sheet.loadingSvName ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-dashed border-slate-200 text-slate-300'}`}
                                                    title={`Loading: ${sheet.loadingSvName || 'Pending'}`}
                                                >
                                                    {sheet.loadingSvName
                                                        ? sheet.loadingSvName
                                                            .charAt(0)
                                                            .toUpperCase()
                                                        : '—'}
                                                </div>
                                                <span
                                                    className={`text-[7px] font-black uppercase tracking-tighter mt-1 ${sheet.loadingSvName ? 'text-blue-600' : 'opacity-40'}`}
                                                >
                                                    Loading
                                                </span>
                                            </div>
                                            <div className="w-2 h-0.5 bg-slate-200 mt-[-8px]" />
                                            <div className="flex flex-col items-center shrink-0">
                                                {(() => {
                                                    const approver =
                                                        sheet.verifiedBy ||
                                                        sheet.completedBy ||
                                                        sheet.loadingApprovedBy;
                                                    return (
                                                        <>
                                                            <div
                                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${approver ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-dashed border-slate-200 text-slate-300'}`}
                                                                title={`Approval: ${approver || 'Pending'}`}
                                                            >
                                                                {approver
                                                                    ? approver
                                                                        .charAt(0)
                                                                        .toUpperCase()
                                                                    : '—'}
                                                            </div>
                                                            <span
                                                                className={`text-[7px] font-black uppercase tracking-tighter mt-1 ${approver ? 'text-purple-600' : 'opacity-40'}`}
                                                            >
                                                                Approval
                                                            </span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                        {sheet.destination}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-muted-foreground">
                                        {new Date(sheet.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-slate-500">
                                        {getDuration(sheet)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`
                                            px-4 py-1.5 font-extrabold text-[10px] uppercase tracking-tight rounded-full border-2
                                            ${sheet.status === SheetStatus.COMPLETED
                                                    ? 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10 dark:text-emerald-400'
                                                    : sheet.status === SheetStatus.LOCKED
                                                        ? 'text-indigo-600 border-indigo-500/20 bg-indigo-500/10 dark:text-indigo-400'
                                                        : 'text-amber-600 border-amber-500/20 bg-amber-500/10 dark:text-amber-400'
                                                }
                                        `}
                                        >
                                            {sheet.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 flex justify-end gap-2">
                                        {currentUser?.role === Role.ADMIN &&
                                            (sheet.status ===
                                                SheetStatus.STAGING_VERIFICATION_PENDING ||
                                                sheet.status ===
                                                SheetStatus.LOADING_VERIFICATION_PENDING) && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
                                                        title={t('reject', settings.language)}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateStatus(
                                                                sheet.id,
                                                                sheet.status ===
                                                                    SheetStatus.STAGING_VERIFICATION_PENDING
                                                                    ? SheetStatus.DRAFT
                                                                    : SheetStatus.LOCKED
                                                            );
                                                        }}
                                                    >
                                                        <XCircle size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10"
                                                        title={t('approve', settings.language)}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateStatus(
                                                                sheet.id,
                                                                sheet.status ===
                                                                    SheetStatus.STAGING_VERIFICATION_PENDING
                                                                    ? SheetStatus.LOCKED
                                                                    : SheetStatus.COMPLETED
                                                            );
                                                        }}
                                                    >
                                                        <CheckCircle size={14} />
                                                    </Button>
                                                </>
                                            )}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="font-black text-[10px] uppercase tracking-widest bg-muted/50 hover:bg-primary hover:text-white transition-all rounded-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const isStaging =
                                                    sheet.status === SheetStatus.DRAFT ||
                                                    sheet.status ===
                                                    SheetStatus.STAGING_VERIFICATION_PENDING;
                                                navigate(
                                                    isStaging
                                                        ? `/sheets/staging/${sheet.id}`
                                                        : `/sheets/loading/${sheet.id}`
                                                );
                                            }}
                                        >
                                            {t('view_sheet', settings.language)}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-center pt-8">
                <Button
                    variant="ghost"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="text-muted-foreground hover:text-foreground h-12 px-8 font-black uppercase tracking-widest rounded-xl hover:bg-muted"
                >
                    {isLoadingMore ? <RefreshCw className="animate-spin mr-3" size={20} /> : null}
                    {isLoadingMore
                        ? t('loading_dots', settings.language)
                        : t('load_older_sheets_database', settings.language)}
                </Button>
            </div>
        </div>
    );
}

function FilterButton({
    active,
    onClick,
    icon,
    label,
    count
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    count?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all 
                ${active
                    ? 'bg-white dark:bg-slate-700 shadow-xl text-primary ring-1 ring-slate-200 dark:ring-white/10 scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-white/5'
                }
            `}
        >
            {icon}
            {label}
            {count !== undefined && (
                <span
                    className={`ml-1.5 px-2 py-0.5 rounded-full text-[9px] ${active ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                >
                    {count}
                </span>
            )}
        </button>
    );
}
