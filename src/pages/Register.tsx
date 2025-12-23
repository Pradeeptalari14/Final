
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Role } from '@/types';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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

    const formatRole = (role: string) => {
        return role.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            // Check if user exists
            const { data: existing } = await supabase.from('users').select('*').eq('data->>username', formData.username).single();
            if (existing) {
                throw new Error("Username already taken");
            }

            const newId = crypto.randomUUID();
            const newUser = {
                id: newId,
                username: formData.username,
                password: formData.password,
                role: formData.role,
                fullName: formData.username,
                email: '',
                isApproved: false // Require Admin Approval
            };

            const { error } = await supabase.from('users').insert({
                id: newId,
                data: newUser
            });

            if (error) throw error;

            alert("Registration successful! Waiting for Admin Approval.");
            navigate('/login');

        } catch (error: any) {
            console.error(error);
            alert(error.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-screen w-full font-sans overflow-hidden bg-[#fce4ec]">
            {/* Premium Sricity Background */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
                    style={{ backgroundImage: "url('/sricity-bg.png')" }}
                />
                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px]" />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(2,6,23,0.1) 100%)' }}
                />
            </div>

            {/* Header Content - Top Left Branding */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-10 left-12 z-20 flex items-center gap-5"
            >
                <img src="/unicharm-logo.png" alt="Unicharm" className="w-14 h-auto drop-shadow-2xl brightness-110" />
                <div className="flex flex-col">
                    <h1 className="text-2xl font-serif font-black text-slate-800 tracking-tight leading-none">
                        Unicharm Operations
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-slate-500 mt-1.5 opacity-80">
                        Supply Chain Management
                    </p>
                </div>
            </motion.div>

            {/* Header Content - Top Right Welcome */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-12 right-12 z-20 text-right"
            >
                <h2 className="text-5xl font-serif text-slate-800 font-light tracking-tighter italic leading-tight">
                    Welcome to Sricity
                </h2>
                <p className="text-sm font-bold text-slate-600 tracking-[0.3em] uppercase opacity-40 mt-1">
                    SCM-FG Operations
                </p>
            </motion.div>

            {/* CENTER: Register Form Card */}
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full max-w-[420px] p-8 rounded-[2.5rem] bg-slate-950/85 backdrop-blur-2xl border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
                >
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-400">
                                Access Request Portal
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1">
                            <input
                                type="text"
                                placeholder="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all text-sm font-medium"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-[13px] focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20 font-medium"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/20"
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="Confirm"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-[13px] focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20 font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer font-medium"
                            >
                                {Object.values(Role).map(role => (
                                    <option key={role} value={role} className="text-black">
                                        {formatRole(role)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-2xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center uppercase tracking-[0.2em] text-xs"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Request Access"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center justify-center gap-2 mx-auto text-[10px] font-bold text-white/20 hover:text-blue-400 transition-all uppercase tracking-[0.3em]"
                        >
                            <ArrowLeft size={14} /> Back to Sign In
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Content: Premium Product Brands */}
            <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center gap-16 md:gap-24 opacity-30 grayscale contrast-150">
                <img src="/brand-mamypoko.png" alt="MamyPoko" className="h-10 md:h-12 w-auto" />
                <img src="/brand-sofy.png" alt="SOFY" className="h-8 md:h-10 w-auto" />
                <img src="/brand-lifree.png" alt="Lifree" className="h-8 md:h-10 w-auto" />
            </div>
        </div>
    );
}
