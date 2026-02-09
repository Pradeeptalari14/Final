import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SignaturePadProps {
    svName: string;
    svSign: string;
    slSign: string;
    deoSign: string;
    isLocked: boolean;
    onChange: (field: string, value: string) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
    svName,
    svSign,
    slSign,
    deoSign,
    isLocked,
    onChange
}) => {
    const { users } = useData();
    const findUserByName = (name: string) => users.find(u => (u.fullName || u.username) === name);

    return (
        <div className="p-4 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">
                        Supervisor Name
                    </label>
                    <div className="flex items-center gap-2">
                        {svName && (
                            <Avatar className="h-6 w-6 border border-slate-200">
                                <AvatarImage src={findUserByName(svName)?.photoURL} />
                                <AvatarFallback className="text-[8px] bg-slate-100 text-slate-400 font-bold">
                                    {svName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <input
                            type="text"
                            value={svName}
                            onChange={(e) => onChange('svName', e.target.value)}
                            disabled={isLocked}
                            className="w-full text-sm outline-none p-2 bg-slate-50 rounded border border-slate-200 font-bold"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">
                        Supervisor Sign
                    </label>
                    <input
                        type="text"
                        value={svSign}
                        onChange={(e) => onChange('svSign', e.target.value)}
                        disabled={isLocked}
                        className="w-full text-base outline-none p-2 bg-slate-50 rounded border border-slate-200 font-script text-xl"
                        placeholder="Sign"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">
                        SL Sign
                    </label>
                    <input
                        type="text"
                        value={slSign}
                        onChange={(e) => onChange('slSign', e.target.value)}
                        disabled={isLocked}
                        className="w-full text-base outline-none p-2 bg-slate-50 rounded border border-slate-200 font-script text-xl"
                        placeholder="Sign"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">
                        DEO Sign
                    </label>
                    <input
                        type="text"
                        value={deoSign}
                        onChange={(e) => onChange('deoSign', e.target.value)}
                        disabled={isLocked}
                        className="w-full text-base outline-none p-2 bg-slate-50 rounded border border-slate-200 font-script text-xl"
                        placeholder="Sign"
                    />
                </div>
            </div>
        </div>
    );
};
