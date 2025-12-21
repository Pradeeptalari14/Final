import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check SessionStorage (Tab Isolated) FIRST
        const localUser = sessionStorage.getItem('currentUser');
        if (localUser) {
            try {
                const parsed = JSON.parse(localUser);
                // Create a fake session structure for compatibility
                const fakeSession: any = {
                    user: parsed,
                    access_token: 'local-session',
                };
                setSession(fakeSession);
                setLoading(false);
                return; // SKIP Supabase check if we have a local user
            } catch (e) {
                console.error("Invalid local session", e);
            }
        }

        // 2. Fallback to Supabase (Global) Check
        supabase.auth.getSession().then(({ data, error }: { data: { session: Session | null }, error: any }) => {
            if (error) {
                console.error("AuthCheck Failed:", error.message);
            }
            if (!localUser) { // Only set if no local user found
                setSession(data?.session ?? null);
            }
            setLoading(false);
        }).catch((err: any) => {
            console.error("Unexpected Auth Error:", err);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            // Only update if we don't have a forced local session override
            if (!sessionStorage.getItem('currentUser')) {
                setSession(session);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
