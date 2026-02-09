import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { Role, User, AppSettings } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';
import { t } from '@/lib/i18n';

interface EditUserModalProps {
    user: User | null;
    onClose: () => void;
    onSuccess: () => Promise<void>;
    settings: AppSettings;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
    user,
    onClose,
    onSuccess,
    settings
}) => {
    const { addToast } = useToast();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const { currentUser } = useData();

    // Filter Roles: Only SUPER_ADMIN can assign SUPER_ADMIN role
    const availableRoles = Object.values(Role).filter(r => {
        if (currentUser?.role !== Role.SUPER_ADMIN && r === Role.SUPER_ADMIN) {
            return false;
        }
        return true;
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditingUser(user);
        setAvatarPreview(user?.photoURL || null);
    }, [user]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAvatarPreview(base64String);
                setEditingUser(prev => prev ? ({ ...prev, photoURL: base64String }) : null);
            };
            reader.readAsDataURL(file);
        }
    };

    const { updateUser } = useData();

    if (!user || !editingUser) return null;

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateUser(editingUser);
            addToast(
                'success',
                `${editingUser.username} ${t('user_updated_successfully', settings.language)} `
            );
            await onSuccess();
            onClose();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            addToast('error', t('failed_to_update_user', settings.language) + ': ' + msg);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
            <div className="bg-background border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <FileText size={18} className="text-primary" />{' '}
                        {t('edit_user', settings.language)}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleUpdateUser} className="p-6 space-y-5 overflow-y-auto">
                    {/* Avatar Upload */}
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center mb-4 relative w-fit mx-auto group">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-colors cursor-pointer bg-slate-50 relative">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-2">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Change Photo</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                        </div>

                        {/* Remove Button - Outside the circular container */}
                        {avatarPreview && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setAvatarPreview(null);
                                    setEditingUser(prev => prev ? ({ ...prev, photoURL: undefined }) : null);
                                }}
                                className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors z-20"
                                title="Remove Photo"
                                type="button"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                {t('username', settings.language)}
                            </label>
                            <input
                                value={editingUser.username}
                                onChange={(e) =>
                                    setEditingUser({ ...editingUser, username: e.target.value })
                                }
                                className="w-full bg-background border border-border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                {t('full_name', settings.language)}
                            </label>
                            <input
                                value={editingUser.fullName}
                                onChange={(e) =>
                                    setEditingUser({ ...editingUser, fullName: e.target.value })
                                }
                                className="w-full bg-background border border-border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                            {t('role_assignment', settings.language)}
                        </label>
                        <select
                            value={editingUser.role}
                            onChange={(e) =>
                                setEditingUser({ ...editingUser, role: e.target.value as Role })
                            }
                            className="w-full bg-background border border-border p-1.5 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none font-bold"
                        >
                            {availableRoles.map((r) => (
                                <option key={r} value={r} className="font-bold">
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                {t('employee_code', settings.language)}
                            </label>
                            <input
                                value={editingUser.empCode}
                                onChange={(e) =>
                                    setEditingUser({ ...editingUser, empCode: e.target.value })
                                }
                                className="w-full bg-background border border-border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                {t('email_address', settings.language)}
                            </label>
                            <input
                                type="email"
                                value={editingUser.email}
                                onChange={(e) =>
                                    setEditingUser({ ...editingUser, email: e.target.value })
                                }
                                className="w-full bg-background border border-border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 justify-end border-t border-border mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-border text-foreground hover:bg-muted"
                        >
                            {t('cancel', settings.language)}
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6"
                        >
                            {t('save_changes', settings.language)}
                        </Button>
                    </div>
                </form >
            </div >
        </div >
    );
};
