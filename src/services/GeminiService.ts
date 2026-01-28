import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ReceiptItem, User } from "../types";

// Lazy initialization
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

// Model Configuration
const PRIMARY_MODEL = "gemini-3-pro-preview";
const FALLBACK_MODEL = "gemini-2.5-flash"; // Known working model for this user

let currentModelName = PRIMARY_MODEL;

const getModel = () => {
    if (!genAI) {
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!API_KEY) {
            console.error("Missing VITE_GEMINI_API_KEY. Please check your .env file.");
            throw new Error("Missing API Key");
        }
        genAI = new GoogleGenerativeAI(API_KEY);
    }

    // Always get the model instance for the current model name
    // This allows dynamic switching
    model = genAI.getGenerativeModel({ model: currentModelName });
    return model;
};

// Helper for exponential backoff with Model Fallback
async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 2000
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        // Check for Rate Limit (429) OR Model Not Found (404) on Primary
        // If Primary fails with 404, it means the user doesn't have access to it, so we should fallback.
        const isRateLimit = error.message?.includes('429') || error.status === 429;
        const isNotFound = error.message?.includes('404') || error.message?.includes('not found');

        if (isRateLimit || (isNotFound && currentModelName === PRIMARY_MODEL)) {
            console.warn(`Error (${isRateLimit ? '429' : '404'}) hit on ${currentModelName}.`);

            // If we are on the primary model, switch to fallback immediately
            if (currentModelName === PRIMARY_MODEL) {
                console.warn(`Switching to fallback model: ${FALLBACK_MODEL}`);
                currentModelName = FALLBACK_MODEL;
                // Retry immediately with the new model
                return retryWithBackoff(operation, retries, delay);
            }

            // If we are already on fallback (or switched) and it's a rate limit, use standard backoff
            if (isRateLimit && retries > 0) {
                // Try to parse "retry in X s" from error message
                const match = error.message?.match(/retry in ([\d.]+)s/);
                let waitTime = delay;
                if (match && match[1]) {
                    waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000; // Add 1s buffer
                }

                console.warn(`Rate limit on fallback. Retrying in ${waitTime}ms... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return retryWithBackoff(operation, retries - 1, delay * 2);
            }
        }
        throw error;
    }
}

export const GeminiService = {
    /**
     * Parses a receipt image and returns a list of items.
     */
    async parseReceipt(imageFile: File): Promise<{ items: ReceiptItem[], metadata: any }> {
        return retryWithBackoff(async () => {
            try {
                const model = getModel();
                const base64Data = await fileToGenerativePart(imageFile);
                const prompt = `
                    Analyze this receipt image and extract:
                    1. The list of purchased items.
                    2. The merchant/store name.
                    3. The date of the receipt (format: MMM DD, YYYY).
                    4. The receipt number (if visible).

                    Return ONLY a valid JSON object with the following structure:
                    {
                      "items": [
                        { "id": "unique_id_1", "name": "Item Name", "price": 10.50, "assignedTo": [] }
                      ],
                      "metadata": {
                        "merchantName": "Store Name",
                        "date": "MMM DD, YYYY",
                        "receiptNumber": "12345"
                      }
                    }
                    Do not include markdown formatting like \`\`\`json. Just the raw JSON object.
                    Ensure the price is a number.
                `;

                const result = await model.generateContent([prompt, base64Data]);
                const response = await result.response;
                const text = response.text();
                const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                return JSON.parse(cleanText);
            } catch (error: any) {
                console.error("Gemini Error:", error);
                if (error.message?.includes("404") || error.message?.includes("not found")) {
                    throw new Error(`Model not found (${currentModelName}). Please check API key access.`);
                }
                throw error;
            }
        });
    },

    parseCommand: async (text: string, items: ReceiptItem[], users: User[]) => {
        return retryWithBackoff(async () => {
            const model = getModel();

            const prompt = `
            You are a smart bill-splitting assistant.
            
            Current Items:
            ${JSON.stringify(items.map(i => ({ id: i.id, name: i.name, price: i.price })))}
            
            Current Users:
            ${JSON.stringify(users.map(u => ({ name: u.name })))}
            
            User Message: "${text}"
            
            Task:
            Analyze the message and determine if the user is trying to assign items to people.
            If yes, return a JSON object with the following structure:
            {
                "action": "ASSIGN",
                "assignments": [
                    { "user": "ExactUserNameOrNewName", "items": ["ExactItemNameFromList"] }
                ]
            }
            
            Rules:
            1. "Me" refers to the user named "Me".
            2. If multiple people shared an item, list the item for EACH person.
            3. Match item names as closely as possible to the list.
            4. If the message is just chat or a question, return { "action": "CHAT", "response": "Your helpful response" }.
            5. Return ONLY valid JSON. Do not include markdown formatting.
            `;

            try {
                const result = await model.generateContent(prompt);
                const responseText = result.response.text().replace(/```json|```/g, '').trim();
                return JSON.parse(responseText);
            } catch (error) {
                console.error("Gemini Parse Error:", error);
                if ((error as any).message?.includes('429')) throw error;
                return { action: "CHAT", response: "I'm having trouble understanding that. Could you try again?" };
            }
        });
    },

    chat: async (message: string, currentItems: ReceiptItem[]) => {
        return retryWithBackoff(async () => {
            try {
                const model = getModel();
                const prompt = `
                    You are a helpful bill splitter assistant.
                    Here is the current list of items on the bill:
                    ${JSON.stringify(currentItems)}
                    The user says: "${message}"
                    If the user is asking to split an item or assign an item to someone, confirm the action in a friendly way.
                    If the user is asking a general question, answer it.
                    Keep your response short and concise (under 50 words).
                `;
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (error: any) {
                console.error("Gemini Chat Error:", error);
                if (error.message?.includes('429')) throw error;
                return "I'm having trouble connecting. Please check the console for details.";
            }
        });
    }
};

// Helper to convert File to GoogleGenerativeAI Part
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64Data = base64String.split(",")[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
