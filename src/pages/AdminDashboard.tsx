import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { SheetStatus, Role } from "@/types";
import { LogOut, User as UserIcon, Settings, History as HistoryIcon, ShieldCheck } from 'lucide-react';
import { StatsCards } from "@/components/admin/StatsCards";
import { OperationalTableView } from "@/components/admin/OperationalTableView";
import { DatabaseView } from "@/components/admin/DatabaseView";
import { UserManagement } from "@/components/admin/UserManagement";
import { AuditLogView } from "@/components/admin/AuditLogView";
import { LiveOperationsMonitor } from "@/components/admin/LiveOperationsMonitor";
import { SecurityScanner } from "@/components/admin/SecurityScanner";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { AnalyticsHub } from "@/components/admin/AnalyticsHub";
import { t } from "@/lib/i18n";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const { users, sheets, loading, refreshUsers, refreshSheets, currentUser, settings } = useData();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    // Derived State (Role-Aware)
    const relevantSheets = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === Role.ADMIN) return sheets;

        return sheets.filter(sheet => {
            if (currentUser.role === Role.STAGING_SUPERVISOR) {
                const sName = (sheet.supervisorName || '').toLowerCase().trim();
                const uName = (currentUser.username || '').toLowerCase().trim();
                const fName = (currentUser.fullName || '').toLowerCase().trim();
                const isMine = sName === uName || sName === fName;
                if (isMine) return true;
                // Allow viewing Team's Pending/Locked/Completed sheets (Global Visibility)
                return sheet.status !== SheetStatus.DRAFT;
            }
            if (currentUser.role === Role.LOADING_SUPERVISOR) {
                // Loading SV sees Approved Staging sheets downwards
                return sheet.status === SheetStatus.LOCKED ||
                    sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING ||
                    sheet.status === SheetStatus.COMPLETED;
            }
            if (currentUser.role === Role.SHIFT_LEAD) {
                // Shift Leads see everything except Drafts usually.
                return sheet.status !== SheetStatus.DRAFT;
            }
            return false;
        });
    }, [sheets, currentUser]);

    const activeStaging = relevantSheets.filter(s => s.status === SheetStatus.DRAFT || s.status === SheetStatus.STAGING_VERIFICATION_PENDING).length;
    const activeLoading = relevantSheets.filter(s => s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING).length;
    const pendingApproval = relevantSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING || s.status === SheetStatus.LOADING_VERIFICATION_PENDING).length;

    // Detailed counts for breakdown
    const stagingDrafts = relevantSheets.filter(s => s.status === SheetStatus.DRAFT).length;
    const stagingPending = relevantSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING).length;
    const loadingReady = relevantSheets.filter(s => s.status === SheetStatus.LOCKED).length;
    const loadingPending = relevantSheets.filter(s => s.status === SheetStatus.LOADING_VERIFICATION_PENDING).length;

    // --- FRESH NAVIGATION LOGIC ---
    // Refactor: activeTab -> activeSection, subFilter -> activeViewMode
    const activeSection = searchParams.get('section') || 'dashboard';
    const activeViewMode = (searchParams.get('view_mode') || 'ALL').toUpperCase();

    const handleNavigation = (section: string, viewMode?: string) => {
        // --- STRICT ROLE GUARDS ---
        if (section === 'users' && currentUser?.role !== Role.ADMIN) return;
        if (section === 'security' && currentUser?.role !== Role.ADMIN) return;
        if (section === 'audit_logs' && (currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SHIFT_LEAD)) return;

        const newParams: Record<string, string> = { section };

        if (viewMode) {
            newParams.view_mode = viewMode;
        }

        if (section === 'dashboard') {
            setSearchParams({});
        } else {
            setSearchParams(newParams);
        }
    };

    const handleViewModeChange = (value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value === 'ALL') {
            newParams.delete('view_mode');
        } else {
            newParams.set('view_mode', value);
        }
        setSearchParams(newParams);
    };

    if (loading) return <div>{t('loading_dots', settings?.language || 'en')}</div>;

    return (
        <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-950 overflow-hidden relative">

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">

                {/* HEADER & KEY METRICS (Only show on operational tabs to reduce clutter) */}
                {activeSection !== 'users' && activeSection !== 'audit_logs' && activeSection !== 'reports' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-300">
                                    {activeSection === 'dashboard' ? t('operational_overview', settings.language) : t('admin_dashboard', settings.language)}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {t('welcome_back', settings.language)}, {currentUser?.fullName}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">

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
                                        {/* Reports Link (Admin/Shift Lead) - NEW: Power BI Integration */}
                                        {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD) && (
                                            <button
                                                onClick={() => handleNavigation('reports')}
                                                className={`p-1.5 rounded-full transition-colors ${activeSection === 'reports' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                                title="Management Reports (Power BI)"
                                            >
                                                <HistoryIcon size={14} className={activeSection === 'reports' ? 'animate-pulse' : ''} />
                                            </button>
                                        )}

                                        {/* Audit Logs Link (Admin/Shift Lead) */}
                                        {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD) && (
                                            <button
                                                onClick={() => handleNavigation('audit_logs')}
                                                className={`p-1.5 rounded-full transition-colors ${activeSection === 'audit_logs' ? 'text-primary bg-primary/10' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                                title={t('audit_logs', settings.language)}
                                            >
                                                <HistoryIcon size={14} />
                                            </button>
                                        )}

                                        {/* Security Link (Admin Only) */}
                                        {currentUser?.role === Role.ADMIN && (
                                            <button
                                                onClick={() => handleNavigation('security')}
                                                className={`p-1.5 rounded-full transition-colors ${activeSection === 'security' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                                title="Security Scanner"
                                            >
                                                <ShieldCheck size={14} />
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
                            activeSection={activeSection}
                            onNavigate={handleNavigation}
                            stats={{
                                staging: activeStaging,
                                loading: activeLoading,
                                approval: pendingApproval,
                                stagingDrafts,
                                stagingPending,
                                loadingReady,
                                loadingPending
                            }}
                        />
                    </div>
                )}

                {/* 1. USERS VIEW */}
                {activeSection === 'users' && (
                    <UserManagement
                        users={users}
                        refreshUsers={refreshUsers}
                        sheets={relevantSheets}
                    />
                )}

                {/* 2. DATABASE VIEW (Full History) */}
                {activeSection === 'database' && (
                    <DatabaseView
                        sheets={relevantSheets}
                        currentUser={currentUser}
                        settings={settings}
                        refreshSheets={refreshSheets}
                    />
                )}

                {/* 3. OPERATIONAL VIEWS (Staging, Loading, Shift Lead) */}
                {(activeSection === 'staging_db' || activeSection === 'loading_db' || activeSection === 'shift_lead_db' || activeSection === 'admin_ops') && (
                    <OperationalTableView
                        sheets={relevantSheets}
                        activeSection={activeSection === 'admin_ops' ? 'staging_db' : activeSection}
                        activeViewMode={activeViewMode}
                        onViewModeChange={handleViewModeChange}
                        currentUser={currentUser}
                        settings={settings}
                        refreshSheets={refreshSheets}
                    />
                )}

                {/* 4. AUDIT LOGS VIEW */}
                {activeSection === 'audit_logs' && (
                    <AuditLogView
                        sheets={relevantSheets}
                        currentUser={currentUser}
                    />
                )}

                {/* 5. DASHBOARD VIEW (Live Monitor) */}
                {activeSection === 'dashboard' && (
                    <div className="space-y-6">
                        <AnalyticsCharts sheets={relevantSheets} />
                        <LiveOperationsMonitor sheets={relevantSheets} onRefresh={refreshSheets} />
                    </div>
                )}

                {/* 5a. CUSTOM ANALYTICS HUB (Power BI Alternative) */}
                {activeSection === 'reports' && (
                    <AnalyticsHub sheets={relevantSheets} />
                )}

                {/* 6. SECURITY SCANNER VIEW */}
                {activeSection === 'security' && (
                    <SecurityScanner />
                )}

            </main>
        </div>
    );
}
