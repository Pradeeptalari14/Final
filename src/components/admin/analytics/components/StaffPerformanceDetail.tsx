import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { getAllUsersStats } from '@/lib/performanceUtils';
import {
    Users,
    Search,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function StaffPerformanceDetail() {
    const { users, sheets } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const staffStats = useMemo(() => {
        return getAllUsersStats(users, sheets);
    }, [users, sheets]);

    const filteredStats = useMemo(() => {
        return staffStats.filter((s: any) => {
            const matchesSearch =
                s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.empCode?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [staffStats, searchTerm, roleFilter]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff Name/ID..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
                    <select
                        className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 py-2 pl-3 pr-8"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="ALL">All Roles</option>
                        <option value="LOADING_SUPERVISOR">Loading</option>
                        <option value="STAGING_SUPERVISOR">Staging</option>
                        <option value="SHIFT_LEAD">Shift Leads</option>
                    </select>
                </div>

                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">
                    {filteredStats.length} Users Tracked
                </div>
            </div>

            {/* Performance Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredStats.map((user: any) => (
                    <UserRow key={user.id} user={user} />
                ))}

                {filteredStats.length === 0 && (
                    <div className="py-20 text-center">
                        <Users size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">No staff found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function UserRow({ user }: { user: any }) {
    const { stats } = user;

    return (
        <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[2rem] hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Profile Info */}
                <div className="flex items-center gap-4 min-w-[250px]">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
                        {user.fullName?.charAt(0) || user.username?.charAt(0)}
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {user.fullName}
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {user.role?.replace('_', ' ')}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
                                {user.empCode}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        icon={CheckCircle2}
                        label="Completions"
                        value={`${stats.completedSheets}/${stats.totalSheets}`}
                        sub={`Rate: ${stats.efficiency}%`}
                        color="text-emerald-500"
                    />
                    <MetricCard
                        icon={Clock}
                        label="Avg Load Time"
                        value={`${stats.avgLoadingTimeMinutes}m`}
                        sub={stats.avgLoadingTimeMinutes < 45 ? "On Target" : "Warning"}
                        color={stats.avgLoadingTimeMinutes < 45 ? "text-indigo-500" : "text-rose-500"}
                    />
                    <MetricCard
                        icon={Target}
                        label="Total Cases"
                        value={stats.totalCases.toLocaleString()}
                        sub="Volume Handled"
                        color="text-amber-500"
                    />
                    <MetricCard
                        icon={ArrowUpRight}
                        label="Productivity"
                        value={`${((stats.totalCases / (stats.totalSheets || 1)) / 10).toFixed(1)}`}
                        sub="Score Index"
                        color="text-purple-500"
                    />
                </div>

                {/* Performance Gauge */}
                <div className="lg:pl-6 border-l border-slate-100 dark:border-slate-800 hidden xl:block">
                    <div className="relative h-16 w-32 flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery</span>
                            <span className="text-xs font-black text-indigo-500">{stats.efficiency}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                style={{ width: `${stats.efficiency}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, sub, color }: { icon: any, label: string, value: string, sub: string, color: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50", color)}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mb-0.5">{label}</p>
                <p className="text-base font-black text-slate-800 dark:text-white leading-none mb-1">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{sub}</p>
            </div>
        </div>
    );
}
