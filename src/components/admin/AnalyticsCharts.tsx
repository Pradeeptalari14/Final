import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SheetData } from '@/types';
import { Calendar, Clock } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface AnalyticsChartsProps {
    sheets: SheetData[];
}

export function AnalyticsCharts({ sheets: allSheets }: AnalyticsChartsProps) {
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'CUSTOM'>('7D');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 0. Filter sheets by time range
    const filteredSheets = useMemo(() => {
        if (timeRange === 'CUSTOM') {
            let filtered = [...allSheets];
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                filtered = filtered.filter((s) => new Date(s.date) >= start);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filtered = filtered.filter((s) => new Date(s.date) <= end);
            }
            return filtered;
        }

        const now = new Date();
        let days = 7;
        if (timeRange === '30D') days = 30;
        if (timeRange === '90D') days = 90;

        const threshold = new Date(now.setDate(now.getDate() - days));
        return allSheets.filter((s) => new Date(s.date) >= threshold);
    }, [allSheets, timeRange, startDate, endDate]);

    // 1. Prepare Data: Sheets per Day (Dynamic Range)
    const dailyActivity = useMemo(() => {
        let days = 7;
        if (timeRange === '7D') days = 7;
        else if (timeRange === '30D') days = 30;
        else if (timeRange === '90D') days = 90;
        else if (timeRange === 'CUSTOM') {
            if (startDate && endDate) {
                const s = new Date(startDate);
                const e = new Date(endDate);
                const diffTime = Math.abs(e.getTime() - s.getTime());
                days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                // Cap at 180 days for performance
                if (days > 180) days = 180;
            } else {
                days = 30; // Default buffer for custom
            }
        }

        const result = [];
        const endDateObj = timeRange === 'CUSTOM' && endDate ? new Date(endDate) : new Date();

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(endDateObj);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // Format label: sparse for longer ranges
            let displayDate = '';
            if (days <= 7) {
                displayDate = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            } else if (days <= 31) {
                displayDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            } else {
                displayDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            }

            const count = filteredSheets.filter((s) => s.date === dateStr).length;
            result.push({ date: displayDate, fullDate: dateStr, count });
        }
        return result;
    }, [filteredSheets, timeRange, startDate, endDate]);

    // 2. Prepare Data: Status Distribution (On Filtered Sheets)
    const statusDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredSheets.forEach((s) => {
            const status = s.status || 'UNKNOWN';
            counts[status] = (counts[status] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({
                name: name.replace(/_/g, ' '),
                value
            }))
            .filter((i) => i.value > 0);
    }, [filteredSheets]);

    // Colors for Pie Chart
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Time Range:</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-white/5">
                    {(['7D', '30D', '90D', 'CUSTOM'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${timeRange === range ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {range === '7D'
                                ? '7 Days'
                                : range === '30D'
                                  ? '30 Days'
                                  : range === '90D'
                                    ? '3 Months'
                                    : 'Custom'}
                        </button>
                    ))}
                </div>
            </div>

            {/* NEW: Custom Date Picker for Analytics */}
            {timeRange === 'CUSTOM' && (
                <div className="flex justify-end items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden group focus-within:ring-2 focus-within:ring-slate-400/20 transition-all">
                        <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100 dark:border-white/5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                            <div className="flex flex-col">
                                <span className="text-[7px] uppercase font-bold text-slate-400 leading-tight">
                                    Start Time
                                </span>
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-[11px] font-bold outline-none w-[145px] cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                            <div className="flex flex-col">
                                <span className="text-[7px] uppercase font-bold text-slate-400 leading-tight">
                                    End Time
                                </span>
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent text-[11px] font-bold outline-none w-[145px] cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                {/* BAR CHART: Daily Activity */}
                <Card className="shadow-lg shadow-slate-200/50 border-slate-200 dark:border-white/5 dark:bg-slate-900/50">
                    <CardHeader>
                        <CardTitle>Daily Activity</CardTitle>
                        <CardDescription>
                            Sheets created in the last{' '}
                            {timeRange === '7D'
                                ? '7 days'
                                : timeRange === '30D'
                                  ? '30 days'
                                  : '3 months'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyActivity}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#E2E8F0"
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#64748B' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#64748B' }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#3B82F6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* PIE CHART: Status Distribution */}
                <Card className="shadow-lg shadow-slate-200/50 border-slate-200">
                    <CardHeader>
                        <CardTitle>Sheet Status Distribution</CardTitle>
                        <CardDescription>Breakdown by current status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusDistribution.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-4 mt-2">
                            {statusDistribution.map((entry, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 text-xs text-slate-600"
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span>
                                        {entry.name} ({entry.value})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
