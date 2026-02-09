import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';
import { Role, AppSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, User, Check, AlertCircle, X } from 'lucide-react';
import { t } from '@/lib/i18n';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

export default function SettingsPage() {
    const { currentUser } = useData();
    const { devRole, setDevRole, settings, updateSettings } = useAppState();

    // Add/Edit User Form State

    // State cleaned

    return (
        <div className="p-4 md:p-6 space-y-6 pb-20">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
                {t('settings', settings.language)}
            </h2>

            {/* PROFILE SECTION */}
            <ProfileSection />

            {/* PERSONALIZATION SECTION */}
            <Card className="border-border bg-card/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {t('personalization', settings.language)}{' '}
                        <Badge
                            variant="secondary"
                            className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                        >
                            New
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Theme & Accent */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('appearance', settings.language)}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-foreground font-medium">
                                        {t('theme_mode', settings.language)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {t('theme_desc', settings.language)}
                                    </div>
                                </div>
                                <div className="flex bg-muted p-1 rounded-lg border border-border">
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ theme: 'light' })}
                                        className={`px-3 py-1.5 rounded-md text-xs transition-all ${settings?.theme === 'light' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('light', settings.language)}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ theme: 'dark' })}
                                        className={`px-3 py-1.5 rounded-md text-xs transition-all ${settings?.theme === 'dark' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('dark', settings.language)}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-foreground font-medium">
                                        {t('accent_color', settings.language)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {t('accent_desc', settings.language)}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {['blue', 'emerald', 'purple'].map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() =>
                                                updateSettings({ accentColor: color as AppSettings['accentColor'] })
                                            }
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${settings?.accentColor === color ? 'border-primary scale-110' : 'border-transparent hover:scale-105'}`}
                                            style={{
                                                backgroundColor:
                                                    color === 'blue'
                                                        ? '#3b82f6'
                                                        : color === 'emerald'
                                                            ? '#10b981'
                                                            : '#a855f7'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* View Options */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('view_options', settings.language)}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {/* Density */}
                            <div className="bg-card p-4 rounded-lg border border-border">
                                <div className="mb-3">
                                    <div className="text-sm text-foreground font-medium">
                                        {t('density', settings.language)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {t('density_desc', settings.language)}
                                    </div>
                                </div>
                                <div className="flex bg-muted p-1 rounded-lg border border-border w-full">
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ density: 'compact' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.density === 'compact' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('compact', settings.language)}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ density: 'comfortable' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.density === 'comfortable' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('comfortable', settings.language)}
                                    </button>
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="bg-card p-4 rounded-lg border border-border">
                                <div className="mb-3">
                                    <div className="text-sm text-foreground font-medium">
                                        {t('text_size', settings.language)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {t('text_size_desc', settings.language)}
                                    </div>
                                </div>
                                <div className="flex bg-muted p-1 rounded-lg border border-border w-full">
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ fontSize: 'small' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.fontSize === 'small' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        A-
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ fontSize: 'medium' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.fontSize === 'medium' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        A
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ fontSize: 'large' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.fontSize === 'large' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        A+
                                    </button>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="bg-card p-4 rounded-lg border border-border">
                                <div className="mb-3">
                                    <div className="text-sm text-foreground font-medium">
                                        {t('sidebar', settings.language)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {t('sidebar_collapsed_desc', settings.language)}
                                    </div>
                                </div>
                                <div className="flex bg-muted p-1 rounded-lg border border-border w-full">
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ sidebarCollapsed: false })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${!settings?.sidebarCollapsed ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('expanded', settings.language)}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ sidebarCollapsed: true })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.sidebarCollapsed ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('collapsed', settings.language)}
                                    </button>
                                </div>
                            </div>

                            {/* Language */}
                            <div className="bg-card p-4 rounded-lg border border-border">
                                <div className="mb-3">
                                    <div className="text-sm text-foreground font-medium">
                                        {t('language', settings.language)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {t('language_desc', settings.language)}
                                    </div>
                                </div>
                                <div className="flex bg-muted p-1 rounded-lg border border-border w-full">
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ language: 'en' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.language === 'en' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('english', settings.language)}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ language: 'jp' })}
                                        className={`flex-1 py-1.5 rounded-md text-xs transition-all ${settings?.language === 'jp' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('japanese', settings.language)}
                                    </button>
                                </div>
                            </div>

                            {/* Default Tab */}
                            <div className="bg-card p-4 rounded-lg border border-border">
                                <div className="mb-3">
                                    <div className="text-sm text-foreground font-medium">
                                        {t('default_tab', settings.language)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {t('default_tab_desc', settings.language)}
                                    </div>
                                </div>
                                <select
                                    className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={settings?.defaultTab || 'staging_db'}
                                    onChange={(e) => updateSettings({ defaultTab: e.target.value })}
                                >
                                    <option value="staging_db">
                                        {t('staging', settings.language)}
                                    </option>
                                    <option value="loading_db">
                                        {t('loading', settings.language)}
                                    </option>
                                    <option value="shift_lead_db">
                                        {t('shift_lead', settings.language)}
                                    </option>
                                    <option value="user_management">
                                        {t('users', settings.language)}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* DEVELOPER TOOLS (Compacted) - ADMIN ONLY - DEV ONLY */}
            {currentUser?.role === Role.ADMIN && import.meta.env.DEV && (
                <Card className="border-border bg-card opacity-75 hover:opacity-100 transition-opacity">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                            {t('developer_tools', settings.language)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                            {t('developer_tools_desc', settings.language)}
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
            )}

            {/* ADMIN AREA: USER MANAGEMENT - REMOVED AS PER REQUEST (Now in Dashboard) */}
        </div>
    );
}

function ProfileSection() {
    const { currentUser, updateUser, setCurrentUser } = useData();
    const { addToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: currentUser?.fullName || '',
        photoURL: currentUser?.photoURL || ''
    });

    useEffect(() => {
        if (currentUser) {
            setFormData({
                fullName: currentUser.fullName || '',
                photoURL: currentUser.photoURL || ''
            });
        }
    }, [currentUser]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({ ...prev, photoURL: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const updatedUser = {
                ...currentUser,
                fullName: formData.fullName,
                photoURL: formData.photoURL
            };
            await updateUser(updatedUser);
            setCurrentUser(updatedUser);
            addToast('success', 'Profile updated successfully');
            setIsEditing(false);
        } catch {
            addToast('error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return null;

    return (
        <Card className="border-border bg-card/40 overflow-hidden shadow-2xl">
            <CardHeader className="bg-muted/30 border-b border-border">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        Profile Information
                    </CardTitle>
                    {!isEditing ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-bold uppercase tracking-wider h-8"
                        >
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        fullName: currentUser.fullName || '',
                                        photoURL: currentUser.photoURL || ''
                                    });
                                }}
                                disabled={loading}
                                className="text-xs font-bold uppercase tracking-wider h-8"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleSave}
                                disabled={loading}
                                className="text-xs font-bold uppercase tracking-wider h-8 bg-indigo-600 hover:bg-indigo-700"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />}
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start text-center md:text-left">
                    {/* Avatar Upload */}
                    <div className="relative group shrink-0">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-transform hover:scale-105">
                            {formData.photoURL ? (
                                <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="text-slate-300" />
                            )}
                        </div>
                        {isEditing && (
                            <>
                                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full z-10">
                                    <Camera size={24} />
                                    <span className="text-[10px] font-bold uppercase mt-1">Change</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                </label>
                                {formData.photoURL && (
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, photoURL: '' }))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors z-20"
                                        title="Remove Photo"
                                        type="button"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex-1 space-y-3 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                    Username
                                </label>
                                <div className="p-2 bg-muted/50 border border-border rounded-lg text-sm font-medium text-slate-500 flex items-center gap-2">
                                    @{currentUser.username}
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4 bg-slate-100 border-slate-200 text-slate-500">
                                        Read-only
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                    Role
                                </label>
                                <div className="p-2 bg-muted/50 border border-border rounded-lg text-sm font-medium text-slate-500 flex items-center gap-2 uppercase">
                                    {currentUser.role.replace(/_/g, ' ')}
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                    Full Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                        className="w-full bg-background border border-border p-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Enter your full name"
                                    />
                                ) : (
                                    <div className="p-2 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg text-sm font-semibold">
                                        {currentUser.fullName || 'Not set'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                    Employee Code
                                </label>
                                <div className="p-2 bg-muted/50 border border-border rounded-lg text-sm font-medium text-slate-500">
                                    {currentUser.empCode || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex gap-3 items-start animate-in slide-in-from-bottom-2">
                        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Heads up!</p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-1">
                                Updating your profile info will affect how you&apos;re identified in check sheets and performance reports.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
