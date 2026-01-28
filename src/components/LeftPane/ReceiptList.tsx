import React from 'react';
import { useBill } from '../../context/BillContext';

interface ReceiptListProps {
    isEditing?: boolean;
}

const ReceiptList: React.FC<ReceiptListProps> = ({ isEditing = false }) => {
    const { items, users, currency, toggleAssignment, updateItem, addItem } = useBill();

    const getUser = (userId: string) => users.find(u => u.id === userId);

    return (
        <div className="space-y-3">
            {items.map(item => (
                <div
                    key={item.id}
                    onClick={() => {
                        if (!isEditing) {
                            // Cycle through users or just toggle 'Me' for now?
                            // Plan said: "Click Item -> Toggle Assignment"
                            // Let's toggle the first user ('Me') for simplicity, or maybe open a menu?
                            // Actually, let's just toggle 'Me' (u1) as a default action for quick testing,
                            // OR better: if no one assigned, assign 'Me'. If 'Me' assigned, unassign.
                            // But wait, we have multiple users.
                            // Let's make it toggle the CURRENT user (which is usually 'Me' in this single-player view).
                            // For now, let's hardcode toggling 'u1' (Me) to verify interactivity.
                            toggleAssignment(item.id, 'u1');
                        }
                    }}
                    className={`group flex items-center justify-between bg-surface-dark p-3 rounded-lg border border-[#333] transition-colors cursor-pointer ${isEditing ? '' : 'hover:border-primary/50'}`}
                >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className="bg-[#333] text-gray-400 flex items-center justify-center rounded-md shrink-0 size-10">
                            <span className="material-symbols-outlined text-xl">
                                {item.name.toLowerCase().includes('beer') || item.name.toLowerCase().includes('soda') ? 'local_bar' :
                                    item.name.toLowerCase().includes('cake') ? 'icecream' : 'restaurant'}
                            </span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 mr-4">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                    className="bg-[#222] text-white text-sm border border-[#444] rounded px-2 py-1 w-full focus:border-primary outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                            )}

                            {!isEditing && (
                                <p className="text-xs text-gray-500">
                                    Qty: 1 {item.assignedTo.length > 1 ? '(Shared)' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {!isEditing && (
                            <div className="flex -space-x-2">
                                {item.assignedTo.map(uid => {
                                    const user = getUser(uid);
                                    if (!user) return null;
                                    return (
                                        <div
                                            key={uid}
                                            className="size-6 rounded-full border border-[#1E1E1E] flex items-center justify-center text-[10px] font-bold text-white"
                                            style={{ backgroundColor: user.color }}
                                            title={user.name}
                                        >
                                            {user.name[0]}
                                        </div>
                                    );
                                })}
                                {item.assignedTo.length === 0 && (
                                    <div className="size-6 rounded-full border border-[#1E1E1E] border-dashed border-gray-500 flex items-center justify-center bg-transparent">
                                        <span className="material-symbols-outlined text-[10px] text-gray-500">add</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {isEditing ? (
                            <input
                                type="number"
                                value={item.price}
                                onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                                className="bg-[#222] text-white text-sm font-mono border border-[#444] rounded px-2 py-1 w-20 text-right focus:border-primary outline-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <p className={`text-sm font-bold font-mono ${item.assignedTo.length === 0 ? 'text-primary' : 'text-white'}`}>
                                {currency}{item.price.toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>
            ))}

            <button
                onClick={() => {
                    const newItem = {
                        id: `item-${Date.now()}`,
                        name: 'New Item',
                        price: 0,
                        quantity: 1,
                        assignedTo: []
                    };
                    addItem(newItem);
                }}
                className="w-full py-3 border border-dashed border-[#333] rounded-lg text-gray-500 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined">add</span>
                Add Item
            </button>
        </div>
    );
};

export default ReceiptList;
