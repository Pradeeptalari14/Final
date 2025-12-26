import { createContext, useContext } from 'react';
import { SheetData, User, Notification, AppSettings } from '@/types';

export interface DataContextType {
    sheets: SheetData[];
    users: User[];
    getAllUsers: () => User[];
    notifications: Notification[];
    securityLogs: any[];
    activityLogs: any[];
    loading: boolean;
    refreshSheets: () => Promise<void>;
    loadMoreArchived: () => Promise<void>;
    refreshUsers: () => Promise<void>;
    updateUser: (user: User) => Promise<{ error: any }>;
    addSheet: (sheet: SheetData) => Promise<{ error: any }>;
    updateSheet: (sheet: SheetData) => Promise<{ error: any }>;
    deleteSheet: (id: string) => Promise<{ error: any }>;
    logSecurityEvent: (action: string, details: string, actor?: string, severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => Promise<void>;
    logActivity: (action: string, details: string) => Promise<void>;
    devRole: string | null;
    setDevRole: (role: string) => void;
    shift: string;
    setShift: (shift: string) => void;
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
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
