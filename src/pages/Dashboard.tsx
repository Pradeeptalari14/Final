import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';
import { SheetStatus, Role, SheetData } from '@/types';
import { StageColumn } from '@/components/dashboard/StageColumn';
import { WorkflowRailway } from '@/components/dashboard/WorkflowRailway';
import { t } from '@/lib/i18n';

export default function DashboardOverview() {
    const { sheets, currentUser, users } = useData();
    const { settings } = useAppState();
    const navigate = useNavigate();

    // STRICT USER FILTERING
    const relevantSheets =
        currentUser?.role === Role.ADMIN
            ? sheets
            : sheets.filter((sheet) => {
                // Staging Supervisor
                if (currentUser?.role === Role.STAGING_SUPERVISOR) {
                    const name = sheet.supervisorName?.toLowerCase().trim();
                    const username = currentUser.username?.toLowerCase().trim();
                    const fullname = currentUser.fullName?.toLowerCase().trim();
                    return name === username || name === fullname;
                }
                // Loading Supervisor
                if (currentUser?.role === Role.LOADING_SUPERVISOR) {
                    // COMPLETED sheets included for historical view/stats
                    return (
                        sheet.status === SheetStatus.LOCKED ||
                        sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING ||
                        sheet.status === SheetStatus.COMPLETED
                    );
                }
                // Shift Lead
                if (currentUser?.role === Role.SHIFT_LEAD) {
                    return sheet.status !== SheetStatus.DRAFT;
                }
                return false;
            });

    // Helper for filter links
    const getFilterLinks = (stage: string) => {
        // ALLOW LOADING SUPERVISOR
        if (
            currentUser?.role !== Role.ADMIN &&
            currentUser?.role !== Role.SHIFT_LEAD &&
            currentUser?.role !== Role.STAGING_SUPERVISOR &&
            currentUser?.role !== Role.LOADING_SUPERVISOR
        )
            return [];

        const isRejected = (s: SheetData) => s.rejectionReason && s.rejectionReason.trim() !== '';

        if (stage === 'STAGING') {
            // Stats for Staging Supervisor
            if (currentUser?.role === Role.ADMIN || currentUser?.role === Role.STAGING_SUPERVISOR) {
                const draftCount = relevantSheets.filter(
                    (s) => s.status === SheetStatus.DRAFT && !isRejected(s)
                ).length;
                const pendingCount = sheets.filter(
                    (s) => s.status === SheetStatus.STAGING_VERIFICATION_PENDING
                ).length;
                const lockedCount = sheets.filter((s) => s.status === SheetStatus.LOCKED).length;
                const rejectedCount = relevantSheets.filter(
                    (s) => s.status === SheetStatus.DRAFT && isRejected(s)
                ).length;

                // GLOBAL STATS (Requested by User: See all users' totals)
                // Use 'sheets' directly instead of 'relevantSheets'
                const completedCount = sheets.filter(
                    (s) => s.status === SheetStatus.COMPLETED
                ).length;
                const totalStagingCount = sheets.length;

                return [
                    {
                        label: t('total_staging', settings.language),
                        count: totalStagingCount,
                        link: '/database',
                        color: 'bg-white dark:bg-slate-800 border-l-4 border-slate-600 shadow-sm text-slate-800 dark:text-slate-200 font-bold'
                    },
                    {
                        label: t('draft', settings.language),
                        count: draftCount,
                        link: '/admin?section=staging_db&view_mode=VIEW_STAGING_DRAFT',
                        color: 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 font-bold'
                    },
                    {
                        label: t('pending_verification', settings.language),
                        count: pendingCount,
                        link: '/admin?section=staging_db&view_mode=VIEW_STAGING_VERIFY',
                        color: 'bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 text-orange-900 dark:text-orange-400 font-bold'
                    },
                    {
                        label: t('locked_not_editable', settings.language),
                        count: lockedCount,
                        link: '/admin?section=staging_db&view_mode=VIEW_LOCKED',
                        color: 'bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 text-purple-900 dark:text-purple-400 font-bold'
                    },
                    {
                        label: t('completed', settings.language),
                        count: completedCount,
                        link: '/admin?section=staging_db&view_mode=VIEW_COMPLETED',
                        color: 'bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-400 font-bold'
                    },
                    {
                        label: t('rejected', settings.language),
                        count: rejectedCount,
                        link: '/admin?section=staging_db&view_mode=VIEW_STAGING_REJECTED',
                        color: 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-400 font-bold'
                    }
                ];
            }

            const rejectedCount = relevantSheets.filter(
                (s) =>
                    (s.status === SheetStatus.DRAFT ||
                        s.status === SheetStatus.STAGING_VERIFICATION_PENDING) &&
                    isRejected(s)
            ).length;

            if (rejectedCount === 0) return [];
            return [
                {
                    label: t('rejected', settings.language),
                    count: rejectedCount,
                    link: '/admin?section=shift_lead_db&view_mode=VIEW_STAGING_REJECTED',
                    color: 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-400 font-bold'
                }
            ];
        }

        if (stage === 'LOADING') {
            // Admin OR Loading Supervisor
            if (currentUser?.role === Role.ADMIN || currentUser?.role === Role.LOADING_SUPERVISOR) {
                const loadingSheets = relevantSheets.filter(
                    (s) =>
                        s.status !== SheetStatus.DRAFT &&
                        s.status !== SheetStatus.STAGING_VERIFICATION_PENDING
                );

                // GLOBAL STATS for Total and Completed
                const globalLoadingSheets = sheets.filter(
                    (s) =>
                        s.status !== SheetStatus.DRAFT &&
                        s.status !== SheetStatus.STAGING_VERIFICATION_PENDING
                );

                // "Total Loading" = Ready to Load + Pending + Rejected (which are Locked/Pending) + Completed
                // Basically everything passing the "Staging" phase.
                const totalLoadingCount = globalLoadingSheets.length;

                const completedCount = globalLoadingSheets.filter(
                    (s) => s.status === SheetStatus.COMPLETED
                ).length;

                // Personal/Actionable Stats
                const readyCount = loadingSheets.filter(
                    (s) => s.status === SheetStatus.LOCKED
                ).length;
                const pendingVerCount = loadingSheets.filter(
                    (s) => s.status === SheetStatus.LOADING_VERIFICATION_PENDING
                ).length;
                const rejectedCount = loadingSheets.filter(
                    (s) => s.status === SheetStatus.LOCKED && isRejected(s)
                ).length;

                return [
                    {
                        label: t('total_loading', settings.language),
                        count: totalLoadingCount,
                        link: '/database',
                        color: 'bg-white dark:bg-slate-800 border-l-4 border-slate-600 shadow-sm text-slate-800 dark:text-slate-200 font-bold'
                    },
                    {
                        label: t('ready_to_load', settings.language),
                        count: readyCount,
                        link: '/admin?section=loading_db&view_mode=VIEW_LOADING_READY',
                        color: 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-400 font-bold'
                    },
                    {
                        label: t('pending_verification', settings.language),
                        count: pendingVerCount,
                        link: '/admin?section=loading_db&view_mode=VIEW_LOADING_VERIFY',
                        color: 'bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 text-orange-900 dark:text-orange-400 font-bold'
                    },
                    {
                        label: t('completed', settings.language),
                        count: completedCount,
                        link: '/admin?section=loading_db&view_mode=VIEW_COMPLETED',
                        color: 'bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-400 font-bold'
                    },
                    {
                        label: t('rejected', settings.language),
                        count: rejectedCount,
                        link: '/admin?section=loading_db&view_mode=VIEW_LOADING_REJECTED',
                        color: 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-400 font-bold'
                    }
                ];
            }
            return [];
        }

        if (
            stage === 'SHIFT_LEAD' &&
            (currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD)
        ) {
            // ... (Existing Shift Lead logic)
            const approvalCount = relevantSheets.filter(
                (s) =>
                    s.status === SheetStatus.STAGING_VERIFICATION_PENDING ||
                    s.status === SheetStatus.LOADING_VERIFICATION_PENDING
            ).length;
            const stagingApprCount = relevantSheets.filter(
                (s) =>
                    s.status === SheetStatus.DRAFT ||
                    s.status === SheetStatus.STAGING_VERIFICATION_PENDING
            ).length;
            const loadingApprCount = relevantSheets.filter(
                (s) => s.status === SheetStatus.LOADING_VERIFICATION_PENDING
            ).length;
            const completedCount = relevantSheets.filter(
                (s) => s.status === SheetStatus.COMPLETED
            ).length;
            const stagingRejCount = relevantSheets.filter(
                (s) => s.status === SheetStatus.DRAFT && isRejected(s)
            ).length;
            const loadingRejCount = relevantSheets.filter(
                (s) => s.status === SheetStatus.LOADING_VERIFICATION_PENDING && isRejected(s)
            ).length;
            const allDoneCount = relevantSheets.filter(
                (s) => s.status === SheetStatus.COMPLETED
            ).length;

            return [
                {
                    label: t('total_approvals', settings.language),
                    count: approvalCount,
                    link: '/admin?section=shift_lead_db',
                    color: 'bg-white dark:bg-slate-800 border-l-4 border-slate-600 shadow-sm text-slate-800 dark:text-slate-200 font-bold'
                },
                {
                    label: t('staging_approvals', settings.language),
                    count: stagingApprCount,
                    link: '/admin?section=shift_lead_db&view_mode=VIEW_STAGING_VERIFY',
                    color: 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-400 font-bold'
                },
                {
                    label: t('loading_approvals', settings.language),
                    count: loadingApprCount,
                    link: '/admin?section=shift_lead_db&view_mode=VIEW_LOADING_VERIFY',
                    color: 'bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 text-orange-900 dark:text-orange-400 font-bold'
                },
                {
                    label: t('completed', settings.language),
                    count: completedCount,
                    link: '/admin?section=shift_lead_db&view_mode=VIEW_COMPLETED',
                    color: 'bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-400 font-bold'
                },
                {
                    label: t('staging_rejected', settings.language),
                    count: stagingRejCount,
                    link: '/admin?section=shift_lead_db&view_mode=VIEW_STAGING_REJECTED',
                    color: 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-400 font-bold'
                },
                {
                    label: t('loading_rejected', settings.language),
                    count: loadingRejCount,
                    link: '/admin?section=shift_lead_db&view_mode=VIEW_LOADING_REJECTED',
                    color: 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-400 font-bold'
                },
                {
                    label: t('all_done', settings.language),
                    count: allDoneCount,
                    link: '/database',
                    color: 'bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-400 font-bold shadow-sm'
                }
            ];
        }

        // 4. TOTAL SHEETS (ADMIN ONLY)
        if (stage === 'TOTAL_SHEETS' && currentUser?.role === Role.ADMIN) {
            const allCount = relevantSheets.length;
            const completedCount = relevantSheets.filter(
                (s) => s.status === SheetStatus.COMPLETED
            ).length;
            const activeCount = allCount - completedCount;
            const rejectedCount = relevantSheets.filter(isRejected).length;

            return [
                {
                    label: t('total_sheets', settings.language),
                    count: allCount,
                    link: '/database',
                    color: 'bg-white dark:bg-slate-800 border-l-4 border-slate-600 shadow-sm text-slate-800 dark:text-slate-200 font-bold'
                },
                {
                    label: t('completed', settings.language),
                    count: completedCount,
                    link: '/database?filter=COMPLETED',
                    color: 'bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-400 font-bold'
                },
                {
                    label: t('active', settings.language),
                    count: activeCount,
                    link: '/database?filter=ACTIVE',
                    color: 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-400 font-bold'
                },
                {
                    label: t('rejected', settings.language),
                    count: rejectedCount,
                    link: '/database?filter=REJECTED',
                    color: 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-400 font-bold'
                }
            ];
        }

        return [];
    };

    // --- VIEW LOGIC ---
    const isStagingSupervisor = currentUser?.role === Role.STAGING_SUPERVISOR;
    const isLoadingSupervisor = currentUser?.role === Role.LOADING_SUPERVISOR;
    const isShiftLead = currentUser?.role === Role.SHIFT_LEAD;
    const isAdmin = currentUser?.role === Role.ADMIN; // Helper for Admin view layout

    // Calculate User Stats for Admin
    const userStats = isAdmin
        ? {
            total: users.length,
            staging: users.filter((u) => u.role === Role.STAGING_SUPERVISOR).length,
            loading: users.filter((u) => u.role === Role.LOADING_SUPERVISOR).length,
            shift: users.filter((u) => u.role === Role.SHIFT_LEAD).length
        }
        : null;

    return (
        <div className="space-y-3 px-4 pb-4 pt-1">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className={`${settings?.density === 'compact' ? 'text-xl' : 'text-2xl'} font-bold tracking-tight text-foreground mb-1`}>
                        {t('dashboard', settings.language)}
                    </h1>
                </div>
                {/* New Sheet Button for Staging Supervisor */}
                {isStagingSupervisor && (
                    <Button
                        onClick={() => navigate('/sheets/staging/new')}
                        className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={18} />
                        {t('new_staging_sheet', settings.language)}
                    </Button>
                )}
            </motion.div>

            {/* Quick Actions Layout */}
            {/* If Admin, use multi-row layout. Else use grid. */}

            {isAdmin ? (
                // ADMIN LAYOUT
                <div className="flex flex-col gap-3">
                    {/* NEW: Workflow Visualizer (Railway) */}
                    <WorkflowRailway sheets={sheets} />

                    {/* Row 1: Operations Columns (Now 4 Columns) */}
                    <div className={`grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4`}>
                        <StageColumn
                            title="Staging"
                            color="border-slate-200 dark:border-white/10"
                            items={relevantSheets.filter(
                                (s) =>
                                    s.status === SheetStatus.DRAFT ||
                                    s.status === SheetStatus.STAGING_VERIFICATION_PENDING
                            )}
                            linkTo="/admin?section=staging_db"
                            filters={getFilterLinks('STAGING')}
                            density={settings?.density}
                        />
                        <StageColumn
                            title="Loading"
                            color="border-blue-500/20"
                            items={relevantSheets.filter(
                                (s) =>
                                    s.status === SheetStatus.LOCKED ||
                                    s.status === SheetStatus.LOADING_VERIFICATION_PENDING
                            )}
                            linkTo="/admin?section=loading_db"
                            filters={getFilterLinks('LOADING')}
                            density={settings?.density}
                        />
                        <StageColumn
                            title="Shift Lead"
                            color="border-purple-500/20"
                            items={relevantSheets.filter(
                                (s) => s.status === SheetStatus.STAGING_VERIFICATION_PENDING
                            )}
                            linkTo="/admin?section=shift_lead_db"
                            filters={getFilterLinks('SHIFT_LEAD')}
                            density={settings?.density}
                        />

                        {/* 4th Column: Users (Moved & Updated) */}
                        <div
                            className={`rounded-lg border border-indigo-200 dark:border-indigo-500/20 ${settings?.density === 'compact' ? 'p-2' : 'p-3'} flex flex-col gap-2 transition-colors relative group hover:bg-slate-50 dark:hover:bg-white/[0.02]`}
                        >
                            <div
                                className={`flex items-center justify-between border-b border-slate-200 dark:border-white/5 ${settings?.density === 'compact' ? 'pb-1' : 'pb-2'}`}
                            >
                                <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">
                                    {t('users', settings.language)}
                                </h3>
                                <span className="text-xs font-mono opacity-50">{users.length}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {/* Total Users (Full Width) */}
                                <button
                                    onClick={() => navigate('/admin?section=users')}
                                    className={`col-span-2 flex items-center justify-between px-4 ${settings?.density === 'compact' ? 'py-1' : 'py-2'} rounded bg-white dark:bg-slate-800 border-l-4 border-slate-600 shadow-sm text-slate-800 dark:text-slate-200 font-bold hover:scale-[1.02] transition-all group min-h-[40px]`}
                                >
                                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                                        {t('total_users', settings.language)}
                                    </span>
                                    <span className={`font-bold ${settings?.density === 'compact' ? 'text-xl' : 'text-2xl'}`}>
                                        {userStats?.total || 0}
                                    </span>
                                </button>

                                {/* Pending (Alert) */}
                                <button
                                    onClick={() => navigate('/admin?section=users&filter=PENDING')}
                                    className={`flex flex-col items-center justify-center ${settings?.density === 'compact' ? 'p-1' : 'p-2'} rounded bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-400 font-bold hover:scale-[1.02] transition-all relative overflow-hidden`}
                                >
                                    <div className="absolute top-0 right-0 p-1 opacity-20">
                                        <Plus size={settings?.density === 'compact' ? 18 : 24} />
                                    </div>
                                    <span className={`font-bold ${settings?.density === 'compact' ? 'text-base' : 'text-lg'}`}>
                                        {users.filter((u) => !u.isApproved).length}
                                    </span>
                                    <span className="text-[9px] opacity-80 uppercase mt-1">
                                        {t('pending', settings.language)}
                                    </span>
                                </button>

                                {/* Staging */}
                                <button
                                    onClick={() =>
                                        navigate('/admin?section=users&filter=STAGING_SUPERVISOR')
                                    }
                                    className={`flex flex-col items-center justify-center ${settings?.density === 'compact' ? 'p-1' : 'p-2'} rounded bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-400 font-bold hover:scale-[1.02] transition-all`}
                                >
                                    <span className={`font-bold ${settings?.density === 'compact' ? 'text-base' : 'text-lg'}`}>
                                        {userStats?.staging || 0}
                                    </span>
                                    <span className="text-[9px] opacity-80 uppercase mt-1">
                                        {t('staging', settings.language)}
                                    </span>
                                </button>

                                {/* Loading */}
                                <button
                                    onClick={() =>
                                        navigate('/admin?section=users&filter=LOADING_SUPERVISOR')
                                    }
                                    className={`flex flex-col items-center justify-center ${settings?.density === 'compact' ? 'p-1' : 'p-2'} rounded bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 text-orange-900 dark:text-orange-400 font-bold hover:scale-[1.02] transition-all`}
                                >
                                    <span className={`font-bold ${settings?.density === 'compact' ? 'text-base' : 'text-lg'}`}>
                                        {userStats?.loading || 0}
                                    </span>
                                    <span className="text-[9px] opacity-80 uppercase mt-1">
                                        {t('loading', settings.language)}
                                    </span>
                                </button>

                                {/* Leads */}
                                <button
                                    onClick={() =>
                                        navigate('/admin?section=users&filter=SHIFT_LEAD')
                                    }
                                    className={`flex flex-col items-center justify-center ${settings?.density === 'compact' ? 'p-1' : 'p-2'} rounded bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-400 font-bold hover:scale-[1.02] transition-all`}
                                >
                                    <span className={`font-bold ${settings?.density === 'compact' ? 'text-base' : 'text-lg'}`}>
                                        {userStats?.shift || 0}
                                    </span>
                                    <span className="text-[9px] opacity-80 uppercase mt-1">
                                        {t('leads', settings.language)}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Total Sheets (Full Width) */}
                    <div className="w-full">
                        <StageColumn
                            title={t('total_sheets', settings.language)}
                            color="border-emerald-500/20"
                            items={relevantSheets.filter((s) => s.status === SheetStatus.COMPLETED)}
                            linkTo="/database"
                            filters={getFilterLinks('TOTAL_SHEETS')}
                            density={settings?.density}
                            fullWidth={true}
                            hideItems={true}
                        />
                    </div>
                </div>
            ) : (
                // SUPERVISOR / DEFAULT LAYOUT (Grid)
                <div
                    className={`grid gap-4 ${settings?.density === 'compact' ? 'max-h-[600px]' : ''} 
                    ${isStagingSupervisor || isLoadingSupervisor || isShiftLead ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}
                >
                    {/* 1. Staging Column (Consolidated) */}
                    {(currentUser?.role === Role.ADMIN ||
                        currentUser?.role === Role.STAGING_SUPERVISOR) && (
                            <StageColumn
                                title="Staging"
                                color="border-slate-200 dark:border-white/10"
                                items={relevantSheets.filter(
                                    (s) =>
                                        s.status === SheetStatus.DRAFT ||
                                        s.status === SheetStatus.STAGING_VERIFICATION_PENDING
                                )}
                                linkTo={
                                    currentUser?.role === Role.ADMIN ||
                                        currentUser?.role === Role.STAGING_SUPERVISOR
                                        ? '/admin?section=staging_db'
                                        : undefined
                                }
                                filters={getFilterLinks('STAGING')}
                                density={settings?.density}
                                fullWidth={isStagingSupervisor}
                            />
                        )}

                    {/* 2. Loading Column (Admin/Loading SV) */}
                    {(currentUser?.role === Role.ADMIN ||
                        currentUser?.role === Role.LOADING_SUPERVISOR) && (
                            <StageColumn
                                title="Loading"
                                color="border-blue-500/20"
                                items={relevantSheets.filter(
                                    (s) =>
                                        s.status === SheetStatus.LOCKED ||
                                        s.status === SheetStatus.LOADING_VERIFICATION_PENDING
                                )}
                                linkTo={
                                    currentUser?.role === Role.ADMIN
                                        ? '/admin?section=loading_db'
                                        : currentUser?.role === Role.LOADING_SUPERVISOR
                                            ? '/admin?section=loading_db'
                                            : '/admin?section=shift_lead_db&view_mode=VIEW_LOADING_VERIFY'
                                }
                                filters={getFilterLinks('LOADING')}
                                density={settings?.density}
                                fullWidth={isLoadingSupervisor}
                            />
                        )}

                    {/* 3. Shift Lead Column */}
                    {(currentUser?.role === Role.ADMIN ||
                        currentUser?.role === Role.SHIFT_LEAD) && (
                            <StageColumn
                                title="Shift Lead"
                                color="border-purple-500/20"
                                items={relevantSheets.filter(
                                    (s) => s.status === SheetStatus.STAGING_VERIFICATION_PENDING
                                )}
                                linkTo="/admin?section=shift_lead_db"
                                filters={getFilterLinks('SHIFT_LEAD')}
                                density={settings?.density}
                                fullWidth={isShiftLead}
                            />
                        )}

                    {/* 4. Completed (Supervisors ONLY - Admin uses Total Sheets layout above) */}
                    {!isAdmin && currentUser?.role === Role.SHIFT_LEAD && (
                        <div className="h-full">
                            <StageColumn
                                title="Completed"
                                color="border-emerald-500/20"
                                items={relevantSheets.filter(
                                    (s) => s.status === SheetStatus.COMPLETED
                                )}
                                linkTo={undefined}
                                filters={getFilterLinks('COMPLETED')}
                                density={settings?.density}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
