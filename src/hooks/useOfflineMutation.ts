import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { set, get } from 'idb-keyval';

export interface OfflineMutation {
    id: string;
    key: string;
    payload: unknown;
    timestamp: number;
    retryCount: number;
}

const QUEUE_KEY = 'offline_mutation_queue';

export function useOfflineMutation<TData, TError, TVariables, TContext = unknown>(
    mutationKey: string,
    options?: UseMutationOptions<TData, TError, TVariables, TContext>
) {

    return useMutation<TData, TError, TVariables, TContext>({
        ...options,
        mutationFn: async (variables) => {
            // OPTIMIZED BACKGROUND SYNC STRATEGY:
            // 1. Always queue the mutation to IDB
            // 2. Trigger the sync process immediately
            // 3. Return successfully to the UI so it doesn't block

            const mutation: OfflineMutation = {
                id: crypto.randomUUID(),
                key: mutationKey,
                payload: variables,
                timestamp: Date.now(),
                retryCount: 0
            };

            const queue = (await get<OfflineMutation[]>(QUEUE_KEY)) || [];
            queue.push(mutation);
            await set(QUEUE_KEY, queue);

            // Trigger immediate sync attempt in background
            window.dispatchEvent(new Event('trigger-sync'));

            // Optimistic success return
            // We return a mock object that mimics the expected structure { error: null }
            // This prevents crashes when consumers destructure const { error } = await mutation.mutateAsync(...)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { error: null } as any;
        },
        // We removed standard onError handling because we catch everything by queuing.
        // The actual sync errors are handled by SyncManager.
    });
}
