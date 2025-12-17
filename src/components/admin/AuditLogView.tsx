import { useState, useMemo } from 'react';
import { SheetData, Role, User } from '@/types';
import { Search, History, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';

interface AuditLogViewProps {
    sheets: SheetData[];
    currentUser: User | null;
}

export function AuditLogView({ sheets, currentUser }: AuditLogViewProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const logs = useMemo(() => {
        if (!sheets) return [];

        // 1. Flatten all history logs
        let allLogs = sheets.flatMap(sheet =>
            (sheet.history || []).map(log => ({
                ...log,
                sheetId: sheet.id,
                supervisor: sheet.supervisorName,
                status: sheet.status
            }))
        );

        // 2. Sort by Timestamp Descending
        allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // 3. ROLE-BASED FILTERING
        // Admin & Lead: See ALL
        // Staging: See only STAGING_* actions OR Reference to own Sheets
        // Loading: See only LOADING_* actions OR Reference to own Sheets
        if (currentUser?.role === Role.STAGING_SUPERVISOR) {
            allLogs = allLogs.filter(log =>
                log.action.startsWith('STAGING_') ||
                log.actor === currentUser.username ||
                log.supervisor === currentUser.username
            );
        } else if (currentUser?.role === Role.LOADING_SUPERVISOR) {
            allLogs = allLogs.filter(log =>
                log.action.startsWith('LOADING_') ||
                log.action === 'REJECTED_LOADING' ||
                log.actor === currentUser.username
            );
        }

        // 4. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            allLogs = allLogs.filter(log =>
                log.actor.toLowerCase().includes(q) ||
                log.details.toLowerCase().includes(q) ||
                log.sheetId.toLowerCase().includes(q)
            );
        }

        return allLogs;
    }, [sheets, currentUser, searchQuery]);

    const handleExportLogs = () => {
        const exportData = logs.map(log => ({
            Timestamp: new Date(log.timestamp).toLocaleString(),
            Actor: log.actor,
            Action: log.action,
            Sheet_ID: log.sheetId,
            Details: log.details
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
        XLSX.writeFile(wb, `Audit_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <History className="text-blue-500" size={24} />
                    <h3 className="text-xl font-bold text-foreground">System Audit Logs</h3>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background border border-input rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-blue-500 w-64"
                            placeholder="Search logs..."
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportLogs} className="gap-2">
                        <Download size={14} /> Export
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Timestamp</th>
                                <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Actor</th>
                                <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Action</th>
                                <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Sheet Ref</th>
                                <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        No logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : logs.map((log, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">
                                        {log.actor}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`
                                            px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                            ${log.action.includes('REJECT') ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                log.action.includes('VERIFIED') || log.action === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}
                                        `}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 font-mono text-xs text-slate-500">
                                        {log.sheetId ? log.sheetId.slice(0, 8) : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                                        {log.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
