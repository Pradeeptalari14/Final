import { User } from '@/types';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PodiumItemProps {
    user: User & { rankMetric: number | string };
    rank: 1 | 2 | 3;
    metricLabel: string;
}

const PodiumItem = ({ user, rank, metricLabel }: PodiumItemProps) => {
    const isFirst = rank === 1;
    const height = isFirst ? 'h-64' : rank === 2 ? 'h-52' : 'h-44';
    const color = isFirst ? 'from-amber-400 to-amber-600' : rank === 2 ? 'from-slate-300 to-slate-500' : 'from-orange-400 to-orange-600';
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
                <div className="absolute inset-0 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    {user.fullName ? (
                        <span className="text-2xl font-black text-slate-400">
                            {user.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                    ) : (
                        <span className="text-2xl font-black text-slate-400">?</span>
                    )}
                </div>
                <div className={cn(
                    "absolute -bottom-2 translate-x-1/2 right-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-20",
                    color
                )}>
                    {rank}
                </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-4">
                <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight truncate max-w-[150px]">
                    {user.fullName || user.username}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                    {user.empCode}
                </p>
            </div>

            {/* The Pillar */}
            <div className={cn(
                "w-32 rounded-t-3xl shadow-2xl relative flex flex-col items-center justify-end pb-8 bg-gradient-to-b transition-all duration-700",
                color,
                height
            )}>
                <Icon size={isFirst ? 48 : 32} className="text-white/20 absolute top-8" />
                <div className="text-center text-white">
                    <div className="text-2xl font-black">{user.rankMetric}</div>
                    <div className="text-[10px] font-bold uppercase opacity-80 tracking-tighter">{metricLabel}</div>
                </div>

                {/* Visual Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20" />
            </div>
        </div>
    );
};

export function LeaderboardPodium({ users, metricLabel }: { users: any[], metricLabel: string }) {
    if (users.length === 0) return null;

    // Sort: 2nd, 1st, 3rd for visual podium
    const podiumOrder = [];
    if (users[1]) podiumOrder.push({ ...users[1], r: 2 as const });
    if (users[0]) podiumOrder.push({ ...users[0], r: 1 as const });
    if (users[2]) podiumOrder.push({ ...users[2], r: 3 as const });

    return (
        <div className="flex items-end justify-center gap-4 md:gap-12 py-12 px-4">
            {podiumOrder.map((u, i) => (
                <div key={i} className="animate-in slide-in-from-bottom duration-1000" style={{ animationDelay: `${i * 150}ms` }}>
                    <PodiumItem user={u} rank={u.r} metricLabel={metricLabel} />
                </div>
            ))}
        </div>
    );
}
