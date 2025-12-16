import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { StatsCards } from "@/components/admin/StatsCards";
import { OperationalTableView } from "@/components/admin/OperationalTableView";
import { DatabaseView } from "@/components/admin/DatabaseView";
import { UserManagement } from "@/components/admin/UserManagement";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { users, sheets, loading, refreshUsers, refreshSheets, currentUser, settings } = useData();
    const { addToast } = useToast();

    // Derived State
    const pendingUsersCount = users.filter(u => !u.isApproved).length;

    // Tabs: 'users' | 'database' | 'staging_db' | 'loading_db' | 'shift_lead_db'
    const [activeTab, setActiveTab] = useState<string>('staging_db');

    // Sync tab with URL or Settings
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        } else if (settings?.defaultTab) {
            setActiveTab(settings.defaultTab);
        }
    }, [searchParams, settings?.defaultTab]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        // We do not set 'filter' param here, letting sub-components handle defaults or "All"
        navigate(`/admin?tab=${tab}`, { replace: true });
    };

    if (loading) return <div className="p-8 text-slate-400">Loading Admin Dashboard...</div>;

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Overview of all operations and system status.
                    </p>
                </div>
            </div>

            {/* Stats Cards (Navigation) */}
            <StatsCards
                currentUser={currentUser}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                pendingUsersCount={pendingUsersCount}
            />

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
                {(activeTab === 'staging_db' || activeTab === 'loading_db' || activeTab === 'shift_lead_db') && (
                    <OperationalTableView
                        sheets={sheets}
                        activeTab={activeTab}
                        currentUser={currentUser}
                        settings={settings}
                        refreshSheets={refreshSheets}
                    />
                )}
            </div>
        </div>
    );
}
