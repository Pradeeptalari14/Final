import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { set, get } from 'idb-keyval';
import { toast } from 'sonner';

export interface OfflineMutation {
    id: string;
    key: string;
    payload: unknown;
    timestamp: number;
    retryCount: number;
}

const QUEUE_KEY = 'offline_mutation_queue';

export function useOfflineMutation<TData, TError, TVariables>(
    mutationKey: string,
    options?: UseMutationOptions<TData, TError, TVariables>
) {

    return useMutation<TData, TError, TVariables>({
        ...options,
        mutationFn: async (variables) => {
            if (!navigator.onLine) {
                // If offline, throw specific error to trigger onError
                throw new Error('OFFLINE_MODE');
            }
            if (options?.mutationFn) {
                // @ts-expect-error: Argument count mismatch in some TQuery versions
                return await options.mutationFn(variables);
            }
            throw new Error('No mutation function provided');
        },
        onError: async (error, variables, context) => {
            if ((error as Error).message === 'OFFLINE_MODE') {
                const mutation: OfflineMutation = {
                    id: crypto.randomUUID(),
                    key: mutationKey,
                    payload: variables,
                    timestamp: Date.now(),
                    retryCount: 0
                };

                // Save to Queue
                const queue = (await get<OfflineMutation[]>(QUEUE_KEY)) || [];
                queue.push(mutation);
                await set(QUEUE_KEY, queue);

                toast.warning('Offline: Changes Saved Locally', {
                    description: 'Will sync automatically when online.',
                    duration: 4000
                });

                // Optimistically update UI if onMutate provided fallback data
                // This logic depends on implementation specifics, but basic toast is critical.

                // Mimic success to prevent app crash if caller expects success
                // We return null as TData, which might require type loosening in caller
                return;
            }

            if (options?.onError) {
                // @ts-expect-error: Argument count mismatch in some TQuery versions
                options.onError(error, variables, context);
            }
        }
    });
}
