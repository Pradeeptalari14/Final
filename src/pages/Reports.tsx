import React, { useState, useMemo } from 'react'; // v8.1

import {
    Activity,
    Clock,
    TrendingUp,
    Calendar,
    Filter,
    Download,
    LayoutDashboard,
    Factory,
    Truck,
    AlertOctagon,
    FileText,
    Info,
    ChevronDown,
    Users,
    CheckCircle2,
    Search,
    Timer,
    MoreHorizontal
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Role } from '@/types';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Line
} from 'recharts';
import { UserDetailModal, ShiftUser } from '@/components/UserDetailModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from "@/components/ui/input";

// --- Types ---
type ReportType = 'production' | 'oee' | 'downtime' | 'quality' | 'dpr' | 'shift';

// --- Report Details Configuration ---
const reportDetails: Record<ReportType, { title: string; desc: string; purpose: string; metrics: string }> = {
    production: {
        title: "Production Summary",
        desc: "Overview of manufacturing output, identifying trends and throughput efficiency.",
        purpose: "Used to track hourly/daily production targets versus actual output.",
        metrics: "Cases Produced, Target Adherence, Efficiency %"
    },
    oee: {
        title: "OEE Analysis",
        desc: "Overall Equipment Effectiveness breakdown into Availability, Performance, and Quality.",
        purpose: "Critical for identifying losses due to downtime, speed loss, or defects.",
        metrics: "OEE Score, Run Time, Speed Loss"
    },
    downtime: {
        title: "Downtime Analysis",
        desc: "Detailed classification of stop events, reasons, and duration impact.",
        purpose: "Pinpoint root causes of efficiency loss to prioritize maintenance or process fixes.",
        metrics: "Total Downtime, Top 5 Reasons, MTTR"
    },
    quality: {
        title: "Quality Control",
        desc: "Defect rate monitoring and standardized quality radar metrics.",
        purpose: "Ensure product standards are met and identify specific defect types.",
        metrics: "Defect Rate, FPY (First Pass Yield), Scrap %"
    },
    dpr: {
        title: "Daily Production Report (DPR)",
        desc: "Comprehensive end-of-day shop floor summary for managers.",
        purpose: "The official record of daily plant performance, used for morning meetings.",
        metrics: "Shift-wise Output, Major Stoppages, Manpower Utilization"
    },
    shift: {
        title: "Shift Performance (User Focus)",
        desc: "Real-time performance tracking of all active staff on the current shift.",
        purpose: "Monitor individual output, efficiency, and workload distribution.",
        metrics: "Sheets Completed, Cases Handled, SLA %, Avg Time"
    }
};

// --- Mock Data Generators (Dynamic) ---
const generateProductionData = (variance = 0) => {
    return Array.from({ length: 24 }).map((_, i) => ({
        time: `${i}:00`,
        target: 400 + Math.floor(Math.random() * 50),
        actual: 350 + Math.floor(Math.random() * 150) + variance,
        efficiency: 85 + Math.floor(Math.random() * 15)
    }));
};

const generateDowntimeData = () => [
    { reason: 'Equipment Failure', duration: 145 + Math.floor(Math.random() * 30), count: 3 },
    { reason: 'Material Shortage', duration: 80 + Math.floor(Math.random() * 20), count: 5 },
    { reason: 'Shift Change', duration: 45, count: 2 },
    { reason: 'Quality Checks', duration: 30, count: 8 },
    { reason: 'Cleaning', duration: 25, count: 1 },
];

const generateQualityData = () => [
    { metric: 'Accuracy', A: 95, B: 80, fullMark: 100 },
    { metric: 'Speed', A: 88, B: 90, fullMark: 100 },
    { metric: 'Reliability', A: 92, B: 85, fullMark: 100 },
    { metric: 'Safety', A: 98, B: 95, fullMark: 100 },
    { metric: 'Compliance', A: 100, B: 90, fullMark: 100 },
];

// --- SLA Logic (40 min target) ---

// --- SLA Logic (40 min target) ---
const generateSLAData = (variance = 0) => {
    // Simulate last 50 loading operations
    const totalOps = 50;
    const slaTarget = 40; // minutes
    let metSLA = 0;
    const ops = Array.from({ length: totalOps }).map((_, i) => {
        const duration = 25 + Math.floor(Math.random() * 30) + variance; // 25 to 55 mins
        if (duration <= slaTarget) metSLA++;
        return {
            id: `OP-${1000 + i}`,
            duration,
            status: duration <= slaTarget ? 'Met' : 'Breached'
        };
    });

    return {
        slaPercent: Math.round((metSLA / totalOps) * 100),
        avgDuration: Math.round(ops.reduce((acc, curr) => acc + curr.duration, 0) / totalOps),
        totalOps,
        breached: totalOps - metSLA,
        details: ops
    };
};


export default function ReportsPage() {
    const { sheets, users, activityLogs } = useData();
    const [activeReport, setActiveReport] = useState<ReportType>('shift'); // Default to Shift Report as per user interest
    const [timeRange, setTimeRange] = useState('Last 7 Days');
    const [dataVariance, setDataVariance] = useState(0); // Used to simulate filter changes
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Refresh data when filters change
    const handleFilterChange = (range: string) => {
        setIsRefreshing(true);
        setTimeRange(range);
        setTimeout(() => {
            setDataVariance(Math.floor(Math.random() * 20) - 10);
            setIsRefreshing(false);
        }, 600);
    };

    const prodData = useMemo(() => generateProductionData(dataVariance), [dataVariance]);
    const downtimeData = useMemo(() => generateDowntimeData(), [dataVariance]);
    const qualityData = useMemo(() => generateQualityData(), [dataVariance]);
    const slaStats = useMemo(() => generateSLAData(dataVariance > 0 ? 5 : 0), [dataVariance]);

    // --- Real Data Aggregation ---
    const shiftUsers = useMemo(() => {
        if (!users || !sheets) return [];

        const today = new Date().toDateString();

        // 1. Filter sheets based on Time Range
        const relevantSheets = sheets.filter(s => {
            const sheetDate = new Date(s.createdAt || s.date);
            if (timeRange === 'Today') return sheetDate.toDateString() === today;
            // For now, if not today, show ALL (Last 30 days default behavior for demo)
            return true;
        });

        // 2. Map Users to Performance Stats
        return users.map(user => {
            // Find sheets where this user was the Supervisor of record
            // Matches by Full Name or Username (fallback)
            const userSheets = relevantSheets.filter(s =>
                (s.loadingSvName === user.fullName || s.loadingSvName === user.username) ||
                (s.supervisorName === user.fullName || s.supervisorName === user.username) ||
                (s.pickingBy === user.fullName || s.pickingBy === user.username)
            );

            const sheetsCompleted = userSheets.length;

            // Calculate Cases
            const casesHandled = userSheets.reduce((acc, s) => {
                const loadingTotal = (s.loadingItems || []).reduce((sum, i) => sum + (i.total || 0), 0);
                const additionalTotal = (s.additionalItems || []).reduce((sum, i) => sum + (i.total || 0), 0);
                // Fallback to staging total if loading not started yet
                const stagingTotal = (s.stagingItems || []).reduce((sum, i) => sum + (i.ttlCases || 0), 0);
                return acc + (loadingTotal > 0 ? loadingTotal + additionalTotal : stagingTotal);
            }, 0);

            // Calculate Avg Time (Duration)
            let totalMinutes = 0;
            let timedSheets = 0;
            let metSlaCount = 0;

            userSheets.forEach(s => {
                if (s.loadingStartTime && s.loadingEndTime) {
                    // Start/End are time descriptions "HH:MM:SS" ?? Or ISO?
                    // Hook sets them as `toLocaleTimeString` or custom string. 
                    // Let's assume standard time string parsing for now.
                    // If they are just "10:00:00", we need a dummy date.
                    const d1 = new Date(`1970-01-01T${s.loadingStartTime}`);
                    const d2 = new Date(`1970-01-01T${s.loadingEndTime}`);
                    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                        let diff = (d2.getTime() - d1.getTime()) / 1000 / 60; // minutes
                        if (diff < 0) diff += 24 * 60; // Handle midnight crossover
                        totalMinutes += diff;
                        timedSheets++;
                        if (diff <= 40) metSlaCount++;
                    }
                }
            });

            const avgTime = timedSheets > 0 ? Math.round(totalMinutes / timedSheets) : 0;
            const slaCompliance = timedSheets > 0 ? Math.round((metSlaCount / timedSheets) * 100) : 100;

            // Activity Status
            // Check activity logs for this user
            const userLogs = activityLogs.filter(l => l.actor === user.username);
            const lastLog = userLogs[0]; // Ordered by time desc
            let lastActiveStr = "Offline";
            let status: 'Active' | 'Break' | 'Offline' = 'Offline';

            if (lastLog) {
                const logTime = new Date(lastLog.timestamp).getTime();
                const now = Date.now();
                const diffMins = (now - logTime) / 1000 / 60;

                if (diffMins < 15) status = 'Active';
                else if (diffMins < 60) status = 'Break';
                else status = 'Offline';

                if (diffMins < 1) lastActiveStr = "Just now";
                else if (diffMins < 60) lastActiveStr = `${Math.floor(diffMins)}m ago`;
                else if (diffMins < 1440) lastActiveStr = `${Math.floor(diffMins / 60)}h ago`;
                else lastActiveStr = "1d+ ago";
            }

            return {
                id: user.id,
                name: user.fullName || user.username,
                role: user.role === Role.LOADING_SUPERVISOR ? 'Loading Supervisor' :
                    user.role === Role.STAGING_SUPERVISOR ? 'Staging Supervisor' :
                        user.role === Role.SHIFT_LEAD ? 'Shift Lead' : 'Operator',
                sheetsCompleted,
                casesHandled,
                avgTime,
                slaCompliance,
                status,
                lastActive: lastActiveStr,
                avatar: undefined // No avatar URL in User type yet
            } as ShiftUser;
        })
            .filter(u => u.role !== 'Admin') // Filter out admins if needed
            .sort((a, b) => b.sheetsCompleted - a.sheetsCompleted); // Top performers first

    }, [users, sheets, activityLogs, timeRange]);

    const details = reportDetails[activeReport];

    // --- KPIs based on Report Type ---
    const renderContent = () => {
        if (activeReport === 'shift') {
            return <ShiftPerformanceView users={shiftUsers} />;
        }

        // Generic Dashboard for other reports
        return (
            <>
                {renderKPIs()}
                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {activeReport === 'production' && (
                        <Card className="col-span-1 lg:col-span-2 border-0 shadow-sm ring-1 ring-slate-100">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-base font-bold text-slate-800">Production vs Target (Hourly)</CardTitle>
                                        <CardDescription>Real-time throughput monitoring against planned targets.</CardDescription>
                                    </div>
                                    <Info size={16} className="text-slate-400 cursor-help" />
                                </div>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={prodData}>
                                        <defs>
                                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" name="Actual Output" />
                                        <Line type="step" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} name="Target" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {(activeReport === 'downtime' || activeReport === 'oee') && (
                        <Card className="border-0 shadow-sm ring-1 ring-slate-100">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-base font-bold text-slate-800">Downtime Analysis (Pareto)</CardTitle>
                                        <CardDescription>Top reasons for efficiency loss by duration.</CardDescription>
                                    </div>
                                    <Info size={16} className="text-slate-400 cursor-help" />
                                </div>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={downtimeData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                                        <YAxis dataKey="reason" type="category" width={100} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px' }} />
                                        <Bar dataKey="duration" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} name="Duration (min)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {(activeReport === 'quality' || activeReport === 'oee') && (
                        <Card className="border-0 shadow-sm ring-1 ring-slate-100">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-base font-bold text-slate-800">Quality Radar</CardTitle>
                                        <CardDescription>Performance across key quality dimensions.</CardDescription>
                                    </div>
                                    <Info size={16} className="text-slate-400 cursor-help" />
                                </div>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={qualityData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                                        <Radar name="Shift A" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                        <Radar name="Shift B" dataKey="B" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                        <Legend />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </>
        );
    };

    const renderKPIs = () => {
        switch (activeReport) {
            case 'production':
            case 'dpr':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <KPIGCard
                            title="Total Output"
                            desc="Total cases produced/loaded in the selected period."
                            value={8450 + (dataVariance * 10)}
                            unit="Cases"
                            trend="+5.2%"
                            trendUp={true}
                            icon={<Factory className="text-blue-500" />}
                        />
                        <KPIGCard
                            title="SLA Compliance"
                            desc={`Percentage of trucks loaded within the ${40} min target.`}
                            value={`${slaStats.slaPercent}%`}
                            unit={`Target: < ${40} min`}
                            trend={slaStats.slaPercent < 90 ? "-2.1%" : "+1.5%"}
                            trendUp={slaStats.slaPercent >= 90}
                            icon={<Clock className={slaStats.slaPercent >= 90 ? "text-green-500" : "text-amber-500"} />}
                            alert={slaStats.slaPercent < 90}
                        />
                        <KPIGCard
                            title="Avg Loading Time"
                            desc="Average duration from Check-in to Gate-out."
                            value={`${slaStats.avgDuration}m`}
                            unit="per truck"
                            trend={slaStats.avgDuration > 40 ? "+5m" : "-2m"}
                            trendUp={slaStats.avgDuration <= 40}
                            icon={<Truck className="text-purple-500" />}
                        />
                    </div>
                );
            case 'oee':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <KPIGCard title="OEE Score" desc="Global standard for measuring manufacturing productivity." value="85.4%" unit="Good" trend="+1.2%" trendUp={true} icon={<Activity className="text-blue-600" />} />
                        <KPIGCard title="Availability" desc="Percentage of scheduled time that the operation is available to operate." value="92.1%" unit="Run Time" trend="-0.5%" trendUp={false} icon={<Clock className="text-green-600" />} />
                        <KPIGCard title="Performance" desc="Speed at which the Work Center runs as a percentage of its designed speed." value="88.5%" unit="Speed" trend="+2.4%" trendUp={true} icon={<TrendingUp className="text-purple-600" />} />
                    </div>
                );
            default:
                return (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm mb-6 flex gap-2">
                        <Info size={16} className="mt-0.5" /> Select a specific KPI module to see metrics.
                    </div>
                );
        }
    };

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] bg-slate-50/50">
            {/* Sidebar / Report Selector */}
            <div className="w-64 border-r border-slate-200 bg-white p-4 hidden md:block overflow-y-auto shrink-0">
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 px-2">Management Hub</h2>
                    <p className="text-xs text-slate-500 px-2">Industrial Operations Center</p>
                </div>

                <div className="space-y-1">
                    <ReportNavItem
                        active={activeReport === 'production'}
                        icon={<LayoutDashboard size={18} />}
                        label="Production Summary"
                        onClick={() => setActiveReport('production')}
                    />
                    <ReportNavItem
                        active={activeReport === 'dpr'}
                        icon={<FileText size={18} />}
                        label="Daily Prod. Report (DPR)"
                        onClick={() => setActiveReport('dpr')}
                    />
                    <ReportNavItem
                        active={activeReport === 'shift'}
                        icon={<Users size={18} />}
                        label="Shift Report (Staff)"
                        onClick={() => setActiveReport('shift')}
                    />
                    <div className="h-px bg-slate-100 my-2 mx-2" />
                    <ReportNavItem
                        active={activeReport === 'oee'}
                        icon={<Activity size={18} />}
                        label="OEE Analysis"
                        onClick={() => setActiveReport('oee')}
                    />
                    <ReportNavItem
                        active={activeReport === 'downtime'}
                        icon={<AlertOctagon size={18} />}
                        label="Downtime Analysis"
                        onClick={() => setActiveReport('downtime')}
                    />
                    <ReportNavItem
                        active={activeReport === 'quality'}
                        icon={<CheckCircle2 size={18} />}
                        label="Quality & Defects"
                        onClick={() => setActiveReport('quality')}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className={cn("flex-1 overflow-auto p-6 transition-opacity duration-300", isRefreshing ? "opacity-60" : "opacity-100")}>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {details.title}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 mb-2">{details.desc}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Purpose: {details.purpose}
                            </Badge>
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                Key Metrics: {details.metrics}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-white">
                                    <Calendar className="mr-2 h-4 w-4" /> {timeRange} <ChevronDown size={14} className="ml-1 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-1" align="end">
                                <div className="grid gap-1">
                                    {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month'].map((range) => (
                                        <Button
                                            key={range}
                                            variant="ghost"
                                            size="sm"
                                            className="justify-start font-normal"
                                            onClick={() => handleFilterChange(range)}
                                        >
                                            {range}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button variant="outline" size="sm" className="bg-white" onClick={() => handleFilterChange(timeRange)}>
                            <Filter className="mr-2 h-4 w-4" /> Filter
                        </Button>
                        <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                    </div>
                </div>

                {renderContent()}

            </div>
        </div>
    );
}

// --- Shift User View Component ---

// --- Shift User View Component ---
function ShiftPerformanceView({ users }: { users: ShiftUser[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<ShiftUser | null>(null);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeUsers = users.filter(u => u.status === 'Active').length;
    const totalSheets = users.reduce((acc, u) => acc + u.sheetsCompleted, 0);
    const avgEff = Math.round(users.reduce((acc, u) => acc + u.slaCompliance, 0) / (users.length || 1));

    return (
        <div className="space-y-6">
            <UserDetailModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />

            {/* Top Stats Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPIGCard
                    title="Staff On-Shift"
                    desc="Number of currently active supervisors and operators."
                    value={activeUsers}
                    unit={`/ ${users.length} Total`}
                    trend="Full Staff"
                    trendUp={true}
                    icon={<Users className="text-blue-500" />}
                />
                <KPIGCard
                    title="Sheets Completed"
                    desc="Total staging and loading sheets filed today."
                    value={totalSheets}
                    unit="Sheets"
                    trend="+12%"
                    trendUp={true}
                    icon={<FileText className="text-green-500" />}
                />
                <KPIGCard
                    title="Avg Team Efficiency"
                    desc="Combined SLA compliance score across all team members."
                    value={`${avgEff}%`}
                    unit="SLA Score"
                    trend="-2%"
                    trendUp={false}
                    icon={<Activity className="text-purple-500" />}
                />
            </div>

            {/* Detailed User Table */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle className="text-lg">Staff Performance Logs</CardTitle>
                            <CardDescription>Detailed breakdown of individual contributions and efficiency.</CardDescription>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search staff..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Operator / Supervisor</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Sheets</TableHead>
                                <TableHead className="text-right">Cases</TableHead>
                                <TableHead className="text-center">Avg Time</TableHead>
                                <TableHead className="w-[150px]">SLA Efficiency</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                                                        {user.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium text-slate-900">{user.name}</div>
                                                    <div className="text-xs text-slate-500">{user.lastActive}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal text-slate-600">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{user.sheetsCompleted}</TableCell>
                                        <TableCell className="text-right text-slate-500">{user.casesHandled.toLocaleString()}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-slate-600">
                                                <Timer size={14} />
                                                {user.avgTime}m
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className={user.slaCompliance >= 90 ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                                                        {user.slaCompliance}%
                                                    </span>
                                                </div>
                                                <Progress value={user.slaCompliance} className={cn("h-1.5", user.slaCompliance >= 90 ? "bg-green-100" : "bg-amber-100")} indicatorClassName={user.slaCompliance >= 90 ? "bg-green-500" : "bg-amber-500"} />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "gap-1",
                                                user.status === 'Active' ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" :
                                                    user.status === 'Break' ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" :
                                                        "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                            )}>
                                                <div className={cn("h-1.5 w-1.5 rounded-full",
                                                    user.status === 'Active' ? "bg-green-500" :
                                                        user.status === 'Break' ? "bg-amber-500" :
                                                            "bg-slate-400"
                                                )} />
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}>
                                                        View Time Logs
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}>
                                                        Performance Card
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No staff members found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Sub-components ---


function KPIGCard({ title, desc, value, unit, trend, trendUp, icon, alert = false }: any) {
    return (
        <div className={cn(
            "p-5 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md group relative",
            alert ? "border-red-200 bg-red-50/10" : "border-slate-100"
        )}>
            {/* Info Tooltip */}
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 transition-colors cursor-help"
                        title="Click for details"
                    >
                        <Info size={14} />
                    </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-64 text-xs text-slate-600 bg-white p-3 shadow-xl border-slate-200 z-50">
                    <p className="font-bold text-slate-800 mb-1">{title}</p>
                    {desc}
                </PopoverContent>
            </Popover>

            <div className="flex justify-between items-start mb-2">
                <div className={cn("p-2 rounded-lg", alert ? "bg-red-100" : "bg-slate-50")}>
                    {icon}
                </div>
                {trend && (
                    <Badge variant="secondary" className={cn(
                        "font-mono text-xs font-bold",
                        trendUp ? "text-green-700 bg-green-50" : (alert ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50")
                    )}>
                        {trend}
                    </Badge>
                )}
            </div>
            <div>
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-800">{value}</span>
                    <span className="text-xs text-slate-400 font-medium">{unit}</span>
                </div>
            </div>
        </div>
    );
}

function ReportNavItem({ active, icon, label, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-all",
                active
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
        >
            <div className={cn(active ? "text-white" : "text-slate-400")}>{icon}</div>
            {label}
        </div>
    );
}
