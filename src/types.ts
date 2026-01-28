export interface ReceiptItem {
    id: string;
    name: string;
    price: number;
    assignedTo: string[]; // Array of user IDs
}

export interface User {
    id: string;
    name: string;
    color: string;
}

export interface ChatMessage {
    id: string;
    senderId: string; // 'system' or 'user'
    text: string;
    timestamp: number;
}

export interface BillMetadata {
    merchantName: string;
    date: string;
    receiptNumber?: string;
    status: 'PENDING' | 'COMPLETED';
}

export interface BillHistoryItem {
    id: string;
    timestamp: number;
    metadata: BillMetadata;
    items: ReceiptItem[];
    users: User[];
    chatHistory: ChatMessage[];
}

export interface BillState {
    items: ReceiptItem[];
    users: User[];
    chatHistory: ChatMessage[];
    taxRate: number;
    tipRate: number;
    billMetadata: BillMetadata;
}
