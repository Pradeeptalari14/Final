import { useState, useMemo } from 'react';
import { Role, User, SheetData } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Search,
    UserPlus,
    Users,
    Shield,
    UserCheck,
    Star,
    Clock,
    LayoutGrid,
    PanelLeft,
    Filter,
    ArrowUpDown,
    Download,
    ChevronDown
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';
import { t } from '@/lib/i18n';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserTable } from './users/UserTable';
import { AddUserModal } from './users/AddUserModal';
import { EditUserModal } from './users/EditUserModal';
import { PasswordResetModal } from './users/PasswordResetModal';
import { UserDetailsSlideOver } from './users/UserDetailsSlideOver';
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
    DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';

interface UserManagementProps {
    users: User[];
    refreshUsers: () => Promise<void>;
    sheets: SheetData[];
}

type SortKey = 'name' | 'role' | 'lastActive' | 'status';
type SortDirection = 'asc' | 'desc';

export function UserManagement({ users, refreshUsers, sheets }: UserManagementProps) {
    const { currentUser } = useData();
    const { settings } = useAppState();

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

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // --- NEW: Local Sort & Filter State ---
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'lastActive',
        direction: 'desc'
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [isOverview, setIsOverview] = useState(userFilter === 'ALL');



    // --- Compute Final List ---
    const processedUsers = useMemo(() => {
        let result = [...filteredUsers];

        // 1. Status Filter
        if (statusFilter === 'ACTIVE') {
            result = result.filter((u) => u.isApproved && !u.isLocked);
        } else if (statusFilter === 'LOCKED') {
            result = result.filter((u) => u.isLocked);
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
                case 'status': {
                    // Sort order: Locked > Active > Pending
                    const getStatusWeight = (u: User) => (u.isLocked ? 3 : u.isApproved ? 2 : 1);
                    comparison = getStatusWeight(a) - getStatusWeight(b);
                    break;
                }
                case 'lastActive': {
                    const timeA = lastActiveMap.get(a.username) || 0;
                    const timeB = lastActiveMap.get(b.username) || 0;
                    comparison = timeA - timeB;
                    break;
                }
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [filteredUsers, statusFilter, sortConfig, lastActiveMap]);

    // STRICT GUARD: Admin only
    if (currentUser?.role !== Role.ADMIN) {
        return (
            <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest">
                {t('access_denied', settings.language)}
            </div>
        );
    }

    // --- Export Handler ---
    const handleExport = () => {
        const csvHeader =
            'ID,Full Name,Username,Role,Employee Code,Status,Role Status,Last Active\n';
        const csvRows = processedUsers
            .map((user) => {
                const lastActive = lastActiveMap.get(user.username);
                const lastActiveStr = lastActive ? new Date(lastActive).toISOString() : 'Never';
                const status = user.isLocked ? 'LOCKED' : user.isApproved ? 'ACTIVE' : 'PENDING';

                return [
                    user.id,
                    `"${user.fullName}"`, // Quote names to handle commas
                    user.username,
                    user.role,
                    user.empCode || 'N/A',
                    status,
                    user.isDeleted ? 'DELETED' : 'LIVE',
                    lastActiveStr
                ].join(',');
            })
            .join('\n');

        const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `user_directory_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    // Sidebar Navigation Items
    const navItems = [
        {
            id: 'ALL',
            label: 'All Users',
            icon: Users,
            count: users.length,
            color: 'text-slate-500'
        },
        {
            id: Role.ADMIN,
            label: 'Administrators',
            icon: Shield,
            count: users.filter((u) => u.role === Role.ADMIN).length,
            color: 'text-indigo-600'
        },
        {
            id: Role.STAGING_SUPERVISOR,
            label: 'Staging Supervisors',
            icon: UserCheck,
            count: users.filter((u) => u.role === Role.STAGING_SUPERVISOR).length,
            color: 'text-blue-600'
        },
        {
            id: Role.LOADING_SUPERVISOR,
            label: 'Loading Supervisors',
            icon: LayoutGrid,
            count: users.filter((u) => u.role === Role.LOADING_SUPERVISOR).length,
            color: 'text-orange-600'
        },
        {
            id: Role.SHIFT_LEAD,
            label: 'Shift Leads',
            icon: Star,
            count: users.filter((u) => u.role === Role.SHIFT_LEAD).length,
            color: 'text-purple-600'
        },
        {
            id: 'PENDING',
            label: 'Pending Approval',
            icon: Clock,
            count: users.filter((u) => !u.isApproved).length,
            color: 'text-amber-600'
        },
        {
            id: 'LOCKED',
            label: 'Locked Accounts',
            icon: Shield,
            count: users.filter((u) => u.isLocked).length,
            color: 'text-red-600'
        }
    ];

    // Filter Navigation Handler
    const handleCategoryClick = (categoryId: string) => {
        setFilter(categoryId as Role | 'ALL' | 'PENDING' | 'LOCKED');
        setIsOverview(false);
    };

    return (
        <div className="h-full animate-in fade-in zoom-in-95 duration-300">
            {isOverview ? (
                // --- OVERVIEW MODE: Directory Cards ---
                <div className="h-full overflow-y-auto px-4 pt-1 lg:p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">User Directory</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Select a category to manage users and permissions.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleCategoryClick(item.id)}
                                    className="group relative flex flex-col items-start p-4 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300 text-left"
                                >
                                    <div className={cn("p-2 rounded-xl mb-3 transition-colors", item.id === 'ALL' ? "bg-slate-100 dark:bg-slate-800" : "bg-indigo-50 dark:bg-indigo-900/20")}>
                                        <item.icon className={cn("h-6 w-6", item.color)} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-600 transition-colors">
                                        {item.label}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-400 mb-4 line-clamp-2">
                                        Manage {item.label.toLowerCase()} settings and access.
                                    </p>
                                    <div className="mt-auto flex items-center justify-between w-full">
                                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-0.5 text-xs font-bold rounded-md border-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 transition-colors">
                                            {item.count} Users
                                        </Badge>
                                        <div className="h-6 w-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                                            <ChevronDown className="h-3 w-3 -rotate-90 text-indigo-600" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // --- LIST MODE: Split View (Sidebar + Table) ---
                <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6">
                    {/* LEFT SIDEBAR - DIRECTORY TREE */}
                    {isSidebarOpen && (
                        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide bg-white/50 lg:bg-transparent p-2 lg:p-0 rounded-2xl lg:rounded-none border lg:border-none border-slate-100 dark:border-slate-800">
                            <div className="px-2 lg:px-4 py-2 lg:w-full min-w-[200px]">
                                <button
                                    onClick={() => setIsOverview(true)}
                                    className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 hover:underline"
                                >
                                    <div className="bg-indigo-100 rounded-md p-1">
                                        <LayoutGrid className="h-3 w-3" />
                                    </div>
                                    Back to Directory
                                </button>

                                <div className="flex lg:flex-col gap-1 lg:space-y-1">
                                    {navItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setFilter(item.id as Role | 'ALL' | 'PENDING' | 'LOCKED')}
                                            className={cn(
                                                'flex-shrink-0 lg:w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border lg:border-none border-slate-100 dark:border-slate-800 lg:bg-transparent bg-white dark:bg-slate-900',
                                                userFilter === item.id
                                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-lg shadow-indigo-500/10 lg:scale-105 border-indigo-200 dark:border-indigo-900'
                                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 lg:hover:pl-4'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon size={16} className={item.color} />
                                                <span className="whitespace-nowrap">{item.label}</span>
                                            </div>
                                            {item.count > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-1.5 h-5 min-w-[20px] justify-center"
                                                >
                                                    {item.count}
                                                </Badge>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MAIN CONTENT - DATA GRID */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-w-0">
                        {/* TOOLBAR */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 transition-all">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-full flex-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                                        className="h-10 w-10 p-0 shrink-0 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                                    >
                                        <PanelLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
                                    </Button>

                                    {/* Search Field */}
                                    <div className="relative w-full group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-500 transition-all hover:bg-slate-200/50 dark:hover:bg-slate-800"
                                            placeholder="Search directory..."
                                        />
                                    </div>
                                </div>

                                {/* Actions Group */}
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                                    {/* Filter Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "h-10 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600 transition-all rounded-lg px-4",
                                                    statusFilter !== 'ALL' && "bg-indigo-50 border-indigo-200 text-indigo-600"
                                                )}
                                            >
                                                <Filter className="mr-2 h-4 w-4" />
                                                <span>Filter</span>
                                                {statusFilter !== 'ALL' && (
                                                    <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                                                        1
                                                    </span>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                                <DropdownMenuRadioItem value="ALL">All Users</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="ACTIVE">Active Only</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="LOCKED">Locked Accounts</DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Sort Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-10 border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 rounded-lg px-4">
                                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                                Sort
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuRadioGroup value={sortConfig.key} onValueChange={(v) => setSortConfig(prev => ({ ...prev, key: v as any }))}>
                                                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="role">Role</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="lastActive">Last Active</DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                            <DropdownMenuSeparator />
                                            <div className="p-2 gap-2 flex">
                                                <Button variant={sortConfig.direction === 'asc' ? 'secondary' : 'ghost'} size="sm" className="flex-1 h-8 text-xs" onClick={() => setSortConfig(p => ({ ...p, direction: 'asc' }))}>Asc</Button>
                                                <Button variant={sortConfig.direction === 'desc' ? 'secondary' : 'ghost'} size="sm" className="flex-1 h-8 text-xs" onClick={() => setSortConfig(p => ({ ...p, direction: 'desc' }))}>Desc</Button>
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

                                    <Button variant="outline" size="sm" onClick={handleExport} className="h-10 hover:bg-slate-50 text-slate-600 hidden sm:flex rounded-lg px-4">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>

                                    <Button onClick={() => setIsAddingUser(true)} size="sm" className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 border-0 rounded-lg px-5 font-semibold tracking-wide">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Add User
                                    </Button>
                                </div>
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
                                onRowClick={(user) => setSelectedUser(user)}
                            />
                        </div>

                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] text-slate-400 flex justify-between items-center font-medium">
                            <span>{processedUsers.length} users</span>
                            <span className="hidden sm:inline">SCM-FG Directory Service v1.2</span>
                        </div>
                    </div>
                </div>
            )}

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

            <UserDetailsSlideOver
                user={selectedUser}
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                lastActive={selectedUser ? lastActiveMap.get(selectedUser.username) : undefined}
                onEdit={setEditingUser}
                onToggleStatus={toggleUserStatus}
                onUnlock={handleUnlockUser}
                onResetPassword={setPasswordResetUser}
                onDelete={handleDeleteUser}
            />
        </div>
    );
}
