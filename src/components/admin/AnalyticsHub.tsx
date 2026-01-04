import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SheetData, SheetStatus } from '@/types';
import {
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Target,
    Activity,
    Calendar,
    Download,
    Search,
    Zap,
    Maximize2,
    X,
    Users,
    UserCheck,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    AlertCircle,
    Layers,
    LayoutGrid,
    PanelLeft,
    Info,
    Truck,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import { StaffPerformanceDetail } from './analytics/components/StaffPerformanceDetail';
import { AnalyticsCharts } from './AnalyticsCharts';
import { RosterUploader, RosterEntry } from './analytics/RosterUploader';
import { LogisticsTable } from './analytics/LogisticsTable';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';
import { UserPerformanceSummary } from './analytics/components/UserPerformanceSummary';
import { Role, User } from '@/types';

interface AnalyticsHubProps {
    sheets: SheetData[];
    currentUser?: User | null;
    onRefresh?: () => Promise<void>;
}

export function AnalyticsHub({ sheets: allSheets, currentUser, onRefresh: _onRefresh }: AnalyticsHubProps) {
    const navigate = useNavigate();
    const { users } = useData();
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('7D');
    const [searchId, setSearchId] = useState('');
    const [selectedSheet, setSelectedSheet] = useState<SheetData | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showProjection, setShowProjection] = useState(false);
    const [rosterData, setRosterData] = useState<RosterEntry[]>([]);

    // Load Roster from IDB on mount
    useState(() => {
        get('shift_roster').then((val) => {
            if (val) setRosterData(val);
        });
    });

    const handleRosterUpload = (data: RosterEntry[]) => {
        setRosterData(data);
        set('shift_roster', data);
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
            // 1. Date Filter
            const dateMatch = new Date(s.date) >= threshold;
            if (!dateMatch) return false;

            // 2. User Specific Filter (Only for non-ADMIN/SHIFT_LEAD)
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
            totalActual += (s.additionalItems || []).reduce(
                (acc, item) => acc + (item.total || 0),
                0
            );
        });

        const efficiency = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
        const completed = filteredData.filter((s) => s.status === SheetStatus.COMPLETED).length;
        const completionRate = totalSheets > 0 ? (completed / totalSheets) * 100 : 0;

        return [
            {
                label: 'Total Efficiency',
                value: `${efficiency.toFixed(1)}%`,
                trend: '+2.4%',
                isUp: true,
                icon: Target,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                glow: 'shadow-blue-500/20',
                description: 'Ratio of Actual Verified Cases vs Target Cases'
            },
            {
                label: 'Completion Rate',
                value: `${completionRate.toFixed(1)}%`,
                trend: '-1.2%',
                isUp: false,
                icon: Activity,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                glow: 'shadow-emerald-500/20',
                description: 'Percentage of total sheets marked as COMPLETED'
            },
            {
                label: 'Sricity Pulse',
                value: totalSheets.toString(),
                trend: 'ACTIVE',
                isUp: true,
                icon: Zap,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                glow: 'shadow-indigo-500/20',
                description: 'Total number of active operational sheets'
            },
            {
                label: 'Production Qty',
                value: (totalActual / 1000).toFixed(1) + 'K',
                trend: '+5.2%',
                isUp: true,
                icon: TrendingUp,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                glow: 'shadow-amber-500/20',
                description: 'Total volume of confirmed loaded cases'
            }
        ];
    }, [filteredData]);

    // 3. Supervisor Radar Data (Aggregate Real Metrics) - REMOVED UNUSED CALCULATION
    // Future Note: Re-implement supervisorQuality here if radar charts are needed.

    // 4. Performance Data (Daily) - REMOVED UNUSED CALCULATION
    // Future Note: Re-implement dailyPerformance here if daily efficiency charts are needed.

    // 7. Velocity Forecast (Real Real-Time Data)
    const velocityMetrics = useMemo(() => {
        const hourMap = new Array(24).fill(0);
        const uniqueDays = new Set<string>();

        // Use ALL sheets to build a robust historical profile, not just filtered
        allSheets.forEach((s) => {
            // Prefer loadingStartTime, fallback to createdAt or date
            const ts = s.loadingStartTime || s.createdAt || s.date;
            const d = new Date(ts);
            if (isNaN(d.getTime())) return;

            uniqueDays.add(d.toDateString());
            const h = d.getHours();

            // Calculate Volume (Staging Target as predictive proxy, or Actual if available)
            const vol = s.stagingItems.reduce((acc, i) => acc + (i.ttlCases || 0), 0);
            hourMap[h] += vol;
        });

        const dayCount = uniqueDays.size || 1;
        const profile = hourMap.map((total, h) => ({
            time: `${h.toString().padStart(2, '0')}:00`,
            load: Math.round(total / dayCount),
            raw: total
        }));

        // Find Peaks
        let peakLoad = 0;
        let peakTime = '';
        profile.forEach((p) => {
            if (p.load > peakLoad) {
                peakLoad = p.load;
                peakTime = p.time;
            }
        });

        // Filter for display (e.g. 06:00 to 22:00 usually, or just non-zero)
        const displayData = profile.filter((p) => p.load > 0);

        // If no data, return a localized default or empty
        if (displayData.length === 0)
            return {
                chartData: [],
                peakTime: 'N/A',
                peakLoad: 0,
                rec: 'Insufficient data for prediction',
                efficiencyGain: '0%'
            };

        return {
            chartData: displayData,
            peakTime,
            peakLoad,
            rec:
                peakLoad > 500
                    ? `Peak load of ${peakLoad} cases at ${peakTime}. Recommend deploying 2 extra loaders.`
                    : `Optimum flow detected at ${peakTime}. Standard staffing is sufficient.`,
            efficiencyGain: peakLoad > 500 ? '+15% throughput' : 'Stable'
        };
    }, [allSheets]);

    // 5. CSV Export
    const handleExport = () => {
        const headers = [
            'Date',
            'ID',
            'Shift',
            'Destination',
            'Target (Cases)',
            'Actual (Cases)',
            'Status'
        ];
        const rows = filteredData.map((s) => {
            const target = s.stagingItems.reduce((acc, item) => acc + (item.ttlCases || 0), 0);
            const actual =
                (s.loadingItems || []).reduce((acc, item) => acc + (item.total || 0), 0) +
                (s.additionalItems || []).reduce((acc, item) => acc + (item.total || 0), 0);
            return [s.date, s.id, s.shift, s.destination, target, actual, s.status];
        });

        const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `unicharm_futuristic_analytics_${timeRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 6. Deep Dive Search logic (ID or User)
    const handleSearch = () => {
        const query = searchId.toLowerCase().trim();
        if (!query) return;

        // Try find sheet
        const foundSheet = allSheets.find((s) => s.id.toLowerCase() === query);
        if (foundSheet) {
            setSelectedSheet(foundSheet);
            setSelectedUser(null);
            return;
        }

        // Try find user
        const foundUser = users.find(
            (u) =>
                u.fullName.toLowerCase().includes(query) ||
                u.username.toLowerCase() === query ||
                u.empCode?.toLowerCase() === query
        );

        if (foundUser) {
            // Aggregate user performance
            const userSheets = allSheets.filter(
                (s) =>
                    s.supervisorName === foundUser.fullName ||
                    s.loadingSvName === foundUser.fullName ||
                    s.createdBy === foundUser.username
            );

            let tT = 0;
            let tA = 0;
            userSheets.forEach((s) => {
                tT += s.stagingItems.reduce((acc, i) => acc + (i.ttlCases || 0), 0);
                tA += (s.loadingItems || []).reduce((acc, i) => acc + (i.total || 0), 0);
                tA += (s.additionalItems || []).reduce((acc, i) => acc + (i.total || 0), 0);
            });

            setSelectedUser({
                ...foundUser,
                stats: {
                    totalSheets: userSheets.length,
                    completedSheets: userSheets.filter((s) => s.status === SheetStatus.COMPLETED)
                        .length,
                    totalCases: tA,
                    efficiency: tT > 0 ? (tA / tT) * 100 : 0
                }
            });
            setSelectedSheet(null);
        }
    };

    const [searchParams, setSearchParams] = useSearchParams();
    const [reportViewMode, setReportViewMode] = useState<'OVERVIEW' | 'DETAIL'>(
        searchParams.get('report') ? 'DETAIL' : 'OVERVIEW'
    );
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Derive activeReport from searchParams
    const activeReport = searchParams.get('report')?.toUpperCase() || 'DAILY';


    const setActiveReport = (report: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('report', report);
        setSearchParams(newParams);
    };

    const reportTypes = [
        {
            id: 'DAILY',
            label: 'Operational Overview',
            icon: Activity,
            description: 'Monitor daily operational metrics and KPIs',
            count: 'Live',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20'
        },
        {
            id: 'ROSTER',
            label: 'Shift Roster',
            icon: Users,
            description: 'Upload shift plans and track staff attendance vs schedule',
            count: 'Active',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20'
        },
        {
            id: 'LOGISTICS',
            label: 'Logistics',
            icon: Truck,
            description: 'Track Active, Past, and Future vehicle movements',
            count: 'Vehicles',
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20'
        },
        {
            id: 'STAFF',
            label: 'Staff Performance',
            icon: Target,
            description: 'Analyze supervisor and team performance',
            count: 'Metrics',
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20'
        }
    ];

    if (reportViewMode === 'OVERVIEW') {
        return (
            <div className="h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-300">
                <div className="h-full overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">Report Center</h2>
                            <p className="text-slate-500 dark:text-slate-400">Select a report category to view detailed analytics.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {reportTypes.map((report) => (
                                <button
                                    key={report.id}
                                    onClick={() => { setActiveReport(report.id); setReportViewMode('DETAIL'); }}
                                    className="group relative flex flex-col items-start p-6 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300 text-left"
                                >
                                    <div className={cn("p-3 rounded-2xl mb-4 transition-colors", report.bg)}>
                                        <report.icon className={cn("h-8 w-8", report.color)} />
                                    </div>
                                    <div className="flex justify-between items-start w-full mb-1">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                                            {report.label}
                                        </h3>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">
                                            {report.count}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-400">
                                        {report.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                {/* LEFT SIDEBAR - REPORTS NAV */}
                {isSidebarOpen && (
                    <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide bg-white/50 lg:bg-transparent p-2 lg:p-0 rounded-2xl lg:rounded-none border lg:border-none border-slate-100 dark:border-slate-800">
                        <div className="px-2 lg:px-4 py-2 lg:w-full min-w-[200px]">
                            <button
                                onClick={() => setReportViewMode('OVERVIEW')}
                                className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 hover:underline"
                            >
                                <div className="bg-indigo-100 rounded-md p-1">
                                    <LayoutGrid className="h-3 w-3" />
                                </div>
                                Back to Reports
                            </button>

                            <div className="flex lg:flex-col gap-1 lg:space-y-1">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2 hidden lg:block">
                                    Report Center
                                </h3>
                                <button
                                    onClick={() => { setActiveReport('DAILY'); setReportViewMode('DETAIL'); }}
                                    className={cn(
                                        'flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border lg:border-none border-slate-100 dark:border-slate-800 lg:bg-transparent bg-white dark:bg-slate-900',
                                        activeReport === 'DAILY'
                                            ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-lg shadow-indigo-500/10 lg:scale-105 border-indigo-200 dark:border-indigo-900'
                                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 lg:hover:pl-4'
                                    )}
                                >
                                    <Activity size={16} className="text-indigo-600" />
                                    <span className="whitespace-nowrap">Operational Overview</span>
                                </button>
                                <button
                                    onClick={() => { setActiveReport('ROSTER'); setReportViewMode('DETAIL'); }}
                                    className={cn(
                                        'flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border lg:border-none border-slate-100 dark:border-slate-800 lg:bg-transparent bg-white dark:bg-slate-900',
                                        activeReport === 'ROSTER'
                                            ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-lg shadow-emerald-500/10 lg:scale-105 border-emerald-200 dark:border-emerald-900'
                                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 lg:hover:pl-4'
                                    )}
                                >
                                    <Users size={16} className="text-emerald-600" />
                                    <span className="whitespace-nowrap">Shift Roster</span>
                                </button>
                                <button
                                    onClick={() => { setActiveReport('LOGISTICS'); setReportViewMode('DETAIL'); }}
                                    className={cn(
                                        'flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border lg:border-none border-slate-100 dark:border-slate-800 lg:bg-transparent bg-white dark:bg-slate-900',
                                        activeReport === 'LOGISTICS'
                                            ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-lg shadow-amber-500/10 lg:scale-105 border-amber-200 dark:border-amber-900'
                                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 lg:hover:pl-4'
                                    )}
                                >
                                    <Truck size={16} className="text-amber-600" />
                                    <span className="whitespace-nowrap">Vehicle Logistics</span>
                                </button>
                                <button
                                    onClick={() => { setActiveReport('STAFF'); setReportViewMode('DETAIL'); }}
                                    className={cn(
                                        'flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border lg:border-none border-slate-100 dark:border-slate-800 lg:bg-transparent bg-white dark:bg-slate-900',
                                        activeReport === 'STAFF'
                                            ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-lg shadow-purple-500/10 lg:scale-105 border-purple-200 dark:border-purple-900'
                                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 lg:hover:pl-4'
                                    )}
                                >
                                    <Target size={16} className="text-purple-600" />
                                    <span className="whitespace-nowrap">Staff Performance</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MAIN CONTENT WRAPPER - SCROLLABLE */}
                <div className="flex-1 flex flex-col bg-white/50 dark:bg-slate-900/50 rounded-[2rem] overflow-hidden min-w-0 relative">
                    <div className="absolute top-4 left-4 z-50">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="h-10 w-10 p-0 shrink-0 rounded-xl bg-white/80 backdrop-blur-md shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-white transition-all"
                        >
                            <PanelLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
                        </Button>
                    </div>

                    <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                        <div className="space-y-6">
                            {/* FUTURISTIC TOOLBAR */}
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl shadow-indigo-500/5">
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                        <div className="relative w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-lg overflow-hidden">
                                            <Activity size={24} className="animate-pulse" />
                                            <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-indigo-600 rounded-full m-2" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                            {reportTypes.find(r => r.id === activeReport)?.label || 'Analytics Hub'}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.3em]">
                                                {activeReport === 'DAILY' ? 'Live Operational Stream' : 'Historical Analysis'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                                    {/* Deep Dive Search */}
                                    <div className="relative flex-1 min-w-[300px] xl:max-w-md group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <Search
                                                size={16}
                                                className="text-indigo-400 group-focus-within:text-indigo-600 transition-colors"
                                            />
                                        </div>
                                        <Input
                                            value={searchId}
                                            onChange={(e) => setSearchId(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Search Sheet ID or Staff Name..."
                                            className="pl-12 pr-24 h-10 rounded-2xl bg-slate-50 border-none shadow-inner text-xs font-bold placeholder:text-slate-300"
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
                                        >
                                            Explore
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex gap-1">
                                            {(['7D', '30D', '90D'] as const).map((r) => (
                                                <button
                                                    key={r}
                                                    onClick={() => setTimeRange(r)}
                                                    className={cn(
                                                        'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all',
                                                        timeRange === r
                                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl shadow-indigo-500/10 scale-105'
                                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                    )}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="h-14 w-14 rounded-2xl border-none bg-slate-100 hover:bg-indigo-50 text-indigo-600 transition-all"
                                            onClick={handleExport}
                                            title="Export Detailed Report"
                                        >
                                            <Download size={20} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* KPI GRID - GLASS BLUR CARDS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {kpis.map((kpi, idx) => (
                                    <Card
                                        key={idx}
                                        className={cn(
                                            'relative border-none shadow-xl shadow-slate-200/40 dark:shadow-none dark:border rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-300',
                                            kpi.glow
                                        )}
                                    >
                                        <CardContent className="p-5 relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div
                                                    className={cn(
                                                        'p-2.5 rounded-xl transition-all duration-500 group-hover:rotate-[15deg] shadow-sm',
                                                        kpi.bg,
                                                        kpi.color
                                                    )}
                                                >
                                                    <kpi.icon size={20} />
                                                </div>
                                                <div className="flex gap-2">
                                                    <div
                                                        className={cn(
                                                            'px-2.5 py-1 rounded-full flex items-center gap-1 text-[9px] font-black tracking-widest',
                                                            kpi.isUp
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-rose-50 text-rose-600'
                                                        )}
                                                    >
                                                        {kpi.isUp ? (
                                                            <TrendingUp size={12} />
                                                        ) : (
                                                            <TrendingDown size={12} />
                                                        )}
                                                        {kpi.trend}
                                                    </div>
                                                    <div className="group/info relative">
                                                        <Info
                                                            size={16}
                                                            className="text-slate-300 hover:text-indigo-400 cursor-help transition-colors"
                                                        />
                                                        <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-slate-800 text-white text-[10px] rounded-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 pointer-events-none shadow-xl font-medium">
                                                            {kpi.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">
                                                {kpi.value}
                                            </h3>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
                                                {kpi.label}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* MAIN DATA STREAMING HUB */}
                            {activeReport === 'DAILY' && (
                                <div className="space-y-6">
                                    {/* 0. Relocated Performance Summary */}
                                    {currentUser && currentUser.role !== Role.ADMIN && (
                                        <div className="mb-6">
                                            <UserPerformanceSummary />
                                        </div>
                                    )}

                                    {/* 1. Analytics Charts (Moved from Dashboard) */}
                                    <AnalyticsCharts sheets={filteredData} />

                                    {/* 2. Enhanced Metrics (Total Qty, Dispatched, Loaded) */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800">
                                            <CardContent className="p-4 flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-indigo-400">Total Quantity (Target)</span>
                                                <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                                                    {filteredData.reduce((acc, s) => acc + s.stagingItems.reduce((a, i) => a + (i.ttlCases || 0), 0), 0).toLocaleString()}
                                                </span>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800">
                                            <CardContent className="p-4 flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-emerald-400">Loaded Quantity (Actual)</span>
                                                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                                    {filteredData.reduce((acc, s) => {
                                                        const l = (s.loadingItems || []).reduce((a, i) => a + (i.total || 0), 0);
                                                        const ad = (s.additionalItems || []).reduce((a, i) => a + (i.total || 0), 0);
                                                        return acc + l + ad;
                                                    }, 0).toLocaleString()}
                                                </span>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
                                            <CardContent className="p-4 flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-blue-400">Dispatched Quantity</span>
                                                <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                                                    {filteredData.filter(s => s.status === SheetStatus.COMPLETED).reduce((acc, s) => {
                                                        const l = (s.loadingItems || []).reduce((a, i) => a + (i.total || 0), 0);
                                                        const ad = (s.additionalItems || []).reduce((a, i) => a + (i.total || 0), 0);
                                                        return acc + l + ad;
                                                    }, 0).toLocaleString()}
                                                </span>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Existing Graphs */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        {/* Keeping existing custom charts if needed, or rely on AnalyticsCharts */}
                                    </div>
                                </div>
                            )}

                            {activeReport === 'ROSTER' && (
                                <div className="space-y-6">
                                    <Card className="border-none shadow-none bg-transparent">
                                        <CardHeader>
                                            <CardTitle>Shift Roster Management</CardTitle>
                                            <CardDescription>Upload Excel Plan to sync with Daily Operations</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <RosterUploader onUploadSuccess={handleRosterUpload} />
                                        </CardContent>
                                    </Card>

                                    {rosterData.length > 0 && (
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                                            <h3 className="font-bold mb-4">Current Roster ({rosterData.length})</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                                            <th className="py-2">Date</th>
                                                            <th className="py-2">Shift</th>
                                                            <th className="py-2">Staff Name</th>
                                                            <th className="py-2">Assigned Role</th>
                                                            <th className="py-2">Vehicle</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rosterData.slice(0, 10).map((r, i) => (
                                                            <tr key={i} className="border-b border-slate-50 dark:border-slate-900">
                                                                <td className="py-2">{r.date}</td>
                                                                <td className="py-2">{r.shift}</td>
                                                                <td className="py-2 font-bold">{r.staffName}</td>
                                                                <td className="py-2 text-slate-500">{r.role}</td>
                                                                <td className="py-2 font-mono">{r.vehicleNo || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {rosterData.length > 10 && <p className="text-[10px] text-slate-400 mt-2 text-center">Showing first 10 entries of {rosterData.length}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeReport === 'LOGISTICS' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4">
                                    {/* 1. ACTIVE VEHICLES (Loading/Locked) */}
                                    <LogisticsTable
                                        title="Active Vehicles (On-Site)"
                                        color="amber"
                                        entries={filteredData
                                            .filter(s => s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING)
                                            .map(s => ({
                                                id: s.id,
                                                date: s.date,
                                                vehicleNo: s.vehicleNo || 'Unknown',
                                                destination: s.destination,
                                                status: s.status,
                                                supervisor: s.loadingSvName,
                                                totalQty: s.stagingItems.reduce((a, i) => a + (i.ttlCases || 0), 0),
                                                loadedQty: (s.loadingItems || []).reduce((a, i) => a + (i.total || 0), 0)
                                            }))}
                                    />

                                    {/* 2. FUTURE VEHICLES (Drafts + Roster Predicted) */}
                                    {/* Combining Draft sheets and Roster items that have vehicles */}
                                    <LogisticsTable
                                        title="Future / Planned Vehicles"
                                        color="slate"
                                        entries={[
                                            ...filteredData.filter(s => s.status === SheetStatus.DRAFT || s.status === SheetStatus.STAGING_VERIFICATION_PENDING).map(s => ({
                                                id: s.id,
                                                date: s.date,
                                                vehicleNo: s.vehicleNo || 'Pending',
                                                destination: s.destination,
                                                status: s.status,
                                                totalQty: s.stagingItems.reduce((a, i) => a + (i.ttlCases || 0), 0),
                                                loadedQty: 0
                                            })),
                                            ...rosterData.filter(r => r.vehicleNo && new Date(r.date) > new Date()).map((r, i) => ({
                                                id: `roster-${i}`,
                                                date: r.date,
                                                vehicleNo: r.vehicleNo!,
                                                destination: 'Scheduled',
                                                status: 'PLANNED',
                                                totalQty: 0,
                                                loadedQty: 0
                                            }))
                                        ]}
                                    />

                                    {/* 3. PAST VEHICLES (Completed) */}
                                    <LogisticsTable
                                        title="Dispatched / Past Vehicles"
                                        color="emerald"
                                        entries={filteredData
                                            .filter(s => s.status === SheetStatus.COMPLETED)
                                            .map(s => ({
                                                id: s.id,
                                                date: s.date,
                                                vehicleNo: s.vehicleNo || 'Unknown',
                                                destination: s.destination,
                                                status: s.status,
                                                totalQty: s.stagingItems.reduce((a, i) => a + (i.ttlCases || 0), 0),
                                                loadedQty: (s.loadingItems || []).reduce((a, i) => a + (i.total || 0), 0) + (s.additionalItems || []).reduce((a, i) => a + (i.total || 0), 0)
                                            }))}
                                    />
                                </div>
                            )}

                            {activeReport === 'STAFF' && (
                                <StaffPerformanceDetail />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* DEEP DIVE MODAL / OVERLAY */}
            {
                (selectedSheet || selectedUser) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                        <div
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
                            onClick={() => {
                                setSelectedSheet(null);
                                setSelectedUser(null);
                            }}
                        />
                        <Card className="relative w-full max-w-4xl h-full max-h-[85vh] rounded-[2rem] border-none shadow-2xl shadow-indigo-500/20 overflow-hidden flex flex-col bg-white dark:bg-slate-900">
                            <button
                                onClick={() => {
                                    setSelectedSheet(null);
                                    setSelectedUser(null);
                                }}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors z-20"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex-1 overflow-y-auto">
                                {selectedSheet && (
                                    <div className="p-8 space-y-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl">
                                                    <Maximize2 size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-md text-[9px] font-black tracking-widest uppercase">
                                                            Analytical Portal
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[9px] font-black tracking-widest uppercase">
                                                            Verified
                                                        </span>
                                                    </div>
                                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                        Sheet {selectedSheet.id}
                                                    </h2>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4">
                                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                                    <Calendar className="text-indigo-500" size={20} />
                                                    <div>
                                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                            Captured Date
                                                        </p>
                                                        <p className="text-sm font-black">
                                                            {new Date(
                                                                selectedSheet.date
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                                    <Clock size={20} className="text-amber-500" />
                                                    <div>
                                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                            Start Time
                                                        </p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white">
                                                            {(() => {
                                                                const log = selectedSheet.history?.find(h => h.action === 'LOADING_STARTED' || h.action === 'STAGING_STARTED');
                                                                return selectedSheet.loadingStartTime || (log ? new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-');
                                                            })()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                                    <Clock size={20} className="text-emerald-500" />
                                                    <div>
                                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                            End Time
                                                        </p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white">
                                                            {(() => {
                                                                const log = selectedSheet.history?.find(h => h.action === 'COMPLETED' || h.action === 'LOADING_SUBMITTED' || h.action === 'STAGING_SUBMITTED');
                                                                return selectedSheet.loadingEndTime || (log ? new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-');
                                                            })()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => {
                                                        const isStaging = selectedSheet.status === SheetStatus.DRAFT || selectedSheet.status === SheetStatus.STAGING_VERIFICATION_PENDING;
                                                        const target = isStaging ? `/sheets/staging/${selectedSheet.id}` : `/sheets/loading/${selectedSheet.id}`;
                                                        navigate(target);
                                                    }}
                                                    className="h-14 px-6 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                                                >
                                                    View Details
                                                    <ArrowRight size={16} />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* 3-COLUMN METRICS GRID */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                {
                                                    label: 'Efficiency',
                                                    val: '94.2%',
                                                    icon: Zap,
                                                    col: 'indigo'
                                                },
                                                {
                                                    label: 'Time to Load',
                                                    val: '42 Min',
                                                    icon: Clock,
                                                    col: 'amber'
                                                },
                                                {
                                                    label: 'Damage Rate',
                                                    val: '0.0%',
                                                    icon: AlertCircle,
                                                    col: 'emerald'
                                                },
                                                {
                                                    label: 'Total Volume',
                                                    val: '1,450',
                                                    icon: Layers,
                                                    col: 'blue'
                                                }
                                            ].map((m, i) => (
                                                <div
                                                    key={i}
                                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                                                >
                                                    <div
                                                        className={cn(
                                                            'w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white shadow-sm',
                                                            `text-${m.col}-500`
                                                        )}
                                                    >
                                                        <m.icon size={18} />
                                                    </div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                                        {m.label}
                                                    </p>
                                                    <p className="text-xl font-black">{m.val}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* SKU Analysis Chart */}
                                            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-50 dark:border-slate-700">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h4 className="text-sm font-black">
                                                        SKU Fulfillment Performance
                                                    </h4>
                                                    <BarChart3 className="text-slate-300" size={16} />
                                                </div>
                                                <div className="h-[180px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart
                                                            data={selectedSheet.stagingItems.slice(
                                                                0,
                                                                6
                                                            )}
                                                        >
                                                            <XAxis dataKey="skuName" hide />
                                                            <YAxis hide />
                                                            <Tooltip
                                                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                                                contentStyle={{
                                                                    borderRadius: '16px',
                                                                    border: 'none',
                                                                    boxShadow:
                                                                        '0 20px 40px rgba(0,0,0,0.1)',
                                                                    fontSize: '11px'
                                                                }}
                                                            />
                                                            <Bar
                                                                dataKey="ttlCases"
                                                                fill="#4f46e5"
                                                                radius={[6, 6, 0, 0]}
                                                                barSize={32}
                                                            />
                                                            <Bar
                                                                dataKey="loose"
                                                                fill="#e2e8f0"
                                                                radius={[6, 6, 0, 0]}
                                                                barSize={32}
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Process Timeline */}
                                            <div className="space-y-4">
                                                <div className="p-6 rounded-3xl bg-indigo-900 text-white relative overflow-hidden">
                                                    <div className="relative z-10">
                                                        <h4 className="text-sm font-black mb-4">
                                                            Workflow Pulse
                                                        </h4>
                                                        <div className="space-y-6">
                                                            {[
                                                                {
                                                                    label: 'Staging Started',
                                                                    time: '08:00 AM',
                                                                    completed: true
                                                                },
                                                                {
                                                                    label: 'Verification Done',
                                                                    time: '08:45 AM',
                                                                    completed: true
                                                                },
                                                                {
                                                                    label: 'Loading Commenced',
                                                                    time: '09:00 AM',
                                                                    completed: true
                                                                },
                                                                {
                                                                    label: 'Quality Sign-off',
                                                                    time: '09:42 AM',
                                                                    completed: true
                                                                }
                                                            ].map((step, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex gap-3 relative"
                                                                >
                                                                    {i < 3 && (
                                                                        <div className="absolute left-[11px] top-6 bottom-[-20px] w-0.5 bg-indigo-500/30" />
                                                                    )}
                                                                    <div
                                                                        className={cn(
                                                                            'w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10',
                                                                            step.completed
                                                                                ? 'bg-emerald-400 text-indigo-900'
                                                                                : 'bg-indigo-700 text-indigo-400'
                                                                        )}
                                                                    >
                                                                        <CheckCircle2 size={12} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-black text-white leading-none">
                                                                            {step.label}
                                                                        </p>
                                                                        <p className="text-[9px] text-indigo-300 font-bold mt-0.5 tracking-widest">
                                                                            {step.time}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedUser && (
                                    <div className="p-8 space-y-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl relative">
                                                <Users size={32} />
                                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
                                                    <UserCheck size={16} />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-1 block">
                                                    Performance Portfolio
                                                </span>
                                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                    {selectedUser.fullName}
                                                </h2>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                        {selectedUser.role}
                                                    </span>
                                                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                        EMP: {selectedUser.empCode}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="p-6 rounded-[2.5rem] bg-indigo-50 border border-indigo-100">
                                                <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-4">
                                                    Aggregate Efficiency
                                                </h4>
                                                <div className="text-4xl font-black text-indigo-600 tracking-tighter mb-3">
                                                    {selectedUser.stats.efficiency.toFixed(1)}%
                                                </div>
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <TrendingUp size={16} />
                                                    <span className="text-xs font-black">
                                                        +3.2% vs Mean
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[
                                                    {
                                                        label: 'Operations Handled',
                                                        val: selectedUser.stats.totalSheets,
                                                        icon: Layers,
                                                        det: 'Active Sheets'
                                                    },
                                                    {
                                                        label: 'Completed Flows',
                                                        val: selectedUser.stats.completedSheets,
                                                        icon: CheckCircle2,
                                                        det: 'Full Success'
                                                    },
                                                    {
                                                        label: 'Production Volume',
                                                        val:
                                                            (
                                                                selectedUser.stats.totalCases / 1000
                                                            ).toFixed(1) + 'K',
                                                        icon: Zap,
                                                        det: 'Units Moved'
                                                    }
                                                ].map((s, i) => (
                                                    <div
                                                        key={i}
                                                        className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 text-indigo-500">
                                                            <s.icon size={20} />
                                                        </div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                                            {s.label}
                                                        </p>
                                                        <p className="text-xl font-black mb-1">
                                                            {s.val}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-slate-300">
                                                            {s.det}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* USER WORKFLOW HISTORY */}
                                        <div className="p-6 rounded-[2.5rem] bg-slate-900 text-white">
                                            <h4 className="text-sm font-black mb-6 flex items-center gap-2">
                                                <Activity className="text-indigo-400" size={18} />
                                                Recent Operational Activity
                                            </h4>
                                            <div className="space-y-3">
                                                {allSheets
                                                    .filter(
                                                        (s) =>
                                                            s.supervisorName === selectedUser.fullName
                                                    )
                                                    .slice(0, 5)
                                                    .map((s, i) => (
                                                        <div
                                                            key={i}
                                                            className="group flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedSheet(s);
                                                                setSelectedUser(null);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                                    {s.id.substring(0, 2)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black">
                                                                        Sheet {s.id}
                                                                    </p>
                                                                    <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-widest">
                                                                        {s.destination}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-black text-indigo-400">
                                                                    {s.status}
                                                                </p>
                                                                <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-widest">
                                                                    {new Date(
                                                                        s.date
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <ArrowRight
                                                                size={16}
                                                                className="text-slate-700 group-hover:text-white transition-colors"
                                                            />
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )
            }

            {/* FOOTER INSIGHTS */}
            {/* FOOTER INSIGHTS */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl shadow-slate-200/40">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                            <Zap className="text-amber-400" size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-lg font-black tracking-tight">
                                    System Velocity Optimize
                                </h4>
                                <div className="group/info relative">
                                    <Info
                                        size={14}
                                        className="text-slate-400 hover:text-white cursor-help transition-colors"
                                    />
                                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-black/80 text-white text-[10px] rounded-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 pointer-events-none shadow-xl font-medium backdrop-blur-md">
                                        Predictive AI analysis suggesting resource allocation based
                                        on incoming load.
                                    </div>
                                </div>
                            </div>
                            <p className="text-indigo-300 font-bold max-w-sm mt-1 text-xs">
                                Predictive loading suggests Shift C will handle a peak of **
                                {(velocityMetrics.peakLoad / 1000).toFixed(1)}K cases**.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowProjection(true)}
                        className="h-10 px-6 rounded-xl bg-white text-indigo-950 hover:bg-white/90 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-white/5"
                    >
                        View Projection
                    </Button>
                </div>
            </div>

            {/* PROJECTION MODAL */}
            {
                showProjection && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
                        <div
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
                            onClick={() => setShowProjection(false)}
                        />
                        <Card className="relative w-full max-w-4xl h-auto max-h-[90vh] rounded-[2.5rem] border-none shadow-2xl shadow-indigo-500/20 overflow-hidden flex flex-col bg-white dark:bg-slate-900">
                            <button
                                onClick={() => setShowProjection(false)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors z-20"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-10 space-y-8 overflow-y-auto">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                                        <Zap size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                            Velocity Forecast
                                        </h2>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            AI-Driven Resource Optimization
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                                            Predicted Hourly Load (Avg)
                                        </h4>
                                        <div className="h-[200px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={velocityMetrics.chartData}>
                                                    <XAxis
                                                        dataKey="time"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            fill: '#64748b'
                                                        }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
                                                        contentStyle={{
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                    <Bar
                                                        dataKey="load"
                                                        fill="#f59e0b"
                                                        radius={[6, 6, 0, 0]}
                                                        barSize={32}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">
                                                Recommendation
                                            </h4>
                                            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                                {velocityMetrics.rec}
                                            </p>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-2">
                                                Efficiency Gain
                                            </h4>
                                            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                                Projected{' '}
                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                    {velocityMetrics.efficiencyGain}
                                                </span>{' '}
                                                with optimized allocation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }

        </>
    );
}
