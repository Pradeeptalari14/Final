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
    const [selectedRole, setSelectedRole] = useState("Staging Supervisor");
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
            <div className="absolute inset-0 bg-black/40 z-0" />

            {/* Login Card - Right Aligned */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="w-full max-w-sm relative z-10 mr-0 md:mr-16"
            >
                {/* Dark Glass Card */}
                <div className="relative bg-black/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-2xl">

                    {/* Header Section */}
                    <div className="flex flex-col items-center mb-10 space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full flex items-center justify-center mb-2 p-1.5 relative overflow-hidden shadow-2xl border border-white/10">
                            <img src={logoImage} alt="Unicharm" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Unicharm SCM</h1>
                            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">FG Warehouse Operations</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-200 text-xs mb-4">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        <div className="relative group">
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/10 border border-white/5 rounded-lg px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm backdrop-blur-sm"
                                placeholder="Username"
                            />
                        </div>

                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/10 border border-white/5 rounded-lg px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm backdrop-blur-sm"
                                placeholder="Password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {/* Role Dropdown */}
                        <div className="relative group">
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full bg-white/10 border border-white/5 rounded-lg px-4 py-3.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm backdrop-blur-sm appearance-none cursor-pointer"
                            >
                                <option value="Staging Supervisor" className="bg-slate-900 text-slate-300">Staging Supervisor</option>
                                <option value="Loading Supervisor" className="bg-slate-900 text-slate-300">Loading Supervisor</option>
                                <option value="Admin" className="bg-slate-900 text-slate-300">Admin</option>
                                <option value="Security" className="bg-slate-900 text-slate-300">Security</option>
                                <option value="Forklift Operator" className="bg-slate-900 text-slate-300">Forklift Operator</option>
                            </select>
                            {/* Custom Arrow */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            className={cn(
                                "w-full py-3.5 px-4 bg-[#FF8C00] hover:bg-[#FF7000] text-white font-bold rounded-lg transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 mt-8",
                                isLoading && "opacity-80 cursor-wait"
                            )}
                        >
                            {isLoading ? "Authenticating..." : (
                                <> <LogIn size={18} /> <span>Login</span></>
                            )}
                        </button>

                        <div className="text-center mt-8">
                            <p className="text-slate-500 text-xs">
                                Don't have an account? <span className="text-[#FF8C00] cursor-pointer hover:underline font-medium">Register now</span>
                            </p>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
