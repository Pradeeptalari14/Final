import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Role } from '@/types';
import { Loader2, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { motion } from 'framer-motion';
import RegisterModal from '@/components/auth/RegisterModal';

export default function LoginPage() {
    const navigate = useNavigate();
    const { setDevRole, users, setCurrentUser } = useData();


    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: Role.STAGING_SUPERVISOR
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Find user
        const foundUser = users.find(u => u.username.toLowerCase() === formData.username.toLowerCase());

        // Simple password check (Mock auth for now as per legacy, or check stored password)
        // If user exists, we check if password matches (assuming cleartext in this simulated env, or just allow if username matches for now)
        // User request "edit passowrds" implies passwords matter.
        // Let's check matching password if it exists on the user object.

        if (foundUser) {
            // Strict Password Check
            if (!foundUser.password || foundUser.password !== formData.password) {
                setError("Invalid password");
                setLoading(false);
                return;
            }

            // Strict Approval Check
            if (!foundUser.isApproved) {
                setError("Account is pending Admin approval.");
                setLoading(false);
                return;
            }

            // Strict Role Check (Requested by User)
            if (foundUser.role !== formData.role) {
                setError(`Incorrect role selected. This user is a ${foundUser.role}.`);
                setLoading(false);
                return;
            }

            const finalRole = foundUser.role;

            setTimeout(() => {
                setLoading(false);
                setDevRole(finalRole);
                setCurrentUser(foundUser);
                navigate(finalRole === Role.ADMIN ? '/admin' : '/');
            }, 500);

        } else {
            setError("User not found.");
            setLoading(false);
        }
    };

    return (
        <div className="relative h-screen w-full font-sans overflow-hidden">
            <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} />

            {/* Background Image - Full Screen Cover */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: "url('/bg-v2.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />
            {/* Subtle Overlay */}
            <div className="absolute inset-0 z-0 bg-black/20" />

            {/* Main Layout Container */}
            <div className="relative z-10 w-full h-full flex">

                {/* Left Side (Empty to show background content) */}
                <div className="hidden md:flex flex-1"></div>

                {/* Right Side - Full Height Glass Sidebar */}
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    // Increased transparency: bg-black/40 instead of brown/80
                    // Removed overflow-y-auto to enforce fit
                    className="w-full md:w-[450px] h-full bg-black/40 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col justify-center px-6 md:px-10 relative"
                >
                    {/* Decorative Top Accent - Thinner */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/50 via-orange-400/50 to-amber-300/50" />

                    <div className="w-full max-w-sm mx-auto flex flex-col h-full justify-center max-h-[800px]">

                        {/* Header */}
                        <div className="text-center space-y-3 mb-6">
                            {/* Straight Logo - No Rotation */}
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 shadow-inner ring-1 ring-white/10 backdrop-blur-md">
                                <img src="/unicharm-logo.png" alt="Logo" className="w-10 h-auto drop-shadow-md brightness-110" />
                            </div>
                            <div className="space-y-0.5">
                                <h1 className="text-2xl font-serif font-bold text-[#fcf5eb] tracking-tight">Unicharm Operations</h1>
                                <p className="text-[#d8c5b0] text-[9px] uppercase tracking-[0.3em] font-bold opacity-70">Supply Chain Management</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-12 h-px bg-white/10 mx-auto mb-6" />

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-2.5 rounded-lg bg-red-900/30 border border-red-500/20 flex items-center gap-3"
                            >
                                <AlertCircle size={14} className="text-red-200" />
                                <p className="text-[11px] text-red-100 font-medium">{error}</p>
                            </motion.div>
                        )}

                        {/* Form - Tighter Spacing */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#e8d5c4] uppercase tracking-widest pl-1 opacity-80">Username</label>
                                <div className="group relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-focus-within:bg-amber-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full h-11 bg-black/20 border border-white/5 rounded-xl pl-8 pr-4 text-[#fcf5eb] placeholder-[#e8d5c4]/20 focus:outline-none focus:border-amber-500/30 focus:bg-black/30 transition-all text-sm backdrop-blur-sm"
                                        required
                                        placeholder="Enter ID"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#e8d5c4] uppercase tracking-widest pl-1 opacity-80">Password</label>
                                <div className="group relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-focus-within:bg-amber-400 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full h-11 bg-black/20 border border-white/5 rounded-xl pl-8 pr-12 text-[#fcf5eb] placeholder-[#e8d5c4]/20 focus:outline-none focus:border-amber-500/30 focus:bg-black/30 transition-all text-sm backdrop-blur-sm"
                                        required
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/30 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#e8d5c4] uppercase tracking-widest pl-1 opacity-80">Role</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-focus-within:bg-amber-400 transition-colors" />
                                    </div>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                                        className="w-full h-11 bg-black/20 border border-white/5 rounded-xl pl-8 pr-4 text-[#fcf5eb] focus:outline-none focus:border-amber-500/30 focus:bg-black/30 transition-all text-sm appearance-none cursor-pointer"
                                    >
                                        <option value={Role.STAGING_SUPERVISOR} className="bg-[#2a2422] text-[#e8d5c4]">Staging Supervisor</option>
                                        <option value={Role.LOADING_SUPERVISOR} className="bg-[#2a2422] text-[#e8d5c4]">Loading Supervisor</option>
                                        <option value={Role.SHIFT_LEAD} className="bg-[#2a2422] text-[#e8d5c4]">Shift Lead</option>
                                        <option value={Role.ADMIN} className="bg-[#2a2422] text-[#e8d5c4]">Admin</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 mt-6 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl text-sm shadow-xl shadow-orange-900/20 border-t border-white/10 transition-all duration-300 transform active:scale-[0.98] tracking-widest uppercase"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-3">Sign In <LogIn size={16} /></span>}
                            </Button>
                        </form>

                        {/* Register Option */}
                        <div className="text-center pt-6">
                            <button
                                onClick={() => setShowRegister(true)}
                                className="text-[11px] text-[#d8c5b0]/60 hover:text-[#fcf5eb] transition-colors"
                            >
                                New user? <span className="font-bold text-[#e8d5c4] ml-1 border-b border-transparent hover:border-[#e8d5c4]">Create Account</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
