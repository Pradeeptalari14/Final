import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Role } from '@/types';
import { supabase } from '@/lib/supabase';
import { Loader2, X, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: Role.STAGING_SUPERVISOR,
        fullName: '',
        email: '',
        empCode: ''
    });

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
                fullName: formData.fullName || formData.username,
                email: formData.email,
                empCode: formData.empCode,
                isApproved: false // Require Admin Approval
            };

            const { error } = await supabase.from('users').insert({
                id: newId,
                data: newUser
            });

            if (error) throw error;

            setSuccess(true);

            // Auto close after success
            setTimeout(() => {
                setSuccess(false);
                setFormData({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    role: Role.STAGING_SUPERVISOR,
                    fullName: '',
                    email: '',
                    empCode: ''
                });
                onClose();
            }, 3000);

        } catch (error: any) {
            console.error(error);
            alert(error.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Create Account</h3>
                                <p className="text-xs text-muted-foreground">Request access to dashboard</p>
                            </div>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {success ? (
                                <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in">
                                    <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">Registration Successful!</h3>
                                    <p className="text-muted-foreground px-4">
                                        Your account has been created and is pending approval.
                                        Please contact the administrator to activate your account.
                                    </p>
                                    <Button onClick={onClose} className="mt-4 w-full">Got it</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Username <span className="text-destructive">*</span></label>
                                            <input
                                                required
                                                value={formData.username}
                                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                                                placeholder="jdoe"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                                            <input
                                                value={formData.fullName}
                                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    {/* Added Email and EMP Code Fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Email Address <span className="text-destructive">*</span></label>
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">EMP Code</label>
                                            <input
                                                required
                                                value={formData.empCode}
                                                onChange={e => setFormData({ ...formData, empCode: e.target.value })}
                                                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                                                placeholder="EMP-001"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Password <span className="text-destructive">*</span></label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-background border border-input rounded-lg px-3 py-2 pr-10 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                                                placeholder="Create a password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Confirm Password <span className="text-destructive">*</span></label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                                            placeholder="Repeat password"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Role Request</label>
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                                        >
                                            {Object.values(Role).map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 mt-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Request Access"}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div >
            )
            }
        </AnimatePresence >
    );
}
