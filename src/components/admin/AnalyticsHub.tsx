import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SheetData, SheetStatus, StagingItem, LoadingItem } from '@/types';

import {
    TrendingUp,
    Zap,
    X,
    Users,
    Search,
    Truck,
    Clock,
    Calendar,
    LayoutGrid,
    PanelLeft,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAppState } from '@/contexts/AppStateContext';
import { StaffLeaderboard } from './analytics/components/StaffLeaderboard';
import { AnalyticsCharts } from './AnalyticsCharts';
import { RosterUploader, RosterEntry } from './analytics/RosterUploader';
import { LogisticsTable } from './analytics/LogisticsTable';
import { RosterSheetTable } from './analytics/RosterSheetTable';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';
import { UserPerformanceSummary } from './analytics/components/UserPerformanceSummary';
import { Role, User } from '@/types';
import { InAppChat } from './analytics/InAppChat';

interface AnalyticsHubProps {
    sheets: SheetData[];
    currentUser?: User | null;
    onRefresh?: () => Promise<void>;
}

export function AnalyticsHub({ sheets: allSheets, currentUser, onRefresh: _onRefresh }: AnalyticsHubProps) {
    const { settings } = useAppState();
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('7D');
    const [searchId, setSearchId] = useState('');
    const [selectedSheet, setSelectedSheet] = useState<SheetData | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const [leaderboardCategory, setLeaderboardCategory] = useState<'STAGING' | 'LOADING' | 'SHIFT_LEAD'>('STAGING');
    const [rosterData, setRosterData] = useState<RosterEntry[]>([]);
    const [rosterHeaders, setRosterHeaders] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeReport, setActiveReport] = useState('DAILY');

    // -- Chat State --
    const [activeChats, setActiveChats] = useState<string[]>([]);

    const handleChatOpen = (name: string) => {
        if (!activeChats.includes(name)) {
            // Add to start, max 3 windows
            setActiveChats(prev => [name, ...prev].slice(0, 3));
        }
    };

    const handleChatClose = (name: string) => {
        setActiveChats(prev => prev.filter(n => n !== name));
    };

    // Load Roster from IDB on mount
    useState(() => {
        Promise.all([get('shift_roster'), get('roster_headers')]).then(([data, headers]) => {
            if (data) {
                setRosterData(data);
                // Self-healing: If headers missing but data exists, recover from data keys
                if (!headers || headers.length === 0) {
                    if (data.length > 0) {
                        const recoveredHeaders = Object.keys(data[0]).filter(k => k !== 'date' && k !== 'shift' && k !== 'staffName' && k !== 'role');
                        // If recovered headers are empty (meaning only logic keys exist), fallback to logic keys
                        setRosterHeaders(recoveredHeaders.length > 0 ? recoveredHeaders : ['Date', 'Shift', 'Staff Name', 'Role']);
                    }
                } else {
                    setRosterHeaders(headers);
                }
            }
        });
    });

    const handleRosterUpload = (data: RosterEntry[], headers: string[]) => {
        setRosterData(data);
        set('shift_roster', data);
        setRosterHeaders(headers);
        set('roster_headers', headers);
        toast.success('Roster synced successfully!');
    };

    // 1. Filtering Logic
    const filteredData = useMemo(() => {
        const now = new Date();
        let days = 7;
        if (timeRange === '30D') days = 30;
        if (timeRange === '90D') days = 90;
        const threshold = new Date(now.setDate(now.getDate() - days));

        return allSheets.filter((s) => {
            const dateMatch = new Date(s.date) >= threshold;
            if (!dateMatch) return false;
            if (currentUser && currentUser.role !== Role.ADMIN && currentUser.role !== Role.SHIFT_LEAD) {
                const uName = (currentUser.username || '').toLowerCase().trim();
                const fName = (currentUser.fullName || '').toLowerCase().trim();
                const sName = (s.supervisorName || '').toLowerCase().trim();
                const lName = (s.loadingSvName || '').toLowerCase().trim();
                const cName = (s.createdBy || '').toLowerCase().trim();
                return sName === uName || sName === fName || lName === uName || lName === fName || cName === uName;
            }
            return true;
        });
    }, [allSheets, timeRange, currentUser]);

    // 2. Aggregate KPI Calculations
    const kpis = useMemo(() => {
        const totalSheets = filteredData.length;
        let totalTarget = 0;
        let totalActual = 0;
        filteredData.forEach((s) => {
            totalTarget += s.stagingItems.reduce((acc, item) => acc + (item.ttlCases || 0), 0);
            totalActual += (s.loadingItems || []).reduce((acc, item) => acc + (item.total || 0), 0);
            totalActual += (s.additionalItems || []).reduce((acc, item) => acc + (item.total || 0), 0);
        });
        const efficiency = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
        const completed = filteredData.filter((s) => s.status === SheetStatus.COMPLETED).length;
        const completionRate = totalSheets > 0 ? (completed / totalSheets) * 100 : 0;

        return [
            { label: 'Total Efficiency', value: `${efficiency.toFixed(1)}%`, trend: '+2.4%', isPositive: true, icon: Zap },
            { label: 'Completion Rate', value: `${completionRate.toFixed(1)}%`, trend: '+1.2%', isPositive: true, icon: CheckCircle2 },
            { label: 'Total Volume', value: totalActual.toLocaleString(), trend: '-0.4%', isPositive: false, icon: Truck },
            { label: 'Active Reports', value: totalSheets.toString(), trend: '+5', isPositive: true, icon: Clock }
        ];
    }, [filteredData]);



    const reportTypes = [
        { id: 'DAILY', label: 'Operational Overview', icon: LayoutGrid, color: 'indigo', desc: 'Real-time efficiency & throughput' },
        { id: 'ROSTER', label: 'Shift Roster', icon: Calendar, color: 'purple', desc: 'Resource planning & staff sync' },
        { id: 'LOGISTICS', label: 'Vehicle Logistics', icon: Truck, color: 'emerald', desc: 'Dispatch status & cycle times' },
        { id: 'STAFF', label: 'Staff Performance', icon: Users, color: 'amber', desc: 'Incentives & picking accuracy' }
    ];

    return (
        <>
            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
                <div className={cn(
                    "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 transition-all duration-300 flex flex-col shrink-0 relative",
                    isSidebarOpen ? "w-80" : "w-20 items-center py-6"
                )}>
                    {isSidebarOpen ? (
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <LayoutGrid size={20} />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Report Center</h2>
                                </div>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <PanelLeft size={16} />
                                </button>
                            </div>

                            <nav className="space-y-1">
                                {reportTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setActiveReport(type.id)}
                                        className={cn(
                                            "w-full flex flex-col p-4 rounded-2xl transition-all relative group",
                                            activeReport === type.id
                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 mb-1">
                                            <type.icon size={18} className={cn(
                                                "transition-colors",
                                                activeReport === type.id ? `text-${type.color}-600` : "text-slate-400"
                                            )} />
                                            <span className="font-bold text-sm tracking-tight">{type.label}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium ml-8 leading-tight">{type.desc}</p>
                                        {activeReport === type.id && (
                                            <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full", `bg-${type.color}-600`)} />
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    ) : (
                        // Collapsed Icon-Only View
                        <div className="flex flex-col items-center w-full gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 hover:shadow-md transition-all"
                            >
                                <PanelLeft size={20} />
                            </button>

                            <nav className="flex flex-col gap-3">
                                {reportTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setActiveReport(type.id)}
                                        className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group",
                                            activeReport === type.id
                                                ? `bg-${type.color}-50 text-${type.color}-600 shadow-sm`
                                                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                        )}
                                        title={type.label}
                                    >
                                        <type.icon size={20} />
                                        {activeReport === type.id && (
                                            <div className={cn("absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full", `bg-${type.color}-600`)} />
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>

                {/* MAIN CONTENT AREA (No Blur for sharpness) */}
                <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative">

                    <div className="h-full flex flex-col relative">
                        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                            <div className="space-y-8 max-w-[1600px] mx-auto">
                                {/* TOOLBAR */}
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/20">
                                    <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                                        <div className="relative flex-1 md:max-w-md">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <Input
                                                placeholder="Search Sheets, Vehicles..."
                                                value={searchId}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchId(e.target.value)}
                                                className="pl-12 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                                            {(['7D', '30D', '90D'] as const).map((range) => (
                                                <button
                                                    key={range}
                                                    onClick={() => setTimeRange(range)}
                                                    className={cn(
                                                        "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                                        timeRange === range
                                                            ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                    )}
                                                >
                                                    {range}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            className="h-12 px-6 rounded-2xl border-slate-200 dark:border-white/5 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                                        >
                                            <TrendingUp size={16} />
                                            Export Report
                                        </Button>
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                            <Zap size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* KPI GRID */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {kpis.map((kpi, i) => (
                                        <Card key={i} className="group relative overflow-hidden rounded-[2rem] border-none shadow-xl shadow-slate-200/30 dark:shadow-none bg-white dark:bg-slate-900 transition-all hover:-translate-y-1">
                                            <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10", kpi.isPositive ? "bg-emerald-500" : "bg-indigo-500")} />
                                            <CardContent className="p-8">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                                                        <kpi.icon size={20} />
                                                    </div>
                                                    <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest", kpi.isPositive ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                                                        {kpi.trend}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{kpi.label}</p>
                                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{kpi.value}</h3>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* MAIN REPORT CONTENT */}
                                {activeReport === 'DAILY' && (
                                    <AnalyticsCharts sheets={filteredData} className="animate-in fade-in slide-in-from-bottom-5 duration-500" />
                                )}

                                {activeReport === 'ROSTER' && (
                                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/20 bg-white dark:bg-slate-900 overflow-hidden">
                                        <CardHeader className="p-8 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <CardTitle className="text-2xl font-black tracking-tighter">Shift Roster Sync</CardTitle>
                                                    <CardDescription className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel Management & Deployment</CardDescription>
                                                </div>
                                                <RosterUploader onUploadSuccess={handleRosterUpload} />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <div className="col-span-full">
                                                    <RosterSheetTable
                                                        density={settings?.density}
                                                        headers={rosterHeaders}
                                                        entries={rosterData.filter(r =>
                                                            !searchId ||
                                                            Object.values(r).some(val =>
                                                                String(val).toLowerCase().includes(searchId.toLowerCase())
                                                            )
                                                        )}
                                                        onChatClick={handleChatOpen}
                                                    />

                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeReport === 'LOGISTICS' && (
                                    <div className="space-y-8">
                                        <LogisticsTable
                                            title="Active & Verification Pending"
                                            color="indigo"
                                            density={settings?.density}
                                            onRowClick={(id) => setSelectedSheet(filteredData.find(s => s.id === id) || null)}
                                            entries={filteredData.filter(s => s.status !== SheetStatus.COMPLETED).map(s => ({
                                                id: s.id,
                                                date: s.date,
                                                vehicleNo: s.vehicleNo || 'Pending',
                                                destination: s.destination,
                                                status: s.status,
                                                totalQty: s.stagingItems.reduce((a, i: StagingItem) => a + (i.ttlCases || 0), 0),
                                                loadedQty: (s.loadingItems || []).reduce((a, i: LoadingItem) => a + (i.total || 0), 0)
                                            }))}
                                        />
                                        <LogisticsTable
                                            title="Dispatched / Past Vehicles"
                                            color="emerald"
                                            density={settings?.density}
                                            onRowClick={(id) => setSelectedSheet(filteredData.find(s => s.id === id) || null)}
                                            entries={filteredData.filter(s => s.status === SheetStatus.COMPLETED).map(s => ({
                                                id: s.id,
                                                date: s.date,
                                                vehicleNo: s.vehicleNo || 'Unknown',
                                                destination: s.destination,
                                                status: s.status,
                                                totalQty: s.stagingItems.reduce((a, i: StagingItem) => a + (i.ttlCases || 0), 0),
                                                loadedQty: (s.loadingItems || []).reduce((a, i: LoadingItem) => a + (i.total || 0), 0)
                                            }))}
                                        />
                                    </div>
                                )}

                                {activeReport === 'STAFF' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Performance Leaderboard</h3>
                                                <p className="text-sm text-slate-500">Recognizing top contributors across operations</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                                    {(['STAGING', 'LOADING', 'SHIFT_LEAD'] as const).map((cat) => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => setLeaderboardCategory(cat)}
                                                            className={cn(
                                                                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                                                leaderboardCategory === cat
                                                                    ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                                                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                                            )}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <StaffLeaderboard sheets={filteredData} roleFilter={leaderboardCategory} onUserSelect={setSelectedUser} />
                                    </div>
                                )}
                            </div>
                        </div>


                    </div>
                </div>
            </div>

            {/* DEEP DIVE MODAL */}
            {(selectedSheet || selectedUser) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-950/60" onClick={() => { setSelectedSheet(null); setSelectedUser(null); }} />
                    <Card className="relative w-full max-w-4xl h-full max-h-[85vh] rounded-[2rem] border-none shadow-2xl shadow-indigo-500/20 overflow-hidden flex flex-col bg-white dark:bg-slate-900">
                        <button onClick={() => { setSelectedSheet(null); setSelectedUser(null); }} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors z-20">
                            <X size={20} />
                        </button>
                        <div className="flex-1 overflow-y-auto">
                            {selectedSheet && (
                                <div className="p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Sheet {selectedSheet.id}</h2>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Deep-Dive</p>
                                        </div>
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase",
                                            selectedSheet.status === SheetStatus.COMPLETED ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                        )}>
                                            {selectedSheet.status.replace(/_/g, ' ')}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">Destination</p>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-200 truncate">{selectedSheet.destination}</p>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">Vehicle No</p>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-200 truncate">{selectedSheet.vehicleNo || 'Pending'}</p>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">Date</p>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-200 truncate">{selectedSheet.date}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Workflow History</h4>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Created By', value: selectedSheet.createdBy, time: selectedSheet.createdAt },
                                                { label: 'Staging Supervisor', value: selectedSheet.supervisorName, time: selectedSheet.createdAt },
                                                { label: 'Loading Supervisor', value: selectedSheet.loadingSvName, time: selectedSheet.loadingStartTime }
                                            ].map((log, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">{log.label}</p>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{log.value || 'N/A'}</p>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-slate-400">{log.time ? new Date(log.time).toLocaleTimeString() : '--:--'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {selectedUser && (
                                <div className="p-8 space-y-8">
                                    <UserPerformanceSummary user={selectedUser} sheets={filteredData} />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Global Chat Overlay */}
            {activeChats.map((recipient, i) => (
                <InAppChat
                    key={recipient}
                    recipientName={recipient}
                    index={i}
                    onClose={() => handleChatClose(recipient)}
                />
            ))}
        </>
    );
}
