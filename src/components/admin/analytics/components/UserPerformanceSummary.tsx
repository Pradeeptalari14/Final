import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { calculateUserStats } from '@/lib/performanceUtils';
import { Clock, CheckSquare, Target, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserPerformanceSummary({ collapsed }: { collapsed?: boolean }) {
    const { currentUser, sheets } = useData();

    const stats = useMemo(() => {
        if (!currentUser) return null;
        return calculateUserStats(currentUser.fullName || currentUser.username, sheets);
    }, [currentUser, sheets]);

    if (!stats || !currentUser || currentUser.role === 'ADMIN') return null;

    if (collapsed) {
        return (
            <div className="flex flex-col items-center gap-3 py-4 border-t border-slate-100 dark:border-white/5 mx-2">
                <div title={`Efficiency: ${stats.efficiency}%`}>
                    <Activity size={18} className="text-emerald-500" />
                </div>
                <div title={`Avg Load Time: ${stats.avgLoadingTimeMinutes}m`}>
                    <Clock size={18} className="text-indigo-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 mx-2 my-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 px-1">
                My Performance
            </h4>

            <div className="grid grid-cols-2 gap-3">
                <StatBox
                    icon={CheckSquare}
                    label="Sheets"
                    value={`${stats.completedSheets}/${stats.totalSheets}`}
                    color="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                />
                <StatBox
                    icon={Clock}
                    label="Avg Time"
                    value={`${stats.avgLoadingTimeMinutes}m`}
                    color="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10"
                />
                <StatBox
                    icon={Target}
                    label="Efficiency"
                    value={`${stats.efficiency}%`}
                    color="text-amber-600 bg-amber-50 dark:bg-amber-500/10"
                />
                <StatBox
                    icon={Activity}
                    label="Cases"
                    value={stats.totalCases > 1000 ? `${(stats.totalCases / 1000).toFixed(1)}k` : stats.totalCases}
                    color="text-rose-600 bg-rose-50 dark:bg-rose-500/10"
                />
            </div>
        </div>
    );
}

function StatBox({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
    return (
        <div className="flex flex-col p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
            <div className={cn("p-1.5 rounded-lg w-fit mb-2", color)}>
                <Icon size={14} />
            </div>
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{label}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white truncate">{value}</span>
        </div>
    );
}
