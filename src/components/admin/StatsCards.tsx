import { Card, CardContent } from "@/components/ui/card";
import { FileText, Truck, ShieldCheck, Database } from 'lucide-react';
import { Role, User } from "@/types";

interface StatsCardsProps {
    currentUser: User | null;
    activeTab: string;
    onTabChange: (tab: string) => void;
    stats: {
        staging: number;
        loading: number;
        approval: number;
    };
}

export function StatsCards({ currentUser, activeTab, onTabChange, stats }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
            {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.STAGING_SUPERVISOR) && (
                <Card
                    className={`cursor-pointer transition-all border-l-4 shadow-sm ${activeTab === 'staging_db' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-2 ring-blue-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => onTabChange('staging_db')}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${activeTab === 'staging_db' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}><FileText size={20} /></div>
                        <div className="flex-1">
                            <div className="font-bold text-slate-800 dark:text-slate-100">Staging Tasks</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {stats.staging > 0 ? <span className="text-blue-600">{stats.staging} Active</span> : 'No Active Tasks'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.LOADING_SUPERVISOR) && (
                <Card
                    className={`cursor-pointer transition-all border-l-4 shadow-sm ${activeTab === 'loading_db' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 ring-2 ring-orange-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => onTabChange('loading_db')}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${activeTab === 'loading_db' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}><Truck size={20} /></div>
                        <div className="flex-1">
                            <div className="font-bold text-slate-800 dark:text-slate-100">Loading Tasks</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {stats.loading > 0 ? <span className="text-orange-600">{stats.loading} Active</span> : 'No Active Tasks'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD) && (
                <Card
                    className={`cursor-pointer transition-all border-l-4 shadow-sm ${activeTab === 'shift_lead_db' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 ring-2 ring-purple-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => onTabChange('shift_lead_db')}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${activeTab === 'shift_lead_db' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}><ShieldCheck size={20} /></div>
                        <div className="flex-1">
                            <div className="font-bold text-slate-800 dark:text-slate-100">Shift Lead</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {stats.approval > 0 ? <span className="text-purple-600">{stats.approval} Needs Approval</span> : 'All Approved'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card
                className={`cursor-pointer transition-all border-l-4 shadow-sm ${activeTab === 'database' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                onClick={() => onTabChange('database')}
            >
                <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activeTab === 'database' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}><Database size={20} /></div>
                    <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">Master Records</div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">History</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper icon

