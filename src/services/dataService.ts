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
                .order('created_at', { ascending: false })
                .limit(limitActive),

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

        const activeSheets = activeRes.data?.map((row) => ({
            ...(row.data as SheetData),
            id: row.id
        })) || [];

        const archivedSheets = archivedRes.data?.map((row) => ({
            ...(row.data as SheetData),
            id: row.id
        })) || [];

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

    // --- SESSIONS ---
    async logSession(session: import('@/types').LoginSession) {
        // We use "sessions" table. Upsert based on ID
        const { error } = await supabase.from('sessions').upsert({ id: session.id, data: session });
        if (error) throw error;
        return { error: null };
    },

    async getActiveSessions() {
        const { data, error } = await supabase.from('sessions').select('*');
        if (error) throw error;
        // Clean up old sessions (> 24 hours inactive)
        const now = Date.now();
        const activeSessions = data
            .map((row: { data: unknown }) => row.data as import('@/types').LoginSession)
            .filter(session => {
                const lastActive = new Date(session.lastActive).getTime();
                return (now - lastActive) < 24 * 60 * 60 * 1000;
            });
        return activeSessions;
    },

    async killSession(sessionId: string) {
        const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
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

        const { error: error4 } = await supabase.from('users').delete().neq('id', '0');
        if (error4) console.error('Error clearing users:', error4);

        const { error: error5 } = await supabase.from('messages').delete().neq('id', '0');
        if (error5) console.error('Error clearing messages:', error5);

        return { success: true };
    },

    // --- CHAT SYSTEM ---
    async sendMessage(msg: Omit<import('@/types').ChatMessage, 'id' | 'timestamp'>) {
        const { data, error } = await supabase.from('messages').insert({
            sender_id: msg.senderId,
            receiver_id: msg.receiverId,
            message: msg.message
        }).select().single();

        if (error) {
            if (error.code === 'PGRST205') {
                console.error("Supabase SQL Table Not Created:", error.message);
                throw new Error("Missing 'messages' table in database. Run SQL migration first.");
            }
            throw error;
        }

        return {
            data: {
                id: data.id,
                senderId: data.sender_id,
                receiverId: data.receiver_id,
                message: data.message,
                timestamp: data.timestamp
            },
            error: null
        };
    },

    async getOnlineUserIds(): Promise<string[]> {
        const { data, error } = await supabase.from('sessions').select('*');
        if (error) {
            console.error('Error fetching sessions:', error);
            return [];
        }

        const now = Date.now();
        const activeIds = data
            .map(row => row.data as import('@/types').LoginSession)
            .filter(session => {
                const lastActive = new Date(session.lastActive).getTime();
                return (now - lastActive) < 10 * 60 * 1000; // 10 minutes for "Online"
            })
            .map(session => session.userId);

        return Array.from(new Set(activeIds));
    },

    async getRecentMessages(limit = 200, currentUserId?: string) {
        if (!currentUserId) {
            console.warn("getRecentMessages called without currentUserId. Returning empty array for privacy.");
            return [];
        }

        let query = supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

        const { data, error } = await query
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            if (error.code === 'PGRST205') {
                console.warn("Supabase 'messages' table is missing. Returning empty chat history.");
                return [];
            }
            throw error;
        }

        // Map DB snake_case to camelCase
        return (data || []).map(row => ({
            id: row.id,
            senderId: row.sender_id,
            receiverId: row.receiver_id,
            message: row.message,
            timestamp: row.timestamp
        })).reverse() as import('@/types').ChatMessage[]; // Reverse to chronological
    },

    subscribeToMessages(callback: (msg: import('@/types').ChatMessage) => void) {
        const channel = supabase.channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const row = payload.new;
                    callback({
                        id: row.id,
                        senderId: row.sender_id,
                        receiverId: row.receiver_id,
                        message: row.message,
                        timestamp: row.timestamp
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
};
