import { useState, useEffect, useCallback } from 'react';
import { SheetData, SheetStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    PlayCircle,
    Clock,
    CheckCircle,
    RefreshCcw,
    Search
} from 'lucide-react';
import { useAppState } from '@/contexts/AppStateContext';
import { t } from '@/lib/i18n';

interface LiveOperationsMonitorProps {
    sheets: SheetData[];
    onRefresh: () => Promise<void>;
}

export function LiveOperationsMonitor({ sheets, onRefresh }: LiveOperationsMonitorProps) {
    const { settings } = useAppState();
    const isCompact = settings?.density === 'compact';
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
    }, [onRefresh]);

    // Auto-Refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            handleRefresh();
        }, 30000);
        return () => clearInterval(interval);
    }, [handleRefresh]);

    // 1. Get Active Sheets
    const activeSheets = sheets.filter((s) => s.status !== SheetStatus.COMPLETED);

    // 2. Map Users to Sheets
    const activeOperations = activeSheets
        .map((sheet) => {
            return {
                id: sheet.id,
                type: sheet.status === SheetStatus.DRAFT ? 'Staging' : 'Loading',
                supervisor: sheet.supervisorName,
                status: sheet.status,
                timestamp: sheet.updatedAt || sheet.createdAt,
                destination: sheet.destination
            };
        })
        .filter(
            (op) =>
                (op.supervisor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (op.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (op.destination || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

    if (activeSheets.length === 0) {
        return (
            <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-8 text-slate-500">
                    <CheckCircle className="mb-2 opacity-50" size={32} />
                    <p className="font-semibold">{t('all_systems_idle', settings.language)}</p>
                    <p className="text-sm">{t('no_active_workflows', settings.language)}</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="mt-4"
                    >
                        <RefreshCcw
                            size={16}
                            className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                        />
                        {t('check_again', settings.language)}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={isCompact ? 'border-border/50 shadow-none' : ''}>
            <CardHeader className={`${isCompact ? 'py-1.5 px-3' : 'pb-3'} border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0`}>
                <div className="flex items-center gap-2">
                    <CardTitle className={`flex items-center gap-2 ${isCompact ? 'text-base' : 'text-lg'}`}>
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        {t('live_operations', settings.language)}
                    </CardTitle>
                    <Badge variant="secondary" className={isCompact ? 'text-[10px] h-5 py-0 px-1.5' : 'text-xs'}>
                        {activeSheets.length} {t('active_sheets', settings.language)}
                    </Badge>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                        <Search className={`absolute left-2 ${isCompact ? 'top-1' : 'top-1.5'} h-3.5 w-3.5 text-muted-foreground`} />
                        <Input
                            placeholder={t('search_placeholder', settings.language)}
                            className={`${isCompact ? 'h-6 text-[10px]' : 'h-8 text-xs'} pl-8 w-full`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`${isCompact ? 'h-6 w-6' : 'h-8 w-8'} p-0 shrink-0`}
                    >
                        <RefreshCcw size={isCompact ? 12 : 16} className={isRefreshing ? 'animate-spin' : ''} />
                        <span className="sr-only">{t('refresh', settings.language)}</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {activeOperations.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            {t('no_sheets_found', settings.language)}
                        </div>
                    ) : (
                        activeOperations.map((op) => {
                            const isStale = (new Date().getTime() - new Date(op.timestamp).getTime()) > 1000 * 60 * 60; // 1 Hour

                            return (
                                <div
                                    key={op.id}
                                    className={`${isCompact ? 'p-1.5 px-3' : 'p-4'} flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors ${isStale ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                                >
                                    <div className="flex items-start sm:items-center gap-4">
                                        <div
                                            className={`${isCompact ? 'p-1.5' : 'p-2'} rounded-full shrink-0 ${op.type === 'Staging' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20'}`}
                                        >
                                            <PlayCircle size={isCompact ? 16 : 20} />
                                        </div>
                                        <div className="space-y-1">
                                            <div
                                                className={`font-bold flex flex-wrap items-center gap-2 text-sm`}
                                            >
                                                {op.supervisor}
                                                <Badge
                                                    variant="outline"
                                                    className={`${isCompact ? 'text-[8px] h-4 py-0 px-1' : 'text-[10px]'} uppercase font-bold border-emerald-500/30 text-emerald-500 bg-emerald-500/5`}
                                                >
                                                    {t(
                                                        (op.status || '').toLowerCase(),
                                                        settings.language
                                                    )}
                                                </Badge>
                                                {isStale && (
                                                    <Badge variant="destructive" className="animate-pulse bg-amber-500 text-white text-[9px] uppercase">
                                                        Stale (&gt;1h)
                                                    </Badge>
                                                )}
                                            </div>
                                            <div
                                                className={`text-muted-foreground flex items-center gap-2 text-xs`}
                                            >
                                                <span className="font-mono bg-muted px-1 rounded">
                                                    #{op.id.slice(0, 8)}
                                                </span>
                                                <span>•</span>
                                                <span className="font-medium text-foreground">
                                                    {op.destination ||
                                                        t('no_activity', settings.language)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className={`flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 ${isCompact ? 'pt-1 mt-1' : 'pt-2 mt-2'} sm:pt-0 sm:mt-0`}
                                    >
                                        <Badge
                                            className={`mb-0 sm:mb-1 ${isCompact ? 'text-[9px] h-4 py-0 px-1' : ''} ${op.type === 'Staging' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                                        >
                                            {t(
                                                (op.status || '').toLowerCase(),
                                                settings.language
                                            ).replace(/_/g, ' ')}
                                        </Badge>
                                        <div
                                            className={`text-muted-foreground flex items-center gap-1 ${isCompact ? 'text-[9px]' : 'text-[10px]'} ${isStale ? 'text-amber-600 font-bold' : ''}`}
                                        >
                                            <Clock size={isCompact ? 9 : 10} />
                                            {new Date(op.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
