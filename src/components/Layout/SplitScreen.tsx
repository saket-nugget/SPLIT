import React from 'react';

import ReceiptUploader from '../LeftPane/ReceiptUploader';
import ReceiptList from '../LeftPane/ReceiptList';
import ChatInterface from '../RightPane/ChatInterface';
import { useBill } from '../../context/BillContext';

const SplitScreen: React.FC = () => {
    const { items, currency, setCurrency, billMetadata, updateBillMetadata, history, saveBill, loadBill, deleteBill, resetBill, taxRate, tipRate, setTaxRate, setTipRate, users, addUser, removeUser, updateUser, getBillSummary, addMessage } = useBill();
    const [isEditing, setIsEditing] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'receipt' | 'chat'>('receipt');
    const [showHistory, setShowHistory] = React.useState(false);
    const [showPeople, setShowPeople] = React.useState(false);
    const [newUserName, setNewUserName] = React.useState('');

    const currencies = ['$', '€', '£', '₹', '¥'];

    return (
        <>
            {/* Top Navigation */}
            <header className="flex items-center justify-between border-b border-[#333] bg-surface-dark px-4 md:px-6 py-3 h-16 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 text-primary p-2 rounded-lg">
                        <span className="material-symbols-outlined text-2xl">receipt_long</span>
                    </div>
                    <h1 className="text-white text-lg font-bold tracking-tight">SPLIT</h1>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden md:flex items-center text-sm text-gray-400 gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        System Operational
                    </div>
                    <div className="hidden md:block h-8 w-[1px] bg-[#333]"></div>

                    {/* Currency Selector */}
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-[#222] text-white text-sm font-medium border border-[#333] rounded px-2 py-1 focus:outline-none focus:border-primary"
                    >
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <button
                        className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        onClick={() => setShowPeople(true)}
                    >
                        People
                    </button>
                    <button
                        className="md:hidden text-gray-300 hover:text-white transition-colors p-2"
                        onClick={() => setShowPeople(true)}
                    >
                        <span className="material-symbols-outlined text-xl">group</span>
                    </button>
                    <button
                        className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        onClick={() => setShowHistory(true)}
                    >
                        History
                    </button>
                    <button
                        className="md:hidden text-gray-300 hover:text-white transition-colors p-2"
                        onClick={() => setShowHistory(true)}
                    >
                        <span className="material-symbols-outlined text-xl">history</span>
                    </button>
                    <button
                        className="hidden md:flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm font-bold transition-colors"
                        onClick={() => {
                            const summary = getBillSummary();
                            navigator.clipboard.writeText(summary);
                            addMessage("Summary copied to clipboard! 📋", 'system');
                        }}
                    >
                        <span className="material-symbols-outlined text-sm">share</span>
                        Share
                    </button>
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-9 border-2 border-[#333]" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA4-6sn-rN0TP0YUrLY3Ssc_gdH0lUpScCCXCCQ8K7HHlzdQGbwsaV0kqxacuw2zefyoM3d28O-UFL-KVPCzlgqmRjSFPRlEeO_OjMyg7kfrRrjMnQLBn7E4O_JkWPmFzotX-cBlITcFM-apQbLEqd8bHhVGvu8g6P2T4oJ6Nf4BkKbg_IxTV54m4UNnF3zz9bZ_crPaKmagcr671ScBtDh_6NP2Va7rTyHapGSMUy3elUYTzptoLeFyUoOeW_savIKOITy7Tb7rAs")' }}></div>
                </div>
            </header>

            {/* Main Content Split Layout */}
            <main className="flex flex-1 overflow-hidden h-[calc(100dvh-4rem-4rem)] md:h-[calc(100dvh-4rem)] relative">
                {/* Left Pane: Receipt View */}
                <section className={`${activeTab === 'receipt' ? 'flex' : 'hidden'} md:flex w-full md:w-2/5 flex-col border-r border-[#333] bg-[#161616] relative shadow-xl z-10 h-full`}>
                    {/* Header */}
                    <div className="p-4 md:p-6 pb-2 shrink-0">
                        <div className="flex justify-between items-end mb-4">
                            <div className="flex-1 mr-4">
                                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Current Receipt</h2>
                                {isEditing ? (
                                    <div className="flex flex-col gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={billMetadata.merchantName}
                                            onChange={(e) => updateBillMetadata({ merchantName: e.target.value })}
                                            className="bg-[#222] text-white text-sm px-2 py-1 rounded border border-[#444] w-full"
                                            placeholder="Merchant Name"
                                        />
                                        <input
                                            type="text"
                                            value={billMetadata.receiptNumber || ''}
                                            onChange={(e) => updateBillMetadata({ receiptNumber: e.target.value })}
                                            className="bg-[#222] text-gray-400 text-xs px-2 py-1 rounded border border-[#444] w-full"
                                            placeholder="Receipt #"
                                        />
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 mt-1 truncate">
                                        {billMetadata.receiptNumber ? `Receipt #${billMetadata.receiptNumber} • ` : ''}
                                        {billMetadata.merchantName}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`text-sm font-medium flex items-center gap-1 transition-colors shrink-0 ${isEditing ? 'text-green-500' : 'text-primary hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-base">{isEditing ? 'check' : 'edit'}</span>
                                {isEditing ? 'Done' : 'Edit'}
                            </button>
                        </div>
                        {/* Receipt Meta */}
                        <div className="flex gap-2 mb-2 items-center">
                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded border border-yellow-500/20">
                                {billMetadata.status}
                            </span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={billMetadata.date}
                                    onChange={(e) => updateBillMetadata({ date: e.target.value })}
                                    className="bg-[#222] text-gray-400 text-xs px-2 py-1 rounded border border-[#444]"
                                    placeholder="Date"
                                />
                            ) : (
                                <span className="px-2 py-1 bg-[#333] text-gray-400 text-xs font-medium rounded">
                                    {billMetadata.date}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Receipt Items */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-2 space-y-3">
                        {items.length === 0 && !isEditing ? <ReceiptUploader /> : <ReceiptList isEditing={isEditing} />}
                    </div>

                    {/* Receipt Footer Summary */}
                    <div className="mt-auto bg-[#1a1a1a] border-t border-[#333] p-4 md:p-6 shadow-2xl">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Subtotal</span>
                                <span>{currency}{items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400 items-center">
                                <span>Tax {isEditing ? '(%)' : `(${(taxRate * 100).toFixed(1)}%)`}</span>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={Math.round(taxRate * 100)}
                                        onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100 || 0)}
                                        className="bg-[#222] text-white text-sm border border-[#444] rounded px-2 py-1 w-16 text-right focus:border-primary outline-none"
                                    />
                                ) : (
                                    <span>{currency}{(items.reduce((sum, item) => sum + item.price, 0) * taxRate).toFixed(2)}</span>
                                )}
                            </div>
                            <div className="flex justify-between text-sm text-primary font-medium items-center">
                                <span className="flex items-center gap-2">Tip {isEditing ? '(%)' : <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20">{(tipRate * 100).toFixed(0)}%</span>}</span>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={Math.round(tipRate * 100)}
                                        onChange={(e) => setTipRate(parseFloat(e.target.value) / 100 || 0)}
                                        className="bg-[#222] text-white text-sm border border-[#444] rounded px-2 py-1 w-16 text-right focus:border-primary outline-none"
                                    />
                                ) : (
                                    <span>{currency}{(items.reduce((sum, item) => sum + item.price, 0) * tipRate).toFixed(2)}</span>
                                )}
                            </div>
                        </div>
                        <div className="border-t border-[#333] pt-4 flex justify-between items-center">
                            <span className="text-white font-bold text-lg">Total</span>
                            <span className="text-white font-bold text-xl font-mono">
                                {currency}{(items.reduce((sum, item) => sum + item.price, 0) * (1 + taxRate + tipRate)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Right Pane: Smart Chat & Logic */}
                <section className={`${activeTab === 'chat' ? 'flex' : 'hidden'} md:flex w-full md:w-3/5 flex-col bg-background-dark relative h-full`}>
                    <ChatInterface />
                </section>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#161616] border-t border-[#333] flex justify-around items-center h-16 z-50 pb-safe">
                <button
                    onClick={() => setActiveTab('receipt')}
                    className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'receipt' ? 'text-primary' : 'text-gray-500'}`}
                >
                    <span className="material-symbols-outlined">receipt_long</span>
                    <span className="text-xs font-medium">Receipt</span>
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'chat' ? 'text-primary' : 'text-gray-500'}`}
                >
                    <span className="material-symbols-outlined">chat</span>
                    <span className="text-xs font-medium">Chat & Split</span>
                </button>
            </nav>

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-[#333] flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">Bill History</h3>
                            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-4 border-b border-[#333] flex gap-2">
                            <button
                                onClick={() => { saveBill(); setShowHistory(false); }}
                                className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <span className="material-symbols-outlined">save</span>
                                Save Current
                            </button>
                            <button
                                onClick={() => { resetBill(); setShowHistory(false); }}
                                className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <span className="material-symbols-outlined">add</span>
                                New Bill
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {history.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <span className="material-symbols-outlined text-4xl mb-2">history</span>
                                    <p>No saved bills yet.</p>
                                </div>
                            ) : (
                                history.map(bill => (
                                    <div key={bill.id} className="bg-[#222] border border-[#333] rounded-xl p-4 hover:border-primary/50 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="text-white font-bold">{bill.metadata.merchantName}</h4>
                                                <p className="text-xs text-gray-400">{new Date(bill.timestamp).toLocaleDateString()} • {new Date(bill.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteBill(bill.id); }}
                                                className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs bg-[#333] text-gray-300 px-2 py-1 rounded">
                                                {bill.items.length} Items • {bill.users.length} People
                                            </span>
                                            <button
                                                onClick={() => { loadBill(bill.id); setShowHistory(false); }}
                                                className="text-primary text-sm font-bold hover:underline"
                                            >
                                                Load
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* People Management Modal */}
            {showPeople && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-[#333] flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">Manage People</h3>
                            <button onClick={() => setShowPeople(false)} className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-4 border-b border-[#333]">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (newUserName.trim()) {
                                        addUser(newUserName.trim());
                                        setNewUserName('');
                                    }
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    placeholder="Add new person..."
                                    className="flex-1 bg-[#222] text-white px-4 py-2 rounded-lg border border-[#333] focus:border-primary outline-none"
                                />
                                <button
                                    type="submit"
                                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold transition-colors"
                                >
                                    Add
                                </button>
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center justify-between bg-[#222] p-3 rounded-lg border border-[#333]">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
                                            style={{ backgroundColor: user.color }}
                                            onClick={() => updateUser(user.id, { color: `#${Math.floor(Math.random() * 16777215).toString(16)}` })}
                                            title="Click to change color"
                                        >
                                            {user.name[0]}
                                        </div>
                                        {user.id === 'u1' ? (
                                            <span className="text-white font-medium">Me (You)</span>
                                        ) : (
                                            <input
                                                type="text"
                                                value={user.name}
                                                onChange={(e) => updateUser(user.id, { name: e.target.value })}
                                                className="bg-transparent text-white font-medium outline-none border-b border-transparent focus:border-primary"
                                            />
                                        )}
                                    </div>
                                    {user.id !== 'u1' && (
                                        <button
                                            onClick={() => removeUser(user.id)}
                                            className="text-gray-500 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SplitScreen;
