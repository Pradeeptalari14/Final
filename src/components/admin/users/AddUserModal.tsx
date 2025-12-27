import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Role } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { t } from '@/lib/i18n';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => Promise<void>;
    settings: any;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    settings
}) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        fullName: '',
        empCode: '',
        email: '',
        password: '',
        role: '' as Role
    });

    if (!isOpen) return null;

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!newUser.username || !newUser.password)
                throw new Error('Username and Password are required.');
            if (!newUser.role) throw new Error('Please select a role.');
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
            setNewUser({
                username: '',
                fullName: '',
                empCode: '',
                email: '',
                password: '',
                role: '' as Role
            });
        } catch (error: any) {
            addToast('error', error.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
                    <h3 className="font-bold text-lg">{t('add_new_user', settings.language)}</h3>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleAddUser} className="p-4 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">
                            {t('role', settings.language)}
                        </label>
                        <select
                            value={newUser.role}
                            onChange={(e) =>
                                setNewUser({ ...newUser, role: e.target.value as Role })
                            }
                            className="w-full bg-background border border-border p-1.5 rounded-lg text-xs font-bold"
                        >
                            <option value="" disabled>
                                Select Role
                            </option>
                            {Object.values(Role).map((r) => (
                                <option key={r} value={r} className="font-bold">
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">
                                {t('username', settings.language)} *
                            </label>
                            <input
                                required
                                value={newUser.username}
                                onChange={(e) =>
                                    setNewUser({ ...newUser, username: e.target.value })
                                }
                                className="w-full bg-background border border-border p-2 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">
                                {t('full_name', settings.language)}
                            </label>
                            <input
                                value={newUser.fullName}
                                onChange={(e) =>
                                    setNewUser({ ...newUser, fullName: e.target.value })
                                }
                                className="w-full bg-background border border-border p-2 rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">
                                {t('password', settings.language)} *
                            </label>
                            <input
                                required
                                type="text"
                                value={newUser.password}
                                onChange={(e) =>
                                    setNewUser({ ...newUser, password: e.target.value })
                                }
                                className="w-full bg-background border border-border p-2 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">
                                {t('emp_code', settings.language)}
                            </label>
                            <input
                                value={newUser.empCode}
                                onChange={(e) =>
                                    setNewUser({ ...newUser, empCode: e.target.value })
                                }
                                className="w-full bg-background border border-border p-2 rounded-lg"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">
                            {t('email', settings.language)}
                        </label>
                        <input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="w-full bg-background border border-border p-2 rounded-lg"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('cancel', settings.language)}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-primary text-primary-foreground"
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
