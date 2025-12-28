import { useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { OfflineMutation } from '@/hooks/useOfflineMutation';

const QUEUE_KEY = 'offline_mutation_queue';

export function SyncManager() {
    const { updateSheet, addSheet, updateUser } = useData();

    useEffect(() => {
        const syncQueue = async () => {
            if (!navigator.onLine) return;

            const queue = (await get<OfflineMutation[]>(QUEUE_KEY)) || [];
            if (queue.length === 0) return;

            toast.info('Syncing Offline Data...', {
                description: `Processing ${queue.length} pending items.`,
                duration: 999999, // keep until done or replaced
                id: 'sync-progress'
            });

            const failed: OfflineMutation[] = [];
            let successCount = 0;

            for (const item of queue) {
                try {
                    // Replay Logic based on Key
                    if (item.key === 'updateSheet') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await updateSheet(item.payload as any);
                    } else if (item.key === 'addSheet') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await addSheet(item.payload as any);
                    } else if (item.key === 'updateUser') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await updateUser(item.payload as any);
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

            toast.dismiss('sync-progress');
            if (successCount > 0) {
                toast.success('Sync Complete', {
                    description: `Successfully synced ${successCount} items.`
                });
            }
            if (failed.length > 0) {
                toast.error('Sync Incomplete', {
                    description: `${failed.length} items failed to sync. Will retry later.`
                });
            }
        };

        window.addEventListener('online', syncQueue);
        // Attempt sync immediately on mount if online
        syncQueue();

        return () => window.removeEventListener('online', syncQueue);
    }, [updateSheet, addSheet, updateUser]);

    return null; // Headless component
}
