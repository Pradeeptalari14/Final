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
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4 bg-gradient-to-br from-slate-100 to-slate-200">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: "url('/bg-v2.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            {/* Overlay - lighter for white theme */}
            <div className="absolute inset-0 bg-slate-900/40 z-0 backdrop-blur-[2px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Premium White Card */}
                <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-8 space-y-2">
                        <div className="p-3 bg-blue-600/10 rounded-xl text-blue-600 mb-2">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Unicharm Operations</h1>
                        <p className="text-slate-500 text-sm">Secure Access Portal</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email or Username</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                                placeholder="Enter your credentials..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            disabled={isLoading}
                            className={cn(
                                "w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2",
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
