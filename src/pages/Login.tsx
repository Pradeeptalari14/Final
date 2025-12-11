import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // First try standard Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                // FALLBACK REMOVED for Security:
                // We no longer query the public 'users' table for passwords.
                // All users must be registered in Supabase Auth.
                throw error;
            } else {
                navigate('/');
            }
        } catch (err: any) {
            console.error("Login failed:", err);
            setError(err.message || "Authentication failed. Please verify your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: "url('/login-bg.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            {/* Overlay for readability */}
            <div className="absolute inset-0 bg-slate-950/60 z-0 backdrop-blur-[2px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative"
            >
                {/* Glass Card */}
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
                <div className="relative bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-8 space-y-2">
                        <div className="p-3 bg-white/10 rounded-xl text-white mb-2">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Unicharm Operations</h1>
                        <p className="text-slate-400 text-sm">Secure Access Portal</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Email or Username</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                placeholder="Enter your credentials..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            disabled={isLoading}
                            className={cn(
                                "w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2",
                                isLoading && "opacity-80 cursor-wait"
                            )}
                        >
                            {isLoading ? "Authenticating..." : (
                                <><span>Sign In</span> <LogIn size={18} /></>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
