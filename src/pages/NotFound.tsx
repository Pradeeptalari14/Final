import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/contexts/AppStateContext';
import { t } from '@/lib/i18n';

export default function NotFound() {
    const navigate = useNavigate();
    const { settings } = useAppState();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full text-center space-y-8 p-12 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden"
            >
                {/* Decorative background gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-6 border border-slate-200 dark:border-slate-700 shadow-inner">
                        <AlertTriangle size={40} />
                    </div>

                    <h1 className="text-6xl font-black mb-2 bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold text-foreground">
                        {t('page_not_found', settings.language)}
                    </h2>
                    <p className="text-muted-foreground mt-4 leading-relaxed">
                        The page you are looking for might have been moved, deleted, or simply
                        doesn&apos;t exist.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-4 relative">
                    <Button
                        onClick={() => navigate('/')}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        {t('back_to_dashboard', settings.language)}
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="w-full h-12 rounded-xl border border-border/50 hover:bg-muted font-medium flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </Button>
                </div>

                <div className="pt-8 border-t border-border/50">
                    <p className="text-xs text-muted-foreground opacity-50 uppercase tracking-widest font-bold">
                        Unicharm Smart Operations
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
