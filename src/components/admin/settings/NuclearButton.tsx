import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Trash2, AlertTriangle, Radiation } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { Role } from '@/types';
import { useUsers } from '@/contexts/UserContext';

export const NuclearButton = () => {
    const { currentUser } = useUsers();
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    // Guard 1: Only Super Admin can see this
    if (currentUser?.role !== Role.SUPER_ADMIN) return null;

    const handleNuclearReset = async () => {
        if (confirmText !== 'DELETE') return;

        setLoading(true);
        try {
            // 1. Wipe Supabase Data
            await dataService.resetAllData();

            // 2. Wipe Local Storage
            localStorage.clear();

            // 3. Force Reload
            window.location.reload();
        } catch (error) {
            console.error('Failed to nuke data:', error);
            alert('Failed to delete some data. Check console.');
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-sm border border-red-500"
                >
                    <Radiation size={16} className="animate-pulse" />
                    Reset All Data
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-red-200 bg-red-50/50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600 font-blac text-xl">
                        <AlertTriangle size={24} />
                        NUCLEAR OPTION
                    </DialogTitle>
                    <DialogDescription className="text-slate-700 font-medium pt-2">
                        Are you absolutely sure? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-white p-4 rounded-lg border border-red-100 space-y-3">
                    <p className="text-sm text-slate-600">
                        This will permanently delete:
                    </p>
                    <ul className="list-disc list-inside text-xs text-red-600 font-bold space-y-1">
                        <li>All Sheets (Staging & Loading)</li>
                        <li>All Users (except you if lucky, but assume all)</li>
                        <li>All Audit & Security Logs</li>
                        <li>All Local Browser Data</li>
                    </ul>
                    <div className="pt-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                            Type "DELETE" to confirm
                        </label>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="border-red-200 focus-visible:ring-red-500 font-mono"
                            placeholder="DELETE"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleNuclearReset}
                        disabled={confirmText !== 'DELETE' || loading}
                        className="bg-red-600 hover:bg-red-700 gap-2 font-bold w-full sm:w-auto"
                    >
                        {loading ? (
                            'Nuking...'
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Delete Everything
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
