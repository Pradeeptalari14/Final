import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, X, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Role, AppSettings } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { t } from '@/lib/i18n';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => Promise<void>;
    settings: AppSettings;
}

import { useData } from '@/contexts/DataContext';

export const AddUserModal: React.FC<AddUserModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    settings
}) => {
    const { addToast } = useToast();
    const { currentUser } = useData();
    const [loading, setLoading] = useState(false);

    // Password Visibility State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    // Filter Roles: Only SUPER_ADMIN can create another SUPER_ADMIN
    const availableRoles = Object.values(Role).filter(r => {
        if (currentUser?.role !== Role.SUPER_ADMIN && r === Role.SUPER_ADMIN) {
            return false;
        }
        return true;
    });

    const initialUserState = {
        username: '',
        fullName: '',
        empCode: '',
        email: '',
        password: '',
        role: '' as Role,
        photoURL: ''
    };

    const [newUser, setNewUser] = useState(initialUserState);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Reset form when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setNewUser(initialUserState);
            setConfirmPassword('');
            setAvatarPreview(null);
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isOpen]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAvatarPreview(base64String);
                setNewUser(prev => ({ ...prev, photoURL: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!newUser.username || !newUser.password)
                throw new Error('Username and Password are required.');
            if (!newUser.role) throw new Error('Please select a role.');
            if (newUser.password !== confirmPassword) throw new Error('Passwords do not match.');

            const userData = {
                id: crypto.randomUUID(),
                username: newUser.username,
                email: newUser.email,
                fullName: newUser.fullName || newUser.username,
                empCode: newUser.empCode,
                role: newUser.role,
                isApproved: true,
                password: newUser.password,
                photoURL: newUser.photoURL
            };

            const { error } = await supabase
                .from('users')
                .insert({ id: userData.id, data: userData });

            if (error) throw error;

            addToast(
                'success',
                `${newUser.username} ${t('user_created_successfully', settings.language)} `
            );
            await onSuccess();
            onClose();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to create user';
            addToast('error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">
                            {t('add_new_user', settings.language)}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                            Create a new system account
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleAddUser} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Role Selection & Avatar Combined */}
                    <div className="flex gap-6 items-start">
                        {/* Avatar Upload */}
                        <div className="flex-shrink-0">
                            <div className="relative group cursor-pointer">
                                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800/50">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 mx-auto mb-1 flex items-center justify-center text-slate-400">
                                                <span className="text-lg">+</span>
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Photo</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity scale-75">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                </div>
                            </div>
                        </div>

                        {/* Role Selector */}
                        <div className="flex-grow">
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-wider">
                                {t('role', settings.language)} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={newUser.role}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, role: e.target.value as Role })
                                    }
                                    className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                >
                                    <option value="" disabled>Select System Role</option>
                                    {availableRoles.map((r) => (
                                        <option key={r} value={r}>
                                            {r.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                Assigning the correct role is critical for system security and access control.
                            </p>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-wider">
                                {t('full_name', settings.language)}
                            </label>
                            <input
                                value={newUser.fullName}
                                onChange={(e) =>
                                    setNewUser({ ...newUser, fullName: e.target.value })
                                }
                                placeholder="Pradeep Kumar"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-wider">
                                {t('username', settings.language)} <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                value={newUser.username}
                                onChange={(e) =>
                                    setNewUser({ ...newUser, username: e.target.value })
                                }
                                placeholder="pradeep"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-wider">
                                {t('emp_code', settings.language)}
                            </label>
                            <input
                                value={newUser.empCode}
                                onChange={(e) =>
                                    setNewUser({ ...newUser, empCode: e.target.value })
                                }
                                placeholder="EMP-001"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Security Credentials</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-wider">
                                    {t('password', settings.language)} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        value={newUser.password}
                                        onChange={(e) =>
                                            setNewUser({ ...newUser, password: e.target.value })
                                        }
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 pr-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-wider">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`w-full bg-white dark:bg-slate-900 border p-3 pr-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-300 ${confirmPassword && confirmPassword !== newUser.password
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                                            }`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-wider">
                            {t('email', settings.language)}
                        </label>
                        <input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="user@unicharm.com"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="h-11 px-6 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        >
                            {t('cancel', settings.language)}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform active:scale-95"
                        >
                            {loading && <Loader2 className="animate-spin mr-2" size={16} />}{' '}
                            {t('create_user', settings.language)}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
