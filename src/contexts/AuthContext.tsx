import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { authService } from '@/services/authService';
import { User as AppUser } from '@/types';

interface AuthContextType {
    session: Session | null;
    user: SupabaseUser | null; // Keep as SupabaseUser for compatibility
    loading: boolean;
    signOut: () => Promise<void>;
    manualLogin: (user: AppUser) => Promise<void>;
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
            authService.getSession()
                .then(({ data, error }) => {
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
        } = authService.onAuthStateChange((_event, session) => {
            // Only update if we don't have a forced local session override
            if (!sessionStorage.getItem('currentUser')) {
                setSession(session);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [session]);

    const manualLogin = async (user: AppUser) => {
        const fakeSession = {
            user: user as unknown as SupabaseUser, // Cast AppUser to SupabaseUser for session compatibility
            access_token: 'local-session',
            refresh_token: '',
            expires_in: 3600,
            token_type: 'bearer'
        } as unknown as Session;
        setSession(fakeSession);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    };

    const signOut = async () => {
        await authService.signOut();
        setSession(null);
        sessionStorage.removeItem('currentUser');
    };

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut, manualLogin }}>
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
