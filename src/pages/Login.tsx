import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import bgImage from '@/assets/bg-v2.png';
import logoImage from '@/assets/login-logo.png';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
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
        <div className="min-h-screen w-full flex items-center justify-center md:justify-end relative overflow-hidden p-4 md:p-16 bg-slate-950">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            {/* Overlay - Darker for contrast */}
            <div className="absolute inset-0 bg-black/20 z-0" />

            {/* Login Card - Right Aligned */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="w-full max-w-md relative z-10 mr-0 md:mr-10"
            >
                {/* Dark Glass Card */}
                <div className="relative bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

                    {/* Header Section */}
                    <div className="flex flex-col items-center mb-8 space-y-3">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-2 p-1 relative overflow-hidden shadow-lg border border-white/20">
                            <img src={logoImage} alt="Unicharm" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white tracking-tight">Unicharm SCM</h1>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mt-1">FG Warehouse Operations</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400 ml-1">Username</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm"
                                placeholder="Enter your credentials..."
                            />
                        </div>

                        <div className="space-y-1 relative">
                            <label className="text-xs font-medium text-slate-400 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Staging Supervisor Dropdown Placeholder (Visual only as per mock) */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400 ml-1">Role Context</label>
                            <div className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 text-sm flex justify-between items-center cursor-not-allowed opacity-75">
                                <span>Global Operations</span>
                                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">Default</span>
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            className={cn(
                                "w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 mt-6",
                                isLoading && "opacity-80 cursor-wait"
                            )}
                        >
                            {isLoading ? "Authenticating..." : (
                                <> <LogIn size={18} /> <span>Login</span></>
                            )}
                        </button>

                        <div className="text-center mt-6">
                            <p className="text-slate-500 text-xs">
                                Don't have an account? <span className="text-orange-500 cursor-pointer hover:underline">Register now</span>
                            </p>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
