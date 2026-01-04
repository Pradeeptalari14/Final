import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mock Client for Local Mode (No API Key required)
const createMockClient = () => ({
    from: (_table: string) => ({
        select: () => ({
            eq: () => ({ single: () => ({ data: null, error: null }), maybeSingle: () => ({ data: null, error: null }), range: () => ({ data: [], error: null }) }),
            order: () => ({ range: () => ({ data: [], error: null }), limit: () => ({ data: [], error: null }) }),
            or: () => ({ data: [], error: null }),
            data: [],
            error: null
        }),
        insert: () => ({ error: null }),
        update: () => ({ eq: () => ({ error: null }) }),
        delete: () => ({ eq: () => ({ error: null }) }),
    }),
    channel: () => ({
        on: () => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            subscribe: (cb: any) => {
                if (typeof cb === 'function') cb('SUBSCRIBED'); // Fake success
                return { unsubscribe: () => { } };
            }
        })
    }),
    removeChannel: () => { },
    auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null })
    },
    storage: {
        from: () => ({
            upload: () => Promise.resolve({ data: null, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: '' } })
        })
    }
});

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : createMockClient() as any;
