import { motion } from 'framer-motion';
import { Users, Truck, FileCheck, Layers } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetStatus } from '@/types';

export default function DashboardOverview() {
    const { sheets, users, loading } = useData();

    // Calculate Real Stats
    const activeStaging = sheets.filter(s => s.status === SheetStatus.DRAFT || s.status === SheetStatus.STAGING_VERIFICATION_PENDING).length;
    const loadingPending = sheets.filter(s => s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING).length;
    const completedToday = sheets.filter(s => s.status === SheetStatus.COMPLETED && new Date(s.updatedAt || '').toDateString() === new Date().toDateString()).length;
    const activeStaff = users.filter(u => u.isApproved).length;

    const stats = [
        { title: "Active Staging", value: activeStaging, icon: Layers, color: "text-blue-400", bg: "bg-blue-500/10" },
        { title: "Loading Pending", value: loadingPending, icon: Truck, color: "text-yellow-400", bg: "bg-yellow-500/10" },
        { title: "Active Staff", value: activeStaff, icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { title: "Completed Today", value: completedToday, icon: FileCheck, color: "text-purple-400", bg: "bg-purple-500/10" },
    ];

    if (loading) return <div className="p-8 text-slate-400">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Operations Overview</h2>
                    <p className="text-slate-400">Real-time status of the facility workflow.</p>
                </div>
                <div className="flex gap-3">
                    {/* Actions */}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="hover:bg-slate-800/50 transition-colors border-white/5 cursor-default">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon size={20} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 bg-slate-950/50 px-2 py-1 rounded">Real-time</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-slate-400">{stat.title}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Card className="lg:col-span-3 border-white/5 bg-slate-900/20">
                <CardHeader>
                    <CardTitle>Workflow Stages</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full min-h-[300px]">
                        {/* Stage 1: Staging */}
                        <StageColumn
                            title="Staging"
                            color="bg-blue-500/10 text-blue-400 border-blue-500/20"
                            items={sheets.filter(s => s.status === SheetStatus.DRAFT)}
                        />

                        {/* Stage 2: Verification */}
                        <StageColumn
                            title="Ready for Review"
                            color="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            items={sheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING)}
                        />

                        {/* Stage 3: Loading */}
                        <StageColumn
                            title="Loading in Progress"
                            color="bg-purple-500/10 text-purple-400 border-purple-500/20"
                            items={sheets.filter(s => s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING)}
                        />

                        {/* Stage 4: Completed */}
                        <StageColumn
                            title="Completed"
                            color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            items={sheets.filter(s => s.status === SheetStatus.COMPLETED)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StageColumn({ title, color, items }: { title: string, color: string, items: SheetData[] }) {
    return (
        <div className={`rounded-xl border ${color} p-4 h-full flex flex-col gap-3 transition-colors`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider opacity-80">{title}</h3>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px]">
                {items.length === 0 ? (
                    <div className="h-20 flex items-center justify-center text-xs opacity-40 italic">
                        No items
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="bg-slate-950/80 p-3 rounded-lg border border-white/5 hover:border-white/20 transition-all cursor-pointer shadow-sm group">
                            <div className="flex justify-between items-start">
                                <span className="font-medium text-white group-hover:text-blue-400 transition-colors">#{item.id.slice(-4)}</span>
                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-2 truncate">
                                {item.destination || 'Unknown Dest'}
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                                {item.supervisorName || 'Unassigned'}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
