import { useState } from 'react';
import { Comment } from '@/types';
import { X, AlertTriangle } from 'lucide-react';

export const DismissibleAlert = ({ comments }: { comments: Comment[] }) => {
    const [isVisible, setIsVisible] = useState(true);
    if (!isVisible) return null;
    return (
        <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-sm p-4 flex gap-4 animate-in fade-in slide-in-from-top-2 relative mb-4 print:hidden">
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={16} />
            </button>
            <div className="bg-red-50 p-2.5 rounded-full h-fit text-red-500 shrink-0">
                <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    Shift Lead Feedback
                    <span className="text-[10px] font-normal uppercase tracking-wider bg-red-50 text-red-600 px-2 py-0.5 rounded-sm border border-red-100">
                        Review Required
                    </span>
                </h3>
                <div className="space-y-3">
                    {comments.map((comment, i) => (
                        <div
                            key={i}
                            className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                                    {comment.author}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                    {new Date(comment.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <p className="leading-relaxed text-slate-700">{comment.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
