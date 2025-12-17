import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from "@/contexts/DataContext";
// import { useToast } from "@/contexts/ToastContext";
import { StatsCards } from "@/components/admin/StatsCards";
import { OperationalTableView } from "@/components/admin/OperationalTableView";
import { DatabaseView } from "@/components/admin/DatabaseView";
import { UserManagement } from "@/components/admin/UserManagement";
import { AuditLogView } from "@/components/admin/AuditLogView";
import { LiveOperationsMonitor } from "@/components/admin/LiveOperationsMonitor";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { users, sheets, loading, refreshUsers, refreshSheets, currentUser, settings } = useData();
    // const { addToast } = useToast(); // Unused

    // Derived State


    // Tabs: 'dashboard' | 'database' | 'admin_ops' | 'settings' | 'users' | 'audit_logs'
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        navigate(`?tab=${tab}`);
    };

    const isOperationalView = !['users', 'audit_logs'].includes(activeTab);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Header & Stats - Only for Operational Views */}
            {isOperationalView && (
                <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Admin Dashboard
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Overview of all system operations
                            </p>
                        </div>
                    </div>

                    <StatsCards
                        currentUser={currentUser}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                    />
                </>
            )}

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[600px]">

                {/* 1. USERS VIEW */}
                {activeTab === 'users' && (
                    <UserManagement
                        users={users}
                        currentUser={currentUser}
                        refreshUsers={refreshUsers}
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
                        <LiveOperationsMonitor sheets={sheets} users={users} onRefresh={refreshSheets} />
                    </div>
                )}
            </div>
        </div>
    );
}
