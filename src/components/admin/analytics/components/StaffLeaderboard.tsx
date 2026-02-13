import React, { useMemo } from 'react';
import { SheetData, Role, User } from '@/types';
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
    const { users, currentUser } = useData();

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

            // Sync with Current User to ensure consistency with Header/Sidebar
            let finalPhotoUrl = u.photoURL;
            let matchReason = 'None';

            if (currentUser) {
                const normalize = (s?: string) => (s || '').toLowerCase().trim();

                // Enhanced Matching Logic
                if (normalize(u.id) === normalize(currentUser.id)) matchReason = 'ID';
                else if (normalize(u.username) === normalize(currentUser.username)) matchReason = 'Username';
                else if (normalize(u.fullName) === normalize(currentUser.fullName)) matchReason = 'FullName';
                else if (u.empCode && normalize(u.empCode) === normalize(currentUser.empCode)) matchReason = 'EmpCode';

                if (matchReason !== 'None') {
                    finalPhotoUrl = currentUser.photoURL || finalPhotoUrl;
                }
            }

            // FAILSAFE: If still no photo and name is Pradeep, force the Male Avatar
            if (!finalPhotoUrl && (name.toLowerCase().includes('pradeep') || name.toLowerCase().includes('pk') || (u.empCode === 'EMP-001'))) {
                console.log('Leaderboard: Activating Failsafe for Pradeep');
                finalPhotoUrl = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23e0e7ff%22%2F%3E%3Cpath%20d%3D%22M50%2030c-11%200-20%209-20%2020s9%2020%2020%2020%2020-9%2020-20-9-20-20-20zm0%2045c-15%200-28%208-35%2020h70c-7-12-20-20-35-20z%22%20fill%3D%22%234f46e5%22%2F%3E%3C%2Fsvg%3E';
            }

            const metric: StaffMetric = {
                name,
                sheetsCount: 0,
                totalQty: 0,
                // Use real photo if available, otherwise fallback to Inline SVG
                profileUrl: finalPhotoUrl || [
                    // Avatar 1: Male, Blue Theme
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e0e7ff"/><path d="M50 30c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 45c-15 0-28 8-35 20h70c-7-12-20-20-35-20z" fill="%234f46e5"/></svg>',
                    // Avatar 2: Female, Emerald Theme
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23d1fae5"/><circle cx="50" cy="45" r="20" fill="%23059669"/><path d="M15 95c0-15 15-30 35-30s35 15 35 30H15z" fill="%23059669"/></svg>',
                    // Avatar 3: Neutral, Amber Theme
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23fef3c7"/><circle cx="50" cy="40" r="18" fill="%23d97706"/><path d="M20 95c0-15 18-25 30-25s30 10 30 25H20z" fill="%23d97706"/></svg>'
                ][Math.floor(Math.random() * 3)], // Random fallback for non-top-3 if needed
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

        // Assign Rank & Demo Images
        return active.map((m, i: number) => ({
            ...m,
            rank: i + 1,
            // Force demo images for top 3 if no profile picture exists
            // Using Inline SVG Data URIs to guarantee they display (Network/CORS independent)
            profileUrl: m.profileUrl || [
                // Avatar 1: Male, Blue Theme
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e0e7ff"/><path d="M50 30c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 45c-15 0-28 8-35 20h70c-7-12-20-20-35-20z" fill="%234f46e5"/></svg>',
                // Avatar 2: Female, Emerald Theme
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23d1fae5"/><circle cx="50" cy="45" r="20" fill="%23059669"/><path d="M15 95c0-15 15-30 35-30s35 15 35 30H15z" fill="%23059669"/></svg>',
                // Avatar 3: Neutral, Amber Theme
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23fef3c7"/><circle cx="50" cy="40" r="18" fill="%23d97706"/><path d="M20 95c0-15 18-25 30-25s30 10 30 25H20z" fill="%23d97706"/></svg>'
            ][i]
        }));

    }, [sheets, roleFilter, users, currentUser]);

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
                                        <td className="px-6 py-4 text-center">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black mx-auto shadow-sm",
                                                staff.rank === 1 ? "bg-yellow-400 text-yellow-900" :
                                                    staff.rank === 2 ? "bg-slate-200 text-slate-700" :
                                                        staff.rank === 3 ? "bg-orange-200 text-orange-800" :
                                                            "bg-slate-50 dark:bg-slate-800 text-slate-400"
                                            )}>
                                                {staff.rank}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-8 w-8 rounded-full overflow-hidden border border-white dark:border-slate-700 shadow-sm bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                                    {staff.profileUrl ? (
                                                        <img
                                                            src={staff.profileUrl}
                                                            alt={staff.name}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.parentElement?.classList.add('fallback-active');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <span className={cn(
                                                        "absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300 pointer-events-none",
                                                        staff.profileUrl ? "opacity-0 fallback-active:opacity-100" : "opacity-100"
                                                    )}>
                                                        {staff.name.slice(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
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
                <div className={cn(
                    "relative rounded-full overflow-hidden border-4 shadow-lg bg-white dark:bg-slate-800 flex items-center justify-center",
                    isWinner ? "h-24 w-24 border-white/30" : "h-20 w-20 border-slate-100 dark:border-slate-700"
                )}>
                    {data.profileUrl ? (
                        <img
                            src={data.profileUrl}
                            alt={data.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('fallback-active');
                            }}
                        />
                    ) : null}
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center font-black pointer-events-none",
                        isWinner ? "bg-white text-indigo-600 shadow-inner" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
                        isWinner ? "text-xl" : "text-lg",
                        data.profileUrl ? "opacity-0 fallback-active:opacity-100" : "opacity-100"
                    )}>
                        {data.name.slice(0, 2).toUpperCase()}
                    </div>
                </div>
                <div className={cn(
                    "absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 font-black text-sm shadow-md",
                    isWinner ? "bg-yellow-400 text-yellow-900" : "bg-slate-200 text-slate-600"
                )}>
                    {data.rank}
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
