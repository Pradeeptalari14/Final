import { useState, useMemo } from 'react';
import { SheetData, Role, User } from '@/types';
import { Search, History, Download, Calendar, Clock } from 'lucide-react';
import { exportToExcelGeneric } from '@/lib/excelExport';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/contexts/AppStateContext';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { t } from '@/lib/i18n';

interface AuditLogViewProps {
    sheets: SheetData[];
    currentUser: User | null;
}

interface UnifiedLog {
    id?: string;
    timestamp: string;
    actor: string;
    action: string;
    details: string;
    sheetId?: string;
    supervisor?: string;
    status?: string;
    severity?: string;
}

export function AuditLogView({ sheets, currentUser }: AuditLogViewProps) {
    const [logType, setLogType] = useState<'operational' | 'security' | 'activity'>('operational');
    const { securityLogs, activityLogs, isLoading: logsLoading } = useAuditLogs(logType);
    const { settings } = useAppState();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<
        'ALL' | 'STAGING' | 'LOADING' | 'USERS' | 'SHIFTLEAD'
    >('ALL');
    const [timeFilter, setTimeFilter] = useState<'ALL' | '30D' | '90D' | 'CUSTOM'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const logs = useMemo(() => {
        let baseLogs: UnifiedLog[] = [];

        if (logType === 'security') {
            baseLogs = [...securityLogs];
        } else if (logType === 'activity') {
            baseLogs = [...activityLogs];
        } else {
            if (!sheets) return [];
            baseLogs = sheets.flatMap((sheet) =>
                (sheet.history || []).map((log) => ({
                    ...log,
                    sheetId: sheet.id,
                    supervisor: sheet.supervisorName,
                    status: sheet.status,
                    severity: (log as UnifiedLog).severity || 'LOW'
                }))
            );
        }

        // 1. Sort by Timestamp Descending (Primary)
        baseLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // 2. Time Filtering
        if (timeFilter !== 'ALL') {
            if (timeFilter === 'CUSTOM') {
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    baseLogs = baseLogs.filter((log) => new Date(log.timestamp) >= start);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    baseLogs = baseLogs.filter((log) => new Date(log.timestamp) <= end);
                }
            } else {
                const now = new Date();
                const days = timeFilter === '30D' ? 30 : 90;
                const threshold = new Date(now.setDate(now.getDate() - days));
                baseLogs = baseLogs.filter((log) => new Date(log.timestamp) >= threshold);
            }
        }

        // 3. Category/Role Filtering
        if (categoryFilter !== 'ALL') {
            baseLogs = baseLogs.filter((log) => {
                const action = (log.action || '').toUpperCase();

                if (categoryFilter === 'STAGING') return action.includes('STAGING');
                if (categoryFilter === 'LOADING') return action.includes('LOADING');
                if (categoryFilter === 'USERS')
                    return (
                        action.includes('USER') ||
                        action.includes('LOGIN') ||
                        action.includes('LOCKOUT')
                    );
                if (categoryFilter === 'SHIFTLEAD')
                    return (
                        action.includes('VERIFIED') ||
                        action.includes('REJECTED') ||
                        action.includes('ADMIN')
                    );
                return true;
            });
        }

        // 4. User Role Constraints (Privacy/Context)
        if (currentUser?.role === Role.STAGING_SUPERVISOR) {
            baseLogs = baseLogs.filter(
                (log) =>
                    log.action.startsWith('STAGING_') ||
                    log.actor === currentUser.username ||
                    log.supervisor === currentUser.username
            );
        } else if (currentUser?.role === Role.LOADING_SUPERVISOR) {
            baseLogs = baseLogs.filter(
                (log) =>
                    log.action.startsWith('LOADING_') ||
                    log.action === 'REJECTED_LOADING' ||
                    log.actor === currentUser.username
            );
        }

        // 5. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            baseLogs = baseLogs.filter(
                (log) =>
                    (log.actor || '').toLowerCase().includes(q) ||
                    (log.details || '').toLowerCase().includes(q) ||
                    (log.action || '').toLowerCase().includes(q) ||
                    (log.sheetId || '').toLowerCase().includes(q)
            );
        }

        // 6. Limit Results for Performance
        return baseLogs.slice(0, 100);
    }, [
        sheets,
        currentUser,
        searchQuery,
        logType,
        securityLogs,
        activityLogs,
        categoryFilter,
        timeFilter,
        startDate,
        endDate
    ]);

    // STRICT GUARD
    const isAuthorized = currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD;
    if (!isAuthorized) {
        return (
            <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest">
                {t('access_denied', settings.language)}
            </div>
        );
    }

    const handleExportLogs = () => {
        const exportData = logs.map((log) => ({
            Timestamp: new Date(log.timestamp).toLocaleString(),
            Actor: log.actor,
            Action: log.action,
            Sheet_ID: log.sheetId || 'N/A',
            Severity: log.severity || 'LOW',
            Details: log.details
        }));

        exportToExcelGeneric(exportData, `${logType}_Logs`, `${logType.toUpperCase()} Audit Logs`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <History className="text-blue-500" size={24} />
                        <h3 className="text-xl font-bold text-foreground">
                            {t('system_audit_logs', settings.language)}
                        </h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                        {/* Stream Type Toggle */}
                        <div className="flex bg-muted p-1 rounded-lg border border-border w-fit">
                            <button
                                onClick={() => setLogType('operational')}
                                className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${logType === 'operational' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Operational
                            </button>
                            <button
                                onClick={() => setLogType('security')}
                                className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${logType === 'security' ? 'bg-red-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Security{' '}
                                {securityLogs.length > 0 && (
                                    <span className="ml-1 px-1 bg-white/20 rounded">
                                        {securityLogs.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setLogType('activity')}
                                className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${logType === 'activity' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Activity{' '}
                                {activityLogs.length > 0 && (
                                    <span className="ml-1 px-1 bg-white/20 rounded">
                                        {activityLogs.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Category Filter Toggle */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                            {(['ALL', 'STAGING', 'LOADING', 'USERS', 'SHIFTLEAD'] as const).map(
                                (cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${categoryFilter === cat ? 'bg-white dark:bg-slate-600 text-foreground shadow-sm' : 'text-slate-500 hover:text-foreground'}`}
                                    >
                                        {cat}
                                    </button>
                                )
                            )}
                        </div>

                        {/* NEW: Time Range Filter Toggle */}
                        <div className="flex bg-blue-50 dark:bg-blue-900/20 p-1 rounded-lg border border-blue-100 dark:border-blue-800/50 w-fit">
                            <button
                                onClick={() => setTimeFilter('ALL')}
                                className={`px-2 py-1 rounded-md text-[9px] uppercase font-black tracking-tighter transition-all ${timeFilter === 'ALL' ? 'bg-blue-500 text-white shadow-sm' : 'text-blue-600/60 hover:text-blue-600'}`}
                            >
                                All Time
                            </button>
                            <button
                                onClick={() => setTimeFilter('30D')}
                                className={`px-2 py-1 rounded-md text-[9px] uppercase font-black tracking-tighter transition-all ${timeFilter === '30D' ? 'bg-blue-500 text-white shadow-sm' : 'text-blue-600/60 hover:text-blue-600'}`}
                            >
                                30 Days
                            </button>
                            <button
                                onClick={() => setTimeFilter('90D')}
                                className={`px-2 py-1 rounded-md text-[9px] uppercase font-black tracking-tighter transition-all ${timeFilter === '90D' ? 'bg-blue-500 text-white shadow-sm' : 'text-blue-600/60 hover:text-blue-600'}`}
                            >
                                3 Months
                            </button>
                            <button
                                onClick={() => setTimeFilter('CUSTOM')}
                                className={`px-2 py-1 rounded-md text-[9px] uppercase font-black tracking-tighter transition-all ${timeFilter === 'CUSTOM' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-blue-600/60 hover:text-blue-600'}`}
                            >
                                Custom
                            </button>
                        </div>

                        {/* PREMIUM: Date Range Picker UI */}
                        {timeFilter === 'CUSTOM' && (
                            <div className="flex items-center gap-1 animate-in slide-in-from-left-2 duration-300">
                                <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                    <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100 dark:border-white/5">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                        <div className="flex flex-col">
                                            <span className="text-[7px] uppercase font-bold text-slate-400 leading-tight">
                                                Start Time
                                            </span>
                                            <input
                                                type="datetime-local"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none w-[145px] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5">
                                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                        <div className="flex flex-col">
                                            <span className="text-[7px] uppercase font-bold text-slate-400 leading-tight">
                                                End Time
                                            </span>
                                            <input
                                                type="datetime-local"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none w-[145px] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background border border-input rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-blue-500 w-64"
                            placeholder={t('search_logs_placeholder', settings.language)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportLogs}
                        className="gap-2"
                    >
                        <Download size={14} /> {t('export', settings.language)}
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-sm table-fixed">
                        <thead className="bg-slate-50 dark:bg-slate-950/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[16%]">
                                    {t('timestamp', settings.language)}
                                </th>
                                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[14%]">
                                    {t('actor', settings.language)}
                                </th>
                                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[14%]">
                                    {t('action', settings.language)}
                                </th>
                                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[10%]">
                                    Severity
                                </th>
                                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[10%]">
                                    {t('sheet_ref', settings.language)}
                                </th>
                                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 w-[36%]">
                                    {t('details', settings.language)}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {logsLoading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs text-slate-400 animate-pulse font-medium">Fetching secure records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-8 text-center text-slate-400"
                                    >
                                        {t('no_logs_found', settings.language)}
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log, i) => (
                                    <tr
                                        key={i}
                                        className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-slate-500 font-mono text-[10px] truncate">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 truncate">
                                            {log.actor}
                                        </td>
                                        <td className="px-4 py-3 overflow-hidden">
                                            <span
                                                className={`
                                            px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap
                                            ${log.action.includes('REJECT')
                                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                        : log.action.includes('CLICK')
                                                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                                            : log.action.includes('VERIFIED') ||
                                                                log.action === 'COMPLETED'
                                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }
                                        `}
                                            >
                                                {log.action.includes('CLICK')
                                                    ? log.action
                                                    : t(
                                                        log.action.toLowerCase() as string,
                                                        settings.language
                                                    ).replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`
                                            px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                            ${log.severity === 'CRITICAL'
                                                        ? 'bg-red-600 text-white'
                                                        : log.severity === 'HIGH'
                                                            ? 'bg-orange-100 text-orange-600'
                                                            : log.severity === 'MEDIUM'
                                                                ? 'bg-amber-100 text-amber-600'
                                                                : 'bg-slate-100 text-slate-600'
                                                    }
                                        `}
                                            >
                                                {log.severity || 'LOW'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500 truncate">
                                            {log.sheetId ? log.sheetId.slice(0, 8) : '-'}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-slate-600 dark:text-slate-400 truncate text-xs"
                                            title={log.details}
                                        >
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
