import React, { useMemo } from 'react';
import { SheetData, Role, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import {
    calculateStagingStats,
    calculateLoadingStats,
    calculateShiftLeadStats
} from '@/lib/performanceUtils';

interface StaffLeaderboardProps {
    sheets: SheetData[];
    roleFilter: 'STAGING' | 'LOADING' | 'SHIFT_LEAD';
    onUserSelect?: (user: User) => void;
}

interface StaffMetric {
    name: string;
    sheetsCount: number; // Staging Places or Vehicles
    totalQty: number;
    avgTime?: number;
    profileUrl?: string;
    rank: number;
    subLabel: string; // e.g., "Vehicles" or "Staging Places"
}

export const StaffLeaderboard: React.FC<StaffLeaderboardProps> = ({ sheets, roleFilter, onUserSelect }) => {
    const { users } = useData();

    const metrics = useMemo(() => {
        let candidates: typeof users = [];
        if (roleFilter === 'STAGING') {
            candidates = users.filter(u => u.role === Role.STAGING_SUPERVISOR || u.role === Role.ADMIN);
        } else if (roleFilter === 'LOADING') {
            candidates = users.filter(u => u.role === Role.LOADING_SUPERVISOR || u.role === Role.ADMIN);
        } else {
            candidates = users.filter(u => u.role === Role.SHIFT_LEAD || u.role === Role.ADMIN);
        }

        const calculated = candidates.map(u => {
            const name = u.fullName || u.username;
            const metric: StaffMetric = {
                name,
                sheetsCount: 0,
                totalQty: 0,
                profileUrl: u.photoURL,
                rank: 0,
                subLabel: 'Sheets'
            };

            if (roleFilter === 'STAGING') {
                const stats = calculateStagingStats(name, sheets);
                metric.sheetsCount = stats.totalStagingPlaces;
                metric.totalQty = stats.totalQuantity;
                metric.subLabel = 'Staging Places';
            } else if (roleFilter === 'LOADING') {
                const stats = calculateLoadingStats(name, sheets);
                metric.sheetsCount = stats.totalVehicles;
                metric.totalQty = stats.totalQuantity;
                metric.avgTime = stats.avgTimeMinutes;
                metric.subLabel = 'Vehicles';
            } else {
                const stats = calculateShiftLeadStats(name, sheets);
                metric.sheetsCount = stats.vehiclesDispatched;
                metric.totalQty = stats.totalQuantity;
                metric.avgTime = stats.avgLoadingTime;
                metric.subLabel = 'Vehicles Dispatched';
            }

            return metric;
        });

        // Filter out those with 0 activity
        const active = calculated.filter(m => m.totalQty > 0 || m.sheetsCount > 0);

        // Sort by Quantity primarily
        active.sort((a, b) => b.totalQty - a.totalQty);

        // Assign Rank
        return active.map((m, i: number) => ({ ...m, rank: i + 1 }));

    }, [sheets, roleFilter, users]);

    const topThree = metrics.slice(0, 3);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {metrics.length === 0 && (
                <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-400">No performance data available for this period.</p>
                </div>
            )}

            {/* PODIUM SECTION */}
            {topThree.length > 0 && (
                <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                    {topThree[1] && <PodiumCard data={topThree[1]} delay="100ms" />}
                    {topThree[0] && <PodiumCard data={topThree[0]} isWinner delay="0ms" />}
                    {topThree[2] && <PodiumCard data={topThree[2]} delay="200ms" />}
                </div>
            )}

            {/* LIST SECTION */}
            {metrics.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider">
                            Full Rankings
                        </h3>
                        <span className="text-xs font-medium text-slate-400">
                            Sorted by Volume
                        </span>
                    </div>
                    <div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3 w-16 text-center">Rank</th>
                                    <th className="px-6 py-3">Staff Member</th>
                                    <th className="px-6 py-3 text-center">Metric</th>
                                    <th className="px-6 py-3 text-right">Total Qty (Cases)</th>
                                    <th className="px-6 py-3 text-center">Avg Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {metrics.map((staff) => (
                                    <tr
                                        key={staff.rank}
                                        onClick={() => {
                                            const user = users.find(u => (u.fullName || u.username) === staff.name);
                                            if (user && onUserSelect) onUserSelect(user);
                                        }}
                                        className={cn(
                                            "hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group",
                                            onUserSelect && "cursor-pointer"
                                        )}
                                    >
                                        <td className="px-6 py-4 text-center font-bold text-slate-500 dark:text-slate-400">
                                            {staff.rank}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border border-white dark:border-slate-700 shadow-sm">
                                                    <AvatarImage src={staff.profileUrl} />
                                                    <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold">
                                                        {staff.name.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {staff.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold mr-2">
                                                {staff.sheetsCount}
                                            </span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">{staff.subLabel}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {staff.totalQty.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {staff.avgTime ? (
                                                <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    <TrendingUp size={14} />
                                                    {staff.avgTime} min
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const PodiumCard = ({ data, isWinner = false, delay }: { data: StaffMetric, isWinner?: boolean, delay: string }) => {
    return (
        <div
            className={cn(
                "relative flex flex-col items-center p-6 rounded-3xl transition-all duration-500 hover:-translate-y-2",
                isWinner
                    ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-2xl shadow-indigo-500/30 scale-110 z-10 w-full md:w-1/3"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl w-full md:w-1/4",
                "animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
            )}
            style={{ animationDelay: delay }}
        >
            {isWinner && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Trophy className="h-12 w-12 text-yellow-400 drop-shadow-md animate-bounce" />
                </div>
            )}

            <div className="mb-4 relative">
                <Avatar className={cn(
                    "border-4 shadow-lg",
                    isWinner ? "h-24 w-24 border-white/30" : "h-20 w-20 border-slate-100 dark:border-slate-700"
                )}>
                    <AvatarImage src={data.profileUrl} />
                    <AvatarFallback className={cn(
                        "text-xl font-black",
                        isWinner ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    )}>
                        {data.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className={cn(
                    "absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-sm font-black uppercase tracking-widest shadow-md whitespace-nowrap",
                    isWinner ? "bg-yellow-400 text-yellow-900" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}>
                    #{data.rank} Place
                </div>
            </div>

            <h3 className={cn(
                "font-black text-center mb-1",
                isWinner ? "text-xl" : "text-lg text-slate-800 dark:text-slate-100"
            )}>
                {data.name}
            </h3>

            <p className={cn(
                "text-xs font-bold uppercase tracking-wider mb-4",
                isWinner ? "text-indigo-200" : "text-slate-400"
            )}>
                {data.subLabel.includes('Staging') ? 'Staging Staff' : 'Operation Leader'}
            </p>

            <div className={cn(
                "w-full rounded-2xl p-3 flex justify-around items-center",
                isWinner ? "bg-white/10" : "bg-slate-50 dark:bg-slate-900"
            )}>
                <div className="text-center">
                    <p className={cn("text-[10px] uppercase font-bold", isWinner ? "text-indigo-200" : "text-slate-400")}>
                        {data.subLabel.includes(' ') ? data.subLabel.split(' ')[0] : 'Count'}
                    </p>
                    <p className={cn("text-lg font-black", isWinner ? "text-white" : "text-slate-700 dark:text-slate-200")}>{data.sheetsCount}</p>
                </div>
                <div className={cn("w-px h-8", isWinner ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700")} />
                <div className="text-center">
                    <p className={cn("text-[10px] uppercase font-bold", isWinner ? "text-indigo-200" : "text-slate-400")}>Quantity</p>
                    <p className={cn("text-lg font-black", isWinner ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400")}>
                        {(data.totalQty / 1000).toFixed(1)}k
                    </p>
                </div>
                {data.avgTime !== undefined && (
                    <>
                        <div className={cn("w-px h-8", isWinner ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700")} />
                        <div className="text-center">
                            <p className={cn("text-[10px] uppercase font-bold", isWinner ? "text-indigo-200" : "text-slate-400")}>Avg Time</p>
                            <p className={cn("text-lg font-black", isWinner ? "text-amber-300" : "text-amber-600 dark:text-amber-400")}>
                                {data.avgTime}m
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
