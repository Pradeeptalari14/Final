import { useState, useMemo, useEffect } from 'react';
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { Role, SheetStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, Users, Database, Activity, Trash2, CheckCircle, XCircle, Search, KeyRound, X, Printer, FileText, Truck, ShieldCheck, AlertTriangle, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { users, sheets, loading, refreshUsers, refreshSheets, currentUser, settings } = useData();
    const { addToast } = useToast();

    // Tabs: 'users' | 'database' | 'staging_db' | 'loading_db' | 'shift_lead_db'
    const [activeTab, setActiveTab] = useState<string>('staging_db');

    // --- Database View State ---
    const [subFilter, setSubFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL'); // Dedicated for DatabaseView
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // --- User Management State ---
    const [userSearchQuery, setUserSearchQuery] = useState(''); // Added searching for users
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserLoading, setNewUserLoading] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        fullName: '',
        empCode: '',
        email: '',
        password: '',
        role: Role.STAGING_SUPERVISOR
    });
    // Password Reset State
    const [passwordResetUser, setPasswordResetUser] = useState<any | null>(null);
    const [newPassword, setNewPassword] = useState('');

    // Sync tab and filter with URL or Settings
    useEffect(() => {
        const tab = searchParams.get('tab');
        const filter = searchParams.get('filter');

        if (tab) {
            setActiveTab(tab);
        } else if (settings?.defaultTab) {
            setActiveTab(settings.defaultTab);
        }

        if (filter) {
            setSubFilter(filter);
        }
    }, [searchParams, settings?.defaultTab]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSubFilter('ALL');
        navigate(`/admin?tab=${tab}`, { replace: true });
    };

    // Stats
    const totalSheets = sheets.length;
    const activeUsers = users.filter(u => u.isApproved).length;

    // --- Derived Data ---
    const filteredSheets = useMemo(() => {
        let relevantSheets = sheets;

        // 0. STRICT USER FILTERING (Security Layer)
        if (currentUser?.role !== Role.ADMIN) {
            relevantSheets = relevantSheets.filter(sheet => {
                if (currentUser?.role === Role.STAGING_SUPERVISOR) {
                    return sheet.supervisorName === currentUser.username;
                }
                if (currentUser?.role === Role.LOADING_SUPERVISOR) {
                    return sheet.status === SheetStatus.LOCKED ||
                        sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING ||
                        (sheet.status === SheetStatus.COMPLETED && activeTab === 'database'); // Allow seeing history in generic DB view
                }
                if (currentUser?.role === Role.SHIFT_LEAD) {
                    return true;
                }
                return false;
            });
        }

        // 1. Filter by Active Tab context
        if (activeTab === 'staging_db') {
            // Context: Staging
        } else if (activeTab === 'loading_db') {
            relevantSheets = relevantSheets.filter(s => s.status !== SheetStatus.DRAFT && s.status !== SheetStatus.STAGING_VERIFICATION_PENDING);
        } else if (activeTab === 'shift_lead_db') {
            // Shift lead usually sees everything but we filter by approval status which is handled in sub-filter
        }

        // 2. Global Search & Date
        relevantSheets = relevantSheets.filter(sheet => {
            const matchesSearch = searchQuery === '' ||
                (sheet.supervisorName && sheet.supervisorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                sheet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sheet.shift && sheet.shift.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.destination && sheet.destination.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesDate = dateFilter === '' || (sheet.date && sheet.date.includes(dateFilter));
            return matchesSearch && matchesDate;
        });

        // 3. Sub Filters (Logic dependent on Tab)
        const isRejected = (s: any) => s.comments && s.comments.length > 0; // Generic rejection check

        if (activeTab === 'database') {
            if (statusFilter !== 'ALL') {
                relevantSheets = relevantSheets.filter(s => s.status === statusFilter);
            }
        }
        else if (activeTab === 'staging_db') {
            if (subFilter === 'DRAFT') return relevantSheets.filter(s => s.status === SheetStatus.DRAFT && !isRejected(s));
            if (subFilter === 'LOCKED') return relevantSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING || s.status === SheetStatus.LOCKED);
            if (subFilter === 'COMPLETED') return relevantSheets.filter(s => s.status === SheetStatus.COMPLETED);
            if (subFilter === 'REJECTED') return relevantSheets.filter(s => s.status === SheetStatus.DRAFT && isRejected(s));
        }
        else if (activeTab === 'loading_db') {
            if (subFilter === 'READY') return relevantSheets.filter(s => s.status === SheetStatus.LOCKED);
            if (subFilter === 'LOCKED') return relevantSheets.filter(s => s.status === SheetStatus.LOADING_VERIFICATION_PENDING);
            if (subFilter === 'COMPLETED') return relevantSheets.filter(s => s.status === SheetStatus.COMPLETED);
            if (subFilter === 'REJECTED') return relevantSheets.filter(s => s.status === SheetStatus.LOCKED && isRejected(s));
        }
        else if (activeTab === 'shift_lead_db') {
            if (subFilter === 'STAGING_APPROVALS') return relevantSheets.filter(s => s.status === SheetStatus.DRAFT || s.status === SheetStatus.STAGING_VERIFICATION_PENDING);
            if (subFilter === 'LOADING_APPROVALS') return relevantSheets.filter(s => s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING);
            if (subFilter === 'COMPLETED') return relevantSheets.filter(s => s.status === SheetStatus.COMPLETED);

            if (subFilter === 'STAGING_REJECTED') return relevantSheets.filter(s => s.status === SheetStatus.DRAFT && isRejected(s));
            if (subFilter === 'LOADING_REJECTED') return relevantSheets.filter(s => (s.status === SheetStatus.LOCKED || s.status === SheetStatus.LOADING_VERIFICATION_PENDING) && isRejected(s));
        }

        return relevantSheets;
    }, [sheets, activeTab, subFilter, searchQuery, dateFilter, statusFilter, currentUser]);

    // Filter Users
    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            (user.fullName && user.fullName.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
            user.role.toLowerCase().includes(userSearchQuery.toLowerCase())
        );
    }, [users, userSearchQuery]);

    // Duration Helper
    const getDuration = (sheet: any) => {
        if (sheet.status !== SheetStatus.COMPLETED || !sheet.updatedAt) return '-';
        const start = new Date(sheet.createdAt).getTime();
        const end = new Date(sheet.updatedAt).getTime();
        const diffMs = end - start;
        if (diffMs < 0) return '-';

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // --- Actions ---

    const handleDeleteSheet = async (sheetId: string) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete sheet #${sheetId.slice(0, 8)}? This action cannot be undone.`)) return;

        try {
            const { error } = await supabase.from('sheets').delete().eq('id', sheetId);
            if (error) throw error;
            addToast('success', 'Sheet deleted successfully');
            await refreshSheets();
        } catch (error: any) {
            addToast('error', "Failed to delete sheet: " + error.message);
        }

        const handleDeleteUser = async (userId: string, username: string) => {
            if (!confirm(`Are you sure you want to delete user ${username}?`)) return;
            try {
                const { error } = await supabase.from('users').delete().eq('id', userId);
                if (error) throw error;
                addToast('success', `User ${username} deleted.`);
                await refreshUsers();
            } catch (error: any) {
                addToast('error', "Failed to delete user: " + error.message);
            }
        };




        const toggleUserStatus = async (user: any) => {
            try {
                const updatedUser = { ...user, isApproved: !user.isApproved };
                const { error } = await supabase.from('users').update({ data: updatedUser }).eq('id', user.id);
                if (error) throw error;
                addToast('success', `User ${user.username} is now ${updatedUser.isApproved ? 'Active' : 'Inactive'}`);
                await refreshUsers();
            } catch (error: any) {
                addToast('error', "Failed to update status");
            }
        };

        const handlePasswordReset = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!passwordResetUser || !newPassword) return;

            try {
                const updatedUser = { ...passwordResetUser, password: newPassword };
                const { error } = await supabase.from('users').update({ data: updatedUser }).eq('id', passwordResetUser.id);
                if (error) throw error;
                addToast('success', `Password updated for ${passwordResetUser.username}`);
                setPasswordResetUser(null);
                setNewPassword('');
                await refreshUsers();
            } catch (error: any) {
                addToast('error', "Failed to update password");
            }
        };

        const handleAddUser = async (e: React.FormEvent) => {
            e.preventDefault();
            setNewUserLoading(true);
            try {
                if (!newUser.username || !newUser.password) throw new Error("Username and Password are required.");
                const userData = {
                    id: crypto.randomUUID(),
                    username: newUser.username,
                    email: newUser.email,
                    fullName: newUser.fullName || newUser.username,
                    empCode: newUser.empCode,
                    role: newUser.role,
                    isApproved: true,
                    password: newUser.password
                };
                const { error } = await supabase.from('users').insert({ id: userData.id, data: userData });
                if (error) throw error;
                addToast('success', `User ${newUser.username} created successfully!`);
                await refreshUsers();
                setIsAddingUser(false);
                setNewUser({ username: '', fullName: '', empCode: '', email: '', password: '', role: Role.STAGING_SUPERVISOR });
            } catch (error: any) {
                addToast('error', error.message || "Failed to create user");
            } finally {
                setNewUserLoading(false);
            }
        };

        if (loading) return <div className="p-8 text-slate-400">Loading Admin Dashboard...</div>;

        // --- Sub-Components ---

        const StatsCards = () => (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4">
                {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.STAGING_SUPERVISOR) && (
                    <Card
                        className={`border-white/5 bg-slate-900/40 cursor-pointer hover:bg-slate-900/60 transition-colors ${activeTab === 'staging_db' ? 'ring-2 ring-blue-500/50' : ''}`}
                        onClick={() => handleTabChange('staging_db')}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><FileText size={20} /></div>
                            <div>
                                <div className="font-bold text-white">Staging</div>
                                <div className="text-xs text-slate-400">Drafts</div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.LOADING_SUPERVISOR) && (
                    <Card
                        className={`border-white/5 bg-slate-900/40 cursor-pointer hover:bg-slate-900/60 transition-colors ${activeTab === 'loading_db' ? 'ring-2 ring-orange-500/50' : ''}`}
                        onClick={() => handleTabChange('loading_db')}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400"><Truck size={20} /></div>
                            <div>
                                <div className="font-bold text-white">Loading</div>
                                <div className="text-xs text-slate-400">Tasks</div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD) && (
                    <Card
                        className={`border-white/5 bg-slate-900/40 cursor-pointer hover:bg-slate-900/60 transition-colors ${activeTab === 'shift_lead_db' ? 'ring-2 ring-purple-500/50' : ''}`}
                        onClick={() => handleTabChange('shift_lead_db')}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><ShieldCheck size={20} /></div>
                            <div>
                                <div className="font-bold text-white">Shift Lead</div>
                                <div className="text-xs text-slate-400">Approvals</div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card
                    className={`border-white/5 bg-slate-900/40 cursor-pointer hover:bg-slate-900/60 transition-colors ${activeTab === 'database' ? 'ring-2 ring-indigo-500/50' : ''}`}
                    onClick={() => handleTabChange('database')}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Database size={20} /></div>
                        <div>
                            <div className="font-bold text-white">Database</div>
                            <div className="text-xs text-slate-400">History</div>
                        </div>
                    </CardContent>
                </Card>

                {currentUser?.role === Role.ADMIN && (
                    <Card
                        className={`border-white/5 bg-slate-900/40 cursor-pointer hover:bg-slate-900/60 transition-colors ${activeTab === 'users' ? 'ring-2 ring-emerald-500/50' : ''}`}
                        onClick={() => handleTabChange('users')}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Users size={20} /></div>
                            <div>
                                <div className="font-bold text-white">System</div>
                                <div className="text-xs text-slate-400">Users</div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );

        const FilterBar = () => (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                {/* Sub Filters */}
                <div className="flex flex-wrap gap-2">
                    <Button variant={subFilter === 'ALL' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('ALL')} className="text-xs">All</Button>

                    {activeTab === 'staging_db' && (
                        <>
                            <Button variant={subFilter === 'DRAFT' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('DRAFT')} className="text-xs text-slate-400 data-[state=active]:text-white">Draft</Button>
                            <Button variant={subFilter === 'LOCKED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOCKED')} className="text-xs text-blue-400">Locked / Pending</Button>
                            <Button variant={subFilter === 'COMPLETED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('COMPLETED')} className="text-xs text-green-400">Completed</Button>
                            <Button variant={subFilter === 'REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('REJECTED')} className="text-xs text-red-400">Rejected</Button>
                        </>
                    )}

                    {activeTab === 'loading_db' && (
                        <>
                            <Button variant={subFilter === 'READY' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('READY')} className="text-xs text-blue-400">Ready to Load</Button>
                            <Button variant={subFilter === 'LOCKED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOCKED')} className="text-xs text-orange-400">Locked (Pending Ver.)</Button>
                            <Button variant={subFilter === 'COMPLETED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('COMPLETED')} className="text-xs text-green-400">Completed</Button>
                            <Button variant={subFilter === 'REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('REJECTED')} className="text-xs text-red-400">Rejected</Button>
                        </>
                    )}

                    {activeTab === 'shift_lead_db' && (
                        <>
                            <Button variant={subFilter === 'STAGING_APPROVALS' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('STAGING_APPROVALS')} className="text-xs text-blue-400">Staging Approvals</Button>
                            <Button variant={subFilter === 'LOADING_APPROVALS' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOADING_APPROVALS')} className="text-xs text-orange-400">Loading Approvals</Button>
                            <Button variant={subFilter === 'COMPLETED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('COMPLETED')} className="text-xs text-green-400">Completed</Button>

                            <div className="h-4 w-px bg-white/10 mx-1" />

                            <Button variant={subFilter === 'STAGING_REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('STAGING_REJECTED')} className="text-xs text-red-400">Staging Rejected</Button>
                            <Button variant={subFilter === 'LOADING_REJECTED' ? 'secondary' : 'ghost'} onClick={() => setSubFilter('LOADING_REJECTED')} className="text-xs text-red-400">Loading Rejected</Button>
                        </>
                    )}
                </div>

                {/* Standard Tools */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-950/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none w-40"
                            placeholder="Search..."
                        />
                    </div>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none [color-scheme:dark]"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                        onClick={() => { setSubFilter('ALL'); setSearchQuery(''); setDateFilter(''); }}
                    >
                        Reset
                    </Button>
                </div>
            </div>
        );

        const OperationalTableView = () => (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                {FilterBar()}

                <div className="rounded-xl border border-white/5 overflow-hidden bg-slate-900/20">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-950/50 text-slate-500 border-b border-white/5">
                                <th className="py-3 pl-4 font-medium">Sheet ID</th>
                                <th className="py-3 font-medium">Supervisor</th>
                                <th className="py-3 font-medium">Shift / Dest</th>
                                <th className="py-3 font-medium">Duration</th>
                                <th className="py-3 font-medium">Date</th>
                                <th className="py-3 font-medium">Status</th>
                                <th className="py-3 pr-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSheets.length === 0 ? (
                                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No sheets found for this filter.</td></tr>
                            ) : filteredSheets.map(sheet => (
                                <tr key={sheet.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => {
                                    const target = (sheet.status === SheetStatus.COMPLETED || sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING || sheet.status === SheetStatus.LOCKED)
                                        ? `/sheets/loading/${sheet.id}`
                                        : `/sheets/staging/${sheet.id}`;
                                    navigate(target);
                                }}>
                                    <td className="py-3 pl-4 text-blue-400 font-mono text-xs">#{sheet.id.slice(0, 8)}</td>
                                    <td className="py-3 text-slate-200">
                                        {sheet.supervisorName}
                                        <div className="text-xs text-slate-500">{sheet.empCode}</div>
                                    </td>
                                    <td className="py-3 text-xs text-slate-400">
                                        {sheet.shift}
                                        <div className="text-xs text-slate-500">{sheet.destination || sheet.loadingDoc || '-'}</div>
                                    </td>
                                    <td className="py-3 text-xs text-slate-400 font-mono">{getDuration(sheet)}</td>
                                    <td className="py-3 text-slate-400">{new Date(sheet.date).toLocaleDateString()}</td>
                                    <td className="py-3">
                                        <Badge variant="outline" className={`
                                        ${sheet.status === SheetStatus.COMPLETED ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                                sheet.status.includes('REJECTED') || (sheet.comments && sheet.comments.length > 0 && sheet.status === SheetStatus.DRAFT) ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                                    sheet.status.includes('PENDING') || sheet.status === SheetStatus.LOCKED ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                                                        'text-slate-400 border-slate-700'}
                                    `}>
                                            {sheet.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </td>
                                    <td className="py-3 pr-4 text-right flex justify-end gap-2">
                                        {currentUser?.role === Role.ADMIN && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSheet(sheet.id);
                                                }}
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 opacity-60 group-hover:opacity-100"
                                                title="Delete Sheet (Admin Only)"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const target = (sheet.status === SheetStatus.COMPLETED || sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING || sheet.status === SheetStatus.LOCKED)
                                                    ? `/sheets/loading/${sheet.id}`
                                                    : `/sheets/staging/${sheet.id}`;
                                                navigate(target);
                                            }}
                                            title="View & Print"
                                        >
                                            <Printer size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const target = (sheet.status === SheetStatus.COMPLETED || sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING || sheet.status === SheetStatus.LOCKED)
                                                    ? `/sheets/loading/${sheet.id}`
                                                    : `/sheets/staging/${sheet.id}`;
                                                navigate(target);
                                            }}
                                        >
                                            Open
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );

        const DatabaseView = () => (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-white">Full Database</h3>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-950/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none w-40"
                                placeholder="Search..."
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                        >
                            <option value="ALL">All Status</option>
                            {Object.values(SheetStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none [color-scheme:dark]"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                            onClick={() => { setStatusFilter('ALL'); setSearchQuery(''); setDateFilter(''); }}
                        >
                            Reset
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-white/5 overflow-hidden bg-slate-900/20">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-950/50 text-slate-500 border-b border-white/5">
                                <th className="py-3 pl-4 font-medium">Sheet ID</th>
                                <th className="py-3 font-medium">Supervisor</th>
                                <th className="py-3 font-medium">Shift / Dest</th>
                                <th className="py-3 font-medium">Duration</th>
                                <th className="py-3 font-medium">Date</th>
                                <th className="py-3 font-medium">Status</th>
                                <th className="py-3 pr-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSheets.length === 0 ? (
                                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No sheets found matching filters.</td></tr>
                            ) : filteredSheets.map((sheet) => (
                                <tr key={sheet.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => {
                                    const target = (sheet.status === SheetStatus.COMPLETED || sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING || sheet.status === SheetStatus.LOCKED)
                                        ? `/sheets/loading/${sheet.id}`
                                        : `/sheets/staging/${sheet.id}`;
                                    navigate(target);
                                }}>
                                    <td className="py-3 pl-4 text-slate-300 font-mono text-xs">{sheet.id.slice(0, 8)}...</td>
                                    <td className="py-3 text-slate-200">{sheet.supervisorName}</td>
                                    <td className="py-3 text-slate-400">
                                        <Badge variant="secondary" className="bg-slate-800 text-slate-400">{sheet.shift}</Badge>
                                        <div className="text-xs text-slate-500 mt-1">{sheet.destination || '-'}</div>
                                    </td>
                                    <td className="py-3 text-xs text-slate-400 font-mono">{getDuration(sheet)}</td>
                                    <td className="py-3 text-slate-500">{new Date(sheet.date).toLocaleDateString()}</td>
                                    <td className="py-3">
                                        <Badge variant="outline" className={`
                                        ${sheet.status === SheetStatus.COMPLETED ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                                sheet.status === SheetStatus.LOCKED ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                                                    'text-slate-400 border-slate-700'}
                                    `}>
                                            {sheet.status?.replace(/_/g, ' ')}
                                        </Badge>
                                    </td>
                                    <td className="py-3 pr-4 text-right flex justify-end gap-2">
                                        {currentUser?.role === Role.ADMIN && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSheet(sheet.id);
                                                }}
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 opacity-60 group-hover:opacity-100"
                                                title="Delete Sheet (Admin Only)"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const target = (sheet.status === SheetStatus.COMPLETED || sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING || sheet.status === SheetStatus.LOCKED)
                                                    ? `/sheets/loading/${sheet.id}`
                                                    : `/sheets/staging/${sheet.id}`;
                                                navigate(target);
                                            }}
                                            title="View & Print"
                                        >
                                            <Printer size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const target = (sheet.status === SheetStatus.COMPLETED || sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING || sheet.status === SheetStatus.LOCKED)
                                                    ? `/sheets/loading/${sheet.id}`
                                                    : `/sheets/staging/${sheet.id}`;
                                                navigate(target);
                                            }}
                                        >
                                            Open
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );

        const UserManagement = () => (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">User Management</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="bg-slate-950/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none w-48"
                                placeholder="Search users..."
                            />
                        </div>
                        <Button onClick={() => setIsAddingUser(!isAddingUser)} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                            <UserPlus size={16} className="mr-2" />
                            {isAddingUser ? 'Cancel' : 'Add User'}
                        </Button>
                    </div>
                </div>

                {isAddingUser && (
                    <div className="bg-slate-950/50 border border-blue-500/20 p-6 rounded-xl mb-6">
                        <h4 className="text-sm font-semibold text-blue-200 mb-4">Create New User</h4>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Username <span className="text-red-400">*</span></label>
                                    <input required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-white placeholder-slate-600 focus:border-blue-500 outline-none" placeholder="e.g. johndoe" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Full Name</label>
                                    <input value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-white placeholder-slate-600 focus:border-blue-500 outline-none" placeholder="e.g. John Doe" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Email Address</label>
                                    <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-white placeholder-slate-600 focus:border-blue-500 outline-none" placeholder="john@example.com" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">EMP Code</label>
                                    <input value={newUser.empCode} onChange={e => setNewUser({ ...newUser, empCode: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-white placeholder-slate-600 focus:border-blue-500 outline-none" placeholder="e.g. EMP123" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Initial Password <span className="text-red-400">*</span></label>
                                    <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-white placeholder-slate-600 focus:border-blue-500 outline-none" placeholder="******" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs text-slate-400">Role</label>
                                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })} className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-white focus:border-blue-500 outline-none">
                                        {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={newUserLoading} className="bg-blue-600 hover:bg-blue-500 w-full md:w-auto">
                                    {newUserLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />} Save User
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="rounded-xl border border-white/5 overflow-hidden bg-slate-900/20">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-950/50 text-slate-500 border-b border-white/5">
                                <th className="py-3 pl-4 font-medium">User</th>
                                <th className="py-3 font-medium">Role</th>
                                <th className="py-3 font-medium">EMP</th>
                                <th className="py-3 font-medium">Status</th>
                                <th className="py-3 pr-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-500">No users found.</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-3 pl-4">
                                        <div className="font-medium text-slate-200">{user.fullName || user.username}</div>
                                        <div className="text-xs text-slate-500">@{user.username}</div>
                                    </td>
                                    <td className="py-3"><Badge variant="outline" className="text-xs border-white/10 bg-slate-950 text-slate-400">{user.role}</Badge></td>
                                    <td className="py-3 text-xs text-slate-400 font-mono">{user.empCode || '-'}</td>
                                    <td className="py-3">
                                        <button onClick={() => toggleUserStatus(user)} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${user.isApproved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}>
                                            {user.isApproved ? <CheckCircle size={10} /> : <XCircle size={10} />} {user.isApproved ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="py-3 pr-4 text-right flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-white/10" onClick={() => setPasswordResetUser(user)} title="Change Password">
                                            <KeyRound size={14} />
                                        </Button>
                                        {user.role !== Role.ADMIN && (
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteUser(user.id, user.username)} title="Delete User">
                                                <Trash2 size={14} />
                                            </Button>
                                        )}

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Password Reset Modal */}
                <AnimatePresence>
                    {passwordResetUser && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white">Reset Password</h3>
                                    <button onClick={() => setPasswordResetUser(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-sm text-slate-400">Enter new password for <strong>{passwordResetUser.username}</strong></p>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="New Password" autoFocus />
                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button variant="ghost" onClick={() => setPasswordResetUser(null)} className="text-slate-400">Cancel</Button>
                                        <Button onClick={handlePasswordReset} className="bg-blue-600 hover:bg-blue-500 text-white">Update Password</Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );

        return (
            <div className="p-8 space-y-8 pb-20">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        {currentUser?.role === Role.SHIFT_LEAD ? 'Shift Lead Dashboard' : 'Admin Dashboard'}
                    </h2>
                    <div className="flex justify-between items-end">
                        <p className="text-slate-400">
                            {currentUser?.role === Role.SHIFT_LEAD ? 'Manage approvals and workflow status.' : 'Central command for user management and system health.'}
                        </p>
                        {/* User Info / Role Badge */}
                        {currentUser && (
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <div className="text-sm font-bold text-white">{currentUser.username}</div>
                                    <div className="text-xs text-slate-500 uppercase">{currentUser.role}</div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                    {currentUser.username[0].toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Stats Cards */}
                {StatsCards()}

                {/* Dynamic Content Section */}
                <div className="min-h-[400px]">
                    {activeTab === 'users' && UserManagement()}
                    {(activeTab === 'staging_db' || activeTab === 'loading_db' || activeTab === 'shift_lead_db') && OperationalTableView()}
                    {activeTab === 'database' && DatabaseView()}
                </div>
            </div>
        );
    }
