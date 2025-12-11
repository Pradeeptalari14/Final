import { useState } from 'react';
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { Role } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { UserPlus, Save, Loader2, Users, Shield, Activity, Database, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
    const { users, sheets, loading, refreshUsers } = useData();
    const { addToast } = useToast();

    // User Management State
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserLoading, setNewUserLoading] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: Role.VIEWER
    });

    // Stats
    const totalSheets = sheets.length;
    const activeUsers = users.filter(u => u.isApproved).length;

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewUserLoading(true);

        try {
            if (!newUser.username || !newUser.password) {
                throw new Error("Username and Password are required.");
            }

            const userData = {
                id: crypto.randomUUID(),
                username: newUser.username,
                email: newUser.email,
                fullName: newUser.username,
                role: newUser.role,
                isApproved: true,
                password: newUser.password
            };

            const { error } = await supabase.from('users').insert({
                id: userData.id,
                data: userData
            });

            if (error) throw error;

            addToast('success', `User ${newUser.username} created successfully!`);
            await refreshUsers();
            setIsAddingUser(false);
            setNewUser({ username: '', email: '', password: '', role: Role.VIEWER });

        } catch (error: any) {
            addToast('error', error.message || "Failed to create user");
        } finally {
            setNewUserLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Loading Admin Dashboard...</div>;

    return (
        <div className="p-8 space-y-8 pb-20">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h2>
                <p className="text-slate-400">Central command for user management and system health.</p>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-white/5 bg-slate-900/40">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{activeUsers}</div>
                            <div className="text-sm text-slate-400">Active Users</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/5 bg-slate-900/40">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                            <Database size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{totalSheets}</div>
                            <div className="text-sm text-slate-400">Total Sheets</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/5 bg-slate-900/40">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <Activity size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">Healthy</div>
                            <div className="text-sm text-slate-400">System Status</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Management Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-white/5 bg-slate-900/40">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Shield size={18} className="text-blue-400" />
                                    User Management
                                </CardTitle>
                                <p className="text-sm text-slate-500">Manage access and roles.</p>
                            </div>
                            <Button
                                onClick={() => setIsAddingUser(!isAddingUser)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-500 text-white"
                            >
                                <UserPlus size={16} className="mr-2" />
                                {isAddingUser ? 'Cancel' : 'Add User'}
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Add User Form */}
                            {isAddingUser && (
                                <div className="bg-slate-950/50 border border-blue-500/20 p-4 rounded-lg animate-in fade-in slide-in-from-top-2 mb-6">
                                    <h4 className="text-sm font-semibold text-blue-200 mb-4">Create New User</h4>
                                    <form onSubmit={handleAddUser} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-400">Username</label>
                                                <input
                                                    required
                                                    value={newUser.username}
                                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                                    className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                                                    placeholder="jdoe"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-400">Email</label>
                                                <input
                                                    type="email"
                                                    value={newUser.email}
                                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                                    className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                                                    placeholder="jdoe@unicharm.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-400">Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={newUser.password}
                                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                    className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-400">Role</label>
                                                <select
                                                    value={newUser.role}
                                                    onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}
                                                    className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                                >
                                                    {Object.values(Role).map(r => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <Button type="submit" disabled={newUserLoading} className="bg-blue-600 hover:bg-blue-500">
                                                {newUserLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                                                Save User
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="rounded-xl border border-white/5 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-950/50 text-slate-500 border-b border-white/5">
                                            <th className="py-3 pl-4 font-medium">User</th>
                                            <th className="py-3 font-medium">Role</th>
                                            <th className="py-3 font-medium">Status</th>
                                            <th className="py-3 pr-4 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.length === 0 ? (
                                            <tr><td colSpan={4} className="py-8 text-center text-slate-500">No users found.</td></tr>
                                        ) : users.map((user) => (
                                            <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="py-3 pl-4">
                                                    <div className="font-medium text-slate-200">{user.username}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </td>
                                                <td className="py-3">
                                                    <Badge variant="outline" className="text-xs border-white/10 bg-slate-950 text-slate-400">
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="py-3">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-slate-500 hover:text-white"
                                                        onClick={() => addToast('info', 'Edit User feature coming soon')}
                                                    >
                                                        Edit
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Side Panel: Notifications / Alerts */}
                <div className="space-y-6">
                    <Card className="border-white/5 bg-slate-900/40 h-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertCircle size={18} className="text-yellow-400" />
                                Action Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 rounded-lg bg-slate-950/50 border border-white/5 text-center text-slate-500 text-sm italic">
                                No pending admin actions.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
