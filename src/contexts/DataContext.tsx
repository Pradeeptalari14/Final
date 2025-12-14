import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SheetData, User, Notification, AppSettings } from '@/types';

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
    shift: string;
    setShift: (shift: string) => void;
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    resetAllData: () => Promise<void>;
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    theme: 'light',
    accentColor: 'blue',
    density: 'comfortable',
    sidebarCollapsed: false,
    fontSize: 'medium',
    defaultTab: 'dashboard'
};

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [sheets, setSheets] = useState<SheetData[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [notifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [devRole, setDevRole] = useState<string | null>(null); // Default null to force login
    const [shift, setShift] = useState<string>('A');

    // Settings State
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem('appSettings');
            return saved ? JSON.parse(saved) : defaultSettings;
        } catch (e) {
            console.error('Failed to load settings:', e);
            return defaultSettings;
        }
    });

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings((prev: AppSettings) => {
            const updated = { ...prev, ...newSettings };
            try {
                localStorage.setItem('appSettings', JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to save settings:', e);
            }
            return updated;
        });
    };

    // Apply Theme & Font Size Side Effects
    useEffect(() => {
        const root = window.document.documentElement;

        // Theme
        if (settings.theme === 'light') {
            root.classList.add('light');
            root.classList.remove('dark');
        } else {
            root.classList.remove('light');
            root.classList.add('dark');
        }

        // Accent Color
        root.setAttribute('data-accent', settings.accentColor);

        // Font Size (via CSS variable or class)
        root.style.fontSize = settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : '16px';

    }, [settings.theme, settings.fontSize, settings.accentColor]);

    const [archivedPage, setArchivedPage] = useState(0);
    const PAGE_SIZE = 50;

    const refreshSheets = async () => {
        // 1. Fetch ALL Active Sheets (Non-Completed) - Crucial for Dashboard
        // Note: We use JSON arrow operator ->> for Supabase filtering on jsonb column
        const { data: activeData, error: activeError } = await supabase
            .from('sheets')
            .select('*')
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
            const active = (activeData || []).map((d: any) => ({ ...d.data, id: d.id, status: d.data.status || 'DRAFT' })) as SheetData[];
            const archived = (archivedData || []).map((d: any) => ({ ...d.data, id: d.id, status: d.data.status || 'DRAFT' })) as SheetData[];

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
            const newArchived = data.map((d: any) => ({ ...d.data, id: d.id, status: d.data.status || 'DRAFT' })) as SheetData[];
            setSheets((prev: SheetData[]) => {
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
            const mappedUsers = data.filter((d: any) => d.data && !d.data.isDeleted).map((d: any) => ({ ...d.data, id: d.id }) as User);
            setUsers(mappedUsers);
        }
    };

    const addSheet = async (sheet: SheetData) => {
        const { error } = await supabase.from('sheets').insert({ id: sheet.id, data: sheet });
        if (error) throw error;
        setSheets(prev => [sheet, ...prev]);
    };

    const updateSheet = async (sheet: SheetData) => {
        const { error } = await supabase.from('sheets').update({ data: sheet }).eq('id', sheet.id);
        if (error) throw error;
        setSheets(prev => prev.map(s => s.id === sheet.id ? sheet : s));
    };

    const resetAllData = async () => {
        // Danger: Delete ALL sheets
        const { error: sheetsError } = await supabase.from('sheets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (sheetsError) {
            console.error("Failed to clear sheets:", sheetsError);
            throw sheetsError;
        }

        // Danger: Delete ALL Non-Admin Users
        // We fetch first to filter, as RLS might be tricky with bulk delete
        const { data: usersToDelete, error: fetchError } = await supabase
            .from('users')
            .select('id, data')
            .neq('data->>role', 'ADMIN');

        if (fetchError) {
            alert("Error fetching users: " + fetchError.message);
            throw fetchError;
        }

        alert(`Debug: Found ${usersToDelete?.length || 0} non-admin users to delete.`);

        if (usersToDelete && usersToDelete.length > 0) {
            console.log(`Resetting: Deleting ${usersToDelete.length} non-admin users...`);
            const idsToDelete = usersToDelete.map(u => u.id);
            const { error: deleteError, count } = await supabase.from('users').delete({ count: 'exact' }).in('id', idsToDelete);

            if (deleteError) {
                console.error("Failed to delete users:", deleteError);
                throw deleteError;
            }
            console.log(`Resetting: Successfully deleted ${count} users.`);

            // Critical RLS Check
            if (count === 0 && idsToDelete.length > 0) {
                const msg = "Database deleted 0 users despite finding them. Row Level Security is blocking this. You are likely signed in as a user who does not have 'Delete' permissions.";
                console.error(msg);
                throw new Error(msg);
            }
        }

        setSheets([]);
        await refreshUsers();
    };

    useEffect(() => {
        Promise.all([refreshSheets(), refreshUsers()]).then(() => setLoading(false));
    }, []);

    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Sync currentUser with devRole changes (e.g. from Settings > Developer Tools)
    useEffect(() => {
        if (devRole) {
            if (!currentUser || currentUser.role !== devRole) {
                setCurrentUser({
                    id: 'dev-switch-' + Date.now(),
                    username: 'Simulated ' + devRole,
                    role: devRole as any,
                    isApproved: true,
                    fullName: 'Simulated User',
                    email: 'dev@unicharm.com',
                    empCode: 'DEV',
                    password: ''
                });
            }
        }
    }, [devRole]);

    // ...

    return (
        <DataContext.Provider value={{
            sheets, users, notifications, loading, refreshSheets, loadMoreArchived, refreshUsers, addSheet, updateSheet,
            devRole, setDevRole, shift, setShift, currentUser, setCurrentUser, resetAllData,
            settings, updateSettings
        }}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within DataProvider');
    return context;
};
