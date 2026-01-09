import { useRef } from 'react';
import * as ReactWindowNamespace from 'react-window';
const ReactWindow: any = ReactWindowNamespace;
const FixedSizeList = ReactWindow.FixedSizeList || ReactWindow.default?.FixedSizeList || ReactWindow;
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { SheetData, SheetStatus, Role, User, AppSettings } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Search,
    Trash2,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { t } from '@/lib/i18n';

interface VirtualDatabaseTableProps {
    data: SheetData[];
    settings: AppSettings;
    currentUser: User | null;
    processingId: string | null;
    onRowClick: (sheet: SheetData) => void;
    onDelete: (id: string) => void;
    onQuickApprove?: (sheet: SheetData) => void;
    onQuickReject?: (sheet: SheetData) => void;
    searchQuery: string;
}

export function VirtualDatabaseTable({
    data,
    settings,
    currentUser,
    processingId,
    onRowClick,
    onDelete,
    onQuickApprove,
    onQuickReject,
    searchQuery
}: VirtualDatabaseTableProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listRef = useRef<any>(null);
    const isCompact = settings.density === 'compact';
    const rowHeight = isCompact ? 48 : 64;

    const isRejected = (s: SheetData) => !!s.rejectionReason;

    const getDuration = (sheet: SheetData) => {
        if (sheet.status !== SheetStatus.COMPLETED || !sheet.updatedAt) return '-';
        const start = new Date(sheet.createdAt).getTime();
        const end = new Date(sheet.updatedAt).getTime();

        if (isNaN(start) || isNaN(end)) return '-';

        const diffMs = end - start;
        if (diffMs < 0) return '-';

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const StatusBadge = ({ sheet }: { sheet: SheetData }) => {
        const variantClass = sheet.status === SheetStatus.COMPLETED
            ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
            : isRejected(sheet)
                ? 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10'
                : sheet.status.includes('PENDING') || sheet.status === SheetStatus.LOCKED
                    ? 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10'
                    : 'text-muted-foreground border-border';

        let label = '';
        if (
            sheet.status === SheetStatus.LOCKED &&
            (currentUser?.role === Role.LOADING_SUPERVISOR ||
                currentUser?.role === Role.ADMIN ||
                currentUser?.role === Role.SHIFT_LEAD)
        ) {
            label = t('ready_to_load', settings.language);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label = t(sheet.status.toLowerCase() as any, settings.language).replace(/_/g, ' ');
        }

        return (
            <Badge variant="outline" className={`${variantClass} ${isCompact ? 'text-[8px] px-1 py-0 h-4' : 'text-[10px]'}`}>
                {label}
            </Badge>
        );
    };

    const renderRow = (sheet: SheetData, index: number, style: React.CSSProperties) => {
        if (!sheet) return null;

        return (
            <div
                key={sheet.id || index}
                style={style}
                className="flex items-center border-b border-slate-100 dark:border-white/5 hover:bg-muted/50 transition-colors cursor-pointer group bg-white dark:bg-slate-900"
                onClick={() => onRowClick(sheet)}
            >
                {/* ID */}
                <div className={`pl-6 px-4 font-mono ${isCompact ? 'text-[9px]' : 'text-[10px]'} truncate text-blue-600 dark:text-blue-400 w-[14.28%] shrink-0`}>
                    #{sheet.id.slice(-8)}
                </div>

                {/* Supervisor */}
                <div className="px-4 w-[14.28%] truncate">
                    <div className={`truncate font-medium text-foreground ${isCompact ? 'text-[11px]' : 'text-sm'} leading-tight`}>
                        {sheet.supervisorName}
                    </div>
                    <div className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-muted-foreground truncate opacity-70`}>
                        {sheet.empCode}
                    </div>
                </div>

                {/* Shift / Dest */}
                <div className="px-4 w-[14.28%] truncate">
                    <div className={`text-foreground/80 font-medium truncate ${isCompact ? 'text-[10px]' : 'text-xs'} leading-tight`}>
                        {sheet.shift}
                    </div>
                    <div className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-muted-foreground truncate opacity-70`}>
                        {sheet.destination || sheet.loadingDoc || '-'}
                    </div>
                </div>

                {/* Duration */}
                <div className={`px-4 font-mono truncate ${isCompact ? 'text-[9px]' : 'text-[10px]'} text-slate-600 dark:text-slate-400 w-[14.28%] shrink-0`}>
                    {getDuration(sheet)}
                </div>

                {/* Date */}
                <div className={`px-4 truncate ${isCompact ? 'text-[9px]' : 'text-[10.5px]'} text-slate-600 dark:text-slate-400 w-[14.28%] shrink-0`}>
                    {new Date(sheet.date).toLocaleDateString()}
                </div>

                {/* Status */}
                <div className="px-4 w-[14.28%] shrink-0">
                    <StatusBadge sheet={sheet} />
                </div>

                {/* Actions */}
                <div className="pr-6 px-4 text-right flex justify-end gap-2 w-[14.28%] shrink-0">
                    {currentUser?.role === Role.SHIFT_LEAD &&
                        sheet.status.includes('PENDING') &&
                        onQuickReject &&
                        onQuickApprove && (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={processingId === sheet.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQuickReject(sheet);
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
                                        onQuickApprove(sheet);
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
                                onDelete(sheet.id || '');
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
                            onRowClick(sheet);
                        }}
                        title={t('view_details', settings.language)}
                    >
                        <ArrowRight size={16} />
                    </Button>
                </div>
            </div>
        );
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600 border rounded-xl bg-white dark:bg-slate-900/50">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-3">
                    <Search size={32} strokeWidth={1.5} />
                </div>
                <div className="text-lg font-medium text-slate-900 dark:text-slate-200">
                    {t('no_sheets_found', settings.language)}
                </div>
                <p className="text-sm mt-1 max-w-xs mx-auto text-center">
                    {searchQuery
                        ? 'Try adjusting your search filters.'
                        : 'There are no active tasks in this view.'}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden bg-white dark:bg-slate-900/50 shadow-sm flex flex-col h-full min-h-[500px]">
            {/* Header */}
            <div className={`flex items-center bg-muted/30 text-muted-foreground border-b border-border sticky top-0 z-10 backdrop-blur-md ${isCompact ? 'h-8 text-[9px]' : 'h-11 text-[10px]'} uppercase tracking-[0.15em] font-black shrink-0`}>
                <div className="pl-6 px-4 w-[14.28%] flex items-center gap-2">
                    {t('sheet_id', settings.language)}
                    <Badge variant="secondary" className={`${isCompact ? 'scale-65' : 'scale-75'} origin-left opacity-70 px-1 font-black`}>{data.length}</Badge>
                </div>
                <div className="w-[14.28%] px-4 text-left font-black">{t('supervisor', settings.language)}</div>
                <div className="w-[14.28%] px-4 text-left font-black">{t('shift_dest', settings.language)}</div>
                <div className="w-[14.28%] px-4 text-left font-black">{t('duration', settings.language)}</div>
                <div className="w-[14.28%] px-4 text-left font-black">{t('date', settings.language)}</div>
                <div className="w-[14.28%] px-4 text-left font-black">{t('status', settings.language)}</div>
                <div className="pr-6 px-4 text-right w-[14.28%] font-black">{t('action', settings.language)}</div>
            </div>

            {/* List */}
            <div className="flex-1 relative min-h-[500px] w-full bg-white dark:bg-slate-900/50">
                {data.length < 15 ? (
                    <div className="flex flex-col w-full h-full min-h-[400px]">
                        {data.map((sheet, index) => renderRow(sheet, index, {
                            height: rowHeight,
                            width: '100%',
                            display: 'flex',
                            position: 'relative'
                        }))}
                        {data.length === 0 && <div className="p-8 text-center text-muted-foreground">No data for render</div>}
                    </div>
                ) : (
                    /* @ts-expect-error: AutoSizer type mismatch with children */
                    <AutoSizer defaultHeight={600} defaultWidth={1000}>
                        {({ height, width }: { height: number; width: number }) => {
                            const finalHeight = height > 0 ? height : 600;
                            const finalWidth = width > 0 ? width : 1000;

                            return (
                                <FixedSizeList
                                    ref={listRef}
                                    height={finalHeight}
                                    width={finalWidth}
                                    itemCount={data.length}
                                    itemSize={rowHeight}
                                    itemKey={(idx: number) => data[idx]?.id || idx}
                                    style={{ overflowX: 'hidden' }}
                                >
                                    {({ index, style }: { index: number; style: React.CSSProperties }) => renderRow(data[index], index, style)}
                                </FixedSizeList>
                            );
                        }}
                    </AutoSizer>
                )}
            </div>
        </div>
    );
}
