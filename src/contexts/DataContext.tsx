import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SheetData, User, Notification, SheetStatus } from '@/types';

interface DataContextType {
    sheets: SheetData[];
    users: User[];
    notifications: Notification[];
    loading: boolean;
    refreshSheets: () => Promise<void>;
    loadMoreArchived: () => Promise<void>;
    refreshUsers: () => Promise<void>;
    addSheet: (sheet: SheetData) => Promise<void>;
    updateSheet: (sheet: SheetData) => Promise<void>;
    devRole: string | null;
    setDevRole: (role: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [sheets, setSheets] = useState<SheetData[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [devRole, setDevRole] = useState<string | null>('STAGING_SUPERVISOR'); // Default for dev

    const [archivedPage, setArchivedPage] = useState(0);
    const PAGE_SIZE = 50;

    const refreshSheets = async () => {
        // 1. Fetch ALL Active Sheets (Non-Completed) - Crucial for Dashboard
        // Note: We use JSON arrow operator ->> for Supabase filtering on jsonb column
        const { data: activeData, error: activeError } = await supabase
            .from('sheets')
            .select('*')
            .textSearch('data', `'COMPLETED'`, { config: 'english', type: 'plain' }) // Negation is hard in textSearch, trying filter
            .neq('data->>status', 'COMPLETED')
            .order('created_at', { ascending: false });

        // 2. Fetch Recent Archived Sheets (Completed) - Limit to PAGE_SIZE
        const { data: archivedData, error: archivedError } = await supabase
            .from('sheets')
            .select('*')
            .eq('data->>status', 'COMPLETED')
            .order('created_at', { ascending: false })
            .range(0, PAGE_SIZE - 1);

        if (!activeError && !archivedError) {
            const active = (activeData || []).map(d => ({ ...d.data, id: d.id, status: d.data.status || 'DRAFT' })) as SheetData[];
            const archived = (archivedData || []).map(d => ({ ...d.data, id: d.id, status: d.data.status || 'DRAFT' })) as SheetData[];

            // Combine strict unique set just in case
            const combined = [...active, ...archived];
            // Remove potential duplicates if status changed mid-query (rare)
            const uniqueMap = new Map(combined.map(s => [s.id, s]));
            setSheets(Array.from(uniqueMap.values()));
            setArchivedPage(0);
        }
    };

    const loadMoreArchived = async () => {
        const nextPage = archivedPage + 1;
        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
            .from('sheets')
            .select('*')
            .eq('data->>status', 'COMPLETED')
            .order('created_at', { ascending: false })
            .range(from, to);

        if (data && !error && data.length > 0) {
            const newArchived = data.map(d => ({ ...d.data, id: d.id, status: d.data.status || 'DRAFT' })) as SheetData[];
            setSheets(prev => {
                const combined = [...prev, ...newArchived];
                const uniqueMap = new Map(combined.map(s => [s.id, s]));
                return Array.from(uniqueMap.values());
            });
            setArchivedPage(nextPage);
        }
    };

    const refreshUsers = async () => {
        const { data } = await supabase.from('users').select('*');
        if (data) {
            const mappedUsers = data.filter(d => d.data).map(d => d.data as User);
            setUsers(mappedUsers);
        }
    };

    const addSheet = async (sheet: SheetData) => {
        const { error } = await supabase.from('sheets').insert({ id: sheet.id, data: sheet });
        if (!error) {
            setSheets(prev => [sheet, ...prev]);
        }
    };

    const updateSheet = async (sheet: SheetData) => {
        const { error } = await supabase.from('sheets').update({ data: sheet }).eq('id', sheet.id);
        if (!error) {
            setSheets(prev => prev.map(s => s.id === sheet.id ? sheet : s));
        }
    };

    useEffect(() => {
        Promise.all([refreshSheets(), refreshUsers()]).then(() => setLoading(false));
    }, []);

    return (
        <DataContext.Provider value={{ sheets, users, notifications, loading, refreshSheets, loadMoreArchived, refreshUsers, addSheet, updateSheet, devRole, setDevRole }}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within DataProvider');
    return context;
};
