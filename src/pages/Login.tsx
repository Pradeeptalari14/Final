import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Role } from '@/types';
import { Loader2, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import RegisterModal from '@/components/auth/RegisterModal';

export default function LoginPage() {
    const navigate = useNavigate();
    const { users, setCurrentUser, logSecurityEvent, updateUser } = useData();
    const { manualLogin } = useAuth();
    const { setDevRole } = useAppState();

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: '' as Role | '' // Allow empty initial state
    });

    const formatRole = (role: Role | '') => {
        if (!role) return '';
        switch (role) {
            case Role.STAGING_SUPERVISOR:
                return 'STAGING SUPERVISOR';
            case Role.LOADING_SUPERVISOR:
                return 'LOADING SUPERVISOR';
            case Role.SHIFT_LEAD:
                return 'SHIFT LEAD';
            case Role.ADMIN:
                return 'ADMIN';
            case Role.SUPER_ADMIN:
                return 'SUPER ADMIN';
            default:
                return role;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Check Global/Timer Lockout
        if (lockoutTime && Date.now() < lockoutTime) {
            const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
            setError(`Account/Interface locked. Try again in ${remaining}s.`);
            return;
        }

        setLoading(true);
        setError(null);

        // 2. Validate Role Selection
        if (!formData.role) {
            setError('Please select a role.');
            setLoading(false);
            return;
        }

        // 3. Find user
        const foundUser = users.find(
            (u) => u.username.toLowerCase() === formData.username.toLowerCase()
        );

        if (foundUser) {
            // 4. Check Persistent Lock
            if (foundUser.isLocked) {
                setError(
                    'Account is permanently locked due to security risks. Contact Administrator.'
                );
                setLoading(false);
                logSecurityEvent(
                    'LOGIN_ATTEMPT_LOCKED',
                    `Locked user ${foundUser.username} tried to login`,
                    foundUser.username,
                    'MEDIUM'
                );
                return;
            }

            // 5. Strict Password Check
            if (!foundUser.password || foundUser.password !== formData.password) {
                const attempts = failedAttempts + 1;
                setFailedAttempts(attempts);

                const isAdminAttempt = formData.role === Role.ADMIN;
                const maxAttempts = 5;

                if (attempts >= maxAttempts) {
                    if (isAdminAttempt) {
                        // Admin gets a 60s timer lockout (Requested by User)
                        const lockUntil = Date.now() + 60000;
                        setLockoutTime(lockUntil);
                        setError('Too many failed attempts. Admin security cooldown: 60 seconds.');
                        logSecurityEvent(
                            'ADMIN_LOCKOUT_TIMER',
                            `Admin ${formData.username} triggered 60s cooldown`,
                            formData.username,
                            'HIGH'
                        );
                    } else {
                        // Others get HARD LOCKED (Database update)
                        await updateUser({ ...foundUser, isLocked: true });
                        setError('Too many failed attempts. Account has been SECURELY LOCKED.');
                        logSecurityEvent(
                            'USER_HARD_LOCKED',
                            `User ${formData.username} was hard-locked after 5 failures`,
                            formData.username,
                            'CRITICAL'
                        );
                    }
                } else {
                    setError(`Invalid password. ${maxAttempts - attempts} attempts remaining.`);
                    logSecurityEvent(
                        'LOGIN_FAILED',
                        `Failed login attempt for ${formData.username}`,
                        formData.username,
                        'LOW'
                    );
                }
                setLoading(false);
                return;
            }

            // 6. Strict Approval Check
            if (!foundUser.isApproved) {
                setError('Account is pending Admin approval.');
                setLoading(false);
                return;
            }

            // 7. Strict Role Check
            if (foundUser.role !== formData.role) {
                setError(`Incorrect role selected. This user is a ${foundUser.role}.`);
                setLoading(false);
                return;
            }

            const finalRole = foundUser.role;

            setTimeout(() => {
                setLoading(false);
                setFailedAttempts(0);
                setLockoutTime(null);
                setDevRole(finalRole);
                setCurrentUser(foundUser);
                manualLogin(foundUser); // Update AuthContext state
                navigate('/');
            }, 500);
        } else {
            setError('User not found.');
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen lg:h-screen lg:overflow-hidden bg-[#fce4ec] font-sans">
            <RegisterModal
                isOpen={showRegister}
                onClose={() => setShowRegister(false)}
                initialRole={formData.role as Role}
            />

            {/* Premium Sricity Background */}
            <div className="fixed inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
                    style={{ backgroundImage: "url('/sricity-bg.png')" }}
                />
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]" />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(circle at 40% 50%, transparent 0%, rgba(2,6,23,0.15) 100%)'
                    }}
                />
            </div>

            {/* Header Content - Top Left Branding */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative p-6 pb-0 lg:absolute lg:top-10 lg:left-12 lg:p-0 z-20 flex items-center gap-4 max-w-[80%]"
            >
                <div className="relative group shrink-0">
                    <img
                        src="/unicharm-logo.png"
                        alt="Unicharm"
                        className="relative w-12 lg:w-16 h-auto drop-shadow-2xl brightness-110"
                    />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-xl lg:text-3xl font-serif font-black text-slate-800 tracking-tight leading-none">
                        Unicharm Operations
                    </h1>
                    <p className="text-[10px] lg:text-xs uppercase tracking-[0.3em] font-bold text-slate-700 mt-1.5">
                        Supply Chain Management
                    </p>
                </div>
            </motion.div>

            {/* MAIN CONTENT - STRICT 50/50 GRID */}
            {/* Using h-full on the grid ensures it fills the viewport height exactly on Desktop */}
            <div className="relative z-10 w-full min-h-screen flex flex-col lg:grid lg:grid-cols-2 lg:h-full">
                {/* LEFT COLUMN: Premium Products - POSITIONED BELOW HEADER */}
                {/* top padding ensures it clears the absolute header; justify-start keeps it from floating up */}
                <div className="flex flex-col justify-center lg:justify-start items-center p-8 lg:pt-32 lg:h-full order-2 lg:order-1">
                    <div className="flex flex-col items-center mb-4 lg:mt-12 lg:mb-4 opacity-90">
                        <span
                            className="text-xs lg:text-sm font-bold italic text-slate-700 tracking-[0.6em] uppercase text-center"
                            style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                            Premium Products
                        </span>
                        <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-slate-600 to-transparent mt-3" />
                    </div>

                    <div className="flex flex-row flex-wrap justify-center items-center gap-10 lg:gap-24 w-full max-w-full px-4">
                        {/* MamyPoko */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="group relative shrink-0 transition-all duration-500 hover:-translate-y-4 hover:scale-140 z-10 hover:z-50"
                        >
                            <img
                                src="/brand-mamypoko.png"
                                alt="MamyPoko"
                                className="h-20 lg:h-40 w-auto drop-shadow-2xl filter brightness-105 relative z-10"
                            />
                            {/* Water Reflection */}
                            <div className="absolute -bottom-10 lg:-bottom-20 left-0 right-0 h-10 lg:h-20 overflow-hidden pointer-events-none opacity-[0.25] transform scale-y-[-1] blur-[2px] transition-all duration-500 group-hover:opacity-40 group-hover:blur-[1px]">
                                <img
                                    src="/brand-mamypoko.png"
                                    className="h-20 lg:h-40 w-auto mx-auto"
                                    alt=""
                                />
                            </div>
                        </motion.div>

                        {/* SOFY */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="group relative shrink-0 transition-all duration-500 hover:-translate-y-4 hover:scale-140 z-10 hover:z-50"
                        >
                            <img
                                src="/brand-sofy.png"
                                alt="SOFY"
                                className="h-16 lg:h-32 w-auto drop-shadow-2xl filter brightness-105 relative z-10"
                            />
                            {/* Water Reflection */}
                            <div className="absolute -bottom-8 lg:-bottom-16 left-0 right-0 h-8 lg:h-16 overflow-hidden pointer-events-none opacity-[0.25] transform scale-y-[-1] blur-[2px] transition-all duration-500 group-hover:opacity-40 group-hover:blur-[1px]">
                                <img
                                    src="/brand-sofy.png"
                                    className="h-16 lg:h-32 w-auto mx-auto"
                                    alt=""
                                />
                            </div>
                        </motion.div>

                        {/* Lifree */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="group relative shrink-0 transition-all duration-500 hover:-translate-y-4 hover:scale-140 z-10 hover:z-50"
                        >
                            <img
                                src="/brand-lifree.png"
                                alt="Lifree"
                                className="h-16 lg:h-32 w-auto drop-shadow-2xl filter brightness-105 relative z-10"
                            />
                            {/* Water Reflection */}
                            <div className="absolute -bottom-8 lg:-bottom-16 left-0 right-0 h-8 lg:h-16 overflow-hidden pointer-events-none opacity-[0.25] transform scale-y-[-1] blur-[2px] transition-all duration-500 group-hover:opacity-40 group-hover:blur-[1px]">
                                <img
                                    src="/brand-lifree.png"
                                    className="h-16 lg:h-32 w-auto mx-auto"
                                    alt=""
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Login Portal - MEDIUM SIZE */}
                {/* Centered vertically, aligned right on desktop */}
                <div className="flex flex-col justify-center items-center lg:items-end p-4 md:p-8 lg:pr-32 flex-1 lg:h-full order-1 lg:order-2 min-h-[500px] lg:min-h-0">
                    <div className="w-full max-w-[320px] lg:max-w-[380px]">
                        {/* Header Text - Scaled Down */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 lg:mb-8 text-center lg:text-right"
                        >
                            <h1
                                className="text-3xl lg:text-5xl tracking-tight leading-none text-slate-900"
                                style={{ fontFamily: 'Outfit, sans-serif' }}
                            >
                                <span className="font-light block lg:inline mb-1 lg:mb-0 lg:mr-2">
                                    Welcome to
                                </span>
                                <span className="font-black text-[#003366]">Sricity</span>
                            </h1>
                        </motion.div>

                        {/* Login Card - Premium Glass Effect */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'circOut' }}
                            className="w-full p-6 lg:p-8 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/20 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <div className="text-center mb-5 lg:mb-6">
                                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-3">
                                        <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em] text-white">
                                            Secure Authentication
                                        </span>
                                    </div>
                                    <h3 className="text-lg lg:text-xl font-bold text-white tracking-tight font-sans">
                                        Login Portal
                                    </h3>
                                    <p className="text-[10px] lg:text-xs font-bold text-white/90 tracking-[0.3em] uppercase mt-2">
                                        SCM-FG Operations
                                    </p>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                                    >
                                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                                        <p className="text-[10px] lg:text-xs text-red-100 font-medium leading-tight">
                                            {error}
                                        </p>
                                    </motion.div>
                                )}

                                <form onSubmit={handleLogin} className="space-y-3 lg:space-y-4">
                                    <div className="space-y-3 lg:space-y-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Username"
                                                value={formData.username}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        username: e.target.value
                                                    })
                                                }
                                                className="w-full h-10 lg:h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs lg:text-sm font-semibold"
                                                required
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Password"
                                                value={formData.password}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        password: e.target.value
                                                    })
                                                }
                                                className="w-full h-10 lg:h-11 bg-white/5 border border-white/10 rounded-xl px-4 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs lg:text-sm font-semibold"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/20 hover:text-white transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={16} />
                                                ) : (
                                                    <Eye size={16} />
                                                )}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsRoleOpen(!isRoleOpen)}
                                                className={`w-full h-10 lg:h-11 border border-white/10 px-4 text-left text-white focus:outline-none transition-all text-xs lg:text-sm font-semibold flex items-center justify-between
                                                    ${isRoleOpen ? 'bg-slate-800 rounded-t-xl border-b-transparent' : 'bg-white/5 rounded-xl hover:bg-white/10'}
                                                `}
                                            >
                                                <span className="text-white/70">
                                                    {formatRole(formData.role) || 'Select Role'}
                                                </span>
                                                <LogIn
                                                    size={16}
                                                    className={`transition-all ${isRoleOpen ? 'text-blue-400' : 'text-white/20'}`}
                                                />
                                            </button>

                                            {isRoleOpen && (
                                                <div className="absolute top-full left-0 right-0 bg-slate-800 border border-white/10 border-t-0 rounded-b-xl shadow-2xl overflow-hidden z-[50]">
                                                    {[
                                                        Role.STAGING_SUPERVISOR,
                                                        Role.LOADING_SUPERVISOR,
                                                        Role.SHIFT_LEAD,
                                                        Role.ADMIN
                                                    ].map((role) => (
                                                        <button
                                                            key={role}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, role });
                                                                setIsRoleOpen(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3 text-[10px] lg:text-xs font-medium hover:bg-white/5 transition-colors text-white/50 hover:text-white border-b border-white/5 last:border-0"
                                                        >
                                                            {formatRole(role)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-11 lg:h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center uppercase tracking-[0.2em] text-[10px] lg:text-xs mt-5"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin w-4 h-4 lg:w-5 lg:h-5" />
                                        ) : (
                                            'Sign In'
                                        )}
                                    </Button>
                                </form>

                                <div className="mt-6 lg:mt-8 text-center border-t border-white/5 pt-5 lg:pt-6">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-[9px] lg:text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] cursor-default">
                                            New user?
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowRegister(true);
                                            }}
                                            className="group relative inline-flex items-center justify-center"
                                        >
                                            <span className="text-[9px] lg:text-[10px] font-black text-blue-400 group-hover:text-blue-300 transition-colors uppercase tracking-[0.2em]">
                                                Request Account
                                            </span>
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
