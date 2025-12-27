import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { t } from '@/lib/i18n';

interface PasswordResetModalProps {
    user: User | null;
    onClose: () => void;
    onSuccess: () => Promise<void>;
    settings: any;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
    user,
    onClose,
    onSuccess,
    settings
}) => {
    const { addToast } = useToast();
    const [newPassword, setNewPassword] = useState('');

    if (!user) return null;

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) return;

        try {
            const updatedUser = { ...user, password: newPassword };
            const { error } = await supabase
                .from('users')
                .update({ data: updatedUser })
                .eq('id', user.id);
            if (error) throw error;
            addToast(
                'success',
                `${t('password', settings.language)} ${t('user_updated_successfully', settings.language)}: ${user.username} `
            );
            await onSuccess();
            onClose();
            setNewPassword('');
        } catch (error: any) {
            addToast('error', t('failed_to_update_user', settings.language));
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-xl shadow-2xl p-6">
                <h3 className="font-bold text-lg mb-2">{t('reset_password', settings.language)}</h3>
                <p className="text-sm text-slate-500 mb-4">
                    {t('enter_new_password_for', settings.language)}{' '}
                    <strong>{user.username}</strong>
                </p>
                <form onSubmit={handlePasswordReset}>
                    <input
                        type="text"
                        className="w-full border p-2 rounded mb-4 bg-slate-50 dark:bg-slate-950 dark:border-slate-800"
                        placeholder={t('password', settings.language)}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('cancel', settings.language)}
                        </Button>
                        <Button type="submit">{t('update_password', settings.language)}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
