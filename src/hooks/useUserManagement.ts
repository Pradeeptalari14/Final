import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Role, User, SheetData } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';
import { t } from '@/lib/i18n';

export const useUserManagement = (
    users: User[],
    refreshUsers: () => Promise<void>,
    sheets: SheetData[]
) => {
    const { addToast } = useToast();
    const { currentUser, logSecurityEvent } = useData();
    const { settings } = useAppState();
    const [searchParams, setSearchParams] = useSearchParams();

    // --- User Management State ---
    const [userSearchQuery, setUserSearchQuery] = useState('');
    // Initialize filter from URL param if present, otherwise default to 'ALL'
    const [userFilter, setUserFilter] = useState<'ALL' | 'PENDING' | 'LOCKED' | Role>(
        (searchParams.get('filter') as 'ALL' | 'PENDING' | 'LOCKED' | Role) || 'ALL'
    );

    // Sync filter with URL
    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (filterParam) {
            setUserFilter(filterParam as 'ALL' | 'PENDING' | 'LOCKED' | Role);
        } else {
            setUserFilter('ALL');
        }
    }, [searchParams]);

    // Helper to update filter and URL
    const setFilter = (newFilter: 'ALL' | 'PENDING' | 'LOCKED' | Role) => {
        setUserFilter(newFilter);
        setSearchParams((prev) => {
            prev.set('filter', newFilter);
            return prev;
        });
    };

    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserLoading, setNewUserLoading] = useState(false);

    // Password Reset State
    const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);

    // Edit User State
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // --- Compute Last Active Logic ---
    const lastActiveMap = useMemo(() => {
        const map = new Map<string, number>();
        if (!sheets) return map;

        sheets.forEach((sheet) => {
            // Check creation time
            if (sheet.supervisorName) {
                const t = new Date(sheet.createdAt).getTime();
                if (t > (map.get(sheet.supervisorName) || 0)) map.set(sheet.supervisorName, t);
            }

            // Check history logs
            if (sheet.history) {
                sheet.history.forEach((log) => {
                    if (log.actor) {
                        const t = new Date(log.timestamp).getTime();
                        if (t > (map.get(log.actor) || 0)) map.set(log.actor, t);
                    }
                });
            }
        });
        return map;
    }, [sheets]);

    const filteredUsers = useMemo(() => {
        let res = users;
        // 1. Tab/Role Context Filter
        if (userFilter === 'PENDING') {
            res = res.filter((u) => !u.isApproved);
        } else if (userFilter === Role.STAGING_SUPERVISOR) {
            res = res.filter((u) => u.role === Role.STAGING_SUPERVISOR);
        } else if (userFilter === Role.LOADING_SUPERVISOR) {
            res = res.filter((u) => u.role === Role.LOADING_SUPERVISOR);
        } else if (userFilter === Role.SHIFT_LEAD) {
            res = res.filter((u) => u.role === Role.SHIFT_LEAD);
        } else if (userFilter === Role.ADMIN) {
            res = res.filter((u) => u.role === Role.ADMIN);
        } else if (userFilter === 'LOCKED') {
            res = res.filter((u) => u.isLocked);
        }

        // 2. Search Query Filter
        return res.filter(
            (user) =>
                user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                (user.fullName &&
                    user.fullName.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
                (user.email && user.email.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
                user.role.toLowerCase().includes(userSearchQuery.toLowerCase())
        );
    }, [users, userSearchQuery, userFilter]);

    // --- Handlers ---
    const handleDeleteUser = async (userToDelete: User) => {
        const { id: userId, username, isApproved, role } = userToDelete;

        // 1. SELF-DELETION PROTECTION
        if (userId === currentUser?.id) {
            alert(t('cannot_delete_self', settings.language));
            return;
        }

        // 2. ENFORCE INACTIVE STATUS (Strict Rule)
        if (isApproved) {
            alert(
                `${t('delete_active_user_error', settings.language)}\n\n${t('switch_inactive_first', settings.language)}`
            );
            return;
        }

        // 3. CONFIRMATION
        if (!window.confirm(t('delete_user_confirm', settings.language))) {
            return;
        }

        try {
            // SPECIAL HANDLING FOR ADMINS: Demote first to bypass potential RLS/Constraint
            if (role === Role.ADMIN) {
                await supabase
                    .from('users')
                    .update({
                        data: { ...userToDelete, role: Role.STAGING_SUPERVISOR, isApproved: false }
                    })
                    .eq('id', userId);
            }

            // Attempt Hard Delete - EXPLICITLY SELECT DATA TO VERIFY
            const { error, data: deleteData } = await supabase
                .from('users')
                .delete()
                .eq('id', userId)
                .select();

            // Check for Silent Failure (0 rows deleted)
            const silentFailure = !error && (!deleteData || deleteData.length === 0);

            if (error || silentFailure) {
                const { data: currentUserData } = await supabase
                    .from('users')
                    .select('data')
                    .eq('id', userId)
                    .single();

                if (currentUserData) {
                    const softDeletedData = {
                        ...currentUserData.data,
                        isDeleted: true,
                        role: Role.STAGING_SUPERVISOR, // Ensure role is not ADMIN in the tombstone
                        username: `${username}_deleted_${Date.now()}`
                    };

                    const { error: softError, data: softData } = await supabase
                        .from('users')
                        .update({ data: softDeletedData })
                        .eq('id', userId)
                        .select();

                    if (softError || !softData || softData.length === 0) {
                        const reason = softError?.message || 'Permission Denied (0 rows updated)';
                        alert(
                            `DELETE FAILED\n\nCould not delete user. Database permissions might be restricted.\n\nReason: ${reason}`
                        );
                        return;
                    }
                } else {
                    alert(`DELETE FAILED\n\nUser record not found.`);
                    return;
                }
            }

            // Success feedback
            addToast('success', `${username} ${t('user_deleted', settings.language)}`);
            await refreshUsers();
        } catch (error: unknown) {
            // Blocking Alert for Unexpected Error
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert(`SYSTEM ERROR\n\nFailed to delete user: ${message}`);
        }
    };

    const toggleUserStatus = async (user: User) => {
        if (user.id === currentUser?.id) {
            alert(t('cannot_deactivate_self', settings.language));
            return;
        }
        try {
            const updatedUser = { ...user, isApproved: !user.isApproved };

            // Explicitly select data to confirm row was touched
            const { data, error } = await supabase
                .from('users')
                .update({ data: updatedUser })
                .eq('id', user.id)
                .select();

            if (error) {
                throw error;
            }

            // RCA: Check if any row was actually updated
            if (!data || data.length === 0) {
                throw new Error(
                    'Permission Denied: Database policy prevented this change (0 rows updated).'
                );
            }

            if (updatedUser.isApproved) {
                addToast(
                    'success',
                    `✅ ACCOUNT ACTIVATED: ${user.username} has been successfully approved and can now log in.`
                );
            } else {
                addToast(
                    'info',
                    `User ${user.username} has been deactivated.`
                );
            }

            await refreshUsers();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown Error';
            alert(
                `STATUS CHANGE FAILED\n\nReason: ${message} \n\nTroubleshooting: You might not have permission to modify this user.`
            );
        }
    };

    const handleUnlockUser = async (user: User) => {
        try {
            const updatedUser = { ...user, isLocked: false };
            const { data, error } = await supabase
                .from('users')
                .update({ data: updatedUser })
                .eq('id', user.id)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Permission Denied (0 rows updated).');

            addToast('success', `User ${user.username} unlocked successfully.`);
            logSecurityEvent(
                'USER_UNLOCKED',
                `Admin ${currentUser?.username} unlocked user ${user.username}`,
                currentUser?.username || 'SYSTEM',
                'MEDIUM'
            );
            await refreshUsers();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert(`UNLOCK FAILED\n\nReason: ${message}`);
        }
    };

    return {
        // State
        userSearchQuery,
        setUserSearchQuery,
        userFilter,
        setFilter,
        isAddingUser,
        setIsAddingUser,
        newUserLoading,
        setNewUserLoading,
        passwordResetUser,
        setPasswordResetUser,
        editingUser,
        setEditingUser,
        lastActiveMap,
        filteredUsers,

        // Handlers
        handleDeleteUser,
        toggleUserStatus,
        handleUnlockUser,
        settings // Shared settings
    };
};
