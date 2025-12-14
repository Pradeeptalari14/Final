import { useState } from 'react';
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/contexts/ToastContext";
import { Role } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, Plus, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
    const { devRole, setDevRole, refreshUsers, users, settings, updateSettings } = useData();
    const { addToast } = useToast();

    // Add/Edit User Form State
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserLoading, setNewUserLoading] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: Role.STAGING_SUPERVISOR
    });

    const handleEditUser = (user: any) => {
        setNewUser({
            username: user.username,
            email: user.email || '',
            password: '', // Don't show existing password
            role: user.role
        });
        setEditingUserId(user.id);
        setIsAddingUser(true);
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) return;

        try {
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) throw error;
            addToast('success', `User ${username} deleted successfully.`);
            await refreshUsers();
        } catch (error: any) {
            addToast('error', error.message || "Failed to delete user");
        }
    };

    const handleApproveUser = async (userId: string, username: string) => {
        try {
            const { error } = await supabase.from('users').update({
                data: { ...users.find(u => u.id === userId), isApproved: true }
            }).eq('id', userId);

            if (error) throw error;
            addToast('success', `User ${username} approved successfully.`);
            await refreshUsers();
        } catch (error: any) {
            addToast('error', error.message || "Failed to approve user");
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewUserLoading(true);

        try {
            // Validate
            if (!newUser.username) {
                throw new Error("Username is required.");
            }
            if (!editingUserId && !newUser.password) {
                throw new Error("Password is required for new users.");
            }

            const userData = {
                username: newUser.username,
                email: newUser.email,
                fullName: newUser.username, // Default to username for now
                role: newUser.role,
                isApproved: true,
                ...(newUser.password ? { password: newUser.password } : {}) // Only update password if provided
            };

            if (editingUserId) {
                // UPDATE Existing User
                const existing = users.find(u => u.id === editingUserId);
                const updatedData = { ...existing, ...userData };

                const { error } = await supabase.from('users').update({
                    data: updatedData
                }).eq('id', editingUserId);

                if (error) throw error;
                addToast('success', `User ${newUser.username} updated successfully!`);

            } else {
                // CREATE New User
                const newId = crypto.randomUUID();
                const fullData = { ...userData, id: newId, password: newUser.password }; // Ensure password is set
                const { error } = await supabase.from('users').insert({
                    id: newId,
                    data: fullData
                });
                if (error) throw error;
                addToast('success', `User ${newUser.username} created successfully!`);
            }

            await refreshUsers();
            setIsAddingUser(false);
            setEditingUserId(null);
            setNewUser({ username: '', email: '', password: '', role: Role.STAGING_SUPERVISOR });

        } catch (error: any) {
            addToast('error', error.message || "Failed to save user");
        } finally {
            setNewUserLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-6 pb-20">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Settings</h2>

            {/* PERSONALIZATION SECTION */}
            <Card className="border-border bg-card/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Personalization <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">New</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Theme & Accent */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Appearance</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-foreground font-medium">Theme Mode</div>
                                    <div className="text-xs text-muted-foreground">Light or Dark interface</div>
                                </div>
                                <div className="flex bg-muted p-1 rounded-lg border border-border">
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ theme: 'light' })}
                                        className={`px-3 py-1.5 rounded-md text-xs transition-all ${settings?.theme === 'light' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >Light</button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ theme: 'dark' })}
                                        className={`px-3 py-1.5 rounded-md text-xs transition-all ${settings?.theme === 'dark' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >Dark</button>
                                </div>
                            </div>

                            <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-foreground font-medium">Accent Color</div>
                                    <div className="text-xs text-muted-foreground">Primary highlight color</div>
                                </div>
                                <div className="flex gap-2">
                                    {['blue', 'emerald', 'purple'].map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => updateSettings({ accentColor: color as any })}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${settings?.accentColor === color ? 'border-primary scale-110' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : '#a855f7' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* View Options */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">View Options</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {/* Density */}
                            <div className="bg-card p-4 rounded-lg border border-border">
                                <div className="mb-3">
                                    <div className="text-sm text-foreground font-medium">Density</div>
                                    <div className="text-xs text-muted-foreground">Spacing in tables/lists</div>
                                </div>
                                <div className="flex bg-muted p-1 rounded-lg border border-border w-full">
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ density: 'compact' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.density === 'compact' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >Compact</button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ density: 'comfortable' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.density === 'comfortable' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >Comfy</button>
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="bg-card p-4 rounded-lg border border-border">
                                <div className="mb-3">
                                    <div className="text-sm text-foreground font-medium">Text Size</div>
                                    <div className="text-xs text-muted-foreground">Global font scaling</div>
                                </div>
                                <div className="flex bg-muted p-1 rounded-lg border border-border w-full">
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ fontSize: 'small' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.fontSize === 'small' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >A-</button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ fontSize: 'medium' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.fontSize === 'medium' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >A</button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ fontSize: 'large' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.fontSize === 'large' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >A+</button>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="bg-card p-4 rounded-lg border border-border">
                                <div className="mb-3">
                                    <div className="text-sm text-foreground font-medium">Sidebar</div>
                                    <div className="text-xs text-muted-foreground">Default menu state</div>
                                </div>
                                <div className="flex bg-muted p-1 rounded-lg border border-border w-full">
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ sidebarCollapsed: false })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${!settings?.sidebarCollapsed ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >Expanded</button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ sidebarCollapsed: true })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.sidebarCollapsed ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >Collapsed</button>
                                </div>
                            </div>

                            {/* Default Tab */}
                            <div className="bg-card p-4 rounded-lg border border-border">
                                <div className="mb-3">
                                    <div className="text-sm text-foreground font-medium">Default Tab</div>
                                    <div className="text-xs text-muted-foreground">Admin landing page</div>
                                </div>
                                <select
                                    className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
            <Card className="border-border bg-card opacity-75 hover:opacity-100 transition-opacity">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        Developer Tools
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
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
                                        ? 'bg-primary/20 border-primary text-primary shadow-sm'
                                        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:border-border'
                                    }
                                `}
                            >
                                <div className="font-semibold">{role.replace(/_/g, ' ')}</div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ADMIN AREA: USER MANAGEMENT - REMOVED AS PER REQUEST (Now in Dashboard) */}
        </div>
    );
}
