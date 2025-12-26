import {
    Activity,
    TrendingUp,
    FileText,
    Clock3,
    X
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

// Duplicate interface to avoid circular dependency or complex exports for now. 
// Ideally should be in types/index.ts
export interface ShiftUser {
    id: string;
    name: string;
    role: string;
    sheetsCompleted: number;
    casesHandled: number;
    avgTime: number;
    slaCompliance: number;
    status: 'Active' | 'Break' | 'Offline';
    lastActive: string;
    avatar?: string;
}

export function UserDetailModal({ user, isOpen, onClose }: { user: ShiftUser | null, isOpen: boolean, onClose: () => void }) {
    const { sheets, activityLogs, users } = useData();
    if (!user) return null;

    // Find full user object to get flexible matching name/username
    const fullUser = users.find(u => u.id === user.id);
    const namesToCheck = [user.name, fullUser?.username, fullUser?.fullName].filter(Boolean) as string[];

    // Filter Real Data for this User (Matches ANY of their names)
    const userSheets = sheets.filter(s =>
        namesToCheck.includes(s.loadingSvName || '') ||
        namesToCheck.includes(s.supervisorName || '') ||
        namesToCheck.includes(s.pickingBy || '') ||
        namesToCheck.includes(s.pickingByEmpCode || '')
    );

    const userLogs = activityLogs.filter(l =>
        namesToCheck.includes(l.actor) ||
        namesToCheck.some(n => l.details.includes(n))
    );

    // Prepare Chart Data (Time vs Target)
    const chartData = userSheets.map((s) => {
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
    }).filter(d => d.duration > 0 || d.cases > 0).slice(0, 10); // Last 10 sheets

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                {/* Visual Header */}
                <DialogHeader className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity size={120} />
                    </div>
                    <div className="flex items-center gap-5 relative z-10">
                        <Avatar className="h-20 w-20 border-4 border-white/20 shadow-lg">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-2xl font-bold bg-white text-blue-700">
                                {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-3xl font-bold text-white mb-1">{user.name}</DialogTitle>
                            <DialogDescription className="text-blue-100 text-lg flex items-center gap-2">
                                {user.role}
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 fill-current" />
                                <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border",
                                    user.status === 'Active' ? 'bg-green-400/20 text-green-100 border-green-400/30' : 'bg-slate-400/20 text-slate-200 border-slate-400/30')}>
                                    {user.status}
                                </span>
                            </DialogDescription>
                        </div>
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </DialogHeader>

                <div className="p-6 space-y-8 bg-white">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 group-hover:text-blue-600 transition-colors">Total Sheets</div>
                            <div className="text-3xl font-black text-slate-800">{userSheets.length}</div>
                            <div className="text-xs text-slate-400 mt-1">Assignments</div>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 group-hover:text-blue-600 transition-colors">Total Cases</div>
                            <div className="text-3xl font-black text-slate-800">{user.casesHandled.toLocaleString()}</div>
                            <div className="text-xs text-slate-400 mt-1">Items Loaded</div>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 group-hover:text-blue-600 transition-colors">Avg Speed</div>
                            <div className="text-3xl font-black text-blue-600">{user.avgTime}<span className="text-base font-normal text-slate-400 ml-1">min</span></div>
                            <div className="text-xs text-slate-400 mt-1">per sheet</div>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 group-hover:text-blue-600 transition-colors">SLA Score</div>
                            <div className={cn("text-3xl font-black", user.slaCompliance >= 90 ? "text-emerald-600" : "text-amber-500")}>
                                {user.slaCompliance}%
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Target: &gt;90%</div>
                        </div>
                    </div>

                    {/* Graphs Section */}
                    {chartData.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp className="text-blue-600" size={18} />
                                    Performance Trend (Last 10 Sheets)
                                </h3>
                                <div className="text-xs text-slate-500 flex gap-4">
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Time Taken</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Cases Loaded</div>
                                </div>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
                                        <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
                                        <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                                        />
                                        <Bar yAxisId="left" dataKey="duration" name="Time (min)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.8} />
                                        <Line yAxisId="left" type="monotone" dataKey="target" name="SLA Target (40m)" stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2} dot={false} />
                                        <Area yAxisId="right" type="monotone" dataKey="cases" name="Cases" fill="#10b981" stroke="#10b981" fillOpacity={0.1} strokeWidth={2} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Table Section */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" /> Recent Sheet History
                            </h3>
                            {userSheets.length > 0 ? (
                                <div className="border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow>
                                                <TableHead className="h-9 text-xs font-semibold">Sheet ID</TableHead>
                                                <TableHead className="h-9 text-xs font-semibold text-right">Cases</TableHead>
                                                <TableHead className="h-9 text-xs font-semibold text-right">Time</TableHead>
                                                <TableHead className="h-9 text-xs font-semibold text-right">SLA</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userSheets.slice(0, 5).map(s => {
                                                // Calculate duration inline for SLA check
                                                let duration = 0;
                                                let slaMet = false;
                                                if (s.loadingStartTime && s.loadingEndTime) {
                                                    const d1 = new Date(`1970-01-01T${s.loadingStartTime}`);
                                                    const d2 = new Date(`1970-01-01T${s.loadingEndTime}`);
                                                    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                                                        let diff = Math.round((d2.getTime() - d1.getTime()) / 1000 / 60);
                                                        if (diff < 0) diff += 1440;
                                                        duration = diff;
                                                        slaMet = duration <= 40;
                                                    }
                                                }

                                                return (
                                                    <TableRow key={s.id} className="hover:bg-slate-50/50">
                                                        <TableCell className="font-mono text-xs font-medium text-slate-600">{s.id}</TableCell>
                                                        <TableCell className="text-right text-xs font-medium text-slate-700">
                                                            {(s.loadingItems || []).reduce((acc, i) => acc + i.total, 0) || 0}
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs text-slate-500">
                                                            {duration > 0 ? `${duration}m` : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {duration > 0 ? (
                                                                <Badge variant="outline" className={cn("text-[10px] px-1 h-5", slaMet ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200")}>
                                                                    {slaMet ? "HIT" : "MISS"}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-400 italic p-4 text-center bg-slate-50 rounded-lg dashed border border-slate-200">No activity recorded recently.</div>
                            )}
                        </div>

                        {/* Logs Section */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Clock3 size={16} className="text-slate-400" /> Recent Activity Log
                            </h3>
                            <div className="space-y-3 pl-2 border-l-2 border-slate-100 max-h-[300px] overflow-y-auto">
                                {userLogs.length > 0 ? (
                                    userLogs.slice(0, 8).map((log) => (
                                        <div key={log.id} className="relative pl-4 pb-2">
                                            <div className="absolute -left-[2.5px] top-1.5 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white"></div>
                                            <div className="text-xs text-slate-400 mb-0.5 font-mono">
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-sm font-medium text-slate-700">{log.action}</div>
                                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{log.details}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-slate-400 italic p-2">No system logs found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
