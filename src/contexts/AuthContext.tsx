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
    const [session, setSession] = useState<Session | null>(() => {
        const localUser = sessionStorage.getItem('currentUser');
        if (localUser) {
            try {
                return {
                    user: JSON.parse(localUser),
                    access_token: 'local-session',
                    refresh_token: '',
                    expires_in: 3600,
                    token_type: 'bearer'
                } as Session;
            } catch (e) {
                console.error('Invalid local session', e);
            }
        }
        return null;
    });
    const [loading, setLoading] = useState(() => !sessionStorage.getItem('currentUser'));

    useEffect(() => {
        // Fallback to Supabase (Global) Check if not already loaded from local
        if (!session) {
            supabase.auth
                .getSession()
                .then(({ data, error }: { data: { session: Session | null }; error: { message: string } | null }) => {
                    if (error) {
                        console.error('AuthCheck Failed:', error.message);
                    }
                    setSession(data?.session ?? null);
                    setLoading(false);
                })
                .catch((err: unknown) => {
                    console.error('Unexpected Auth Error:', err);
                    setLoading(false);
                });
        }

        const {
            data: { subscription }
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
