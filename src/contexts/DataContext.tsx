import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
    addSheet: (sheet: SheetData) => Promise<{ error: any }>;
    updateSheet: (sheet: SheetData) => Promise<{ error: any }>;
    deleteSheet: (id: string) => Promise<{ error: any }>;
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

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    theme: 'light',
    accentColor: 'blue',
    density: 'comfortable',
    sidebarCollapsed: false,
    fontSize: 'medium',
    defaultTab: 'dashboard',
    language: 'en'
};

export function DataProvider({ children, queryClient }: { children: React.ReactNode, queryClient: any }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    // 1. Sheets Query
    const { data: sheets = [], isLoading: sheetsLoading } = useQuery<SheetData[]>({
        queryKey: ['sheets'],
        queryFn: async () => {
            interface SupabaseRow {
                id: string;
                data: any;
            }
            const [activeRes, archivedRes] = await Promise.all([
                supabase.from('sheets').select('*').or('data->isArchived.is.null,data->isArchived.eq.false'),
                supabase.from('sheets')
                    .select('*')
                    .eq('data->isArchived', true)
                    .order('created_at', { ascending: false })
                    .range(0, 49)
            ]);

            const { data: activeData, error: activeError } = activeRes as { data: SupabaseRow[] | null, error: any };
            const { data: archivedData, error: archivedError } = archivedRes as { data: SupabaseRow[] | null, error: any };

            if (activeError || archivedError) throw activeError || archivedError;

            const active = (activeData || []).map((d: SupabaseRow) => ({ ...d.data, id: d.id, status: d.data.status || 'DRAFT' })) as SheetData[];
            const archived = (archivedData || []).map((d: SupabaseRow) => ({ ...d.data, id: d.id, status: d.data.status || 'DRAFT' })) as SheetData[];

            const combined = [...active, ...archived];
            const uniqueMap = new Map(combined.map(s => [s.id, s]));
            return Array.from(uniqueMap.values());
        },
    });

    // 2. Users Query
    const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            interface SupabaseUserRow {
                id: string;
                data: any;
            }
            const { data, error } = await supabase.from('users').select('*') as { data: SupabaseUserRow[] | null, error: any };
            if (error) throw error;
            return (data || []).filter((d: SupabaseUserRow) => d.data && !d.data.isDeleted).map((d: SupabaseUserRow) => ({ ...d.data, id: d.id }) as User);
        },
    });

    // 3. Mutations
    const addSheetMutation = useMutation({
        mutationFn: async (sheet: SheetData) => {
            const { error } = await supabase.from('sheets').insert({ id: sheet.id, data: sheet });
            if (error) throw error;
            return { error: null };
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sheets'] }),
    });

    const updateSheetMutation = useMutation({
        mutationFn: async (sheet: SheetData) => {
            const { error } = await supabase.from('sheets').update({ data: sheet }).eq('id', sheet.id);
            if (error) throw error;
            return { error: null };
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sheets'] }),
    });

    const deleteSheetMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('sheets').delete().eq('id', id);
            if (error) throw error;
            return { error: null };
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sheets'] }),
    });

    const [syncStatus, setSyncStatus] = useState<'CONNECTING' | 'LIVE' | 'OFFLINE'>('CONNECTING');

    // Real-time Sync
    useEffect(() => {
        const channel = supabase
            .channel('public:sheets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sheets' }, () => {
                queryClient.invalidateQueries({ queryKey: ['sheets'] });
            })
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') setSyncStatus('LIVE');
                if (status === 'mismatch') setSyncStatus('OFFLINE'); // Should retry, but indicate offline
                if (status === 'timed_out') setSyncStatus('OFFLINE');
                if (status === 'CLOSED') setSyncStatus('OFFLINE');
                if (status === 'CHANNEL_ERROR') setSyncStatus('OFFLINE');
            });

        // Also listen to window online/offline events to toggle status manually if needed
        const handleOffline = () => setSyncStatus('OFFLINE');
        const handleOnline = () => setSyncStatus('CONNECTING'); // Let subscribe callback flip it to LIVE

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [queryClient]);

    const loading = sheetsLoading || usersLoading;

    const [devRole, setDevRole] = useState<string | null>(null); // Default null to force login
    const [shift, setShift] = useState<string>('A');

    // Settings State
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem('appSettings');
            return saved ? JSON.parse(saved) : defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    });

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings((prev: AppSettings) => {
            const updated = { ...prev, ...newSettings };
            try {
                localStorage.setItem('appSettings', JSON.stringify(updated));
            } catch (e) {
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

    const refreshSheets = async () => { queryClient.invalidateQueries({ queryKey: ['sheets'] }); };
    const refreshUsers = async () => { queryClient.invalidateQueries({ queryKey: ['users'] }); };
    const loadMoreArchived = async () => { /* Server-side pagination handled by Query in Phase 3 */ };
    const addSheet = async (sheet: SheetData) => addSheetMutation.mutateAsync(sheet);
    const updateSheet = async (sheet: SheetData) => updateSheetMutation.mutateAsync(sheet);
    const deleteSheet = async (id: string) => deleteSheetMutation.mutateAsync(id);

    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Load User from SessionStorage on mount (Per-Tab Isolation)
    useEffect(() => {
        try {
            const savedUser = sessionStorage.getItem('currentUser');
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
                sessionStorage.setItem('currentUser', JSON.stringify(devUser));
            }
        }
    }, [devRole]);

    // Save User to SessionStorage on Change
    useEffect(() => {
        if (currentUser) {
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            sessionStorage.removeItem('currentUser');
        }
    }, [currentUser]);


    return <DataContext.Provider value={{
        sheets,
        users,
        notifications: [],
        loading,
        refreshSheets,
        loadMoreArchived,
        refreshUsers,
        addSheet,
        updateSheet,
        deleteSheet,
        devRole,
        setDevRole,
        shift,
        setShift,
        currentUser,
        setCurrentUser,
        settings,
        updateSettings,
        isOnline,
        syncStatus
    }}>
        {children}
    </DataContext.Provider>;
}

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within DataProvider');
    return context;
};
