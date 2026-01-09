import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { MoreHorizontal } from 'lucide-react';

interface UserTableProps {
    users: User[];
    lastActiveMap: Map<string, number>;
    onToggleStatus: (user: User) => void;
    onEdit: (user: User) => void;
    onUnlock: (user: User) => void;
    onDelete: (user: User) => void;
    onResetPassword: (user: User) => void;
    onRowClick: (user: User) => void;
    density?: 'compact' | 'comfortable';
}

export const UserTable: React.FC<UserTableProps> = ({
    users,
    onRowClick,
    density
}) => {
    const isCompact = density === 'compact';
    return (
        <div className="w-full">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className={`${isCompact ? 'py-1' : 'py-2'} pl-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[20%]`}>
                            User Name
                        </th>
                        <th className={`${isCompact ? 'py-1' : 'py-2'} font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[25%]`}>
                            Full Name
                        </th>
                        <th className={`${isCompact ? 'py-1' : 'py-2'} font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[25%]`}>
                            Email
                        </th>
                        <th className={`${isCompact ? 'py-1' : 'py-2'} font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[20%]`}>
                            Employee Code
                        </th>
                        <th className={`${isCompact ? 'py-1' : 'py-2'} pr-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 w-[10%]`}>
                            View
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                                No directory objects found.
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => {
                            return (
                                <tr
                                    key={user.id}
                                    onClick={() => onRowClick(user)}
                                    className="group cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className={`${isCompact ? 'py-1' : 'py-2'} pl-6`}>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-slate-500 font-bold">
                                                {user.username}
                                            </p>
                                        </div>
                                    </td>
                                    <td className={`${isCompact ? 'py-1' : 'py-2'} text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-700 transition-colors`}>
                                        {user.fullName}
                                    </td>
                                    <td className={`${isCompact ? 'py-1' : 'py-2'} text-[10px] text-slate-400 font-medium`}>
                                        {user.email || '-'}
                                    </td>
                                    <td className={`${isCompact ? 'py-1' : 'py-2'} text-xs font-mono text-slate-500`}>
                                        <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold">
                                            {user.empCode || 'N/A'}
                                        </span>
                                    </td>
                                    <td className={`${isCompact ? 'py-1' : 'py-2'} pr-6 text-right`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRowClick(user);
                                            }}
                                            className={`${isCompact ? 'h-6 w-6' : 'h-8 w-8'} p-0 rounded-full text-slate-300 group-hover:text-indigo-500 group-hover:bg-indigo-100 transition-all`}
                                        >
                                            <MoreHorizontal size={isCompact ? 14 : 16} />
                                        </Button>
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
