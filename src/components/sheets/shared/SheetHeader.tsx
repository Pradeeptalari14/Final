import React from 'react';
import {
    Calendar,
    User,
    UserCheck,
    Truck,
    MapPin,
    Clock,
    FileCheck,
    Container
} from 'lucide-react';
import { SheetData } from '@/types';
import { useData } from '@/contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SheetHeaderProps {
    data: Partial<SheetData>;
    onChange: (field: string, value: string | number) => void;
    isLocked: boolean;
    isCompleted?: boolean;
    errors?: string[];
    type: 'staging' | 'loading';
}

interface FieldWrapperProps {
    label: string;
    icon?: React.ElementType;
    hasError?: boolean;
    children: React.ReactNode;
}

const FieldWrapper = ({ label, icon: Icon, hasError, children }: FieldWrapperProps) => (
    <div className="flex flex-col gap-1 group">
        <label
            className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5 transition-colors ${hasError ? 'text-red-600' : 'text-slate-500 group-focus-within:text-blue-600'}`}
        >
            {Icon && (
                <Icon
                    size={14}
                    className={
                        hasError
                            ? 'text-red-500'
                            : 'text-slate-400 group-focus-within:text-blue-500'
                    }
                />
            )}{' '}
            {label}
        </label>
        <div
            className={`rounded-md border bg-white shadow-sm transition-all duration-200 overflow-hidden ${hasError ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-50'}`}
        >
            <div className="[&>input]:w-full [&>input]:bg-transparent [&>input]:px-3 [&>input]:py-2.5 [&>input]:text-sm [&>input]:outline-none [&>input]:font-medium [&>input]:text-slate-700 [&>input]:placeholder:text-slate-300 [&>select]:w-full [&>select]:bg-transparent [&>select]:px-3 [&>select]:py-2.5 [&>select]:text-sm [&>select]:outline-none [&>div]:px-3 [&>div]:py-2.5">
                {children}
            </div>
        </div>
    </div>
);

export const SheetHeader: React.FC<SheetHeaderProps> = ({
    data,
    onChange,
    isLocked,
    isCompleted,
    errors = [],
    type
}) => {
    const { users } = useData();
    const findUserByName = (name: string) => users.find(u => (u.fullName || u.username) === name);

    const isStaging = type === 'staging';

    return (
        <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${isStaging ? '3' : '5'} xl:grid-cols-${isStaging ? '3' : '5'} gap-4 p-4 md:p-6 bg-slate-50/50 border-b border-slate-200`}
        >
            {/* Shift */}
            <FieldWrapper label="Shift" icon={Calendar}>
                <select
                    value={data.shift || ''}
                    onChange={(e) => onChange('shift', e.target.value)}
                    disabled={isLocked || isCompleted}
                    className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none appearance-none"
                >
                    <option value="" disabled className="text-slate-400">
                        Select Shift
                    </option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                </select>
            </FieldWrapper>

            {/* Date */}
            <FieldWrapper label="Date" icon={Calendar}>
                <div className="font-semibold text-slate-700 text-sm">
                    {data.date ? new Date(data.date).toLocaleDateString('en-GB') : '-'}
                </div>
            </FieldWrapper>

            {/* Supervisor Name - Only for Staging (Loading uses Picking By) */}
            {isStaging && (
                <FieldWrapper label="Supervisor Name" icon={User}>
                    <div className="flex items-center gap-2">
                        {data.supervisorName && (
                            <Avatar className="h-6 w-6 border border-slate-200">
                                <AvatarImage src={findUserByName(data.supervisorName)?.photoURL} />
                                <AvatarFallback className="text-[8px] bg-slate-100 text-slate-400 font-bold">
                                    {data.supervisorName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <input
                            type="text"
                            value={data.supervisorName || ''}
                            onChange={(e) => onChange('supervisorName', e.target.value)}
                            disabled={true}
                            className="w-full bg-transparent text-sm font-bold text-slate-500 outline-none"
                            placeholder="Auto-filled"
                        />
                    </div>
                </FieldWrapper>
            )}

            {/* Destination */}
            <FieldWrapper label="Destination" icon={MapPin}>
                <input
                    type="text"
                    value={data.destination || ''}
                    onChange={(e) => onChange('destination', e.target.value)}
                    disabled={(!isStaging && true) || isLocked || isCompleted}
                    className={`w-full bg-transparent text-sm font-medium outline-none ${!isStaging || isLocked || isCompleted ? 'text-slate-500' : 'text-slate-700'}`}
                    placeholder={isStaging ? 'Enter Destination' : 'Auto-filled'}
                />
            </FieldWrapper>

            {/* Loading Dock */}
            <FieldWrapper
                label="Loading Dock *"
                icon={MapPin}
                hasError={errors.includes('loadingDock')}
            >
                <input
                    type="text"
                    value={data.loadingDockNo || ''}
                    onChange={(e) => onChange('loadingDockNo', e.target.value)}
                    disabled={(!isStaging && true) || isLocked || isCompleted}
                    className={`w-full bg-transparent text-sm font-medium outline-none ${!isStaging || isLocked || isCompleted ? 'text-slate-500' : 'text-slate-700'}`}
                    placeholder={isStaging ? 'Enter Loading Dock' : 'Auto-filled'}
                />
            </FieldWrapper>

            {!isStaging && (
                <>
                    {/* Picking By */}
                    <FieldWrapper
                        label="Picking By *"
                        icon={User}
                        hasError={errors.includes('pickingBy')}
                    >
                        <div className="flex items-center gap-2">
                            {data.pickingBy && (
                                <Avatar className="h-6 w-6 border border-slate-200">
                                    <AvatarImage src={findUserByName(data.pickingBy)?.photoURL} />
                                    <AvatarFallback className="text-[8px] bg-slate-100 text-slate-400 font-bold">
                                        {data.pickingBy.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            <input
                                type="text"
                                value={data.pickingBy || ''}
                                onChange={(e) => onChange('pickingBy', e.target.value)}
                                disabled={true}
                                className="w-full bg-transparent text-sm font-bold text-slate-500 outline-none"
                                placeholder="Auto-filled"
                            />
                        </div>
                    </FieldWrapper>

                    {/* Picking Crosschecked By */}
                    <FieldWrapper label="Picking Crosschecked By" icon={User}>
                        <input
                            type="text"
                            value={data.pickingCrosscheckedBy || ''}
                            onChange={(e) => onChange('pickingCrosscheckedBy', e.target.value)}
                            disabled={true}
                            className="w-full bg-transparent text-sm font-medium text-slate-500 outline-none"
                            placeholder="Auto-filled"
                        />
                    </FieldWrapper>

                    {/* Emp Code */}
                    <FieldWrapper label="Emp Code" icon={UserCheck}>
                        <input
                            type="text"
                            value={data.empCode || ''}
                            onChange={(e) => onChange('empCode', e.target.value)}
                            disabled={true}
                            className="w-full bg-transparent text-sm font-medium text-slate-500 outline-none"
                            placeholder="Auto-filled"
                        />
                    </FieldWrapper>

                    {/* Transporter */}
                    <FieldWrapper
                        label="Transporter *"
                        icon={Truck}
                        hasError={errors.includes('transporter')}
                    >
                        <input
                            type="text"
                            value={data.transporter || ''}
                            onChange={(e) => onChange('transporter', e.target.value)}
                            disabled={isLocked || isCompleted}
                            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300 disabled:text-slate-500"
                            placeholder="Enter Transporter"
                        />
                    </FieldWrapper>

                    {/* Driver Name */}
                    <FieldWrapper label="Driver Name" icon={User}>
                        <input
                            type="text"
                            value={data.driverName || ''}
                            onChange={(e) => onChange('driverName', e.target.value)}
                            disabled={isLocked || isCompleted}
                            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300 disabled:text-slate-500"
                            placeholder="Driver Name"
                        />
                    </FieldWrapper>

                    {/* Vehicle No */}
                    <FieldWrapper
                        label="Vehicle No *"
                        icon={Truck}
                        hasError={errors.includes('vehicleNo')}
                    >
                        <input
                            type="text"
                            value={data.vehicleNo || ''}
                            onChange={(e) => onChange('vehicleNo', e.target.value)}
                            disabled={isLocked || isCompleted}
                            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none uppercase placeholder:text-slate-300 disabled:text-slate-500"
                            placeholder="XX-00-XX-0000"
                        />
                    </FieldWrapper>

                    {/* Seal No */}
                    <FieldWrapper
                        label="Seal No *"
                        icon={Container}
                        hasError={errors.includes('sealNo')}
                    >
                        <input
                            type="text"
                            value={data.sealNo || ''}
                            onChange={(e) => onChange('sealNo', e.target.value)}
                            disabled={isLocked || isCompleted}
                            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300 disabled:text-slate-500"
                            placeholder="Seal #"
                        />
                    </FieldWrapper>

                    {/* Reg Serial No */}
                    <FieldWrapper label="Reg. Serial No" icon={FileCheck}>
                        <input
                            type="text"
                            value={data.regSerialNo || ''}
                            onChange={(e) => onChange('regSerialNo', e.target.value)}
                            disabled={isLocked || isCompleted}
                            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300 disabled:text-slate-500"
                            placeholder="Serial #"
                        />
                    </FieldWrapper>

                    {/* Time Fields - Only for Loading */}
                    <FieldWrapper label="Start Time" icon={Clock}>
                        <input
                            type="text"
                            value={data.loadingStartTime || ''}
                            onChange={(e) => onChange('loadingStartTime', e.target.value)}
                            disabled={isLocked || isCompleted}
                            className={`w-full bg-transparent text-sm font-medium outline-none ${isLocked || isCompleted ? 'text-slate-500' : 'text-slate-700'}`}
                            placeholder="HH:MM:SS"
                        />
                    </FieldWrapper>

                    <FieldWrapper label="End Time" icon={Clock}>
                        <input
                            type="text"
                            value={data.loadingEndTime || ''}
                            onChange={(e) => onChange('loadingEndTime', e.target.value)}
                            disabled={isLocked || isCompleted}
                            className={`w-full bg-transparent text-sm font-medium outline-none ${isLocked || isCompleted ? 'text-slate-500' : 'text-slate-700'}`}
                            placeholder="HH:MM:SS"
                        />
                    </FieldWrapper>
                </>
            )}

            {!isStaging && (
                <>
                    {/* Status (15th Item) */}
                    <FieldWrapper label="Status" icon={FileCheck}>
                        <div
                            className={`text-sm font-bold uppercase ${isCompleted ? 'text-emerald-600' : isLocked ? 'text-blue-600' : 'text-amber-600'}`}
                        >
                            {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'In Progress'}
                        </div>
                    </FieldWrapper>
                </>
            )}

            {isStaging && (
                <>
                    {/* Emp Code (Staging) */}
                    <FieldWrapper label="Emp Code" icon={UserCheck}>
                        <div className="font-semibold text-slate-700 text-sm">
                            {data.empCode || '-'}
                        </div>
                    </FieldWrapper>
                </>
            )}
        </div>
    );
};
