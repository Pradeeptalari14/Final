import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { Role, User } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { t } from '@/lib/i18n';

interface EditUserModalProps {
    user: User | null;
    onClose: () => void;
    onSuccess: () => Promise<void>;
    settings: any;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
    user,
    onClose,
    onSuccess,
    settings
}) => {
    const { addToast } = useToast();
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        setEditingUser(user);
    }, [user]);

    if (!user || !editingUser) return null;

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('users')
                .update({ data: editingUser })
                .eq('id', editingUser.id);
            if (error) throw error;
            addToast(
                'success',
                `${editingUser.username} ${t('user_updated_successfully', settings.language)} `
            );
            await onSuccess();
            onClose();
        } catch (error: any) {
            addToast('error', t('failed_to_update_user', settings.language) + ': ' + error.message);
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
                            {Object.values(Role).map((r) => (
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
                </form>
            </div>
        </div>
    );
};
