import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SecurityLog, ActivityLog } from '@/types';

export function useAuditLogs(type: 'security' | 'activity' | 'operational') {
    // 1. Security Logs Fetch
    const securityQuery = useQuery<SecurityLog[]>({
        queryKey: ['security_logs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('security_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) return [];

            interface SecurityLogRow {
                id: string;
                data: SecurityLog;
                created_at: string;
            }

            return (data || []).map((d: SecurityLogRow) => ({
                ...d.data,
                id: d.id,
                timestamp: d.created_at || d.data.timestamp
            })) as SecurityLog[];
        },
        enabled: type === 'security',
        staleTime: 1000 * 30, // 30 seconds
    });

    // 2. Activity Logs Fetch
    const activityQuery = useQuery<ActivityLog[]>({
        queryKey: ['activity_logs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) return [];

            return (data || []).map((d: { data: ActivityLog, id: string, created_at: string }) => ({
                ...d.data,
                id: d.id,
                timestamp: d.created_at
            })) as ActivityLog[];
        },
        enabled: type === 'activity',
        staleTime: 1000 * 30,
    });

    return {
        securityLogs: securityQuery.data || [],
        activityLogs: activityQuery.data || [],
        isLoading: securityQuery.isLoading || activityQuery.isLoading,
        refetchSecurity: securityQuery.refetch,
        refetchActivity: activityQuery.refetch
    };
}
