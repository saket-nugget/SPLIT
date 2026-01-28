import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { BillState, ReceiptItem, User, ChatMessage, BillMetadata, BillHistoryItem } from '../types';
import { GeminiService } from '../services/GeminiService';

interface BillContextType extends BillState {
    currency: string;
    setCurrency: (currency: string) => void;
    addItem: (item: ReceiptItem) => void;
    updateItem: (itemId: string, updates: Partial<ReceiptItem>) => void;
    updateItemAssignment: (itemId: string, userIds: string[]) => void;
    toggleAssignment: (itemId: string, userId: string) => void;
    addUser: (name: string) => User | undefined;
    addMessage: (text: string, senderId?: string) => void;
    loadReceipt: (file: File) => Promise<void>;
    updateBillMetadata: (updates: Partial<BillMetadata>) => void;
    history: BillHistoryItem[];
    saveBill: () => void;
    loadBill: (id: string) => void;
    deleteBill: (id: string) => void;
    resetBill: () => void;
    setTaxRate: (rate: number) => void;
    setTipRate: (rate: number) => void;
    removeUser: (id: string) => void;
    updateUser: (id: string, updates: Partial<User>) => void;
    getBillSummary: () => string;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

export const BillProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<ReceiptItem[]>([]);
    const [users, setUsers] = useState<User[]>([
        { id: 'u1', name: 'Me', color: '#6366f1' }, // Default user
    ]);
    // Ref to track users immediately for batch operations
    const usersRef = useRef(users);

    useEffect(() => {
        usersRef.current = users;
    }, [users]);

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { id: 'm1', senderId: 'system', text: 'Welcome! Upload a receipt to get started.', timestamp: Date.now() }
    ]);
    const [taxRate, setTaxRate] = useState(0.08);
    const [tipRate, setTipRate] = useState(0.15);
    const [currency, setCurrency] = useState('$');
    const [billMetadata, setBillMetadata] = useState<BillMetadata>({
        merchantName: 'New Receipt',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'PENDING'
    });

    const [history, setHistory] = useState<BillHistoryItem[]>(() => {
        const saved = localStorage.getItem('split_bill_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('split_bill_history', JSON.stringify(history));
    }, [history]);

    const saveBill = () => {
        const newHistoryItem: BillHistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            metadata: billMetadata,
            items,
            users,
            chatHistory
        };
        setHistory(prev => [newHistoryItem, ...prev]);
        addMessage("Bill saved to history!", 'system');
    };

    const loadBill = (id: string) => {
        const bill = history.find(h => h.id === id);
        if (bill) {
            setItems(bill.items);
            setUsers(bill.users);
            setChatHistory(bill.chatHistory);
            setBillMetadata(bill.metadata);
            addMessage(`Loaded bill: ${bill.metadata.merchantName}`, 'system');
        }
    };

    const deleteBill = (id: string) => {
        setHistory(prev => prev.filter(h => h.id !== id));
    };

    const resetBill = () => {
        setItems([]);
        setUsers([{ id: 'u1', name: 'Me', color: '#6366f1' }]);
        setChatHistory([{ id: 'm1', senderId: 'system', text: 'Welcome! Upload a receipt to get started.', timestamp: Date.now() }]);
        setBillMetadata({
            merchantName: 'New Receipt',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'PENDING'
        });
        addMessage("Started a new bill.", 'system');
    };

    const addItem = (item: ReceiptItem) => {
        setItems(prev => [...prev, item]);
    };

    const updateItem = (itemId: string, updates: Partial<ReceiptItem>) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ));
    };

    const updateItemAssignment = (itemId: string, userIds: string[]) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, assignedTo: userIds } : item
        ));
    };

    const assignUserToItem = (itemId: string, userId: string) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            if (item.assignedTo.includes(userId)) return item;
            return { ...item, assignedTo: [...item.assignedTo, userId] };
        }));
    };

    const toggleAssignment = (itemId: string, userId: string) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            const newAssignments = item.assignedTo.includes(userId)
                ? item.assignedTo.filter(id => id !== userId)
                : [...item.assignedTo, userId];
            return { ...item, assignedTo: newAssignments };
        }));
    };

    const addUser = (name: string) => {
        // Use ref for immediate lookup during batch operations
        const existing = usersRef.current.find(u => u.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing;

        const newUser: User = {
            id: `u${Date.now()}${Math.floor(Math.random() * 1000)}`, // More unique ID
            name,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}` // Random color
        };

        setUsers(prev => [...prev, newUser]);
        usersRef.current = [...usersRef.current, newUser]; // Optimistic update
        usersRef.current = [...usersRef.current, newUser]; // Optimistic update
        return newUser;
    };

    const removeUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        // Also remove from assignments
        setItems(prev => prev.map(item => ({
            ...item,
            assignedTo: item.assignedTo.filter(uid => uid !== id)
        })));
    };

    const updateUser = (id: string, updates: Partial<User>) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    };

    const getBillSummary = () => {
        const userTotals: Record<string, number> = {};
        let subtotal = 0;

        // Initialize totals
        users.forEach(u => userTotals[u.id] = 0);

        // Calculate item splits
        items.forEach(item => {
            subtotal += item.price;
            if (item.assignedTo.length > 0) {
                const splitPrice = item.price / item.assignedTo.length;
                item.assignedTo.forEach(uid => {
                    if (userTotals[uid] !== undefined) {
                        userTotals[uid] += splitPrice;
                    }
                });
            } else {
                // Unassigned items go to 'Me' (u1) by default or stay unassigned?
                // For summary, let's assign unassigned to 'Me' to avoid confusion, or list as 'Unassigned'.
                // Let's add to 'Me' for now as a fallback.
                if (userTotals['u1'] !== undefined) userTotals['u1'] += item.price;
            }
        });

        const totalTax = subtotal * taxRate;
        const totalTip = subtotal * tipRate;
        const grandTotal = subtotal + totalTax + totalTip;

        let summary = `🧾 ${billMetadata.merchantName}\n`;
        summary += `Total: ${currency}${grandTotal.toFixed(2)}\n\n`;

        users.forEach(u => {
            const userSubtotal = userTotals[u.id];
            if (userSubtotal > 0) {
                const userTax = userSubtotal * taxRate;
                const userTip = userSubtotal * tipRate;
                const userTotal = userSubtotal + userTax + userTip;
                summary += `👤 ${u.name}: ${currency}${userTotal.toFixed(2)}\n`;
            }
        });

        summary += `\nGenerated by SPLIT 🚀`;
        return summary;
    };

    const addMessage = (text: string, senderId: string = 'user') => {
        const newMessage: ChatMessage = {
            id: `m${Date.now()}`,
            senderId,
            text,
            timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, newMessage]);

        if (senderId === 'user') {
            processUserCommand(text);
        }
    };

    const loadReceipt = async (file: File) => {
        addMessage("Scanning receipt with Gemini AI...", 'system');
        try {
            const { items: parsedItems, metadata } = await GeminiService.parseReceipt(file);
            setItems(parsedItems);
            if (metadata) {
                setBillMetadata(prev => ({ ...prev, ...metadata }));
            }
            addMessage(`Success! I found ${parsedItems.length} items from ${metadata?.merchantName || 'the receipt'}.`, 'system');
        } catch (error: any) {
            console.error(error);
            addMessage(`Error: ${error.message || "Unknown error"}. Please try again.`, 'system');
        }
    };

    const processUserCommand = async (text: string) => {
        try {
            // Pass current items and users (from ref to be safe)
            const result = await GeminiService.parseCommand(text, items, usersRef.current);

            if (result.action === 'ASSIGN' && result.assignments && result.assignments.length > 0) {
                const updates: string[] = [];

                result.assignments.forEach((assignment: any) => {
                    const userObj = addUser(assignment.user);
                    if (!userObj) return;

                    assignment.items.forEach((itemName: string) => {
                        // Find best matching item
                        const item = items.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(i.name.toLowerCase()));

                        if (item) {
                            assignUserToItem(item.id, userObj.id);
                            updates.push(`${userObj.name} -> ${item.name}`);
                        }
                    });
                });

                if (updates.length > 0) {
                    setTimeout(() => addMessage(`Updated: ${updates.join(', ')}`, 'system'), 500);
                } else {
                    setTimeout(() => addMessage("I understood who, but couldn't find those items on the receipt.", 'system'), 500);
                }
            } else {
                addMessage(result.response || "I'm listening.", 'system');
            }
        } catch (error) {
            console.error("Processing Error:", error);
            addMessage("I had a glitch processing that. Try again?", 'system');
        }
    };

    const updateBillMetadata = (updates: Partial<BillMetadata>) => {
        setBillMetadata(prev => ({ ...prev, ...updates }));
    };

    return (
        <BillContext.Provider value={{
            items, users, chatHistory, taxRate, tipRate, currency, billMetadata,
            addItem, updateItem, updateItemAssignment, toggleAssignment, setCurrency, addUser, addMessage, loadReceipt, updateBillMetadata,
            history, saveBill, loadBill, deleteBill, resetBill, setTaxRate, setTipRate, removeUser, updateUser, getBillSummary
        }}>
            {children}
        </BillContext.Provider>
    );
};

export const useBill = () => {
    const context = useContext(BillContext);
    if (!context) throw new Error('useBill must be used within a BillProvider');
    return context;
};
