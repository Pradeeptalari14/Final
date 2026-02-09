import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { SheetData, User } from '@/types';
import { DataContext, useData } from './DataContextCore';
import { SheetProvider, useSheets } from './SheetContext';
import { UserProvider, useUsers } from './UserContext';
import { dataService } from '@/services/dataService';

// Raw API exports for SyncManager and other low-level utilities
const performAddSheet = async (sheet: SheetData) => dataService.addSheet(sheet);
const performUpdateSheet = async (sheet: SheetData) => dataService.updateSheet(sheet);
const performDeleteSheet = async (id: string) => dataService.deleteSheet(id);
const performUpdateUser = async (user: User) => dataService.updateUser(user);

export { useData, performAddSheet, performUpdateSheet, performDeleteSheet, performUpdateUser };

/**
 * DataProvider Facade
 * Composes SheetProvider and UserProvider to maintain backward compatibility.
 */
export function DataProvider({
    children,
    queryClient
}: {
    children: React.ReactNode;
    queryClient: QueryClient;
}) {
    return (
        <UserProvider queryClient={queryClient}>
            <SheetProvider queryClient={queryClient}>
                <DataBridge>{children}</DataBridge>
            </SheetProvider>
        </UserProvider>
    );
}

/**
 * DataBridge
 * Connects the legacy useData context with the new modular contexts.
 * Pulls values from domain contexts and maps them to the legacy DataContextType.
 */
function DataBridge({ children }: { children: React.ReactNode }) {
    const sheetDomain = useSheets();
    const userDomain = useUsers();

    // Mapping new domain values to legacy context signature
    const contextValue = {
        ...sheetDomain,
        ...userDomain,
        loading: sheetDomain.loading || userDomain.loading,
        notifications: [], // Placeholder for future Notifications domain
        securityLogs: [],  // Handled locally in Audit views now
        activityLogs: [],  // Handled locally in Audit views now
        loadMoreArchived: async () => { }, // Handled by persistence/pagination now
        getAllUsers: () => userDomain.users
    };

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
}
