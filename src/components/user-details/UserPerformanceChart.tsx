import { SheetData } from '@/types';
import { TrendingUp } from 'lucide-react';
import {
    ComposedChart,
    Bar,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface UserPerformanceChartProps {
    userSheets: SheetData[];
}

export function UserPerformanceChart({ userSheets }: UserPerformanceChartProps) {
    if (userSheets.length === 0) return null;

    // Prepare Chart Data (Time vs Target)
    const chartData = userSheets
        .map((s) => {
            let duration = 0;
            if (s.loadingStartTime && s.loadingEndTime) {
                const d1 = new Date(`1970-01-01T${s.loadingStartTime}`);
                const d2 = new Date(`1970-01-01T${s.loadingEndTime}`);
                if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                    let diff = (d2.getTime() - d1.getTime()) / 1000 / 60;
                    if (diff < 0) diff += 24 * 60; // Handle midnight crossover
                    duration = Math.round(diff);
                }
            }
            return {
                name: `Sheet #${s.id.slice(-4)}`, // Short ID
                duration: duration,
                cases: (s.loadingItems || []).reduce((acc, i) => acc + i.total, 0),
                target: 40 // SLA Target
            };
        })
        .filter((d) => d.duration > 0 || d.cases > 0)
        .slice(0, 10); // Last 10 sheets

    return (
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={18} />
                    Performance Trend (Last 10 Sheets)
                </h3>
                <div className="text-xs text-slate-500 flex gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Time
                        Taken
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>{' '}
                        Cases Loaded
                    </div>
                </div>
            </div>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e2e8f0"
                        />
                        <XAxis
                            dataKey="name"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            stroke="#94a3b8"
                        />
                        <YAxis
                            yAxisId="left"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            stroke="#94a3b8"
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            stroke="#94a3b8"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            labelStyle={{
                                color: '#64748b',
                                fontSize: '12px',
                                marginBottom: '4px'
                            }}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="duration"
                            name="Time (min)"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                            fillOpacity={0.8}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="target"
                            name="SLA Target (40m)"
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="cases"
                            name="Cases"
                            fill="#10b981"
                            stroke="#10b981"
                            fillOpacity={0.1}
                            strokeWidth={2}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
