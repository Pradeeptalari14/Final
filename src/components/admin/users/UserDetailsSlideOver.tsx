import { SlideOver } from '@/components/ui/SlideOver';
import { User, Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Shield,
    Mail,
    Clock,
    Hash,
    ShieldAlert,
    CheckCircle,
    XCircle,
    KeyRound,
    FileText,
    Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DeleteUserAlert } from './DeleteUserAlert';
import React from 'react';

interface UserDetailsSlideOverProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    lastActive?: number;
    onEdit: (user: User) => void;
    onToggleStatus: (user: User) => void;
    onUnlock: (user: User) => void;
    onResetPassword: (user: User) => void;
    onDelete: (user: User) => void;
}

export function UserDetailsSlideOver({
    user,
    isOpen,
    onClose,
    lastActive,
    onEdit,
    onToggleStatus,
    onUnlock,
    onResetPassword,
    onDelete
}: UserDetailsSlideOverProps) {
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

    if (!user) return null;

    const isActive = user.isApproved && !user.isLocked;
    const isLocked = user.isLocked;

    const roleColors = {
        [Role.ADMIN]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        [Role.STAGING_SUPERVISOR]: 'bg-blue-100 text-blue-700 border-blue-200',
        [Role.LOADING_SUPERVISOR]: 'bg-orange-100 text-orange-700 border-orange-200',
        [Role.SHIFT_LEAD]: 'bg-purple-100 text-purple-700 border-purple-200'
    };

    return (
        <>
            <SlideOver isOpen={isOpen} onClose={onClose} title="User Profile">
                <div className="space-y-8">
                    {/* Header Profile Section */}
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-3xl font-black text-slate-300 border-4 border-slate-100 dark:border-slate-700 shadow-xl uppercase">
                                {user.fullName.substring(0, 2)}
                            </div>
                            <div
                                className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-800 ${isActive ? 'bg-emerald-500' : isLocked ? 'bg-red-500' : 'bg-amber-500'
                                    }`}
                            />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                            {user.fullName}
                        </h2>
                        <p className="text-slate-500 font-medium">@{user.username}</p>

                        <div className="flex gap-2 mt-4">
                            <Badge variant="outline" className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${roleColors[user.role] || 'bg-slate-100'}`}>
                                {user.role.replace('_', ' ')}
                            </Badge>
                            {user.isLocked && (
                                <Badge variant="destructive" className="uppercase tracking-wider text-[10px]">
                                    Account Locked
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Mail size={14} />
                                <span className="text-[10px] uppercase tracking-wider font-bold">Email Address</span>
                            </div>
                            <p className="font-medium text-sm truncate" title={user.email}>{user.email || 'Not Provided'}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Hash size={14} />
                                <span className="text-[10px] uppercase tracking-wider font-bold">Employee ID</span>
                            </div>
                            <p className="font-medium text-sm">{user.empCode || 'N/A'}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Clock size={14} />
                                <span className="text-[10px] uppercase tracking-wider font-bold">Last Active</span>
                            </div>
                            <p className="font-medium text-sm">
                                {lastActive ? formatDistanceToNow(lastActive, { addSuffix: true }) : 'Never'}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Shield size={14} />
                                <span className="text-[10px] uppercase tracking-wider font-bold">Account Status</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                {user.isLocked ? (
                                    <span className="text-red-600 font-bold text-xs flex items-center gap-1">
                                        <ShieldAlert size={14} /> Locked
                                    </span>
                                ) : user.isApproved ? (
                                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                                        <CheckCircle size={14} /> Active
                                    </span>
                                ) : (
                                    <span className="text-amber-600 font-bold text-xs flex items-center gap-1">
                                        <Clock size={14} /> Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions Hub */}
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onEdit(user);
                                    onClose();
                                }}
                                className="justify-start h-12 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
                            >
                                <FileText size={16} className="mr-3" />
                                Edit Profile Details
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => onResetPassword(user)}
                                className="justify-start h-12 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
                            >
                                <KeyRound size={16} className="mr-3" />
                                Reset Password & Credentials
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => onToggleStatus(user)}
                                className={`justify-start h-12 hover:bg-slate-50 ${user.isApproved ? 'text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'}`}
                            >
                                {user.isApproved ? (
                                    <>
                                        <XCircle size={16} className="mr-3" /> Deactivate Account
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} className="mr-3" /> Approve & Activate Account
                                    </>
                                )}
                            </Button>

                            {user.isLocked && (
                                <Button
                                    variant="outline"
                                    onClick={() => onUnlock(user)}
                                    className="justify-start h-12 text-orange-600 hover:text-orange-700 hover:bg-orange-50 hover:border-orange-200"
                                >
                                    <KeyRound size={16} className="mr-3" /> Unlock Account
                                </Button>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                variant="ghost"
                                onClick={() => setIsDeleteAlertOpen(true)}
                                className="w-full justify-start h-12 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 size={16} className="mr-3" />
                                Delete Permanent Record
                            </Button>
                        </div>
                    </div>
                </div>
            </SlideOver>

            <DeleteUserAlert
                isOpen={isDeleteAlertOpen}
                onClose={() => setIsDeleteAlertOpen(false)}
                user={user}
                onConfirm={(u) => {
                    onDelete(u);
                    onClose(); // Close slideover after delete logic initiated
                }}
                onDeactivate={(u) => {
                    onToggleStatus(u);
                    // Do not close slideover, let user see it updated
                }}
            />
        </>
    );
}
