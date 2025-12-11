import { createContext, useContext, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (type: Toast['type'], message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (type: Toast['type'], message: string, duration = 3000) => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, type, message, duration }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <Toaster toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

// Internal Toaster Component
function Toaster({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
    // Portal to attach to document body to assume top layer
    return createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
        </div>,
        document.body
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast, onDismiss: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, toast.duration);
        return () => clearTimeout(timer);
    }, [toast.duration, onDismiss]);

    const icons = {
        success: <CheckCircle className="text-emerald-400" size={20} />,
        error: <AlertCircle className="text-red-400" size={20} />,
        info: <Info className="text-blue-400" size={20} />
    };

    const styles = {
        success: "border-emerald-500/20 bg-emerald-950/90 text-emerald-100",
        error: "border-red-500/20 bg-red-950/90 text-red-100",
        info: "border-blue-500/20 bg-blue-950/90 text-blue-100"
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md min-w-[300px]",
                styles[toast.type]
            )}
        >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <p className="flex-1 text-sm font-medium leading-tight">{toast.message}</p>
            <button onClick={onDismiss} className="text-white/50 hover:text-white transition-colors">
                <X size={16} />
            </button>
        </motion.div>
    );
}
