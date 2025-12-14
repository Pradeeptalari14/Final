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

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('public:sheets')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'sheets' },
                (payload: any) => {
                    console.log('Realtime update:', payload);
                    if (payload.eventType === 'INSERT') {
                        const newSheet = { ...payload.new.data, id: payload.new.id, status: payload.new.data.status || 'DRAFT' } as SheetData;
                        setSheets(prev => {
                            // Avoid duplicates
                            if (prev.find(s => s.id === newSheet.id)) return prev;
                            return [newSheet, ...prev];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedSheet = { ...payload.new.data, id: payload.new.id, status: payload.new.data.status || 'DRAFT' } as SheetData;
                        setSheets(prev => prev.map(s => s.id === updatedSheet.id ? updatedSheet : s));
                    } else if (payload.eventType === 'DELETE') {
                        setSheets(prev => prev.filter(s => s.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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

    useEffect(() => {
        Promise.all([refreshSheets(), refreshUsers()]).then(() => setLoading(false));
    }, []);

    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Load User from LocalStorage on mount
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                setCurrentUser(JSON.parse(savedUser));
            }
        } catch (e) {
            console.error("Failed to load user session", e);
        }
    }, []);

    // Sync currentUser with devRole changes (e.g. from Settings > Developer Tools)
    useEffect(() => {
        if (devRole) {
            if (!currentUser || currentUser.role !== devRole) {
                const devUser = {
                    id: 'dev-switch-' + Date.now(),
                    username: 'Simulated ' + devRole,
                    role: devRole as any,
                    isApproved: true,
                    fullName: 'Simulated User',
                    email: 'dev@unicharm.com',
                    empCode: 'DEV',
                    password: ''
                };
                setCurrentUser(devUser);
                localStorage.setItem('currentUser', JSON.stringify(devUser));
            }
        }
    }, [devRole]);

    // Save User to LocalStorage on Change
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    // ...

    return (
        <DataContext.Provider value={{
            sheets, users, notifications, loading, refreshSheets, loadMoreArchived, refreshUsers, addSheet, updateSheet,
            devRole, setDevRole, shift, setShift, currentUser, setCurrentUser,
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
