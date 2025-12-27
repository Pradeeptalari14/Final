import React, { useState, useMemo } from 'react';
import {
    Calendar,
    Download,
    Truck,
    Users,
    Clock,
    TrendingUp,
    MapPin,
    Package
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { SheetData, SheetStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { exportToExcelGeneric } from '@/lib/excelExport';

// --- Types ---
type ReportType = 'daily' | 'staff' | 'monthly';

export default function ReportsPage() {
    const { sheets, users, syncStatus, refreshSheets } = useData();
    const [activeReport, setActiveReport] = useState<ReportType>('daily');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // --- Helper for Date Comparison ---
    const isSameDay = (dateStr: string, targetStr: string) => {
        if (!dateStr || !targetStr) return false;
        // Normalize strings to YYYY-MM-DD
        const d1 = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const d2 = targetStr.includes('T') ? targetStr.split('T')[0] : targetStr;
        return d1 === d2;
    };

    // --- Helper for Duration ---
    const getDurationMinutes = (sheet: SheetData) => {
        if (!sheet.loadingStartTime || !sheet.loadingEndTime) return 0;
        const start = new Date(`1970-01-01T${sheet.loadingStartTime}`);
        const end = new Date(`1970-01-01T${sheet.loadingEndTime}`);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
        let diff = (end.getTime() - start.getTime()) / 1000 / 60;
        if (diff < 0) diff += 24 * 60; // Midnight crossover
        return Math.round(diff);
    };

    // --- Helper for Sheet Quantity ---
    const getSheetQuantity = (sheet: SheetData) => {
        const loadingTotal = (sheet.loadingItems || []).reduce((sum, i) => sum + (i.total || 0), 0);
        const additionalTotal = (sheet.additionalItems || []).reduce((sum, i) => sum + (i.total || 0), 0);
        return loadingTotal + additionalTotal;
    };

    // --- 1. Daily Report Data ---
    const dailyReportData = useMemo(() => {
        const filtered = sheets.filter(s => isSameDay(s.date || s.createdAt, selectedDate));

        // Vehicles Dispatched (Completed or Pending Verification - basically finished loading)
        const dispatched = filtered.filter(s =>
            s.status === SheetStatus.COMPLETED ||
            s.status === SheetStatus.LOADING_VERIFICATION_PENDING
        );

        // Destination Wise Aggregation
        const destStats: Record<string, { vehicles: number, qty: number }> = {};
        dispatched.forEach(s => {
            const dest = s.destination || 'Unknown';
            if (!destStats[dest]) destStats[dest] = { vehicles: 0, qty: 0 };
            destStats[dest].vehicles += 1;
            destStats[dest].qty += getSheetQuantity(s);
        });

        return {
            totalVehicles: dispatched.length,
            totalQty: dispatched.reduce((sum, s) => sum + getSheetQuantity(s), 0),
            destinations: Object.entries(destStats).map(([name, stats]) => ({
                name,
                ...stats
            }))
        };
    }, [sheets, selectedDate]);

    // --- 2. Staff KPI Data ---
    const staffKPIData = useMemo(() => {
        const dailySheets = sheets.filter(s => isSameDay(s.date || s.createdAt, selectedDate));

        return (users || []).map(u => {
            const userSheets = dailySheets.filter(s =>
                (s.status === SheetStatus.COMPLETED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING) &&
                (s.loadingSvName === u.fullName || s.supervisorName === u.fullName)
            );

            return {
                name: u.fullName || u.username,
                vehicles: userSheets.length,
                qty: userSheets.reduce((sum, s) => sum + getSheetQuantity(s), 0),
                role: u.role
            };
        }).filter(u => u.vehicles > 0);
    }, [sheets, users, selectedDate]);

    // --- 3. Monthly Report Data ---
    const monthlyReportData = useMemo(() => {
        const [y, m] = selectedDate.split('-');
        const targetMonth = parseInt(m) - 1;
        const targetYear = parseInt(y);

        const monthlySheets = sheets.filter(s => {
            const dateStr = s.date || s.createdAt;
            const d = new Date(dateStr);
            return d.getMonth() === targetMonth &&
                d.getFullYear() === targetYear &&
                (s.status === SheetStatus.COMPLETED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING);
        });

        const destStats: Record<string, { vehicles: number, qty: number, totalTime: number, timedVehicles: number }> = {};

        monthlySheets.forEach(s => {
            const dest = s.destination || 'Unknown';
            if (!destStats[dest]) destStats[dest] = { vehicles: 0, qty: 0, totalTime: 0, timedVehicles: 0 };

            destStats[dest].vehicles += 1;
            destStats[dest].qty += getSheetQuantity(s);

            const duration = getDurationMinutes(s);
            if (duration > 0) {
                destStats[dest].totalTime += duration;
                destStats[dest].timedVehicles += 1;
            }
        });

        return {
            totalVehicles: monthlySheets.length,
            totalQty: monthlySheets.reduce((sum, s) => sum + getSheetQuantity(s), 0),
            destinations: Object.entries(destStats).map(([name, stats]) => ({
                name,
                vehicles: stats.vehicles,
                qty: stats.qty,
                avgTime: stats.timedVehicles > 0 ? Math.round(stats.totalTime / stats.timedVehicles) : 0
            }))
        };
    }, [sheets, selectedDate]);

    // --- Export Handler ---
    const handleExport = () => {
        let exportData: any[] = [];
        let filename = 'Report';

        if (activeReport === 'daily') {
            filename = `Daily_Report_${selectedDate}`;
            exportData = [
                { 'Report Type': 'Daily Report', 'Date': selectedDate },
                { 'Total Vehicles': dailyReportData.totalVehicles, 'Total Quantity': dailyReportData.totalQty },
                {},
                { 'Destination': 'Breakdown', 'Vehicles': 'Qty' },
                ...dailyReportData.destinations.map(d => ({
                    'Destination': d.name,
                    'Vehicles': d.vehicles,
                    'Qty': d.qty
                }))
            ];
        } else if (activeReport === 'staff') {
            filename = `Staff_KPI_${selectedDate}`;
            exportData = staffKPIData.map(s => ({
                'Staff Name': s.name,
                'Role': s.role,
                'Vehicles Dispatched': s.vehicles,
                'Quantity Dispatched': s.qty
            }));
        } else if (activeReport === 'monthly') {
            const monthName = new Date(selectedDate).toLocaleString('default', { month: 'long' });
            filename = `Monthly_Report_${monthName}_${new Date(selectedDate).getFullYear()}`;
            exportData = monthlyReportData.destinations.map(d => ({
                'Destination': d.name,
                'Vehicles': d.vehicles,
                'Quantity': d.qty,
                'Avg Loading Time (min)': d.avgTime
            }));
        }

        exportToExcelGeneric(exportData, filename, 'Report');
    };

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] bg-white dark:bg-slate-950 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-72 border-r border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 p-6 flex flex-col gap-8 shrink-0">
                <div>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Report Center</h2>
                    <div className="space-y-2">
                        <ReportNavItem
                            active={activeReport === 'daily'}
                            label="Daily Report"
                            icon={<Calendar size={18} />}
                            onClick={() => setActiveReport('daily')}
                        />
                        <ReportNavItem
                            active={activeReport === 'staff'}
                            label="Staff KPI / Shift"
                            icon={<Users size={18} />}
                            onClick={() => setActiveReport('staff')}
                        />
                        <ReportNavItem
                            active={activeReport === 'monthly'}
                            label="Monthly Report"
                            icon={<TrendingUp size={18} />}
                            onClick={() => setActiveReport('monthly')}
                        />
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/5">
                    <Button
                        onClick={handleExport}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold h-12 rounded-xl gap-2"
                    >
                        <Download size={18} /> Export Excel
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">
                            {activeReport === 'daily' && "Daily Operations"}
                            {activeReport === 'staff' && "Staff Performance"}
                            {activeReport === 'monthly' && "Monthly Analytics"}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {activeReport === 'daily' && `Viewing operational data for ${new Date(selectedDate).toLocaleDateString()}`}
                            {activeReport === 'staff' && `Individual KPI tracking for ${new Date(selectedDate).toLocaleDateString()}`}
                            {activeReport === 'monthly' && `Aggregated performance metrics for ${new Date(selectedDate).toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                            <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                syncStatus === 'LIVE' ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {syncStatus === 'LIVE' ? "Real-time Sync Active" : "Syncing..."}
                            </span>
                            <button
                                onClick={() => refreshSheets()}
                                className="ml-2 p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors"
                                title="Refresh Data"
                            >
                                <Clock size={12} className="text-slate-400" />
                            </button>
                        </div>

                        <input
                            type={activeReport === 'monthly' ? "month" : "date"}
                            value={activeReport === 'monthly' ? selectedDate.substring(0, 7) : selectedDate}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedDate(activeReport === 'monthly' ? `${val}-01` : val);
                            }}
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 ring-primary/20 outline-none"
                        />
                    </div>
                </div>

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {activeReport === 'daily' && (
                        <>
                            <SummaryCard title="Vehicles Dispatched" value={dailyReportData.totalVehicles} icon={<Truck className="text-blue-500" />} />
                            <SummaryCard title="Total Quantity" value={dailyReportData.totalQty} icon={<Package className="text-emerald-500" />} />
                            <SummaryCard title="Destinations" value={dailyReportData.destinations.length} icon={<MapPin className="text-purple-500" />} />
                        </>
                    )}
                    {activeReport === 'staff' && (
                        <>
                            <SummaryCard title="Staff Active" value={staffKPIData.length} icon={<Users className="text-blue-500" />} />
                            <SummaryCard title="Total Loads" value={staffKPIData.reduce((sum, s) => sum + s.vehicles, 0)} icon={<Truck className="text-green-500" />} />
                            <SummaryCard title="Total Quantity" value={staffKPIData.reduce((sum, s) => sum + s.qty, 0)} icon={<Package className="text-emerald-500" />} />
                        </>
                    )}
                    {activeReport === 'monthly' && (
                        <>
                            <SummaryCard title="Monthly Vehicles" value={monthlyReportData.totalVehicles} icon={<Truck className="text-blue-500" />} />
                            <SummaryCard title="Total Volume" value={monthlyReportData.totalQty} icon={<Package className="text-emerald-500" />} />
                            <SummaryCard title="Avg Loading Time" value={`${Math.round(monthlyReportData.destinations.reduce((acc, d) => acc + d.avgTime, 0) / (monthlyReportData.destinations.length || 1))}m`} icon={<Clock className="text-purple-500" />} />
                        </>
                    )}
                </div>

                {/* Detailed Table */}
                <Card className="border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow>
                                {activeReport === 'daily' && (
                                    <>
                                        <TableHead className="font-black uppercase tracking-wider text-[10px] pl-6 h-14">Destination</TableHead>
                                        <TableHead className="font-black uppercase tracking-wider text-[10px] text-center">Vehicles Dispatched</TableHead>
                                        <TableHead className="font-black uppercase tracking-wider text-[10px] text-right pr-6">Quantity Dispatched</TableHead>
                                    </>
                                )}
                                {activeReport === 'staff' && (
                                    <>
                                        <TableHead className="font-black uppercase tracking-wider text-[10px] pl-6 h-14">Staff Name</TableHead>
                                        <TableHead className="font-black uppercase tracking-wider text-[10px] text-center">Vehicles Handled</TableHead>
                                        <TableHead className="font-black uppercase tracking-wider text-[10px] text-right pr-6">Quantity Handled</TableHead>
                                    </>
                                )}
                                {activeReport === 'monthly' && (
                                    <>
                                        <TableHead className="font-black uppercase tracking-wider text-[10px] pl-6 h-14">Destination</TableHead>
                                        <TableHead className="font-black uppercase tracking-wider text-[10px] text-center">Total Vehicles</TableHead>
                                        <TableHead className="font-black uppercase tracking-wider text-[10px] text-center">Total Quantity</TableHead>
                                        <TableHead className="font-black uppercase tracking-wider text-[10px] text-right pr-6">Avg Loading Time</TableHead>
                                    </>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeReport === 'daily' && dailyReportData.destinations.length > 0 ? (
                                dailyReportData.destinations.map((d, i) => (
                                    <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">{d.name}</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-blue-600 dark:text-blue-400">{d.vehicles}</TableCell>
                                        <TableCell className="text-right pr-6 font-black text-slate-900 dark:text-white">{d.qty.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : activeReport === 'staff' && staffKPIData.length > 0 ? (
                                staffKPIData.map((s, i) => (
                                    <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="font-bold text-slate-900 dark:text-white uppercase">{s.name}</div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{s.role}</div>
                                        </TableCell>
                                        <TableCell className="text-center font-mono font-bold text-green-600 dark:text-green-400">{s.vehicles}</TableCell>
                                        <TableCell className="text-right pr-6 font-black text-slate-900 dark:text-white">{s.qty.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : activeReport === 'monthly' && monthlyReportData.destinations.length > 0 ? (
                                monthlyReportData.destinations.map((d, i) => (
                                    <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">{d.name}</TableCell>
                                        <TableCell className="text-center font-mono font-bold text-blue-600 dark:text-blue-400">{d.vehicles}</TableCell>
                                        <TableCell className="text-center font-bold text-slate-900 dark:text-white">{d.qty.toLocaleString()}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-none font-black text-xs">
                                                {d.avgTime} min
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={activeReport === 'monthly' ? 4 : 3} className="h-40 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        No data available for this period
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}

// --- Sub-components ---

function ReportNavItem({ active, label, icon, onClick }: { active: boolean, label: string, icon: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                active
                    ? "bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-primary dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
            )}
        >
            <div className={cn("transition-colors", active ? "text-primary dark:text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")}>
                {icon}
            </div>
            <span className="font-bold text-sm tracking-tight">{label}</span>
        </button>
    );
}

function SummaryCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
    return (
        <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-md">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">{icon}</div>
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}
