import { User } from '@/types';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PodiumItemProps {
    user: User & { rankMetric: number | string };
    rank: 1 | 2 | 3;
    metricLabel: string;
    theme?: 'dark' | 'light';
}

const PodiumItem = ({ user, rank, metricLabel, theme = 'dark' }: PodiumItemProps) => {
    const isFirst = rank === 1;
    const height = isFirst ? 'h-60' : rank === 2 ? 'h-48' : 'h-40';
    // Darker silver for Light Mode to ensure "text-white" is visible
    const color = isFirst ? 'from-amber-400 to-amber-600' : rank === 2 ? (theme === 'light' ? 'from-slate-500 to-slate-700' : 'from-slate-300 to-slate-500') : 'from-orange-400 to-orange-600';
    const Icon = isFirst ? Trophy : rank === 2 ? Medal : Award;

    return (
        <div className="flex flex-col items-center group relative">
            {/* Avatar Circle */}
            <div className={cn(
                "relative mb-4 z-10 transition-transform duration-500 group-hover:scale-110",
                isFirst ? "w-24 h-24" : "w-20 h-20"
            )}>
                <div className={cn(
                    "absolute inset-0 rounded-full bg-gradient-to-tr blur-md opacity-50",
                    color
                )} />
                <div className={cn(
                    "absolute inset-0 rounded-full border-4 shadow-xl overflow-hidden flex items-center justify-center",
                    theme === 'light' ? "bg-white border-slate-100" : "bg-slate-800 border-slate-700"
                )}>
                    {user.fullName ? (
                        <span className={cn("text-2xl font-black", theme === 'light' ? "text-slate-500" : "text-slate-500")}>
                            {user.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                    ) : (
                        <span className="text-2xl font-black text-slate-400">?</span>
                    )}
                </div>
                <div className={cn(
                    "absolute -bottom-2 translate-x-1/2 right-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-20 bg-gradient-to-br",
                    color
                )}>
                    {rank}
                </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-4">
                <h3 className={cn(
                    "font-black text-lg leading-tight truncate max-w-[150px]",
                    theme === 'light' ? "text-slate-900" : "text-white"
                )}>
                    {user.fullName || user.username}
                </h3>
                <p className={cn(
                    "text-[10px] uppercase tracking-widest font-bold mt-1",
                    theme === 'light' ? "text-slate-500" : "text-slate-400"
                )}>
                    {user.empCode}
                </p>
            </div>

            {/* The Pillar - Rounded Top AND Bottom for better edges */}
            <div className={cn(
                "w-32 rounded-3xl shadow-2xl relative flex flex-col items-center justify-end pb-8 bg-gradient-to-b transition-all duration-700",
                color,
                height
            )}>
                <Icon size={isFirst ? 48 : 32} className="text-white/20 absolute top-8" />
                <div className="text-center text-white">
                    <div className="text-2xl font-black">{user.rankMetric}</div>
                    <div className="text-[10px] font-bold uppercase opacity-80 tracking-tighter">{metricLabel}</div>
                </div>

                {/* Visual Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-3xl" />
            </div>
        </div>
    );
};

export function LeaderboardPodium({ users, metricLabel, theme = 'dark' }: { users: (User & { rankMetric: number | string })[], metricLabel: string, theme?: 'dark' | 'light' }) {
    if (users.length === 0) return null;

    // Sort: 2nd, 1st, 3rd for visual podium
    const podiumOrder = [];
    if (users[1]) podiumOrder.push({ ...users[1], r: 2 as const });
    if (users[0]) podiumOrder.push({ ...users[0], r: 1 as const });
    if (users[2]) podiumOrder.push({ ...users[2], r: 3 as const });

    return (
        <div className="flex items-end justify-center gap-4 md:gap-12 py-12 px-4 pt-20">
            {podiumOrder.map((u, i) => (
                <div key={i} className="animate-in slide-in-from-bottom duration-1000" style={{ animationDelay: `${i * 150}ms` }}>
                    <PodiumItem user={u} rank={u.r} metricLabel={metricLabel} theme={theme} />
                </div>
            ))}
        </div>
    );
}
