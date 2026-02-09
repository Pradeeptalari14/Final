import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export const authService = {
    async getSession() {
        return await supabase.auth.getSession();
    },

    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },

    async signOut() {
        return await supabase.auth.signOut();
    },

    // Helper to normalize user data if needed in future
    getCurrentUser() {
        return supabase.auth.getUser();
    }
};
