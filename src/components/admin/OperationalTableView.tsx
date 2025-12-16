import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { SheetData, SheetStatus, Role, User } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Printer, Trash2 } from 'lucide-react';

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
                    return sheet.supervisorName === currentUser.username || sheet.supervisorName === currentUser.fullName;
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
        const isRejected = (s: any) => s.comments && s.comments.length > 0;

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
            if (subFilter === 'LOCKED') return relevantSheets.filter(s => s.status === SheetStatus.LOADING_VERIFICATION_PENDING);
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

    const FilterBar = () => (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            {/* Sub Filters */}
            <div className="flex flex-wrap gap-2">
                <Button variant={subFilter === 'ALL' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('ALL')} className="text-xs">All</Button>

                {activeTab === 'staging_db' && (
                    <>
                        <Button variant={subFilter === 'DRAFT' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('DRAFT')} className={`text-xs ${subFilter === 'DRAFT' ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'} dark:text-slate-400 dark:data-[state=active]:text-white`}>Draft</Button>
                        <Button variant={subFilter === 'PENDING' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('PENDING')} className={`text-xs ${subFilter === 'PENDING' ? 'bg-orange-100 text-orange-900' : 'text-orange-600 hover:bg-orange-50'} dark:text-orange-400`}>Pending Approval</Button>
                        <Button variant={subFilter === 'LOCKED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOCKED')} className={`text-xs ${subFilter === 'LOCKED' ? 'bg-blue-100 text-blue-900' : 'text-blue-600 hover:bg-blue-50'} dark:text-blue-400`}>Locked (Approved)</Button>
                        <Button variant={subFilter === 'COMPLETED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('COMPLETED')} className={`text-xs ${subFilter === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900' : 'text-emerald-600 hover:bg-emerald-50'} dark:text-green-400`}>Completed</Button>
                        <Button variant={subFilter === 'REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('REJECTED')} className={`text-xs ${subFilter === 'REJECTED' ? 'bg-red-100 text-red-900' : 'text-red-600 hover:bg-red-50'} dark:text-red-400`}>Rejected</Button>
                    </>
                )}

                {activeTab === 'loading_db' && (
                    <>
                        <Button variant={subFilter === 'READY' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('READY')} className={`text-xs ${subFilter === 'READY' ? 'bg-blue-100 text-blue-900' : 'text-blue-600 hover:bg-blue-50'} dark:text-blue-400`}>Ready to Load</Button>
                        <Button variant={subFilter === 'LOCKED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOCKED')} className={`text-xs ${subFilter === 'LOCKED' ? 'bg-orange-100 text-orange-900' : 'text-orange-600 hover:bg-orange-50'} dark:text-orange-400`}>Locked (Pending Ver.)</Button>
                        <Button variant={subFilter === 'COMPLETED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('COMPLETED')} className={`text-xs ${subFilter === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900' : 'text-emerald-600 hover:bg-emerald-50'} dark:text-green-400`}>Completed</Button>
                        <Button variant={subFilter === 'REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('REJECTED')} className={`text-xs ${subFilter === 'REJECTED' ? 'bg-red-100 text-red-900' : 'text-red-600 hover:bg-red-50'} dark:text-red-400`}>Rejected</Button>
                    </>
                )}

                {activeTab === 'shift_lead_db' && (
                    <>
                        <Button variant={subFilter === 'STAGING_APPROVALS' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('STAGING_APPROVALS')} className={`text-xs ${subFilter === 'STAGING_APPROVALS' ? 'bg-blue-100 text-blue-900' : 'text-blue-600 hover:bg-blue-50'} dark:text-blue-400`}>Staging Approvals</Button>
                        <Button variant={subFilter === 'LOADING_APPROVALS' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOADING_APPROVALS')} className={`text-xs ${subFilter === 'LOADING_APPROVALS' ? 'bg-orange-100 text-orange-900' : 'text-orange-600 hover:bg-orange-50'} dark:text-orange-400`}>Loading Approvals</Button>
                        <Button variant={subFilter === 'COMPLETED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('COMPLETED')} className={`text-xs ${subFilter === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900' : 'text-emerald-600 hover:bg-emerald-50'} dark:text-green-400`}>Completed</Button>

                        <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-1" />

                        <Button variant={subFilter === 'STAGING_REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('STAGING_REJECTED')} className={`text-xs ${subFilter === 'STAGING_REJECTED' ? 'bg-red-100 text-red-900' : 'text-red-600 hover:bg-red-50'} dark:text-red-400`}>Staging Rejected</Button>
                        <Button variant={subFilter === 'LOADING_REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOADING_REJECTED')} className={`text-xs ${subFilter === 'LOADING_REJECTED' ? 'bg-red-100 text-red-900' : 'text-red-600 hover:bg-red-50'} dark:text-red-400`}>Loading Rejected</Button>
                    </>
                )}
            </div>

            {/* Standard Tools */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none w-40"
                        placeholder="Search..."
                    />
                </div>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none [color-scheme:dark] dark:[color-scheme:dark] light:[color-scheme:light]"
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
                            <th className={`pl-4 font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Sheet ID</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Supervisor</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Shift / Dest</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Duration</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Date</th>
                            <th className={`font-medium ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Status</th>
                            <th className={`pr-4 text-right ${settings.density === 'compact' ? 'py-2' : 'py-3'}`}>Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredSheets.length === 0 ? (
                            <tr><td colSpan={7} className="py-8 text-center text-slate-500">No sheets found for this filter.</td></tr>
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
                                <td className={`pl-4 text-blue-600 dark:text-blue-400 font-mono text-xs ${settings.density === 'compact' ? 'py-1' : 'py-3'}`}>#{sheet.id.slice(0, 8)}</td>
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
                                                    'text-muted-foreground border-border'}
                                    `}>
                                        {sheet.status.replace(/_/g, ' ')}
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
