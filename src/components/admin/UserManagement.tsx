import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { Role, User, SheetData } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Trash2, KeyRound, CheckCircle, XCircle, X, Loader2, FileText, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserManagementProps {
    users: User[];
    currentUser: User | null;
    refreshUsers: () => Promise<void>;
    sheets: SheetData[];
}

export function UserManagement({ users, currentUser, refreshUsers, sheets }: UserManagementProps) {
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    // --- User Management State ---
    const [userSearchQuery, setUserSearchQuery] = useState('');
    // Initialize filter from URL param if present, otherwise default to 'ALL'
    const [userFilter, setUserFilter] = useState<'ALL' | 'PENDING' | Role>(
        (searchParams.get('filter') as 'ALL' | 'PENDING' | Role) || 'ALL'
    );

    // Sync filter with URL
    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (filterParam) {
            setUserFilter(filterParam as any);
        } else {
            setUserFilter('ALL');
        }
    }, [searchParams]);

    // Helper to update filter and URL
    const setFilter = (newFilter: 'ALL' | 'PENDING' | Role) => {
        setUserFilter(newFilter);
        // Optional: Update URL to reflect change (keeps state shareable)
        setSearchParams(prev => {
            prev.set('filter', newFilter);
            return prev;
        });
    }

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
    const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');

    // Edit User State
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // --- Compute Last Active Logic ---
    const lastActiveMap = useMemo(() => {
        const map = new Map<string, number>();
        if (!sheets) return map;

        sheets.forEach(sheet => {
            // Check creation time
            if (sheet.supervisorName) {
                const t = new Date(sheet.createdAt).getTime();
                if (t > (map.get(sheet.supervisorName) || 0)) map.set(sheet.supervisorName, t);
            }

            // Check history logs
            if (sheet.history) {
                sheet.history.forEach(log => {
                    if (log.actor) {
                        const t = new Date(log.timestamp).getTime();
                        if (t > (map.get(log.actor) || 0)) map.set(log.actor, t);
                    }
                });
            }
        });
        return map;
    }, [sheets]);

    const getTimeAgo = (timestamp: number | undefined) => {
        if (!timestamp) return 'Never';
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };


    const filteredUsers = useMemo(() => {
        let res = users;
        // 1. Tab/Role Context Filter
        if (userFilter === 'PENDING') {
            res = res.filter(u => !u.isApproved);
        } else if (userFilter === Role.STAGING_SUPERVISOR) {
            res = res.filter(u => u.role === Role.STAGING_SUPERVISOR);
        } else if (userFilter === Role.LOADING_SUPERVISOR) {
            res = res.filter(u => u.role === Role.LOADING_SUPERVISOR);
        } else if (userFilter === Role.SHIFT_LEAD) {
            res = res.filter(u => u.role === Role.SHIFT_LEAD);
        }

        // 2. Search Query Filter
        return res.filter(user =>
            user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            (user.fullName && user.fullName.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
            user.role.toLowerCase().includes(userSearchQuery.toLowerCase())
        );
    }, [users, userSearchQuery, userFilter]);

    // --- Handlers ---
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const { error } = await supabase.from('users').update({ data: editingUser }).eq('id', editingUser.id);
            if (error) throw error;
            addToast('success', `User ${editingUser.username} updated successfully`);
            setEditingUser(null);
            await refreshUsers();
        } catch (error: any) {
            addToast('error', "Failed to update user: " + error.message);
        }
    };

    const handleDeleteUser = async (userToDelete: User) => {
        const { id: userId, username, isApproved, role } = userToDelete;

        // 1. Enforce Inactive Status (Blocking Alert)
        if (isApproved) {
            alert(`Cannot Delete Active User!\n\nPlease switch "${username}" to 'Inactive' first.\n(Click the status button in the table)`);
            return;
        }

        // 2. Confirmation (Blocking Confirm)
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete user "${username}"?\n\nThis action cannot be undone.`)) return;

        try {
            // SPECIAL HANDLING FOR ADMINS: Demote first to bypass potential RLS/Constraint
            if (role === Role.ADMIN) {
                console.log("[Delete] Target is Admin. Demoting to STAGING_SUPERVISOR first...");
                const { error: demoteError } = await supabase
                    .from('users')
                    .update({ data: { ...userToDelete, role: 'STAGING_SUPERVISOR', isApproved: false } })
                    .eq('id', userId);

                if (demoteError) {
                    console.warn("[Delete] Failed to demote admin. Proceeding with standard delete anyway...", demoteError);
                }
            }

            // Attempt Hard Delete - EXPLICITLY SELECT DATA TO VERIFY
            const { error, data: deleteData } = await supabase.from('users').delete().eq('id', userId).select();

            // Check for Silent Failure (0 rows deleted)
            const silentFailure = !error && (!deleteData || deleteData.length === 0);

            // If Hard Delete fails or does nothing (RLS), fallback to Soft Delete
            if (error || silentFailure) {
                console.warn(`Hard delete failed (Silent: ${silentFailure}). Attempting soft delete fallback...`, error);

                const { data: currentUserData } = await supabase.from('users').select('data').eq('id', userId).single();

                if (currentUserData) {
                    const softDeletedData = {
                        ...currentUserData.data,
                        isDeleted: true,
                        role: 'STAGING_SUPERVISOR', // Ensure role is not ADMIN in the tombstone
                        username: `${username}_deleted_${Date.now()}`
                    };

                    const { error: softError, data: softData } = await supabase
                        .from('users')
                        .update({ data: softDeletedData })
                        .eq('id', userId)
                        .select();

                    // Check if Soft Delete ALSO failed silently
                    if (softError || !softData || softData.length === 0) {
                        const reason = softError?.message || "Permission Denied (0 rows updated)";
                        console.error("Soft delete also failed", reason);
                        alert(`DELETE FAILED\n\nCould not delete user. Database permissions might be restricted.\n\nReason: ${reason}`);
                        return;
                    }
                } else {
                    alert(`DELETE FAILED\n\nUser record not found.`);
                    return;
                }
            }

            // Success feedback
            addToast('success', `User ${username} deleted.`);
            await refreshUsers();

        } catch (error: any) {
            console.error("Delete failed completely", error);
            // Blocking Alert for Unexpected Error
            alert(`SYSTEM ERROR\n\nFailed to delete user: ${error.message || "Unknown error"}`);
        }
    };

    const toggleUserStatus = async (user: User) => {
        try {
            const updatedUser = { ...user, isApproved: !user.isApproved };

            // Explicitly select data to confirm row was touched
            const { data, error } = await supabase
                .from('users')
                .update({ data: updatedUser })
                .eq('id', user.id)
                .select();

            if (error) {
                console.error("[RCA] Update Error:", error);
                throw error;
            }

            // RCA: Check if any row was actually updated
            if (!data || data.length === 0) {
                console.error("[RCA] Silent Failure: No rows updated. Likely RLS blocking.");
                throw new Error("Permission Denied: Database policy prevented this change (0 rows updated).");
            }

            addToast('success', `User ${user.username} is now ${updatedUser.isApproved ? 'Active' : 'Inactive'}`);
            await refreshUsers();
        } catch (error: any) {
            console.error("[RCA] Toggle exception:", error);
            alert(`STATUS CHANGE FAILED\n\nReason: ${error.message || "Unknown Error"}\n\nTroubleshooting: You might not have permission to modify this user.`);
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


    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">User Management</h3>

                {/* User Filter Tabs */}
                <div className="flex bg-muted p-1 rounded-lg gap-1 overflow-x-auto">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${userFilter === 'ALL' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${userFilter === 'PENDING' ? 'bg-background shadow-sm text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Pending
                    </button>
                    <div className="w-px bg-border my-1" />
                    <button
                        onClick={() => setFilter(Role.STAGING_SUPERVISOR)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${userFilter === Role.STAGING_SUPERVISOR ? 'bg-background shadow-sm text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Staging
                    </button>
                    <button
                        onClick={() => setFilter(Role.LOADING_SUPERVISOR)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${userFilter === Role.LOADING_SUPERVISOR ? 'bg-background shadow-sm text-orange-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Loading
                    </button>
                    <button
                        onClick={() => setFilter(Role.SHIFT_LEAD)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${userFilter === Role.SHIFT_LEAD ? 'bg-background shadow-sm text-purple-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Shift Lead
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none w-64"
                        placeholder="Search users..."
                    />
                </div>
                <Button onClick={() => setIsAddingUser(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <UserPlus size={16} /> Add User
                </Button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                    <thead>
                        <tr className="bg-muted text-muted-foreground border-b border-border sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <th className="py-3 pl-4 font-medium">User</th>
                            <th className="py-3 font-medium">Role</th>
                            <th className="py-3 font-medium">EMP</th>
                            <th className="py-3 font-medium">Last Active</th>
                            <th className="py-3 font-medium">Status</th>
                            <th className="py-3 pr-4 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No users found.</td></tr>
                        ) : filteredUsers.map((user) => {
                            const lastActive = lastActiveMap.get(user.username);
                            return (
                                <tr key={user.id} className="group hover:bg-muted/50 transition-colors">
                                    <td className="py-3 pl-4 font-medium text-foreground">{user.fullName} <div className="text-xs text-muted-foreground font-normal sm:hidden">{user.username}</div></td>
                                    <td className="py-3">
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            {user.role.replace(/_/g, ' ')}
                                        </Badge>
                                    </td>
                                    <td className="py-3 text-muted-foreground text-xs">{user.empCode || '-'}</td>
                                    <td className="py-3 text-muted-foreground text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className={lastActive ? "text-emerald-500" : "text-slate-300"} />
                                            {getTimeAgo(lastActive)}
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <button
                                            onClick={() => toggleUserStatus(user)}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors border ${user.isApproved
                                                ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20'
                                                : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20'
                                                }`}
                                        >
                                            {user.isApproved ? (
                                                <> <CheckCircle size={12} /> Active </>
                                            ) : (
                                                <> <XCircle size={12} /> Inactive </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="py-3 pr-4 text-right flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                            onClick={() => setPasswordResetUser(user)}
                                            title="Reset Password"
                                        >
                                            <KeyRound size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                            onClick={() => setEditingUser(user)}
                                            title="Edit User"
                                        >
                                            <FileText size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteUser(user)}
                                            title="Delete User"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* NEW USER MODAL */}
            {isAddingUser && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
                            <h3 className="font-bold text-lg">Add New User</h3>
                            <button onClick={() => setIsAddingUser(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-4 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                                    className="w-full bg-background border border-border p-2 rounded-lg"
                                >
                                    {Object.values(Role).map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Username *</label>
                                    <input required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="w-full bg-background border border-border p-2 rounded-lg" placeholder="jdoe" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Full Name</label>
                                    <input value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} className="w-full bg-background border border-border p-2 rounded-lg" placeholder="John Doe" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Password *</label>
                                    <input required type="text" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full bg-background border border-border p-2 rounded-lg" placeholder="Secret123" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Emp Code</label>
                                    <input value={newUser.empCode} onChange={e => setNewUser({ ...newUser, empCode: e.target.value })} className="w-full bg-background border border-border p-2 rounded-lg" placeholder="EMP001" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Email</label>
                                <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full bg-background border border-border p-2 rounded-lg" placeholder="john@example.com" />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsAddingUser(false)}>Cancel</Button>
                                <Button type="submit" disabled={newUserLoading} className="bg-primary text-primary-foreground">
                                    {newUserLoading && <Loader2 className="animate-spin mr-2" size={16} />} Create User
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* PASSWORD RESET MODAL */}
            {passwordResetUser && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-xl shadow-2xl p-6">
                        <h3 className="font-bold text-lg mb-2">Reset Password</h3>
                        <p className="text-sm text-slate-500 mb-4">Enter new password for <strong>{passwordResetUser.username}</strong></p>
                        <form onSubmit={handlePasswordReset}>
                            <input
                                type="text"
                                className="w-full border p-2 rounded mb-4 bg-slate-50 dark:bg-slate-950 dark:border-slate-800"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setPasswordResetUser(null)}>Cancel</Button>
                                <Button type="submit">Update Password</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {editingUser && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <div className="bg-background border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileText size={18} className="text-primary" /> Edit User
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-5 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Username</label>
                                    <input
                                        value={editingUser.username}
                                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                        className="w-full bg-background border border-border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Full Name</label>
                                    <input
                                        value={editingUser.fullName}
                                        onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                                        className="w-full bg-background border border-border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Role Assignment</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                                    className="w-full bg-background border border-border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                                >
                                    {Object.values(Role).map(r => (
                                        <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Employee Code</label>
                                    <input
                                        value={editingUser.empCode}
                                        onChange={(e) => setEditingUser({ ...editingUser, empCode: e.target.value })}
                                        className="w-full bg-background border border-border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        value={editingUser.email}
                                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                        className="w-full bg-background border border-border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end border-t border-border mt-2">
                                <Button type="button" variant="outline" onClick={() => setEditingUser(null)} className="border-border text-foreground hover:bg-muted">Cancel</Button>
                                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 px-6">Save Changes</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


