
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Role } from '@/types';
import { Eye, EyeOff, Loader2, ArrowLeft, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: Role.STAGING_SUPERVISOR
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate registration process
        setTimeout(() => {
            setLoading(false);
            // In a real app, this would call an API
            alert("Registration successful! Please login.");
            navigate('/login');
        }, 1500);
    };

    return (
        <div className="relative h-screen w-full overflow-hidden font-sans">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `url('/bg-v2.png')`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 z-0 bg-black/40" />

            {/* Content Container - Two Column Layout */}
            <div className="relative z-10 h-full w-full flex flex-col md:flex-row min-h-screen">

                {/* Left Side: Spacer */}
                <div className="hidden md:flex flex-1 flex-col justify-center px-16 lg:px-24">
                </div>

                {/* Right Side: Register Card */}
                <div className="flex-1 flex items-center justify-center px-4 md:px-16 lg:justify-end lg:pr-32">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full max-w-[420px]"
                    >
                        {/* Consistent Styling with Login */}
                        <div className="relative bg-black/30 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden ring-1 ring-white/10">

                            {/* Decor header line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 opacity-90" />

                            {/* Header */}
                            <div className="text-center mb-6 mt-2">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/80 to-pink-600/80 shadow-lg shadow-purple-500/20 mb-4 ring-2 ring-white/20">
                                    <User className="w-7 h-7 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-white tracking-tight mb-1 drop-shadow-md">Create Account</h1>
                                <p className="text-white/80 text-sm font-medium">Join Unicharm Operations</p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-white/90 ml-1 uppercase tracking-wider shadow-sm">Username</label>
                                    <input
                                        type="text"
                                        placeholder="Choose a username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full h-11 bg-black/40 border border-white/20 rounded-xl px-4 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:bg-black/60 transition-all text-sm backdrop-blur-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-1 relative">
                                    <label className="text-xs font-bold text-white/90 ml-1 uppercase tracking-wider shadow-sm">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full h-11 bg-black/40 border border-white/20 rounded-xl px-4 pr-12 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:bg-black/60 transition-all text-sm backdrop-blur-sm"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 relative">
                                    <label className="text-xs font-bold text-white/90 ml-1 uppercase tracking-wider shadow-sm">Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full h-11 bg-black/40 border border-white/20 rounded-xl px-4 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:bg-black/60 transition-all text-sm backdrop-blur-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-white/90 ml-1 uppercase tracking-wider shadow-sm">Role Request</label>
                                    <div className="relative">
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                                            className="w-full h-11 bg-black/40 border border-white/20 rounded-xl px-4 text-white focus:outline-none focus:border-purple-400 focus:bg-black/60 transition-all text-sm appearance-none cursor-pointer backdrop-blur-sm"
                                        >
                                            {Object.values(Role).map(role => (
                                                <option key={role} value={role} className="bg-slate-900 text-white py-2">
                                                    {role.replace(/_/g, ' ')}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-base shadow-lg shadow-purple-500/30 border-none transition-all duration-300 transform active:scale-[0.98]"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">Create Account <User size={18} /></span>}
                                </Button>
                            </form>

                            <div className="mt-6 pt-4 border-t border-white/10 text-center">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2 w-full text-sm group"
                                >
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    Back to Login
                                </button>
                            </div>

                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
