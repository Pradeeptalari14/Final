import { useState } from 'react';
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { Role } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, Plus } from 'lucide-react';

export default function SettingsPage() {
    const { devRole, setDevRole, refreshUsers, users, settings, updateSettings } = useData();
    const { addToast } = useToast();

    // Add User Form State
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserLoading, setNewUserLoading] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: Role.STAGING_SUPERVISOR
    });

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewUserLoading(true);

        try {
            // Validate
            if (!newUser.username || !newUser.password) {
                throw new Error("Username and Password are required.");
            }

            // 1. Create User in Supabase Auth (Simulated or Real)
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
            setNewUser({ username: '', email: '', password: '', role: Role.STAGING_SUPERVISOR });

        } catch (error: any) {
            addToast('error', error.message || "Failed to create user");
        } finally {
            setNewUserLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-6 pb-20">
            <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>

            {/* PERSONALIZATION SECTION */}
            <Card className="border-white/5 bg-slate-900/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Personalization <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">New</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Theme & Accent */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Appearance</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-950/30 p-4 rounded-lg border border-white/5 flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-slate-200 font-medium">Theme Mode</div>
                                    <div className="text-xs text-slate-500">Light or Dark interface</div>
                                </div>
                                <div className="flex bg-slate-900 p-1 rounded-lg border border-white/5">
                                    <button
                                        onClick={() => updateSettings({ theme: 'light' })}
                                        className={`px-3 py-1.5 rounded-md text-xs transition-all ${settings?.theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >Light</button>
                                    <button
                                        onClick={() => updateSettings({ theme: 'dark' })}
                                        className={`px-3 py-1.5 rounded-md text-xs transition-all ${settings?.theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >Dark</button>
                                </div>
                            </div>

                            <div className="bg-slate-950/30 p-4 rounded-lg border border-white/5 flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-slate-200 font-medium">Accent Color</div>
                                    <div className="text-xs text-slate-500">Primary highlight color</div>
                                </div>
                                <div className="flex gap-2">
                                    {['blue', 'emerald', 'purple'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => updateSettings({ accentColor: color as any })}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${settings?.accentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : '#a855f7' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* View Options */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">View Options</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {/* Density */}
                            <div className="bg-slate-950/30 p-4 rounded-lg border border-white/5">
                                <div className="mb-3">
                                    <div className="text-sm text-slate-200 font-medium">Density</div>
                                    <div className="text-xs text-slate-500">Spacing in tables/lists</div>
                                </div>
                                <div className="flex bg-slate-900 p-1 rounded-lg border border-white/5 w-full">
                                    <button
                                        onClick={() => updateSettings({ density: 'compact' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.density === 'compact' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >Compact</button>
                                    <button
                                        onClick={() => updateSettings({ density: 'comfortable' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.density === 'comfortable' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >Comfy</button>
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="bg-slate-950/30 p-4 rounded-lg border border-white/5">
                                <div className="mb-3">
                                    <div className="text-sm text-slate-200 font-medium">Text Size</div>
                                    <div className="text-xs text-slate-500">Global font scaling</div>
                                </div>
                                <div className="flex bg-slate-900 p-1 rounded-lg border border-white/5 w-full">
                                    <button
                                        onClick={() => updateSettings({ fontSize: 'small' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.fontSize === 'small' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >A-</button>
                                    <button
                                        onClick={() => updateSettings({ fontSize: 'medium' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.fontSize === 'medium' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >A</button>
                                    <button
                                        onClick={() => updateSettings({ fontSize: 'large' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.fontSize === 'large' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >A+</button>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="bg-slate-950/30 p-4 rounded-lg border border-white/5">
                                <div className="mb-3">
                                    <div className="text-sm text-slate-200 font-medium">Sidebar</div>
                                    <div className="text-xs text-slate-500">Default menu state</div>
                                </div>
                                <div className="flex bg-slate-900 p-1 rounded-lg border border-white/5 w-full">
                                    <button
                                        onClick={() => updateSettings({ sidebarCollapsed: false })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${!settings?.sidebarCollapsed ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >Expanded</button>
                                    <button
                                        onClick={() => updateSettings({ sidebarCollapsed: true })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.sidebarCollapsed ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >Collapsed</button>
                                </div>
                            </div>

                            {/* Default Tab */}
                            <div className="bg-slate-950/30 p-4 rounded-lg border border-white/5">
                                <div className="mb-3">
                                    <div className="text-sm text-slate-200 font-medium">Default Tab</div>
                                    <div className="text-xs text-slate-500">Admin landing page</div>
                                </div>
                                <select
                                    className="w-full bg-slate-900 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={settings?.defaultTab || 'staging_db'}
                                    onChange={(e) => updateSettings({ defaultTab: e.target.value })}
                                >
                                    <option value="staging_db">Staging</option>
                                    <option value="loading_db">Loading</option>
                                    <option value="shift_lead_db">Shift Lead</option>
                                    <option value="user_management">Users</option>
                                </select>
                            </div>

                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* DEVELOPER TOOLS (Compacted) */}
            <Card className="border-white/5 bg-slate-900/40 opacity-75 hover:opacity-100 transition-opacity">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-slate-500">
                        Developer Tools
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-slate-400">
                        Simulate roles to verify permissions across the app.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {Object.values(Role).map((role) => (
                            <button
                                key={role}
                                onClick={() => setDevRole(role)}
                                className={`
                                    p-3 rounded-lg border text-left transition-all text-xs
                                    ${devRole === role
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-sm'
                                        : 'bg-slate-950/50 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10'
                                    }
                                `}
                            >
                                <div className="font-semibold">{role.replace(/_/g, ' ')}</div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ADMIN AREA: USER MANAGEMENT */}
            {(devRole === Role.ADMIN) && (
                <Card className="border-emerald-500/20 bg-emerald-950/10">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-emerald-400">Admin Area: User Management</CardTitle>
                        <Button
                            onClick={() => setIsAddingUser(!isAddingUser)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            <Plus size={16} className="mr-2" />
                            {isAddingUser ? 'Cancel' : 'Add User'}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Add User Form */}
                        {isAddingUser && (
                            <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-sm font-semibold text-emerald-200 mb-4">Create New User</h4>
                                <form onSubmit={handleAddUser} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-slate-400">Username</label>
                                            <input
                                                required
                                                value={newUser.username}
                                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                                className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white"
                                                placeholder="jdoe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-slate-400">Email</label>
                                            <input
                                                type="email"
                                                value={newUser.email}
                                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                                className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white"
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
                                                className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-slate-400">Role</label>
                                            <select
                                                value={newUser.role}
                                                onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}
                                                className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white"
                                            >
                                                {Object.values(Role).map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={newUserLoading} className="bg-emerald-600 hover:bg-emerald-500">
                                            {newUserLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                                            Save User
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-500 border-b border-white/5">
                                        <th className="pb-2 pl-2">User</th>
                                        <th className="pb-2">Email</th>
                                        <th className="pb-2">Role</th>
                                        <th className="pb-2">Status</th>
                                        <th className="pb-2 text-right pr-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.length === 0 ? (
                                        <tr><td colSpan={5} className="py-4 text-center text-slate-500">No users found.</td></tr>
                                    ) : users.map((user) => (
                                        <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-3 pl-2 font-medium text-slate-200">{user.username}</td>
                                            <td className="py-3 text-slate-400">{user.email || '-'}</td>
                                            <td className="py-3"><Badge variant="outline" className="text-xs border-white/10">{user.role}</Badge></td>
                                            <td className="py-3"><span className="text-emerald-400 text-xs">Active</span></td>
                                            <td className="py-3 text-right pr-2">
                                                <button
                                                    className="text-slate-500 hover:text-white transition-colors text-xs"
                                                    onClick={() => addToast('info', 'Edit User feature coming soon')}
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
