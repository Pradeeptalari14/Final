import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Truck, FileCheck, Layers, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetStatus, SheetData, Role } from '@/types';

export default function DashboardOverview() {
    const { sheets, currentUser, loading, settings, users } = useData();
    const navigate = useNavigate();

    // STRICT USER FILTERING
    const relevantSheets = currentUser?.role === Role.ADMIN
        ? sheets
        : sheets.filter(sheet => {
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
                return sheet.status === SheetStatus.LOCKED ||
                    sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING ||
                    sheet.status === SheetStatus.COMPLETED;
            }
            // Shift Lead
            if (currentUser?.role === Role.SHIFT_LEAD) {
                return true;
            }
            return false;
        });

    // Helper for filter links
    const getFilterLinks = (stage: string) => {
        // ALLOW LOADING SUPERVISOR
        if (currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SHIFT_LEAD &&
            currentUser?.role !== Role.STAGING_SUPERVISOR && currentUser?.role !== Role.LOADING_SUPERVISOR) return [];

        const isRejected = (s: any) => s.rejectionReason && s.rejectionReason.trim() !== '';

        if (stage === 'STAGING') {
            const rejectedCount = relevantSheets.filter(s =>
                (s.status === SheetStatus.DRAFT || s.status === SheetStatus.STAGING_VERIFICATION_PENDING) && isRejected(s)
            ).length;

            if (currentUser?.role === Role.ADMIN || currentUser?.role === Role.STAGING_SUPERVISOR) {
                const stagingActiveCount = relevantSheets.filter(s => s.status === SheetStatus.DRAFT || s.status === SheetStatus.STAGING_VERIFICATION_PENDING).length;
                const draftCount = relevantSheets.filter(s => s.status === SheetStatus.DRAFT && !isRejected(s)).length;
                const lockedCount = relevantSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING || s.status === SheetStatus.LOCKED).length;
                const completedCount = relevantSheets.filter(s => s.status === SheetStatus.COMPLETED).length;
                const rejectedCount = relevantSheets.filter(s => s.status === SheetStatus.DRAFT && isRejected(s)).length;

                return [
                    { label: 'Total Staging', count: stagingActiveCount, link: '/admin?tab=staging_db', color: 'bg-slate-800 text-slate-300' },
                    { label: 'Draft', count: draftCount, link: '/admin?tab=staging_db&filter=DRAFT', color: 'bg-slate-700 text-slate-300' },
                    { label: 'Locked / Pending', count: lockedCount, link: '/admin?tab=staging_db&filter=LOCKED', color: 'bg-blue-900/20 text-blue-300' },
                    { label: 'Completed', count: completedCount, link: '/admin?tab=staging_db&filter=COMPLETED', color: 'bg-emerald-900/20 text-emerald-300' },
                    { label: 'Rejected', count: rejectedCount, link: '/admin?tab=staging_db&filter=REJECTED', color: 'bg-red-900/20 text-red-300' }
                ];
            }

            if (rejectedCount === 0) return [];
            return [
                { label: 'Rejected', count: rejectedCount, link: '/admin?tab=shift_lead_db&filter=STAGING_REJECTED', color: 'bg-red-900/20 text-red-300 border-red-500/30' }
            ];
        }

        if (stage === 'LOADING') {
            // Admin OR Loading Supervisor
            if (currentUser?.role === Role.ADMIN || currentUser?.role === Role.LOADING_SUPERVISOR) {
                const loadingSheets = relevantSheets.filter(s => s.status !== SheetStatus.DRAFT && s.status !== SheetStatus.STAGING_VERIFICATION_PENDING);

                const loadingActiveCount = loadingSheets.filter(s => s.status !== SheetStatus.COMPLETED).length;

                const readyCount = loadingSheets.filter(s => s.status === SheetStatus.LOCKED).length;
                const pendingVerCount = loadingSheets.filter(s => s.status === SheetStatus.LOADING_VERIFICATION_PENDING).length;
                const completedCount = loadingSheets.filter(s => s.status === SheetStatus.COMPLETED).length;
                const rejectedCount = loadingSheets.filter(s => s.status === SheetStatus.LOCKED && isRejected(s)).length;

                return [
                    { label: 'Total Loading', count: loadingActiveCount, link: '/admin?tab=loading_db', color: 'bg-slate-800 text-slate-300' },
                    { label: 'Ready to Load', count: readyCount, link: '/admin?tab=loading_db&filter=READY', color: 'bg-blue-900/20 text-blue-300' },
                    { label: 'Locked (Pending Ver.)', count: pendingVerCount, link: '/admin?tab=loading_db&filter=LOCKED', color: 'bg-orange-900/20 text-orange-300' },
                    { label: 'Completed', count: completedCount, link: '/admin?tab=loading_db&filter=COMPLETED', color: 'bg-emerald-900/20 text-emerald-300' },
                    { label: 'Rejected', count: rejectedCount, link: '/admin?tab=loading_db&filter=REJECTED', color: 'bg-red-900/20 text-red-300' }
                ];
            }
            return [];
        }

        if (stage === 'SHIFT_LEAD' && (currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD)) {
            // ... (Existing Shift Lead logic)
            const approvalCount = relevantSheets.filter(s =>
                s.status === SheetStatus.STAGING_VERIFICATION_PENDING ||
                s.status === SheetStatus.LOADING_VERIFICATION_PENDING
            ).length;
            const stagingApprCount = relevantSheets.filter(s => s.status === SheetStatus.DRAFT || s.status === SheetStatus.STAGING_VERIFICATION_PENDING).length;
            const loadingApprCount = relevantSheets.filter(s => s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING).length;
            const completedCount = relevantSheets.filter(s => s.status === SheetStatus.COMPLETED).length;
            const stagingRejCount = relevantSheets.filter(s => s.status === SheetStatus.DRAFT && isRejected(s)).length;
            const loadingRejCount = relevantSheets.filter(s => (s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING) && isRejected(s)).length;
            const allDoneCount = relevantSheets.filter(s => s.status === SheetStatus.COMPLETED).length;

            return [
                { label: 'Total Approvals', count: approvalCount, link: '/admin?tab=shift_lead_db', color: 'bg-slate-800 text-slate-300' },
                { label: 'Staging Approvals', count: stagingApprCount, link: '/admin?tab=shift_lead_db&filter=STAGING_APPROVALS', color: 'bg-blue-900/20 text-blue-300' },
                { label: 'Loading Approvals', count: loadingApprCount, link: '/admin?tab=shift_lead_db&filter=LOADING_APPROVALS', color: 'bg-orange-900/20 text-orange-300' },
                { label: 'Completed', count: completedCount, link: '/admin?tab=shift_lead_db&filter=COMPLETED', color: 'bg-emerald-900/20 text-emerald-300' },
                { label: 'Staging Rejected', count: stagingRejCount, link: '/admin?tab=shift_lead_db&filter=STAGING_REJECTED', color: 'bg-red-900/20 text-red-300' },
                { label: 'Loading Rejected', count: loadingRejCount, link: '/admin?tab=shift_lead_db&filter=LOADING_REJECTED', color: 'bg-red-900/20 text-red-300' },
                { label: 'All Done', count: allDoneCount, link: '/database', color: 'bg-emerald-900 text-emerald-100 shadow-md' }
            ];
        }

        // 4. TOTAL SHEETS (ADMIN ONLY)
        if (stage === 'TOTAL_SHEETS' && currentUser?.role === Role.ADMIN) {
            const allCount = relevantSheets.length;
            const completedCount = relevantSheets.filter(s => s.status === SheetStatus.COMPLETED).length;
            const activeCount = allCount - completedCount;
            const rejectedCount = relevantSheets.filter(isRejected).length;

            return [
                { label: 'Total Sheets', count: allCount, link: '/database', color: 'bg-slate-800 text-slate-300' },
                { label: 'Completed', count: completedCount, link: '/database?filter=COMPLETED', color: 'bg-emerald-900/20 text-emerald-300' },
                { label: 'Active', count: activeCount, link: '/database?filter=ACTIVE', color: 'bg-blue-900/20 text-blue-300' },
                { label: 'Rejected', count: rejectedCount, link: '/database?filter=REJECTED', color: 'bg-red-900/20 text-red-300' },
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
    const userStats = isAdmin ? {
        total: users.length,
        staging: users.filter(u => u.role === Role.STAGING_SUPERVISOR).length,
        loading: users.filter(u => u.role === Role.LOADING_SUPERVISOR).length,
        shift: users.filter(u => u.role === Role.SHIFT_LEAD).length
    } : null;


    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Dashboard</h1>
                    <p className="text-slate-400 text-sm">Real-time operations overview & metrics.</p>
                </div>
                {/* New Sheet Button for Staging Supervisor */}
                {isStagingSupervisor && (
                    <Button
                        onClick={() => navigate('/sheets/staging/new')}
                        className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={18} />
                        New Staging Sheet
                    </Button>
                )}
            </motion.div>

            {/* Quick Actions Layout */}
            {/* If Admin, use multi-row layout. Else use grid. */}

            {isAdmin ? (
                // ADMIN LAYOUT
                <div className="flex flex-col gap-4">
                    {/* Row 1: Operations Columns */}
                    <div className={`grid gap-4 grid-cols-1 md:grid-cols-3`}>
                        <StageColumn
                            title="Staging"
                            color="border-white/10"
                            items={relevantSheets.filter(s => s.status === SheetStatus.DRAFT || s.status === SheetStatus.STAGING_VERIFICATION_PENDING)}
                            linkTo="/admin?tab=staging_db"
                            filters={getFilterLinks('STAGING')}
                            density={settings?.density}
                        />
                        <StageColumn
                            title="Loading"
                            color="border-blue-500/20"
                            items={relevantSheets.filter(s => s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING)}
                            linkTo="/admin?tab=loading_db"
                            filters={getFilterLinks('LOADING')}
                            density={settings?.density}
                        />
                        <StageColumn
                            title="Shift Lead"
                            color="border-purple-500/20"
                            items={relevantSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING)}
                            linkTo="/admin?tab=shift_lead_db"
                            filters={getFilterLinks('SHIFT_LEAD')}
                            density={settings?.density}
                        />
                    </div>

                    {/* Row 2: Total Sheets (Full Width) */}
                    <div className="w-full">
                        <StageColumn
                            title="Total Sheets"
                            color="border-emerald-500/20"
                            items={relevantSheets.filter(s => s.status === SheetStatus.COMPLETED)} // Showing completed sheets as primary items list for now
                            linkTo="/database"
                            filters={getFilterLinks('TOTAL_SHEETS')}
                            density={settings?.density}
                            fullWidth={true}
                        />
                    </div>

                    {/* Row 3: Users (Full Width) */}
                    <div className="w-full">
                        <div className={`rounded-lg border border-white/10 ${settings?.density === 'compact' ? 'p-2' : 'p-3'} flex flex-col gap-2 transition-colors relative group hover:bg-white/[0.02]`}>
                            <div className={`flex items-center justify-between border-b border-white/5 ${settings?.density === 'compact' ? 'pb-1' : 'pb-2'}`}>
                                <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">Users</h3>
                                <span className="text-xs font-mono opacity-50">{users.length}</span>
                            </div>

                            {/* User Filter Buttons */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <button onClick={() => navigate('/admin?tab=users')} className="flex flex-col items-center justify-center p-2 rounded bg-slate-800 text-slate-300 border border-white/5 hover:scale-[1.02] transition-all">
                                    <span className="font-bold text-lg">{userStats?.total || 0}</span>
                                    <span className="text-[9px] opacity-80 uppercase mt-1">Total Users</span>
                                </button>
                                <button onClick={() => navigate('/admin?tab=users')} className="flex flex-col items-center justify-center p-2 rounded bg-blue-900/20 text-blue-300 border border-white/5 hover:scale-[1.02] transition-all">
                                    <span className="font-bold text-lg">{userStats?.staging || 0}</span>
                                    <span className="text-[9px] opacity-80 uppercase mt-1">Staging Users</span>
                                </button>
                                <button onClick={() => navigate('/admin?tab=users')} className="flex flex-col items-center justify-center p-2 rounded bg-orange-900/20 text-orange-300 border border-white/5 hover:scale-[1.02] transition-all">
                                    <span className="font-bold text-lg">{userStats?.loading || 0}</span>
                                    <span className="text-[9px] opacity-80 uppercase mt-1">Loading Users</span>
                                </button>
                                <button onClick={() => navigate('/admin?tab=users')} className="flex flex-col items-center justify-center p-2 rounded bg-purple-900/20 text-purple-300 border border-white/5 hover:scale-[1.02] transition-all">
                                    <span className="font-bold text-lg">{userStats?.shift || 0}</span>
                                    <span className="text-[9px] opacity-80 uppercase mt-1">Shift Lead Users</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            ) : (
                // SUPERVISOR / DEFAULT LAYOUT (Grid)
                <div className={`grid gap-4 ${settings?.density === 'compact' ? 'max-h-[600px]' : ''} 
                    ${isStagingSupervisor || isLoadingSupervisor || isShiftLead ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>

                    {/* 1. Staging Column */}
                    {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.STAGING_SUPERVISOR) && (
                        <StageColumn
                            title="Staging"
                            color="border-white/10"
                            items={relevantSheets.filter(s => s.status === SheetStatus.DRAFT || s.status === SheetStatus.STAGING_VERIFICATION_PENDING)}
                            linkTo={currentUser?.role === Role.ADMIN || currentUser?.role === Role.STAGING_SUPERVISOR ? "/admin?tab=staging_db" : undefined}
                            filters={getFilterLinks('STAGING')}
                            density={settings?.density}
                            fullWidth={isStagingSupervisor}
                        />
                    )}

                    {/* 2. Loading Column */}
                    {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.LOADING_SUPERVISOR) && (
                        <StageColumn
                            title="Loading"
                            color="border-blue-500/20"
                            items={relevantSheets.filter(s => s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING)}
                            linkTo={currentUser?.role === Role.ADMIN ? "/admin?tab=loading_db" : currentUser?.role === Role.LOADING_SUPERVISOR ? "/admin?tab=loading_db" : "/admin?tab=shift_lead_db&filter=LOADING_APPROVALS"}
                            filters={getFilterLinks('LOADING')}
                            density={settings?.density}
                            fullWidth={isLoadingSupervisor}
                        />
                    )}

                    {/* 3. Shift Lead Column */}
                    {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD) && (
                        <StageColumn
                            title="Shift Lead"
                            color="border-purple-500/20"
                            items={relevantSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING)}
                            linkTo="/admin?tab=shift_lead_db"
                            filters={getFilterLinks('SHIFT_LEAD')}
                            density={settings?.density}
                            fullWidth={isShiftLead}
                        />
                    )}

                    {/* 4. Completed (Supervisors ONLY - Admin uses Total Sheets layout above) */}
                    {(!isAdmin && (currentUser?.role === Role.SHIFT_LEAD)) && (
                        <div className="h-full">
                            <StageColumn
                                title="Completed"
                                color="border-emerald-500/20"
                                items={relevantSheets.filter(s => s.status === SheetStatus.COMPLETED)}
                                linkTo={undefined}
                                filters={getFilterLinks('COMPLETED')}
                                density={settings?.density}
                            />
                        </div>
                    )}
                </div>
            )}


            {/* Recent Sheets Table */}
            <Card className="border-white/5 bg-slate-900/20">
                <CardHeader className={`${settings?.density === 'compact' ? 'py-2' : 'pb-2'}`}>
                    <CardTitle className="text-lg">Recent Activity {currentUser?.role !== Role.ADMIN && '(My Tasks)'}</CardTitle>
                </CardHeader>
                <CardContent className={`${settings?.density === 'compact' ? 'pb-2' : ''}`}>
                    <div className="overflow-hidden rounded-lg border border-white/5">
                        <table className="w-full text-xs text-left text-slate-400">
                            <thead className="bg-slate-950/50 text-[10px] uppercase font-semibold text-slate-500">
                                <tr>
                                    <th className={`p-2 ${settings?.density === 'compact' ? 'py-1' : ''}`}>Sheet ID</th>
                                    <th className={`p-2 ${settings?.density === 'compact' ? 'py-1' : ''}`}>Supervisor</th>
                                    <th className={`p-2 ${settings?.density === 'compact' ? 'py-1' : ''}`}>Status</th>
                                    <th className={`p-2 ${settings?.density === 'compact' ? 'py-1' : ''}`}>Date</th>
                                    <th className={`p-2 text-right ${settings?.density === 'compact' ? 'py-1' : ''}`}>Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {relevantSheets.length === 0 ? (
                                    <tr><td colSpan={5} className="p-6 text-center opacity-50">No recent activity found.</td></tr>
                                ) : (
                                    relevantSheets.slice(0, 10).map(sheet => (
                                        <tr
                                            key={sheet.id}
                                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                                            onClick={() => {
                                                const isStaging = sheet.status === SheetStatus.DRAFT || sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING;
                                                navigate(isStaging ? `/sheets/staging/${sheet.id}` : `/sheets/loading/${sheet.id}`);
                                            }}
                                        >
                                            <td className={`p-2 font-mono text-blue-400 group-hover:text-blue-300 font-medium ${settings?.density === 'compact' ? 'py-1' : ''}`}>
                                                {sheet.id.startsWith('SH-') ? sheet.id : `# ${sheet.id.slice(-4)}`}
                                            </td>
                                            <td className={`p-2 text-slate-300 ${settings?.density === 'compact' ? 'py-1' : ''}`}>{sheet.supervisorName || '—'}</td>
                                            <td className={`p-2 ${settings?.density === 'compact' ? 'py-1' : ''}`}>
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                    ${sheet.status === SheetStatus.DRAFT ? 'bg-slate-800 text-slate-400' :
                                                        sheet.status === SheetStatus.LOCKED ? 'bg-purple-500/10 text-purple-400' :
                                                            sheet.status === SheetStatus.COMPLETED ? 'bg-emerald-500/10 text-emerald-400' :
                                                                'bg-yellow-500/10 text-yellow-400'}`}>
                                                    {sheet.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className={`p-2 ${settings?.density === 'compact' ? 'py-1' : ''}`}>{new Date(sheet.date).toLocaleDateString()}</td>
                                            <td className={`p-2 text-right ${settings?.density === 'compact' ? 'py-1' : ''}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-[10px] hover:bg-white/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const isStaging = sheet.status === SheetStatus.DRAFT || sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING;
                                                        navigate(isStaging ? `/sheets/staging/${sheet.id}` : `/sheets/loading/${sheet.id}`);
                                                    }}
                                                >
                                                    Open
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// StageColumn
function StageColumn({ title, color, items, linkTo, filters, density, fullWidth }: {
    title: string,
    color: string,
    items: SheetData[],
    linkTo?: string,
    filters?: any[],
    density?: 'compact' | 'comfortable',
    fullWidth?: boolean
}) {
    const navigate = useNavigate();
    const safeLink = linkTo || '/database';
    const isCompact = density === 'compact';

    // Dynamic grid for filters
    const filterGridClass = fullWidth
        ? filters && filters.length > 5 ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'
        : 'grid-cols-2';

    return (
        <div className={`rounded-lg border ${color} ${isCompact ? 'p-2' : 'p-3'} flex flex-col gap-2 transition-colors h-full relative group hover:bg-white/[0.02]`}>
            <div className={`flex items-center justify-between border-b border-white/5 ${isCompact ? 'pb-1' : 'pb-2'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">{title}</h3>
                {items.length > 0 && <span className="text-xs font-mono opacity-50">{items.length}</span>}
            </div>

            {filters && filters.length > 0 && (
                <div className={`grid ${filterGridClass} ${isCompact ? 'gap-1' : 'gap-2'}`}>
                    {filters.map((f, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); navigate(f.link); }}
                            className={`
                                flex flex-col items-center justify-center ${isCompact ? 'p-1' : 'p-2'} rounded 
                                transition-all hover:scale-[1.02] active:scale-[0.98] 
                                border border-white/5 shadow-sm
                                ${f.color} 
                                ${fullWidth ? 'min-h-[60px]' : ''}
                            `}
                        >
                            <span className={`font-bold leading-none ${fullWidth ? 'text-lg' : 'text-sm'}`}>{f.count}</span>
                            <span className="text-[9px] opacity-80 uppercase tracking-tight text-center leading-tight mt-1">{f.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className={`flex-1 overflow-y-auto custom-scrollbar ${isCompact ? 'max-h-[200px]' : 'max-h-[300px]'} ${fullWidth ? 'max-h-[500px]' : ''}`}>
                {items.length === 0 ? (
                    <div
                        onClick={() => navigate(safeLink)}
                        className={`h-full flex flex-col items-center justify-center cursor-pointer hover:opacity-100 opacity-60 transition-opacity ${isCompact ? 'min-h-[60px]' : 'min-h-[80px]'}`}
                    >
                        <div className="text-[10px] opacity-40 mt-1 flex items-center gap-1">
                            View Details <ArrowRight size={10} />
                        </div>
                    </div>
                ) : (
                    <div className={`space-y-2 ${isCompact ? 'pt-0.5' : 'pt-1'} ${fullWidth ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 space-y-0' : ''}`}>
                        {items.map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    const isStaging = item.status === SheetStatus.DRAFT || item.status === SheetStatus.STAGING_VERIFICATION_PENDING;
                                    navigate(isStaging ? `/sheets/staging/${item.id}` : `/sheets/loading/${item.id}`);
                                }}
                                className={`bg-slate-950/40 ${isCompact ? 'p-1.5' : 'p-2'} rounded border border-white/5 hover:border-white/20 hover:bg-slate-900 transition-all cursor-pointer shadow-sm group/item relative`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-mono text-[10px] font-semibold text-white group-hover/item:text-blue-400 transition-colors">#{item.id.slice(-4)}</span>
                                    <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1 truncate font-medium">
                                    {item.destination || 'Unknown Dest'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {items.length > 0 && !fullWidth && (
                    <div
                        onClick={() => navigate(safeLink)}
                        className="text-[10px] text-center opacity-40 hover:opacity-100 cursor-pointer pt-2 border-t border-white/5 mt-2"
                    >
                        View All {items.length} Items &rarr;
                    </div>
                )}
            </div>
        </div>
    );
}
