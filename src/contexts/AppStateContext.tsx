import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '@/types';

interface AppStateContextType {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    shift: string;
    setShift: (shift: string) => void;
    devRole: string | null;
    setDevRole: (role: string | null) => void;
}

const defaultSettings: AppSettings = {
    theme: 'light',
    accentColor: 'blue',
    density: 'comfortable',
    sidebarCollapsed: false,
    fontSize: 'medium',
    defaultTab: 'dashboard',
    language: 'en'
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
    // 1. Settings State
    const [settings, setSettings] = useState<AppSettings>(() => {
        const saved = localStorage.getItem('app_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            // Apply Theme Side-effect
            if (newSettings.theme) {
                if (newSettings.theme === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
            }
            localStorage.setItem('app_settings', JSON.stringify(updated));
            return updated;
        });
    };

    // Initialize Theme on Mount
    useEffect(() => {
        if (settings.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [settings.theme]);

    // 2. Shift State
    const [shift, setShiftState] = useState<string>(() => {
        const currentHour = new Date().getHours();
        // Simple logic: Shift A (6-14), B (14-22), C (22-6). Adjust as needed.
        if (currentHour >= 6 && currentHour < 14) return 'A';
        if (currentHour >= 14 && currentHour < 22) return 'B';
        return 'C';
    });

    const setShift = (s: string) => {
        setShiftState(s);
    };

    // 3. Dev/Debug Role State
    const [devRole, setDevRoleState] = useState<string | null>(() => {
        return localStorage.getItem('app_dev_role');
    });

    const setDevRole = (role: string | null) => {
        setDevRoleState(role);
        if (role) localStorage.setItem('app_dev_role', role);
        else localStorage.removeItem('app_dev_role');
    };

    return (
        <AppStateContext.Provider
            value={{
                settings,
                updateSettings,
                shift,
                setShift,
                devRole,
                setDevRole
            }}
        >
            {children}
        </AppStateContext.Provider>
    );
}

export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within AppStateProvider');
    }
    return context;
};
