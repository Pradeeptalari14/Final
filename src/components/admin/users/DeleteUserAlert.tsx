import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { AlertTriangle, Trash2, XCircle, CheckCircle, ShieldAlert } from 'lucide-react';

interface DeleteUserAlertProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onConfirm: (user: User) => void;
    onDeactivate: (user: User) => void;
}

export function DeleteUserAlert({
    isOpen,
    onClose,
    user,
    onConfirm,
    onDeactivate
}: DeleteUserAlertProps) {
    if (!user) return null;

    const isActive = user.isApproved;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                        {isActive ? (
                            <XCircle className="h-6 w-6 text-red-600" />
                        ) : (
                            <AlertTriangle className="h-6 w-6 text-orange-600" />
                        )}
                    </div>
                    <DialogTitle className="text-center text-xl">
                        {isActive ? 'Cannot Delete Active Account' : 'Permanent Deletion Warning'}
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        {isActive ? (
                            <span>
                                User <strong>@{user.username}</strong> is currently active.
                                <br />
                                You must <strong>Deactivate</strong> the account before you can delete it permanently.
                            </span>
                        ) : (
                            <span className="space-y-2 block text-left bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="block font-medium text-slate-700 mb-2">
                                    You are about to permanently delete <strong>@{user.username}</strong>.
                                </span>
                                <span className="block text-slate-500 text-xs flex gap-2 items-start">
                                    <ShieldAlert size={14} className="min-w-[14px] mt-0.5 text-orange-500" />
                                    This action cannot be undone.
                                </span>
                                <span className="block text-slate-500 text-xs flex gap-2 items-start">
                                    <Trash2 size={14} className="min-w-[14px] mt-0.5 text-red-500" />
                                    <span>All associated logs, history, and activity records for this user will be <strong>permanently lost</strong>.</span>
                                </span>
                                <span className="block text-slate-500 text-xs flex gap-2 items-start">
                                    <AlertTriangle size={14} className="min-w-[14px] mt-0.5 text-amber-500" />
                                    Audit trails may be broken.
                                </span>
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center gap-2 mt-4">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    {isActive ? (
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onDeactivate(user);
                                onClose();
                            }}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Deactivate Now
                        </Button>
                    ) : (
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onConfirm(user);
                                onClose();
                            }}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Yes, Delete Permanently
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
