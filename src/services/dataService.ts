import { supabase } from '@/lib/supabase';
import { SheetData, User } from '@/types';

/**
 * Service Layer: DataService
 * Decouples direct Supabase calls from React Components/Contexts.
 * This makes it easier to mock these functions for testing or switch backends.
 */

export const dataService = {
    // --- SHEETS ---
    async addSheet(sheet: SheetData) {
        const { error } = await supabase.from('sheets').insert({ id: sheet.id, data: sheet });
        if (error) throw error;
        return { error: null };
    },

    async updateSheet(sheet: SheetData) {
        const { error } = await supabase
            .from('sheets')
            .update({ data: sheet })
            .eq('id', sheet.id);
        if (error) throw error;
        return { error: null };
    },

    async deleteSheet(id: string) {
        const { error } = await supabase.from('sheets').delete().eq('id', id);
        if (error) throw error;
        return { error: null };
    },

    async getSheets(limitActive = 50, limitArchived = 50) {
        // Parallel Fetch for Performance
        const [activeRes, archivedRes] = await Promise.all([
            // Active Sheets (Not Archived or explicitly false)
            supabase
                .from('sheets')
                .select('*')
                .or('data->isArchived.is.null,data->isArchived.eq.false')
                .limit(limitActive), // Applied limit


            // Archived Sheets (Recent ones)
            supabase
                .from('sheets')
                .select('*')
                .eq('data->isArchived', true)
                .order('created_at', { ascending: false })
                .limit(limitArchived)
        ]);

        if (activeRes.error) throw activeRes.error;
        if (archivedRes.error) throw archivedRes.error;

        const activeSheets = activeRes.data?.map((row: { data: unknown }) => row.data as SheetData) || [];
        const archivedSheets = archivedRes.data?.map((row: { data: unknown }) => row.data as SheetData) || [];

        return [...activeSheets, ...archivedSheets];
    },

    // --- USERS ---
    async updateUser(user: User) {
        const { error } = await supabase.from('users').update({ data: user }).eq('id', user.id);
        if (error) throw error;
        return { error: null };
    },

    async getUsers() {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return data.map((row: { data: unknown }) => row.data as User);
    },

    async fetchSheetById(id: string) {
        const { data, error } = await supabase
            .from('sheets')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        return {
            ...(data.data as SheetData),
            id: data.id,
            status: (data.data as SheetData).status || 'DRAFT'
        };
    },

    // --- LOGGING ---
    async logSecurityEvent(logEntry: { action: string; details: string; actor: string; severity: string; timestamp: string }) {
        const { error } = await supabase.from('security_logs').insert({ data: logEntry });
        if (error) throw error;
        return { error: null };
    },

    async logActivity(logEntry: { action: string; details: string; actor: string; timestamp: string }) {
        const { error } = await supabase.from('activity_logs').insert({ data: logEntry });
        if (error) throw error;
        return { error: null };
    },

    // --- NUCLEAR --
    async resetAllData() {
        // Delete all rows from tables.
        // Note: RLS must allow this or this will fail.
        // We use .neq('id', '0') as a catch-all since .delete() requires a filter.

        const { error: error1 } = await supabase.from('sheets').delete().neq('id', '0');
        if (error1) console.error('Error clearing sheets:', error1);

        const { error: error2 } = await supabase.from('security_logs').delete().neq('id', '0');
        if (error2) console.error('Error clearing security_logs:', error2);

        const { error: error3 } = await supabase.from('activity_logs').delete().neq('id', '0');
        if (error3) console.error('Error clearing activity_logs:', error3);

        // Optional: Clear users too? Usually we keep the admin, but "Nuclear" implies everything.
        // If users are stored in auth.users, we can't delete them from here without service key.
        // If in public.users table:
        const { error: error4 } = await supabase.from('users').delete().neq('id', '0');
        if (error4) console.error('Error clearing users:', error4);

        return { success: true };
    }
};
