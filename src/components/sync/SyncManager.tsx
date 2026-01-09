import { useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { performAddSheet, performUpdateSheet, performUpdateUser } from '@/contexts/DataContext';
import { OfflineMutation } from '@/hooks/useOfflineMutation';

const QUEUE_KEY = 'offline_mutation_queue';

export function SyncManager() {
    // Use raw API functions to avoid circular queuing
    const queryClient = useQueryClient();

    useEffect(() => {
        let isSyncing = false;

        const syncQueue = async () => {
            if (!navigator.onLine || isSyncing) return;
            isSyncing = true;

            try {
                const queue = (await get<OfflineMutation[]>(QUEUE_KEY)) || [];
                if (queue.length === 0) {
                    isSyncing = false;
                    return;
                }

                // Removed toast.info to reduce noise for background syncs
                // Toasts should only appear on ERROR or completion of a huge batch if user cares?
                // For "Every Save", silence is golden unless error.

                const failed: OfflineMutation[] = [];
                let successCount = 0;

                for (const item of queue) {
                    try {
                        if (item.key === 'updateSheet') {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await performUpdateSheet(item.payload as any);
                        } else if (item.key === 'addSheet') {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await performAddSheet(item.payload as any);
                        } else if (item.key === 'updateUser') {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await performUpdateUser(item.payload as any);
                        }
                        successCount++;
                    } catch (e) {
                        console.error('Sync failed for item', item, e);
                        item.retryCount++;
                        if (item.retryCount < 5) {
                            failed.push(item);
                        }
                    }
                }

                await set(QUEUE_KEY, failed);

                if (successCount > 0) {
                    // Invalidate queries to ensure eventual consistency
                    queryClient.invalidateQueries({ queryKey: ['sheets'] });
                    queryClient.invalidateQueries({ queryKey: ['users'] });

                    // Optional: success toast? Or keep it silent for "instant feel"
                    // Let's only toast if it was a large batch or user was previously offline
                }

                if (failed.length > 0) {
                    // Extract unique error messages if possible
                    const errorMsg = (failed[0] as any).error?.message || (failed[0] as any).error?.details || 'Unknown Error';

                    toast.error('Sync Retry Scheduled', {
                        description: `${failed.length} items failed. Last error: ${errorMsg}`
                    });
                }

            } finally {
                isSyncing = false;
            }
        };

        window.addEventListener('online', syncQueue);
        window.addEventListener('trigger-sync', syncQueue); // Listen for our custom event

        // Polling fallback every 10 seconds just in case
        const interval = setInterval(syncQueue, 10000);

        // Attempt sync immediately on mount
        syncQueue();

        return () => {
            window.removeEventListener('online', syncQueue);
            window.removeEventListener('trigger-sync', syncQueue);
            clearInterval(interval);
        };
    }, [queryClient]);

    return null;
}
