import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

// Custom IDB Storage Wrapper
const idbStorage = {
    getItem: async (key: string) => {
        const val = await get(key);
        return val || null;
    },
    setItem: async (key: string, value: string) => {
        await set(key, value);
    },
    removeItem: async (key: string) => {
        await del(key);
    },
};

// Create Persister
export const persister = createAsyncStoragePersister({
    storage: idbStorage,
    key: 'REACT_QUERY_OFFLINE_CACHE',
});

// Configure Query Client
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes (Consider data fresh)
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (Keep in cache)
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

export { PersistQueryClientProvider };
