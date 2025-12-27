import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Trash2,
    KeyRound,
    CheckCircle,
    XCircle,
    FileText,
    Clock,
    MoreHorizontal,
    ShieldAlert
} from 'lucide-react';
import { User, Role } from '@/types';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface UserTableProps {
    users: User[];
    lastActiveMap: Map<string, number>;
    onToggleStatus: (user: User) => void;
    onEdit: (user: User) => void;
    onUnlock: (user: User) => void;
    onDelete: (user: User) => void;
    onResetPassword: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
    users,
    lastActiveMap,
    onToggleStatus,
    onEdit,
    onUnlock,
    onDelete,
    onResetPassword
}) => {
    const [now] = React.useState(() => Date.now());

    const getTimeAgo = (timestamp: number | undefined) => {
        if (!timestamp) return <span className="text-slate-300">Never</span>;
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return <span className="text-emerald-500 font-bold">Online Now</span>;
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getRoleBadge = (role: Role) => {
        switch (role) {
            case Role.ADMIN:
                return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200';
            case Role.STAGING_SUPERVISOR:
                return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
            case Role.LOADING_SUPERVISOR:
                return 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200';
            case Role.SHIFT_LEAD:
                return 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="w-full">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="py-4 pl-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[50px]">
                            Select
                        </th>
                        <th className="py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[25%]">
                            Identity
                        </th>
                        <th className="py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[15%]">
                            Role / Permissions
                        </th>
                        <th className="py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[15%]">
                            Employee ID
                        </th>
                        <th className="py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[15%]">
                            Last Active
                        </th>
                        <th className="py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[15%]">
                            Status
                        </th>
                        <th className="py-4 pr-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[10%]">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                                No directory objects found.
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => {
                            const lastActive = lastActiveMap.get(user.username);
                            const isOnline = lastActive && now - lastActive < 5 * 60 * 1000;

                            return (
                                <tr
                                    key={user.id}
                                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="py-4 pl-6">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                                        />
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs uppercase border border-slate-200 dark:border-slate-700">
                                                    {user.fullName.substring(0, 2)}
                                                </div>
                                                {isOnline && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    {user.fullName}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    {user.username}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <Badge
                                            variant="outline"
                                            className={`rounded-md border text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider ${getRoleBadge(user.role)}`}
                                        >
                                            {user.role.replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td className="py-4 text-xs font-mono text-slate-500 flex items-center gap-2">
                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                            {user.empCode || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="py-4 text-xs text-slate-500 font-medium">
                                        {getTimeAgo(lastActive)}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            {user.isLocked ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold uppercase">
                                                    <ShieldAlert size={10} /> Locked
                                                </span>
                                            ) : user.isApproved ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase">
                                                    <CheckCircle size={10} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase">
                                                    <Clock size={10} /> Pending
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 pr-6 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-[160px] rounded-xl"
                                            >
                                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400">
                                                    Object Actions
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onEdit(user)}
                                                    className="gap-2 text-xs font-medium"
                                                >
                                                    <FileText size={14} /> Edit Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onResetPassword(user)}
                                                    className="gap-2 text-xs font-medium"
                                                >
                                                    <KeyRound size={14} /> Reset Credential
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onToggleStatus(user)}
                                                    className="gap-2 text-xs font-medium"
                                                >
                                                    {user.isApproved ? (
                                                        <XCircle
                                                            size={14}
                                                            className="text-red-500"
                                                        />
                                                    ) : (
                                                        <CheckCircle
                                                            size={14}
                                                            className="text-emerald-500"
                                                        />
                                                    )}
                                                    {user.isApproved ? 'Deactivate' : 'Activate'}
                                                </DropdownMenuItem>
                                                {user.isLocked && (
                                                    <DropdownMenuItem
                                                        onClick={() => onUnlock(user)}
                                                        className="gap-2 text-xs font-medium text-orange-600"
                                                    >
                                                        <KeyRound size={14} /> Unlock Account
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(user)}
                                                    className="gap-2 text-xs font-medium text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 size={14} /> Delete Object
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};
