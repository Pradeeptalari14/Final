import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, QueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SheetData } from '@/types';
import { dataService } from '@/services/dataService';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

export interface SheetContextType {
    sheets: SheetData[];
    loading: boolean;
    refreshSheets: () => Promise<void>;
    fetchSheetById: (id: string) => Promise<SheetData | null>;
    addSheet: (sheet: SheetData) => Promise<{ error: unknown }>;
    updateSheet: (sheet: SheetData) => Promise<{ error: unknown }>;
    deleteSheet: (id: string) => Promise<{ error: unknown }>;
    syncStatus: 'CONNECTING' | 'LIVE' | 'OFFLINE';
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export function SheetProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
    const [syncStatus, setSyncStatus] = useState<'CONNECTING' | 'LIVE' | 'OFFLINE'>('CONNECTING');

    const { data: sheets = [], isLoading: sheetsLoading } = useQuery<SheetData[]>({
        queryKey: ['sheets'],
        queryFn: async () => {
            return await dataService.getSheets(50, 50);
        },
        staleTime: 1000 * 60,
        refetchInterval: 3000
    });

    const addSheetMutation = useOfflineMutation<{ error: unknown }, unknown, SheetData, { previousSheets?: SheetData[] }>('addSheet', {
        mutationFn: async (_sheet: SheetData) => ({ error: null }),
        onMutate: async (newSheet: SheetData) => {
            await queryClient.cancelQueries({ queryKey: ['sheets'] });
            const previousSheets = queryClient.getQueryData<SheetData[]>(['sheets']);
            queryClient.setQueryData(['sheets'], (old: SheetData[] = []) => [...old, newSheet]);
            return { previousSheets };
        },
        onError: (_err, _newSheet, context) => {
            if (context?.previousSheets) queryClient.setQueryData(['sheets'], context.previousSheets);
        }
    });

    const updateSheetMutation = useOfflineMutation<{ error: unknown }, unknown, SheetData, { previousSheets?: SheetData[] }>('updateSheet', {
        mutationFn: async (_sheet: SheetData) => ({ error: null }),
        onMutate: async (updatedSheet: SheetData) => {
            await queryClient.cancelQueries({ queryKey: ['sheets'] });
            const previousSheets = queryClient.getQueryData<SheetData[]>(['sheets']);
            queryClient.setQueryData(['sheets'], (old: SheetData[] = []) =>
                old.map(s => s.id === updatedSheet.id ? updatedSheet : s)
            );
            return { previousSheets };
        },
        onError: (_err, _updatedSheet, context) => {
            if (context?.previousSheets) queryClient.setQueryData(['sheets'], context.previousSheets);
        }
    });

    const deleteSheetMutation = useMutation({
        mutationFn: async (id: string) => await dataService.deleteSheet(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sheets'] })
    });

    useEffect(() => {
        const channel = supabase
            .channel('public:sheets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sheets' }, () => {
                queryClient.invalidateQueries({ queryKey: ['sheets'] });
                toast.info('Data Updated Remotely', { description: 'Syncing changes...', duration: 1500 });
            })
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') setSyncStatus('LIVE');
                else setSyncStatus('OFFLINE');
            });

        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    const refreshSheets = async () => { queryClient.invalidateQueries({ queryKey: ['sheets'] }); };
    const fetchSheetById = async (id: string) => await dataService.fetchSheetById(id);
    const addSheet = async (sheet: SheetData) => addSheetMutation.mutateAsync(sheet);
    const updateSheet = async (sheet: SheetData) => updateSheetMutation.mutateAsync(sheet);
    const deleteSheet = async (id: string) => deleteSheetMutation.mutateAsync(id);

    return (
        <SheetContext.Provider value={{
            sheets,
            loading: sheetsLoading,
            refreshSheets,
            fetchSheetById,
            addSheet,
            updateSheet,
            deleteSheet,
            syncStatus
        }}>
            {children}
        </SheetContext.Provider>
    );
}

export const useSheets = () => {
    const context = useContext(SheetContext);
    if (!context) throw new Error('useSheets must be used within SheetProvider');
    return context;
};
