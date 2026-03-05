import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types';
import { dataService } from '@/services/dataService';
import { useData } from '@/contexts/DataContext';

interface ChatContextType {
    messages: ChatMessage[];
    sendMessage: (receiverId: string, message: string) => Promise<void>;
    unreadCounts: Record<string, number>;
    markAsRead: (userId: string) => void;
    onlineUserIds: string[];
    loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useData();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Use a ref so the subscription callback always has the latest currentUser without causing re-subscriptions
    const currentUserRef = useRef(currentUser);
    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    // Initial load + real-time subscription
    useEffect(() => {
        if (!currentUser?.id) {
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | undefined;
        let isMounted = true;

        const loadMessages = async () => {
            try {
                setLoading(true);
                const recent = await dataService.getRecentMessages(200, currentUser.id);
                if (isMounted) setMessages(recent);
            } catch (err) {
                console.error('Failed to load messages', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        // Subscribe for real-time new messages
        unsubscribe = dataService.subscribeToMessages((newMsg) => {
            const user = currentUserRef.current;
            if (!user) return;

            // Security check: Only process messages where this user is sender or receiver
            if (
                String(newMsg.senderId) !== String(user.id) &&
                String(newMsg.receiverId) !== String(user.id)
            ) {
                return;
            }

            setMessages((prev) => {
                // Deduplicate: skip if already exists (e.g. returned by optimistic update)
                if (prev.find(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });

            // Increment unread count if message is from someone else
            if (String(newMsg.senderId) !== String(user.id)) {
                setUnreadCounts(prevCounts => ({
                    ...prevCounts,
                    [newMsg.senderId]: (prevCounts[newMsg.senderId] || 0) + 1
                }));
            }
        });

        loadMessages();

        return () => {
            isMounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser?.id]);

    // Poll for online users every 30s
    useEffect(() => {
        const fetchOnline = async () => {
            try {
                const ids = await dataService.getOnlineUserIds();
                setOnlineUserIds(ids);
            } catch (err) {
                console.error('Failed to fetch online users', err);
            }
        };

        fetchOnline();
        const interval = setInterval(fetchOnline, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = useCallback((userId: string) => {
        setUnreadCounts(prev => {
            if (!prev[userId]) return prev;
            const newCounts = { ...prev };
            delete newCounts[userId];
            return newCounts;
        });
    }, []);

    const sendMessage = useCallback(async (receiverId: string, message: string) => {
        if (!currentUser) return;

        // Optimistic UI update
        const optimisticMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            senderId: String(currentUser.id),
            receiverId: String(receiverId),
            message,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const { data, error } = await dataService.sendMessage({
                senderId: String(currentUser.id),
                receiverId: String(receiverId),
                message
            });

            if (error) throw error;

            if (data) {
                setMessages(prev => {
                    // If the real-time subscription already added the real message, remove the optimistic one
                    const exists = prev.find(m => m.id === data.id);
                    if (exists) {
                        return prev.filter(m => m.id !== optimisticMsg.id);
                    }
                    // Otherwise replace optimistic with the real server message
                    return prev.map(m => m.id === optimisticMsg.id ? data : m);
                });
            }
        } catch (error) {
            console.error('Failed to send message', error);
            // Revert optimistic update on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            throw error;
        }
    }, [currentUser]);

    return (
        <ChatContext.Provider value={{ messages, sendMessage, unreadCounts, markAsRead, onlineUserIds, loading }}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return context;
};
