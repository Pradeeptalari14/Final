import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { SheetData, SheetStatus, Role, User } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Printer, Trash2 } from 'lucide-react';

interface DatabaseViewProps {
    sheets: SheetData[];
    currentUser: User | null;
    settings: any;
    refreshSheets: () => Promise<void>;
}

export function DatabaseView({ sheets, currentUser, settings, refreshSheets }: DatabaseViewProps) {
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Local State
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const filteredSheets = useMemo(() => {
        let relevantSheets = sheets;

        // 0. STRICT USER FILTERING (Security Layer)
        if (currentUser?.role !== Role.ADMIN) {
            relevantSheets = relevantSheets.filter(_ => {
                const isStaging = currentUser?.role === Role.STAGING_SUPERVISOR;
                const isLoading = currentUser?.role === Role.LOADING_SUPERVISOR;
                const isShiftLead = currentUser?.role === Role.SHIFT_LEAD;

                // CHANGED: Allow Supervisors to see ALL sheets in Database View (Read-Only)
                // This ensures the "Total Count" on Dashboard matches the list shown here.
                if (isStaging || isLoading || isShiftLead) {
                    return true;
                }

                return false;
            });
        }

        // 1. Global Search & Date
        relevantSheets = relevantSheets.filter(sheet => {
            const matchesSearch = searchQuery === '' ||
                (sheet.supervisorName && sheet.supervisorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                sheet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sheet.shift && sheet.shift.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.destination && sheet.destination.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesDate = dateFilter === '' || (sheet.date && sheet.date.includes(dateFilter));
            return matchesSearch && matchesDate;
        });

        // 2. Status Filter
        if (statusFilter !== 'ALL') {
            relevantSheets = relevantSheets.filter(s => s.status === statusFilter);
        }

        return relevantSheets;
    }, [sheets, statusFilter, searchQuery, dateFilter, currentUser]);

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

    const handleDeleteSheet = async (sheetId: string) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete sheet #${sheetId.slice(0, 8)}? This action cannot be undone.`)) return;

        try {
            const { error } = await supabase.from('sheets').delete().eq('id', sheetId);
            if (error) throw error;
            addToast('success', 'Sheet deleted successfully');
            await refreshSheets();
        } catch (error: any) {
            addToast('error', "Failed to delete sheet: " + error.message);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">Full Database</h3>
                    <Badge variant="outline" className="text-xs border-green-500/50 text-green-400 bg-green-500/10">v8.2 (CLEAN)</Badge>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background border border-input rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none w-40"
                            placeholder="Search..."
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-purple-500/50 focus:outline-none"
                    >
                        <option value="ALL">All Status</option>
                        {Object.values(SheetStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-purple-500/50 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                    />
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden bg-white dark:bg-slate-900/20 shadow-sm dark:shadow-none overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[800px]">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-500 border-b border-slate-200 dark:border-white/5 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <th className={`pl-4 font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Sheet ID</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Supervisor</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Shift / Dest</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Duration</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Date</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Status</th>
                            <th className={`pr-4 text-right font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredSheets.length === 0 ? (
                            <tr><td colSpan={7} className="py-8 text-center text-slate-500">No sheets found matching filters.</td></tr>
                        ) : filteredSheets.map((sheet) => (
                            <tr key={sheet.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => {
                                const isStagingUser = currentUser?.role === Role.STAGING_SUPERVISOR;
                                let target = `/sheets/staging/${sheet.id}`;
                                if (sheet.status === SheetStatus.COMPLETED) {
                                    target = `/sheets/loading/${sheet.id}`;
                                } else if ((sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING || sheet.status === SheetStatus.LOCKED) && !isStagingUser) {
                                    target = `/sheets/loading/${sheet.id}`;
                                }
                                navigate(target);
                            }}>
                                <td className={`pl-4 text-slate-700 dark:text-slate-300 font-mono text-xs ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>{sheet.id.slice(0, 8)}...</td>
                                <td className={`text-slate-900 dark:text-slate-200 ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>{sheet.supervisorName}</td>
                                <td className={`text-slate-500 dark:text-slate-400 ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{sheet.shift}</Badge>
                                    <div className="text-xs text-slate-500 mt-1">{sheet.destination || '-'}</div>
                                </td>
                                <td className={`text-xs text-slate-600 dark:text-slate-400 font-mono ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>{getDuration(sheet)}</td>
                                <td className={`text-slate-600 dark:text-slate-500 ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>{new Date(sheet.date).toLocaleDateString()}</td>
                                <td className={`${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    <Badge variant="outline" className={`
                                        ${sheet.status === SheetStatus.COMPLETED ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                            sheet.status === SheetStatus.LOCKED ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                                                'text-slate-400 border-slate-700'}
                                    `}>
                                        {sheet.status?.replace(/_/g, ' ')}
                                    </Badge>
                                </td>
                                <td className={`pr-4 text-right flex justify-end gap-2 ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    {currentUser?.role === Role.ADMIN && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSheet(sheet.id);
                                            }}
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 opacity-60 group-hover:opacity-100"
                                            title="Delete Sheet (Admin Only)"
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
                                        title="View & Print"
                                    >
                                        <Printer size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                    >
                                        Open
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
