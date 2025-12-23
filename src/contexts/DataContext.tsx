import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SheetData, User, AppSettings } from '@/types';
import { DataContext, useData } from './DataContextCore';
export { useData };

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
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [devRole, setDevRole] = useState<string | null>(null);
    const [shift, setShift] = useState<string>('A');

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

    // Users Mutation
    const updateUserMutation = useMutation({
        mutationFn: async (user: User) => {
            const { error } = await supabase.from('users').update({ data: user }).eq('id', user.id);
            if (error) throw error;
            return { error: null };
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    // 3. Security Logs Query
    const { data: securityLogs = [] } = useQuery<any[]>({
        queryKey: ['security_logs'],
        queryFn: async () => {
            const { data, error } = await supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(100);
            if (error) {
                console.warn("Security logs table might not exist yet. Using local simulated logs.");
                return [];
            }
            interface SecurityLogRow {
                id: string;
                data: any;
                created_at: string;
            }
            return (data || []).map((d: SecurityLogRow) => ({ ...d.data, id: d.id, timestamp: d.created_at || d.data.timestamp }));
        },
    });

    const logSecurityEventMutation = useMutation({
        mutationFn: async ({ action, details, actor, severity }: { action: string, details: string, actor?: string, severity?: string }) => {
            const logEntry = {
                action,
                details,
                actor: actor || 'SYSTEM',
                severity: severity || 'LOW',
                timestamp: new Date().toISOString()
            };
            const { error } = await supabase.from('security_logs').insert({ data: logEntry });
            if (error) {
                console.warn("Failed to save security log to server. Logging to local console instead.", logEntry);
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['security_logs'] }),
    });

    const logSecurityEvent = async (action: string, details: string, actor?: string, severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
        logSecurityEventMutation.mutate({ action, details, actor, severity });
    };

    // 4. Activity Logs (Click Tracking)
    const { data: activityLogs = [] } = useQuery<any[]>({
        queryKey: ['activity_logs'],
        queryFn: async () => {
            const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200);
            if (error) return [];
            return (data || []).map((d: any) => ({ ...d.data, id: d.id, timestamp: d.created_at }));
        },
    });

    const logActivityMutation = useMutation({
        mutationFn: async ({ action, details, actor }: { action: string, details: string, actor: string }) => {
            const logEntry = { action, details, actor, timestamp: new Date().toISOString() };
            await supabase.from('activity_logs').insert({ data: logEntry });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity_logs'] }),
    });

    const logActivity = async (action: string, details: string) => {
        const actor = currentUser?.username || 'GUEST';
        logActivityMutation.mutate({ action, details, actor });
    };

    // Global Click Listener for "Every Click" info
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const clickable = target.closest('button, a, input, [role="button"]');
            if (clickable) {
                const label = clickable.textContent?.trim().substring(0, 30) || (clickable as HTMLInputElement).placeholder || (clickable as HTMLInputElement).value || clickable.id || 'Unnamed Element';
                const action = `CLICK: ${clickable.tagName}`;
                const details = `User clicked on [${label}] in ${window.location.pathname}`;
                logActivity(action, details);
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [currentUser]);

    // 5. Mutations for Sheets
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
                toast.info("Data Updated Remotely", { description: "Refreshing content...", duration: 2000 });
            })
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') setSyncStatus('LIVE');
                if (status === 'mismatch') setSyncStatus('OFFLINE'); // Should retry, but indicate offline
                if (status === 'timed_out') setSyncStatus('OFFLINE');
                if (status === 'CLOSED') setSyncStatus('OFFLINE');
                if (status === 'CHANNEL_ERROR') setSyncStatus('OFFLINE');
            });

        // Also listen to window online/offline events to toggle status manually if needed
        const handleOffline = () => {
            setSyncStatus('OFFLINE');
            toast.error("You are offline", { description: "Changes may not save until you reconnect.", duration: 4000 });
        };
        const handleOnline = () => {
            setSyncStatus('CONNECTING'); // Let subscribe callback flip it to LIVE
            toast.success("Back Online", { description: "Syncing latest data...", duration: 2000 });
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [queryClient]);

    const loading = sheetsLoading || usersLoading;

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
    const updateUser = async (user: User) => updateUserMutation.mutateAsync(user);
    const loadMoreArchived = async () => { /* Server-side pagination handled by Query in Phase 3 */ };
    const addSheet = async (sheet: SheetData) => addSheetMutation.mutateAsync(sheet);
    const updateSheet = async (sheet: SheetData) => updateSheetMutation.mutateAsync(sheet);
    const deleteSheet = async (id: string) => deleteSheetMutation.mutateAsync(id);


    return <DataContext.Provider value={{
        sheets,
        users,
        notifications: [],
        loading,
        refreshSheets,
        loadMoreArchived,
        refreshUsers,
        updateUser,
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
        syncStatus,
        securityLogs,
        logSecurityEvent,
        activityLogs,
        logActivity
    }}>
        {children}
    </DataContext.Provider>;
}


