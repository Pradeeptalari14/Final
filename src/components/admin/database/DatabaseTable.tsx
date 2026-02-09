import { useNavigate } from 'react-router-dom';
import { SheetData, SheetStatus, Role, User } from '@/types';
import { t } from '@/lib/i18n';
import { useAppState } from '@/contexts/AppStateContext';
import { ArrowUp, ArrowDown, Package, MoreHorizontal, CheckCircle, XCircle, Printer, Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SortConfig } from '@/hooks/useDatabaseFilters';

interface DatabaseTableProps {
    sheets: SheetData[];
    currentUser: User | null;
    isLoading?: boolean;
    sortConfig: SortConfig;
    onSort: (key: string) => void;
    onDeleteSheet: (sheetId: string) => void;
    onUpdateStatus: (sheetId: string, newStatus: SheetStatus) => void;
}

export function DatabaseTable({
    sheets,
    currentUser,
    isLoading,
    sortConfig,
    onSort,
    onDeleteSheet,
    onUpdateStatus
}: DatabaseTableProps) {
    const { settings } = useAppState();
    const navigate = useNavigate();

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

    const formatDate = (date: string | number | Date | null | undefined) => {
        if (!date) return '---';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '---' : d.toLocaleString();
    };

    return (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all">
            <div className="w-full">
                <div className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-white/10 sticky top-0 z-10 flex font-extrabold text-[11px] uppercase tracking-wider px-4">
                    <div
                        className={`w-[8%] ${settings.density === 'compact' ? 'py-2' : 'py-3'} cursor-pointer hover:text-primary transition-colors flex justify-center items-center gap-1 group`}
                        onClick={() => onSort('id')}
                    >
                        {t('id', settings.language)}
                        {sortConfig.key === 'id' &&
                            (sortConfig.direction === 'asc' ? (
                                <ArrowUp size={12} className="text-primary" />
                            ) : (
                                <ArrowDown size={12} className="text-primary" />
                            ))}
                        {sortConfig.key !== 'id' && (
                            <ArrowDown
                                size={12}
                                className="opacity-0 group-hover:opacity-50"
                            />
                        )}
                    </div>
                    <div className={`w-[11%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {t('staging_sv', settings.language)}
                        </span>
                    </div>
                    <div className={`w-[11%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {t('loading_sv', settings.language)}
                        </span>
                    </div>
                    <div className={`w-[11%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            {t('approval_sv', settings.language)}
                        </span>
                    </div>
                    <div className={`w-[11%] ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>
                        {t('destination', settings.language)}
                    </div>
                    <div
                        className={`w-[10%] ${settings.density === 'compact' ? 'py-2' : 'py-3'} cursor-pointer hover:text-primary transition-colors flex justify-center items-center gap-1 group`}
                        onClick={() => onSort('date')}
                    >
                        Date
                        {sortConfig.key === 'date' &&
                            (sortConfig.direction === 'asc' ? (
                                <ArrowUp size={12} className="text-primary" />
                            ) : (
                                <ArrowDown size={12} className="text-primary" />
                            ))}
                        {sortConfig.key !== 'date' && (
                            <ArrowDown
                                size={12}
                                className="opacity-0 group-hover:opacity-50"
                            />
                        )}
                    </div>
                    <div className={`w-[6%] ${settings.density === 'compact' ? 'py-2' : 'py-3'} text-center`}>
                        {t('duration', settings.language)}
                    </div>
                    <div className={`w-[22%] ${settings.density === 'compact' ? 'py-1' : 'py-3'} text-center`}>
                        {t('status', settings.language)}
                    </div>
                    <div className={`w-[3%] text-center font-medium px-4 ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 animate-pulse">
                        <Package className="w-8 h-8 opacity-50" />
                        <span className="text-xs font-bold uppercase tracking-widest">Loading database records...</span>
                    </div>
                ) : sheets.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                        {t('no_sheets_found_matching', settings.language)}
                    </div>
                ) : (
                    <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                        {sheets.map((sheet) => {
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

                                        navigate(
                                            useLoadingSheet
                                                ? `/sheets/loading/${sheet.id}`
                                                : `/sheets/staging/${sheet.id}`
                                        );
                                    }}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                                    <div className="w-[8%] font-mono text-[10px] font-bold text-slate-500 group-hover:text-primary transition-colors truncate pr-2 text-center">
                                        #{sheet.id.slice(-8)}
                                    </div>

                                    {/* Timeline Columns */}
                                    <div className="w-[11%] font-medium text-slate-900 dark:text-slate-200 truncate pr-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                            <span className="truncate text-xs">
                                                {sheet.supervisorName || '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-[11%] text-slate-600 dark:text-slate-400 truncate pr-4">
                                        {sheet.loadingSvName ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                <span className="truncate text-xs">
                                                    {sheet.loadingSvName}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600 ml-3">
                                                —
                                            </span>
                                        )}
                                    </div>

                                    <div className="w-[11%] text-slate-600 dark:text-slate-400 truncate pr-4">
                                        {(() => {
                                            const approver =
                                                sheet.verifiedBy ||
                                                sheet.completedBy ||
                                                sheet.loadingApprovedBy;
                                            return approver ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                                                    <span className="truncate text-xs">
                                                        {approver}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600 ml-3">
                                                    —
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    <div className="w-[11%] truncate text-slate-500 pr-4">
                                        <div className="flex flex-col">
                                            <span className="text-foreground font-medium truncate">
                                                {sheet.destination || '-'}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] opacity-60">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded uppercase tracking-tighter">
                                                    {sheet.shift}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-[10%] flex justify-center items-center text-xs">
                                        {formatDate(sheet.date || sheet.createdAt)}
                                    </div>

                                    <div className="w-[6%] text-[10px] font-mono text-slate-400 font-medium text-center">
                                        {getDuration(sheet)}
                                    </div>

                                    <div className="w-[22%] flex justify-center">
                                        <Badge
                                            variant="outline"
                                            className={`
                                        text-[10px] font-extrabold uppercase tracking-tight px-3 py-1 rounded-full whitespace-nowrap border-2
                                        ${isCompleted
                                                    ? 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10 dark:text-emerald-400'
                                                    : sheet.status.includes('PENDING')
                                                        ? 'text-amber-600 border-amber-500/20 bg-amber-500/10 dark:text-amber-400'
                                                        : sheet.status === SheetStatus.LOCKED
                                                            ? 'text-indigo-600 border-indigo-500/20 bg-indigo-500/10 dark:text-indigo-400'
                                                            : 'text-slate-500 border-slate-200 bg-slate-50 dark:text-slate-400 dark:border-white/10 dark:bg-white/5'
                                                }`}
                                        >
                                            {(() => {
                                                if (
                                                    sheet.status === SheetStatus.LOCKED &&
                                                    (currentUser?.role === Role.LOADING_SUPERVISOR ||
                                                        currentUser?.role === Role.ADMIN ||
                                                        currentUser?.role === Role.SHIFT_LEAD)
                                                ) {
                                                    return t('ready_to_load', settings.language);
                                                }
                                                return t(
                                                    sheet.status.toLowerCase(),
                                                    settings.language
                                                ).replace(/_/g, ' ');
                                            })()}
                                        </Badge>
                                    </div>

                                    <div
                                        className="w-[3%] flex justify-center gap-1 px-4"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                                >
                                                    <MoreHorizontal size={14} className="text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                {(currentUser?.role === Role.ADMIN ||
                                                    currentUser?.role === Role.SHIFT_LEAD) && (
                                                        <>
                                                            {(sheet.status ===
                                                                SheetStatus.STAGING_VERIFICATION_PENDING ||
                                                                sheet.status ===
                                                                SheetStatus.LOADING_VERIFICATION_PENDING) && (
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            onUpdateStatus(
                                                                                sheet.id,
                                                                                sheet.status ===
                                                                                    SheetStatus.STAGING_VERIFICATION_PENDING
                                                                                    ? SheetStatus.LOCKED
                                                                                    : SheetStatus.COMPLETED
                                                                            )
                                                                        }
                                                                        className="text-emerald-600 focus:text-emerald-700"
                                                                    >
                                                                        <CheckCircle className="mr-2 h-3.5 w-3.5" />
                                                                        {t('approve', settings.language)}
                                                                    </DropdownMenuItem>
                                                                )}

                                                            {(sheet.status ===
                                                                SheetStatus.STAGING_VERIFICATION_PENDING ||
                                                                sheet.status ===
                                                                SheetStatus.LOADING_VERIFICATION_PENDING) && (
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            onUpdateStatus(
                                                                                sheet.id,
                                                                                sheet.status ===
                                                                                    SheetStatus.STAGING_VERIFICATION_PENDING
                                                                                    ? SheetStatus.DRAFT
                                                                                    : SheetStatus.LOCKED
                                                                            )
                                                                        }
                                                                        className="text-amber-600 focus:text-amber-700"
                                                                    >
                                                                        <XCircle className="mr-2 h-3.5 w-3.5" />
                                                                        {t('reject', settings.language)}
                                                                    </DropdownMenuItem>
                                                                )}
                                                        </>
                                                    )}

                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        // Print logic or visual feedback
                                                    }}
                                                >
                                                    <Printer className="mr-2 h-3.5 w-3.5" />
                                                    {t('print', settings.language)}
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => {
                                                    navigate(
                                                        isCompleted
                                                            ? `/sheets/loading/${sheet.id}`
                                                            : `/sheets/staging/${sheet.id}`
                                                    )
                                                }}>
                                                    <Eye className="mr-2 h-3.5 w-3.5" />
                                                    View Details
                                                </DropdownMenuItem>

                                                {currentUser?.role === Role.ADMIN && (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    t('delete_confirm', settings.language)
                                                                )
                                                            ) {
                                                                onDeleteSheet(sheet.id);
                                                            }
                                                        }}
                                                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                    >
                                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                        {t('delete', settings.language)}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
