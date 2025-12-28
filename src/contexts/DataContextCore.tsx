import { createContext, useContext } from 'react';
import { SheetData, User, Notification, SecurityLog, ActivityLog } from '@/types';

export interface DataContextType {
    sheets: SheetData[];
    users: User[];
    getAllUsers: () => User[];
    notifications: Notification[];
    securityLogs: SecurityLog[];
    activityLogs: ActivityLog[];
    loading: boolean;
    refreshSheets: () => Promise<void>;
    fetchSheetById: (id: string) => Promise<SheetData | null>;
    loadMoreArchived: () => Promise<void>;
    refreshUsers: () => Promise<void>;
    updateUser: (user: User) => Promise<{ error: unknown }>;
    addSheet: (sheet: SheetData) => Promise<{ error: unknown }>;
    updateSheet: (sheet: SheetData) => Promise<{ error: unknown }>;
    deleteSheet: (id: string) => Promise<{ error: unknown }>;
    logSecurityEvent: (
        action: string,
        details: string,
        actor?: string,
        severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    ) => Promise<void>;
    logActivity: (action: string, details: string) => Promise<void>;
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    isOnline: boolean;
    syncStatus: 'CONNECTING' | 'LIVE' | 'OFFLINE';
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within DataProvider. Context initialization failed.');
    }
    return context;
};
