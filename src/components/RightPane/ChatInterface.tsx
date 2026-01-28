import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBill } from '../../context/BillContext';

const ChatInterface: React.FC = () => {
    const { chatHistory, addMessage, users, items, addUser, currency } = useBill();
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        addMessage(input);
        setInput('');
    };

    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            setIsListening(true);
            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
            };

            recognition.start();
        } else {
            alert("Voice input not supported in this browser.");
        }
    };

    // Calculate totals for the summary cards
    const userTotals = useMemo(() => {
        const totals: Record<string, { count: number, cost: number, items: { name: string, price: number }[] }> = {};
        users.forEach(u => totals[u.id] = { count: 0, cost: 0, items: [] });

        items.forEach(item => {
            if (item.assignedTo.length > 0) {
                const splitPrice = item.price / item.assignedTo.length;
                item.assignedTo.forEach(uid => {
                    if (totals[uid]) {
                        totals[uid].count++;
                        totals[uid].cost += splitPrice;
                        totals[uid].items.push({ name: item.name, price: splitPrice });
                    }
                });
            }
        });
        return totals;
    }, [items, users]);

    return (
        <div className="flex flex-col h-full overflow-hidden pb-16 md:pb-0">
            {/* Progress Stepper */}
            <div className="pt-4 px-4 md:pt-8 md:px-8 pb-4 shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-semibold">Assigning Items</h3>
                    <span className="text-primary text-sm font-medium">Step 2 of 3</span>
                </div>
                <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary w-1/3"></div>
                    <div className="h-full bg-primary w-1/3 border-l border-background-dark"></div>
                    <div className="h-full bg-[#333] w-1/3 border-l border-background-dark"></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
                    <span className="text-primary">People</span>
                    <span className="text-primary">Item Assignment</span>
                    <span>Review & Tip</span>
                </div>
            </div>

            {/* Live Totals Grid - Fixed at top */}
            <div className="px-4 md:px-8 py-2 shrink-0 max-h-[35%] overflow-y-auto border-b border-[#333] mb-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    {users.map(user => {
                        const data = userTotals[user.id];
                        return (
                            <div key={user.id} className="bg-surface-dark border border-[#333] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: user.color }}>
                                        {user.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{user.name}</p>
                                        <p className="text-xs text-gray-500">{data.count} Items</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="text-white font-mono font-bold text-lg">{currency}{data.cost.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="h-[1px] bg-[#333] w-full"></div>
                                <ul className="space-y-1 max-h-20 overflow-y-auto custom-scrollbar">
                                    {data.items.map((i, idx) => (
                                        <li key={idx} className="text-xs text-gray-400 flex justify-between">
                                            <span className="truncate max-w-[120px]">{i.name}</span>
                                            <span>{currency}{i.price.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                    {/* Add Person Button */}
                    <div
                        onClick={() => {
                            const name = prompt("Enter person's name:");
                            if (name) addUser(name);
                        }}
                        className="border border-dashed border-[#333] hover:border-gray-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors min-h-[140px]"
                    >
                        <div className="bg-[#222] p-2 rounded-full">
                            <span className="material-symbols-outlined text-gray-400">person_add</span>
                        </div>
                        <span className="text-sm text-gray-400 font-medium">Add Person</span>
                    </div>
                </div>
            </div>

            {/* Chat History - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
                <div className="flex flex-col gap-4 pb-4">
                    {chatHistory.map(msg => (
                        <div key={msg.id} className={`flex gap-3 max-w-[80%] ${msg.senderId === 'user' ? 'self-end flex-row-reverse' : ''}`}>
                            {msg.senderId === 'system' ? (
                                <div className="size-8 rounded-full bg-gradient-to-br from-primary to-purple-800 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                                </div>
                            ) : (
                                <div className="size-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs shrink-0">
                                    ME
                                </div>
                            )}

                            <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.senderId === 'system'
                                ? 'bg-[#252525] rounded-tl-none text-gray-200'
                                : 'bg-primary rounded-tr-none text-background-dark font-medium shadow-lg shadow-primary/10'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 border-t border-[#333] bg-background-dark/95 backdrop-blur z-20 shrink-0">
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <div className="absolute left-4 text-gray-500">
                        <span className="material-symbols-outlined text-xl">auto_awesome</span>
                    </div>
                    <input
                        className="w-full bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-500 rounded-xl py-4 pl-12 pr-32 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                        placeholder="e.g., Dhruv and Sarah shared the nachos..."
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <div className="absolute right-2 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={startListening}
                            className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-[#333] text-gray-400'}`}
                        >
                            <span className="material-symbols-outlined text-xl">mic</span>
                        </button>
                        <button type="submit" className="bg-primary hover:bg-primary-dark text-background-dark font-bold p-2 rounded-lg transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">arrow_upward</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
