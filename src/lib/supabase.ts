import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Environment Variables');
}

// Safe initialization
export const supabase = (() => {
    try {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase variables missing');
        }
        return createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error('Supabase Initialization Failed:', error);
        // Return a mock/proxy that alerts on use, preventing white-screen crash on boot
        return new Proxy({} as any, {
            get: () => () => Promise.reject("Supabase not initialized properly. Check .env")
        });
    }
})();
