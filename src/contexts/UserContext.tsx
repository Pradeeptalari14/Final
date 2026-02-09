import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { User } from '@/types';
import { dataService } from '@/services/dataService';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

export interface UserContextType {
    users: User[];
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    loading: boolean;
    refreshUsers: () => Promise<void>;
    updateUser: (user: User) => Promise<{ error: unknown }>;
    logSecurityEvent: (action: string, details: string, actor?: string, severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => Promise<void>;
    logActivity: (action: string, details: string) => Promise<void>;
    isOnline: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const savedUser = sessionStorage.getItem('currentUser');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch { return null; }
    });

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => await dataService.getUsers(),
        staleTime: 1000 * 60 * 5,
        refetchInterval: 3000
    });

    const updateUserMutation = useOfflineMutation('updateUser', {
        mutationFn: async (user: User) => await dataService.updateUser(user),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
    });

    const logSecurityEventMutation = useMutation({
        mutationFn: async (logEntry: { action: string; details: string; actor: string; severity: string; timestamp: string }) =>
            await dataService.logSecurityEvent(logEntry),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['security_logs'] })
    });

    const logSecurityEvent = useCallback(async (action: string, details: string, actor?: string, severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
        const logEntry = { action, details, actor: actor || 'SYSTEM', severity: severity || 'LOW', timestamp: new Date().toISOString() };
        logSecurityEventMutation.mutate(logEntry);
    }, [logSecurityEventMutation]);

    const logActivityMutation = useMutation({
        mutationFn: async (logEntry: { action: string; details: string; actor: string; timestamp: string }) =>
            await dataService.logActivity(logEntry),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity_logs'] })
    });

    const logActivity = useCallback(async (action: string, details: string) => {
        const actor = currentUser?.username || 'GUEST';
        const logEntry = { action, details, actor, timestamp: new Date().toISOString() };
        logActivityMutation.mutate(logEntry);
    }, [currentUser, logActivityMutation]);

    useEffect(() => {
        if (currentUser) sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        else sessionStorage.removeItem('currentUser');
    }, [currentUser]);

    const refreshUsers = async () => { queryClient.invalidateQueries({ queryKey: ['users'] }); };
    const updateUser = async (user: User) => updateUserMutation.mutateAsync(user);

    return (
        <UserContext.Provider value={{
            users,
            currentUser,
            setCurrentUser,
            loading: usersLoading,
            refreshUsers,
            updateUser,
            logSecurityEvent,
            logActivity,
            isOnline
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUsers = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUsers must be used within UserProvider');
    return context;
};
