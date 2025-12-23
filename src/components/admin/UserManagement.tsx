import { useState, useMemo } from 'react';
import { Role, User, SheetData } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Search,
    UserPlus,
    Users,
    Shield,
    UserCheck,
    Star,
    Clock,
    LayoutGrid,
    Filter,
    ArrowUpDown,
    Download,
    ChevronDown
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { t } from '@/lib/i18n';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserTable } from './users/UserTable';
import { AddUserModal } from './users/AddUserModal';
import { EditUserModal } from './users/EditUserModal';
import { PasswordResetModal } from './users/PasswordResetModal';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { saveAs } from 'file-saver';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

interface UserManagementProps {
    users: User[];
    refreshUsers: () => Promise<void>;
    sheets: SheetData[];
}

type SortKey = 'name' | 'role' | 'lastActive' | 'status';
type SortDirection = 'asc' | 'desc';

export function UserManagement({ users, refreshUsers, sheets }: UserManagementProps) {
    const { currentUser, settings } = useData();

    // STRICT GUARD: Admin only
    if (currentUser?.role !== Role.ADMIN) {
        return <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest">{t('access_denied', settings.language)}</div>;
    }

    const {
        userSearchQuery,
        setUserSearchQuery,
        userFilter,
        setFilter,
        isAddingUser,
        setIsAddingUser,
        passwordResetUser,
        setPasswordResetUser,
        editingUser,
        setEditingUser,
        lastActiveMap,
        filteredUsers, // Base filtered list (Role + Search)
        handleDeleteUser,
        toggleUserStatus,
        handleUnlockUser
    } = useUserManagement(users, refreshUsers, sheets);

    // --- NEW: Local Sort & Filter State ---
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'lastActive',
        direction: 'desc'
    });

    // --- Compute Final List ---
    const processedUsers = useMemo(() => {
        let result = [...filteredUsers];

        // 1. Status Filter
        if (statusFilter === 'ACTIVE') {
            result = result.filter(u => u.isApproved && !u.isLocked);
        } else if (statusFilter === 'LOCKED') {
            result = result.filter(u => u.isLocked);
        }

        // 2. Sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortConfig.key) {
                case 'name':
                    comparison = a.fullName.localeCompare(b.fullName);
                    break;
                case 'role':
                    comparison = a.role.localeCompare(b.role);
                    break;
                case 'status':
                    // Sort order: Locked > Active > Pending
                    const getStatusWeight = (u: User) => u.isLocked ? 3 : (u.isApproved ? 2 : 1);
                    comparison = getStatusWeight(a) - getStatusWeight(b);
                    break;
                case 'lastActive':
                    const timeA = lastActiveMap.get(a.username) || 0;
                    const timeB = lastActiveMap.get(b.username) || 0;
                    comparison = timeA - timeB;
                    break;
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [filteredUsers, statusFilter, sortConfig, lastActiveMap]);

    // --- Export Handler ---
    const handleExport = () => {
        const csvHeader = "ID,Full Name,Username,Role,Employee Code,Status,Role Status,Last Active\n";
        const csvRows = processedUsers.map(user => {
            const lastActive = lastActiveMap.get(user.username);
            const lastActiveStr = lastActive ? new Date(lastActive).toISOString() : "Never";
            const status = user.isLocked ? "LOCKED" : (user.isApproved ? "ACTIVE" : "PENDING");

            return [
                user.id,
                `"${user.fullName}"`, // Quote names to handle commas
                user.username,
                user.role,
                user.empCode || "N/A",
                status,
                user.isDeleted ? "DELETED" : "LIVE",
                lastActiveStr
            ].join(",");
        }).join("\n");

        const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8" });
        saveAs(blob, `user_directory_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    // Sidebar Navigation Items
    const navItems = [
        { id: 'ALL', label: 'All Users', icon: Users, count: users.length, color: 'text-slate-500' },
        { id: Role.ADMIN, label: 'Administrators', icon: Shield, count: users.filter(u => u.role === Role.ADMIN).length, color: 'text-indigo-600' },
        { id: Role.STAGING_SUPERVISOR, label: 'Staging Supervisors', icon: UserCheck, count: users.filter(u => u.role === Role.STAGING_SUPERVISOR).length, color: 'text-blue-600' },
        { id: Role.LOADING_SUPERVISOR, label: 'Loading Supervisors', icon: LayoutGrid, count: users.filter(u => u.role === Role.LOADING_SUPERVISOR).length, color: 'text-orange-600' },
        { id: Role.SHIFT_LEAD, label: 'Shift Leads', icon: Star, count: users.filter(u => u.role === Role.SHIFT_LEAD).length, color: 'text-purple-600' },
        { id: 'PENDING', label: 'Pending Approval', icon: Clock, count: users.filter(u => !u.isApproved).length, color: 'text-amber-600' },
        { id: 'LOCKED', label: 'Locked Accounts', icon: Shield, count: users.filter(u => u.isLocked).length, color: 'text-red-600' },
    ];

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-300">
            {/* LEFT SIDEBAR - DIRECTORY TREE (Mobile: Top horizontal scroll, Desktop: Left vertical sidebar) */}
            <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                <div className="px-4 py-2 lg:w-full min-w-[200px]">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 hidden lg:block">Directory</h3>
                    <div className="flex lg:flex-col gap-1 lg:space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id as any)}
                                className={cn(
                                    "flex-shrink-0 lg:w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border lg:border-none border-slate-100 dark:border-slate-800 lg:bg-transparent bg-white dark:bg-slate-900",
                                    userFilter === item.id
                                        ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-lg shadow-indigo-500/10 lg:scale-105 border-indigo-200 dark:border-indigo-900"
                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 lg:hover:pl-4"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={16} className={item.color} />
                                    <span className="whitespace-nowrap">{item.label}</span>
                                </div>
                                {item.count > 0 && (
                                    <Badge variant="secondary" className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-1.5 h-5 min-w-[20px] justify-center">
                                        {item.count}
                                    </Badge>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto px-4 py-6 hidden lg:block">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20">
                        <p className="text-xs font-bold opacity-80 mb-1 uppercase tracking-widest">Total Users</p>
                        <p className="text-3xl font-black tracking-tight">{users.length}</p>
                        <div className="mt-3 flex items-center gap-2 text-[10px] font-medium bg-white/10 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {users.filter(u => u.isApproved).length} Active Identities
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT - DATA GRID */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-w-0">
                {/* TOOLBAR */}
                <div className="p-4 lg:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                                placeholder="Search..."
                            />
                        </div>
                        <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-slate-700" />
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                            {/* FILTER */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant={statusFilter !== 'ALL' ? "secondary" : "ghost"} size="sm" className={cn("text-slate-500 hover:text-indigo-600 gap-2 shrink-0", statusFilter !== 'ALL' && "text-indigo-600")}>
                                        <Filter size={16} />
                                        <span className="hidden sm:inline">{statusFilter === 'ALL' ? 'Filter' : statusFilter === 'ACTIVE' ? 'Active' : 'Locked'}</span>
                                        <ChevronDown size={12} className="opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuLabel>Account Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                        <DropdownMenuRadioItem value="ALL">Show All Objects</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="ACTIVE">Active Accounts</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="LOCKED">Locked Accounts</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* SORT */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600 gap-2 shrink-0">
                                        <ArrowUpDown size={16} /> <span className="hidden sm:inline">Sort</span>
                                        <ChevronDown size={12} className="opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuLabel>Sort Directory By</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup value={sortConfig.key} onValueChange={(v) => setSortConfig({ key: v as SortKey, direction: sortConfig.direction })}>
                                        <DropdownMenuRadioItem value="name">Full Name</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="role">Role / Permission</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="lastActive">Last Activity</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="status">Account Status</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                    <DropdownMenuSeparator />
                                    <div className="p-2">
                                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                            <button
                                                onClick={() => setSortConfig(p => ({ ...p, direction: 'asc' }))}
                                                className={cn("flex-1 text-xs font-bold py-1.5 rounded-md text-center transition-all", sortConfig.direction === 'asc' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
                                            >
                                                Asc
                                            </button>
                                            <button
                                                onClick={() => setSortConfig(p => ({ ...p, direction: 'desc' }))}
                                                className={cn("flex-1 text-xs font-bold py-1.5 rounded-md text-center transition-all", sortConfig.direction === 'desc' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
                                            >
                                                Desc
                                            </button>
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleExport} className="hidden lg:flex border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">
                            <Download size={16} className="mr-2" /> Export
                        </Button>
                        <Button onClick={() => setIsAddingUser(true)} className="flex-1 lg:flex-none bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 justify-center">
                            <UserPlus size={18} className="mr-2" /> <span className="sm:inline">Add User</span>
                        </Button>
                    </div>
                </div>

                {/* TABLE AREA */}
                <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 relative">
                    <UserTable
                        users={processedUsers}
                        lastActiveMap={lastActiveMap}
                        onToggleStatus={toggleUserStatus}
                        onUnlock={handleUnlockUser}
                        onEdit={setEditingUser}
                        onDelete={handleDeleteUser}
                        onResetPassword={setPasswordResetUser}
                    />
                </div>

                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] text-slate-400 flex justify-between items-center font-medium">
                    <span>{processedUsers.length} users</span>
                    <span className="hidden sm:inline">SCM-FG Directory Service v1.2</span>
                </div>
            </div>

            {/* MODALS */}
            <AddUserModal
                isOpen={isAddingUser}
                onClose={() => setIsAddingUser(false)}
                onSuccess={refreshUsers}
                settings={settings}
            />

            <EditUserModal
                user={editingUser}
                onClose={() => setEditingUser(null)}
                onSuccess={refreshUsers}
                settings={settings}
            />

            <PasswordResetModal
                user={passwordResetUser}
                onClose={() => setPasswordResetUser(null)}
                onSuccess={refreshUsers}
                settings={settings}
            />
        </div>
    );
}
