import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';

// Mock statuses
const statuses = ['Online', 'Away', 'Busy', 'Offline'];
const statusColors = {
    'Online': 'bg-green-500',
    'Away': 'bg-amber-500',
    'Busy': 'bg-red-500',
    'Offline': 'bg-slate-400'
};

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    receiverId: string;
    time: string;
}

export function GlobalChat() {
    const { currentUser, users } = useData();
    const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
    const [activeChats, setActiveChats] = useState<string[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        const storedMessages = localStorage.getItem('unicharm_global_chat');
        if (storedMessages) {
            try {
                return JSON.parse(storedMessages);
            } catch (e) {
                console.error("Failed to load chat history", e);
                return [];
            }
        }
        return [];
    });
    const [searchQuery, setSearchQuery] = useState('');

    const availableUsers = users
        .filter(u => u.id !== currentUser?.id && u.isApproved)
        .filter(u => (u.fullName || u.username).toLowerCase().includes(searchQuery.toLowerCase()));

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('unicharm_global_chat', JSON.stringify(messages));
        }
    }, [messages]);

    const handleSend = (text: string, receiverId: string) => {
        if (!text.trim() || !currentUser) return;

        const msgId = crypto.randomUUID();
        const newMsg: ChatMessage = {
            id: msgId,
            text,
            senderId: currentUser.id,
            receiverId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMsg]);

        setTimeout(() => {
            setMessages(prev => {
                const replyId = crypto.randomUUID();
                return [...prev, {
                    id: replyId,
                    text: "Thanks for the message! I'm reviewing this now.",
                    senderId: receiverId,
                    receiverId: currentUser.id,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }];
            });
        }, 2000);
    };

    if (!currentUser) return null;

    // For mobile viewing, we only want to show one panel at a time to prevent overflow.
    const hasActiveChats = activeChats.length > 0;

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex items-end flex-row-reverse gap-2 sm:gap-4 print:hidden pointer-events-none max-w-[calc(100vw-2rem)]">
            {/* Directory Column - Hidden on mobile if a chat is active */}
            <div className={cn(
                "flex-col items-end pointer-events-auto",
                hasActiveChats ? "hidden sm:flex" : "flex"
            )}>
                {isDirectoryOpen ? (
                    <div className="w-[calc(100vw-2rem)] sm:w-[320px] h-[70vh] sm:h-[500px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
                        <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="text-white" size={18} />
                                <h3 className="font-bold text-white text-sm">Comms Hub</h3>
                            </div>
                            <button onClick={() => setIsDirectoryOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                                <ChevronDown size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-3 flex flex-col gap-2 relative">
                            <div className="relative shrink-0 mb-1 z-10 sticky top-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <Input
                                    placeholder="Search directory..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 pl-9 text-xs rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-sm"
                                />
                            </div>
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1 shrink-0">Internal Directory</h4>
                            <div className="space-y-1.5 flex-1 relative custom-scrollbar pr-1">
                                {availableUsers.map((user, idx) => {
                                    const mockStatus = statuses[idx % statuses.length] as keyof typeof statusColors;
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                if (!activeChats.includes(user.id)) {
                                                    setActiveChats(prev => [...prev, user.id]);
                                                }
                                            }}
                                            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border border-slate-100 dark:border-white/5 shadow-sm group"
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-black overflow-hidden border border-indigo-100 group-hover:border-indigo-300 transition-colors shadow-inner">
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} alt={user.fullName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (user.fullName || user.username).charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full shadow-sm", statusColors[mockStatus])} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline gap-2">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.fullName || user.username}</p>
                                                    <p className="text-[9px] text-slate-400 font-medium shrink-0">{mockStatus}</p>
                                                </div>
                                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest truncate">{user.role.replace('_', ' ')}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                                {availableUsers.length === 0 && (
                                    <div className="text-center p-8 text-slate-400 text-sm">No users found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsDirectoryOpen(true)}
                        className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-2xl hover:shadow-indigo-500/50 transition-all hover:scale-105 active:scale-95"
                    >
                        <MessageCircle size={24} />
                    </button>
                )}
            </div>

            {/* Active Chats */}
            {activeChats.map((chatUserId, index) => {
                const targetUser = users.find(u => u.id === chatUserId);
                if (!targetUser) return null;

                // Hide all but the most recently opened chat on mobile devices to save space
                const isHiddenOnMobile = index !== activeChats.length - 1;

                const chatMessages = messages.filter(
                    m => (m.senderId === currentUser.id && m.receiverId === chatUserId) ||
                        (m.senderId === chatUserId && m.receiverId === currentUser.id)
                );

                const targetIdx = users.findIndex(u => u.id === targetUser.id);
                const mockStatus = statuses[(targetIdx > -1 ? targetIdx : 0) % statuses.length] as keyof typeof statusColors;

                return (
                    <div key={chatUserId} className={cn(
                        "pointer-events-auto w-[calc(100vw-2rem)] sm:w-[300px] h-[65vh] sm:h-[400px] max-h-[75vh] bg-white dark:bg-slate-900 rounded-t-2xl rounded-b-xl shadow-2xl border border-slate-200 dark:border-white/10 flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5",
                        isHiddenOnMobile ? "hidden sm:flex" : "flex"
                    )}>
                        {/* Header */}
                        <div className="px-3 py-2 bg-slate-800 dark:bg-slate-950 flex items-center justify-between shrink-0 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setActiveChats(prev => prev.filter(id => id !== chatUserId).concat(chatUserId))}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-slate-500 shadow-sm">
                                        {targetUser.photoURL ? (
                                            <img src={targetUser.photoURL} alt={targetUser.fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            (targetUser.fullName || targetUser.username).charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-slate-800 dark:border-slate-950 rounded-full shadow-sm", statusColors[mockStatus])} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-[13px] leading-tight text-white truncate text-shadow-sm">{targetUser.fullName || targetUser.username}</span>
                                    <span className={cn("text-[10px] font-medium", mockStatus === 'Online' ? 'text-green-400' : 'text-slate-400')}>{mockStatus}</span>
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setActiveChats(prev => prev.filter(id => id !== chatUserId)); }} className="text-slate-400 hover:text-white transition-colors shrink-0 ml-2 p-1 hover:bg-slate-700 rounded-full">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages */}
                        <ChatMessages messages={chatMessages} currentUserId={currentUser.id} />

                        {/* Input */}
                        <ChatInput onSend={(text) => handleSend(text, chatUserId)} />
                    </div>
                );
            })}
        </div>
    );
}

function ChatMessages({ messages, currentUserId }: { messages: ChatMessage[], currentUserId: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50 relative custom-scrollbar" ref={scrollRef}>
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50 space-y-2">
                    <MessageCircle size={24} />
                    <p className="text-[11px] font-medium">Say hi!</p>
                </div>
            ) : (
                messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed shadow-sm",
                                isMe
                                    ? "bg-indigo-600 text-white rounded-br-none"
                                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none"
                            )}>
                                <p>{msg.text}</p>
                                <span className={cn(
                                    "text-[9px] mt-1 block font-medium opacity-70",
                                    isMe ? "text-indigo-200 text-right" : "text-slate-400"
                                )}>
                                    {msg.time}
                                </span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

function ChatInput({ onSend }: { onSend: (text: string) => void }) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSend(input);
            setInput('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 shrink-0 flex items-center gap-2">
            <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type..."
                className="flex-1 h-9 rounded-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs focus-visible:ring-indigo-500"
            />
            <Button type="submit" size="icon" className="h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shrink-0 transition-transform active:scale-95" disabled={!input.trim()}>
                <Send size={14} className="-ml-0.5" />
            </Button>
        </form>
    );
}
