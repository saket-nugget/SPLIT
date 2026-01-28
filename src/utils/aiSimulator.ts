import type { ReceiptItem, User } from '../types';

export const mockParseReceipt = (): ReceiptItem[] => {
    return [
        { id: '1', name: 'Club Soda', price: 1.75, assignedTo: [] },
        { id: '2', name: 'Club Soda', price: 1.75, assignedTo: [] },
        { id: '3', name: 'Thea\'s Meatballs', price: 13.50, assignedTo: [] },
        { id: '4', name: 'JF Pan Roasted Chicken', price: 16.50, assignedTo: [] },
        { id: '5', name: 'Todman Avenue Free Range', price: 10.50, assignedTo: [] },
    ];
};

interface ParseResult {
    action: 'ASSIGN' | 'UNKNOWN';
    assignments: { user: string; items: string[] }[];
}

export const parseCommand = (text: string, currentItems: ReceiptItem[], currentUsers: User[]): ParseResult => {
    const lowerText = text.toLowerCase();
    const assignments: { user: string; items: string[] }[] = [];

    // 1. Pre-process: Split by common delimiters to handle multiple statements
    const clauses = lowerText.split(/,|\.|\band\b(?=.*\bhad\b|.*\bshared\b)/);

    // Helper to find best matching item
    const findItem = (query: string): string | null => {
        // Exact match
        const exact = currentItems.find(i => i.name.toLowerCase() === query);
        if (exact) return exact.name;

        // Partial match (word overlap)
        const queryWords = query.split(' ').filter(w => w.length > 2);
        let bestMatch = null;
        let maxOverlap = 0;

        for (const item of currentItems) {
            const itemWords = item.name.toLowerCase().split(' ');
            const overlap = queryWords.filter(qw => itemWords.some(iw => iw.includes(qw))).length;
            if (overlap > maxOverlap) {
                maxOverlap = overlap;
                bestMatch = item.name;
            }
        }

        // Threshold for match
        return maxOverlap > 0 ? bestMatch : null;
    };

    // Helper to extract users
    const extractUsers = (segment: string): string[] => {
        const words = segment.split(' ');
        const found: string[] = [];

        // Check for "I", "me", "my" -> "Me"
        if (/\b(i|me|my)\b/.test(segment)) found.push('Me');

        // Check for existing users
        currentUsers.forEach(u => {
            if (segment.includes(u.name.toLowerCase()) && u.name !== 'Me') found.push(u.name);
        });

        // Heuristic: Capitalized words or words before "had"/"shared" that aren't common stopwords
        const actionIndex = words.findIndex(w => ['had', 'ate', 'drank', 'ordered', 'got', 'shared', 'split'].includes(w));
        if (actionIndex > 0) {
            const potentialName = words.slice(0, actionIndex).join(' ').replace(/\b(and)\b/g, '').trim();
            const names = potentialName.split(' ').filter(n => n.length > 1 && n !== 'and');
            names.forEach(n => {
                const capName = n.charAt(0).toUpperCase() + n.slice(1);
                if (!found.includes(capName) && !found.includes('Me')) found.push(capName);
            });
        }

        return [...new Set(found)];
    };

    for (const clause of clauses) {
        if (!clause.trim()) continue;

        const users = extractUsers(clause);
        if (users.length === 0) continue;

        // Extract items
        let itemPart = clause;
        ['had', 'ate', 'drank', 'ordered', 'got', 'shared', 'split', 'with'].forEach(verb => {
            itemPart = itemPart.replace(new RegExp(`\\b${verb}\\b`, 'g'), '');
        });
        users.forEach(u => {
            itemPart = itemPart.replace(new RegExp(`\\b${u.toLowerCase()}\\b`, 'g'), '');
        });
        itemPart = itemPart.replace(/\b(the|a|an|of)\b/g, '').trim();

        const matchedItems: string[] = [];
        const potentialItems = itemPart.split(/\band\b/);

        potentialItems.forEach(pItem => {
            const match = findItem(pItem.trim());
            if (match) matchedItems.push(match);
        });

        if (matchedItems.length > 0) {
            users.forEach(user => {
                assignments.push({ user, items: matchedItems });
            });
        }
    }

    if (assignments.length > 0) {
        return { action: 'ASSIGN', assignments };
    }

    return { action: 'UNKNOWN', assignments: [] };
};
