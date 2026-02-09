import { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InAppChatProps {
    recipientName: string;
    onClose: () => void;
    // Index helps position multiple chats side-by-side
    index: number;
}

export function InAppChat({ recipientName, onClose, index }: InAppChatProps) {
    const [messages, setMessages] = useState<{ id: string; text: string; sender: 'me' | 'them'; time: string }[]>([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const timersRef = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            timersRef.current.forEach(timer => clearTimeout(timer));
        };
    }, []);

    // Initial Simulated History
    useEffect(() => {
        if (recipientName) {
            const timer = setTimeout(() => {
                setMessages([
                    { id: '1', text: `Hi ${recipientName.split(' ')[0]}, regarding the roster...`, sender: 'me', time: '10:30 AM' },
                    { id: '2', text: 'Hey! Sure, let me check.', sender: 'them', time: '10:32 AM' }
                ]);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [recipientName]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const newMsg = { id: Date.now().toString(), text: input, sender: 'me' as const, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Simulate reply with tracked timer
        const replyTimer = setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "Thanks! I'm on it.",
                sender: 'them',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }, 1500);

        timersRef.current.push(replyTimer);
    };

    // Calculate position: right-4 (16px) + (index * width + gap)
    // Width = 320px, Gap = 16px
    const rightOffset = 16 + (index * (320 + 16));

    return (
        <div
            style={{ right: `${rightOffset}px` }}
            className="fixed bottom-0 w-[320px] h-[450px] bg-white dark:bg-slate-900 rounded-t-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[100] flex flex-col animate-in slide-in-from-bottom-10 duration-300"
        >

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-indigo-600 dark:bg-indigo-900 border-b border-indigo-700 rounded-t-xl shrink-0">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-black text-white border-2 border-indigo-400">
                            {recipientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-600 rounded-full"></div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white leading-tight w-32 truncate">{recipientName}</h4>
                        <span className="text-[9px] text-indigo-200 font-bold uppercase tracking-wide">Online</span>
                    </div>
                </div>
                <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-200 hover:text-white hover:bg-indigo-500/20">
                        <Phone size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-200 hover:text-white hover:bg-indigo-500/20">
                        <Video size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-200 hover:text-white hover:bg-red-500/80" onClick={onClose}>
                        <X size={14} />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-950 custom-scrollbar" ref={scrollRef}>
                <div className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest my-2">Today</div>
                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex w-full", msg.sender === 'me' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-xs font-medium leading-relaxed shadow-sm",
                            msg.sender === 'me'
                                ? "bg-indigo-600 text-white rounded-br-none"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none"
                        )}>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-100 rounded-full shrink-0">
                    <Paperclip size={14} />
                </Button>
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type..."
                    className="h-8 rounded-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs focus-visible:ring-indigo-500 px-3"
                />
                <Button type="submit" size="icon" className="h-7 w-7 rounded-full bg-indigo-600 hover:bg-indigo-700 shrink-0 text-white shadow-sm" disabled={!input.trim()}>
                    <Send size={12} />
                </Button>
            </form>
        </div>
    );
}
