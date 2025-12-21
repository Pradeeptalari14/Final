import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { SheetStatus, Role } from "@/types";
import { LogOut, User as UserIcon, Settings, History as HistoryIcon } from 'lucide-react';
// import { useToast } from "@/contexts/ToastContext";
import { StatsCards } from "@/components/admin/StatsCards";
import { OperationalTableView } from "@/components/admin/OperationalTableView";
import { DatabaseView } from "@/components/admin/DatabaseView";
import { UserManagement } from "@/components/admin/UserManagement";

import { AuditLogView } from "@/components/admin/AuditLogView";
import { LiveOperationsMonitor } from "@/components/admin/LiveOperationsMonitor";
import { t } from "@/lib/i18n";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams(); // Modified to include setSearchParams
    const { users, sheets, loading, refreshUsers, refreshSheets, currentUser, settings, syncStatus } = useData();
    // const { addToast } = useToast(); // Unused

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    // Derived State
    const activeStaging = sheets.filter(s => s.status === SheetStatus.DRAFT).length;
    const activeLoading = sheets.filter(s => s.status === SheetStatus.LOCKED).length;
    const pendingApproval = sheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING || s.status === SheetStatus.LOADING_VERIFICATION_PENDING).length;

    // Tabs: 'dashboard' | 'database' | 'admin_ops' | 'settings' | 'users' | 'audit_logs' | 'board'
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        } else {
            setActiveTab('dashboard');
        }
    }, [searchParams]);

    const handleTabChange = (tab: string) => {
        // --- STRICT ROLE GUARDS ---
        if (tab === 'users' && currentUser?.role !== Role.ADMIN) return;
        if (tab === 'audit_logs' && (currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SHIFT_LEAD)) return;

        setActiveTab(tab);
        if (tab !== 'dashboard') {
            setSearchParams({ tab });
        } else {
            setSearchParams({});
        }
    };

    if (loading) return <div>{t('loading_dots', settings?.language || 'en')}</div>;

    return (
        <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-950 overflow-hidden relative">

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">

                {/* HEADER & KEY METRICS (Only show on operational tabs to reduce clutter) */}
                {activeTab !== 'users' && activeTab !== 'audit_logs' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-300">
                                    {activeTab === 'dashboard' ? t('operational_overview', settings.language) : t('admin_dashboard', settings.language)}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {t('welcome_back', settings.language)}, {currentUser?.fullName}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* System Status */}
                                <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm text-xs font-medium transition-colors
                                    ${settings.theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
                                    ${loading || users.length === 0 ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}
                                `}>
                                    <span className={`w-2 h-2 rounded-full animate-pulse 
                                        ${loading ? 'bg-yellow-400' :
                                            syncStatus === 'LIVE' ? 'bg-emerald-500' :
                                                syncStatus === 'CONNECTING' ? 'bg-blue-500' : 'bg-red-500'
                                        }`}
                                    />
                                    {loading ? 'Connecting...' :
                                        syncStatus === 'LIVE' ? t('system_online', settings.language) :
                                            syncStatus === 'CONNECTING' ? 'Syncing...' : 'Offline'}
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-700" />

                                {/* User Profile */}
                                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 pr-4 rounded-full border shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        <UserIcon size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">{currentUser?.fullName}</span>
                                        <span className="text-[10px] text-slate-400 font-medium uppercase">
                                            {currentUser?.role === Role.ADMIN ? t('admin', settings.language) :
                                                currentUser?.role === Role.SHIFT_LEAD ? t('shift_lead', settings.language) :
                                                    currentUser?.role === Role.STAGING_SUPERVISOR ? t('staging', settings.language) :
                                                        currentUser?.role === Role.LOADING_SUPERVISOR ? t('loading', settings.language) :
                                                            t('users', settings.language)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                                        {/* Audit Logs Link (Admin/Shift Lead) */}
                                        {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD) && (
                                            <button
                                                onClick={() => handleTabChange('audit_logs')}
                                                className={`p-1.5 rounded-full transition-colors ${activeTab === 'audit_logs' ? 'text-primary bg-primary/10' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                                title={t('audit_logs', settings.language)}
                                            >
                                                <HistoryIcon size={14} />
                                            </button>
                                        )}

                                        {/* Settings Link */}
                                        <button
                                            onClick={() => navigate('/settings')}
                                            className="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                            title={t('settings', settings.language)}
                                        >
                                            <Settings size={14} />
                                        </button>

                                        {/* Logout */}
                                        <button
                                            onClick={handleLogout}
                                            className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                                            title={t('sign_out', settings.language)}
                                        >
                                            <LogOut size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Stats Cards */}
                        <StatsCards
                            currentUser={currentUser}
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            stats={{
                                staging: activeStaging,
                                loading: activeLoading,
                                approval: pendingApproval
                            }}
                        />
                    </div>
                )}

                {/* 1. USERS VIEW */}
                {activeTab === 'users' && (
                    <UserManagement
                        users={users}
                        refreshUsers={refreshUsers}
                        sheets={sheets}
                    />
                )}

                {/* 2. DATABASE VIEW (Full History) */}
                {activeTab === 'database' && (
                    <DatabaseView
                        sheets={sheets}
                        currentUser={currentUser}
                        settings={settings}
                        refreshSheets={refreshSheets}
                    />
                )}

                {/* 3. OPERATIONAL VIEWS (Staging, Loading, Shift Lead) */}
                {(activeTab === 'staging_db' || activeTab === 'loading_db' || activeTab === 'shift_lead_db' || activeTab === 'admin_ops') && (
                    <OperationalTableView
                        sheets={sheets}
                        activeTab={activeTab === 'admin_ops' ? 'staging_db' : activeTab} // Fallback if needed
                        currentUser={currentUser}
                        settings={settings}
                        refreshSheets={refreshSheets}
                    />
                )}

                {/* 4. AUDIT LOGS VIEW */}
                {activeTab === 'audit_logs' && (
                    <AuditLogView
                        sheets={sheets}
                        currentUser={currentUser}
                    />
                )}

                {/* 5. DASHBOARD VIEW (Live Monitor) */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <LiveOperationsMonitor sheets={sheets} onRefresh={refreshSheets} />
                    </div>
                )}


            </main>
        </div >
    );
}
