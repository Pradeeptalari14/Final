import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { SheetStatus, Role, ShiftUser } from '@/types';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, ShieldCheck, Mail, User as UserIcon } from 'lucide-react';
import { UserKPIs } from './user-details/UserKPIs';
import { UserPerformanceChart } from './user-details/UserPerformanceChart';
import { UserHistoryTable } from './user-details/UserHistoryTable';
import { UserActivityLog } from './user-details/UserActivityLog';

interface UserDetailModalProps {
    user: ShiftUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserDetailModal({
    user,
    open,
    onOpenChange
}: UserDetailModalProps) {
    const { sheets, securityLogs } = useData();

    // 1. Filter sheets for this user
    const userSheets = useMemo(() => {
        if (!user) return [];
        return sheets
            .filter(
                (s) =>
                    // Check various fields where user might be recorded
                    s.supervisorName === user.name ||
                    s.loadingSvName === user.name ||
                    s.verifiedBy === user.name ||
                    s.completedBy === user.name ||
                    s.pickingBy === user.name
            )
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
    }, [sheets, user]);

    // 2. Filter logs for this user
    const userLogs = useMemo(() => {
        if (!user) return [];
        return securityLogs
            .filter((log) => log.actor === user.name || log.details.includes(user.name))
            .sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
            .slice(0, 20); // Last 20 logs
    }, [securityLogs, user]);

    // 3. Calculate Performance Metrics
    const metrics = useMemo(() => {
        const completedSheets = userSheets.filter(
            (s) => s.status === SheetStatus.COMPLETED
        );
        const totalCases = userSheets.reduce(
            (acc, s) => acc + (s.loadingItems || []).reduce((a, i) => a + i.total, 0),
            0
        );

        // Calculate average time
        let totalMinutes = 0;
        let sheetsWithTime = 0;
        completedSheets.forEach((s) => {
            if (s.loadingStartTime && s.loadingEndTime) {
                const start = new Date(`1970-01-01T${s.loadingStartTime}`);
                const end = new Date(`1970-01-01T${s.loadingEndTime}`);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    let diff = (end.getTime() - start.getTime()) / 1000 / 60;
                    if (diff < 0) diff += 24 * 60;
                    totalMinutes += diff;
                    sheetsWithTime++;
                }
            }
        });
        const avgTime =
            sheetsWithTime > 0 ? Math.round(totalMinutes / sheetsWithTime) : 0;

        // SLA Compliance (Target: < 45 mins per sheet)
        const compliantSheets = completedSheets.filter((s) => {
            if (s.loadingStartTime && s.loadingEndTime) {
                const start = new Date(`1970-01-01T${s.loadingStartTime}`);
                const end = new Date(`1970-01-01T${s.loadingEndTime}`);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    let diff = (end.getTime() - start.getTime()) / 1000 / 60;
                    if (diff < 0) diff += 24 * 60;
                    return diff <= 45;
                }
            }
            return false;
        }).length;

        const slaCompliance =
            completedSheets.length > 0
                ? Math.round((compliantSheets / completedSheets.length) * 100)
                : 100;

        return {
            totalCases,
            avgTime,
            slaCompliance
        };
    }, [userSheets]);

    if (!user) return null;

    // Merge calculated metrics with user object for display
    const displayUser: ShiftUser = {
        ...user,
        casesHandled: metrics.totalCases,
        avgTime: metrics.avgTime,
        slaCompliance: metrics.slaCompliance
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-slate-50/50 dark:bg-slate-950 backdrop-blur-xl border-slate-200 dark:border-white/10">
                <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 ring-4 ring-white dark:ring-slate-800">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    user.name.charAt(0)
                                )}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    {user.name}
                                    <Badge
                                        variant="outline"
                                        className={`
                                        ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                                        ${user.role === Role.ADMIN
                                                ? 'bg-purple-50 text-purple-600 border-purple-200'
                                                : 'bg-blue-50 text-blue-600 border-blue-200'
                                            }
                                    `}
                                    >
                                        {user.role.replace('_', ' ')}
                                    </Badge>
                                </DialogTitle>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                                    <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer">
                                        <Mail size={14} />
                                        {user.name.toLowerCase().replace(' ', '.')}@unicharm.com
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <UserIcon size={14} />
                                        ID: {user.id.slice(0, 8)}
                                    </div>
                                    <div className="flex items-center gap-1.5 ml-2">
                                        <Badge
                                            variant="secondary"
                                            className="h-5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 gap-1 pl-1 pr-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active Now
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-8">
                    {/* 1. Key Performance Indicators */}
                    <UserKPIs user={displayUser} userSheetsCount={userSheets.length} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 2. Main Performance Chart */}
                        <div className="lg:col-span-2">
                            <UserPerformanceChart userSheets={userSheets} />
                        </div>

                        {/* 3. Recent Activity Log */}
                        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm h-full">
                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <ShieldCheck className="text-indigo-500" size={18} />
                                Recent Activity
                            </h3>
                            <UserActivityLog logs={userLogs} />
                        </div>
                    </div>

                    {/* 4. Detailed History Table */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="text-slate-400" size={18} />
                                Recent Sheet History
                            </h3>
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                View All History
                            </Button>
                        </div>
                        <div className="p-2">
                            <UserHistoryTable userSheets={userSheets} />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
