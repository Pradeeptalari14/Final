import { Card, CardContent } from "@/components/ui/card";
import { Role, User } from "@/types";
import { FileText, Truck, ShieldCheck, Database } from 'lucide-react';
import { t } from "@/lib/i18n";
import { useData } from "@/contexts/DataContext";

interface StatsCardsProps {
    currentUser: User | null;
    activeSection: string;
    onNavigate: (section: string, viewMode?: string) => void;
    stats: {
        staging: number;
        loading: number;
        approval: number;
        stagingDrafts?: number;
        stagingPending?: number;
        loadingReady?: number;
        loadingPending?: number;
    };
}

export function StatsCards({ currentUser, activeSection, onNavigate, stats }: StatsCardsProps) {
    const { settings } = useData();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
            {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.STAGING_SUPERVISOR) && (
                <Card
                    className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-0 shadow-sm
                        ${activeSection === 'staging_db'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-2 ring-blue-500/20 shadow-blue-500/20'
                            : 'bg-white dark:bg-slate-900 border border-slate-100 hover:border-blue-200'
                        }`}
                >
                    <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                        {/* CLICKABLE HEADER ZONE - Explicit View Mode */}
                        <div
                            className="flex justify-between items-start mb-4 cursor-pointer"
                            onClick={() => onNavigate('staging_db', 'VIEW_STAGING_DRAFT')}
                        >
                            <div className={`p-3 rounded-xl backdrop-blur-sm ${activeSection === 'staging_db' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                <FileText size={24} />
                            </div>
                            <div className={`text-2xl font-bold ${activeSection === 'staging_db' ? 'text-white' : 'text-slate-800'}`}>
                                {stats.staging}
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            {/* CLICKABLE TITLE ZONE - Explicit Default */}
                            <div
                                className="cursor-pointer"
                                onClick={() => onNavigate('staging_db', 'VIEW_STAGING_DRAFT')}
                            >
                                <div className={`font-semibold mb-1 ${activeSection === 'staging_db' ? 'text-blue-50' : 'text-slate-600'}`}>
                                    {t('staging_tasks', settings.language)}
                                </div>
                                <div className={`text-xs font-medium ${activeSection === 'staging_db' ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {stats.staging > 0 ? t('active', settings.language) : t('no_active_tasks', settings.language)}
                                </div>
                            </div>

                            {/* ISOLATED BUTTON ZONE - Specific View Modes */}
                            <div className="flex flex-wrap gap-1 z-50 relative">
                                {stats.stagingDrafts !== undefined && stats.stagingDrafts > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onNavigate('staging_db', 'VIEW_STAGING_DRAFT'); }}
                                        className={`relative z-50 hover:scale-105 active:scale-95 px-2 py-1 rounded text-[10px] font-bold transition-all ${activeSection === 'staging_db' ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                    >
                                        {stats.stagingDrafts} {t('draft', settings.language)}
                                    </button>
                                )}
                                {stats.stagingPending !== undefined && stats.stagingPending > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onNavigate('staging_db', 'VIEW_STAGING_VERIFY'); }}
                                        className={`relative z-50 hover:scale-105 active:scale-95 px-2 py-1 rounded text-[10px] font-bold transition-all ${activeSection === 'staging_db' ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                    >
                                        {stats.stagingPending} {t('pending_verification', settings.language)}
                                    </button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.LOADING_SUPERVISOR) && (
                <Card
                    className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-0 shadow-sm
                        ${activeSection === 'loading_db'
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white ring-2 ring-orange-500/20 shadow-orange-500/20'
                            : 'bg-white dark:bg-slate-900 border border-slate-100 hover:border-orange-200'
                        }`}
                >
                    <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                        {/* CLICKABLE HEADER ZONE - Explicit View Mode */}
                        <div
                            className="flex justify-between items-start mb-4 cursor-pointer"
                            onClick={() => onNavigate('loading_db', 'VIEW_LOADING_READY')}
                        >
                            <div className={`p-3 rounded-xl backdrop-blur-sm ${activeSection === 'loading_db' ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600'}`}>
                                <Truck size={24} />
                            </div>
                            <div className={`text-2xl font-bold ${activeSection === 'loading_db' ? 'text-white' : 'text-slate-800'}`}>
                                {stats.loading}
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            {/* CLICKABLE TITLE ZONE - Explicit Default */}
                            <div
                                className="cursor-pointer"
                                onClick={() => onNavigate('loading_db', 'VIEW_LOADING_READY')}
                            >
                                <div className={`font-semibold mb-1 ${activeSection === 'loading_db' ? 'text-orange-50' : 'text-slate-600'}`}>
                                    {t('loading_tasks', settings.language)}
                                </div>
                                <div className={`text-xs font-medium ${activeSection === 'loading_db' ? 'text-orange-100' : 'text-slate-400'}`}>
                                    {stats.loading > 0 ? t('active', settings.language) : t('no_active_tasks', settings.language)}
                                </div>
                            </div>

                            {/* ISOLATED BUTTON ZONE - Specific View Modes */}
                            <div className="flex flex-wrap gap-1 z-50 relative">
                                {stats.loadingReady !== undefined && stats.loadingReady > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onNavigate('loading_db', 'VIEW_LOADING_READY'); }}
                                        className={`relative z-50 hover:scale-105 active:scale-95 px-2 py-1 rounded text-[10px] font-bold transition-all ${activeSection === 'loading_db' ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                                    >
                                        {stats.loadingReady} {t('ready_to_load', settings.language)}
                                    </button>
                                )}
                                {stats.loadingPending !== undefined && stats.loadingPending > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onNavigate('loading_db', 'VIEW_LOADING_VERIFY'); }}
                                        className={`relative z-50 hover:scale-105 active:scale-95 px-2 py-1 rounded text-[10px] font-bold transition-all ${activeSection === 'loading_db' ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                                    >
                                        {stats.loadingPending} {t('pending_verification', settings.language)}
                                    </button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD) && (
                <Card
                    className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-0 shadow-sm
                        ${activeSection === 'shift_lead_db'
                            ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white ring-2 ring-purple-500/20 shadow-purple-500/20'
                            : 'bg-white dark:bg-slate-900 border border-slate-100 hover:border-purple-200'
                        }`}
                >
                    <CardContent className="p-6 relative z-10 p-0">
                        {/* WRAPPER DIV for Shift Lead Click Zone - Default to Staging Verify */}
                        <div className="p-6 h-full flex flex-col justify-between cursor-pointer" onClick={() => onNavigate('shift_lead_db', 'VIEW_STAGING_VERIFY')}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl backdrop-blur-sm ${activeSection === 'shift_lead_db' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'}`}>
                                    <ShieldCheck size={24} />
                                </div>
                                <div className={`text-2xl font-bold ${activeSection === 'shift_lead_db' ? 'text-white' : 'text-slate-800'}`}>
                                    {stats.approval}
                                </div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className={`font-semibold mb-1 ${activeSection === 'shift_lead_db' ? 'text-purple-50' : 'text-slate-600'}`}>
                                        {t('shift_lead', settings.language)}
                                    </div>
                                    <div className={`text-xs font-medium ${activeSection === 'shift_lead_db' ? 'text-purple-100' : 'text-slate-400'}`}>
                                        {stats.approval > 0 ? t('needs_approval', settings.language) : t('all_approved', settings.language)}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {stats.stagingPending !== undefined && stats.stagingPending > 0 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onNavigate('shift_lead_db', 'VIEW_STAGING_VERIFY'); }}
                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${activeSection === 'shift_lead_db' ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                            title={t('staging_approvals', settings.language)}
                                        >
                                            S:{stats.stagingPending}
                                        </button>
                                    )}
                                    {stats.loadingPending !== undefined && stats.loadingPending > 0 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onNavigate('shift_lead_db', 'VIEW_LOADING_VERIFY'); }}
                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${activeSection === 'shift_lead_db' ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                                            title={t('loading_approvals', settings.language)}
                                        >
                                            L:{stats.loadingPending}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card
                className={`cursor-pointer group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-0 shadow-sm
                    ${activeSection === 'database'
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white ring-2 ring-indigo-500/20 shadow-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border border-slate-100 hover:border-indigo-200'
                    }`}
                onClick={() => onNavigate('database')}
            >
                <CardContent className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl backdrop-blur-sm ${activeSection === 'database' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Database size={24} />
                        </div>
                        <div className={`text-2xl font-bold ${activeSection === 'database' ? 'text-white' : 'text-slate-800'}`}>
                            •
                        </div>
                    </div>
                    <div>
                        <div className={`font-semibold mb-1 ${activeSection === 'database' ? 'text-indigo-50' : 'text-slate-600'}`}>
                            {t('master_records', settings.language)}
                        </div>
                        <div className={`text-xs font-medium ${activeSection === 'database' ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {t('history_title', settings.language)}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
