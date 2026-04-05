import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are 'The Librarian,' the world's most insightful and knowledgeable literary curator and recommendation engine. You have an encyclopedic knowledge of all books, from ancient classics to obscure modern texts across all genres and disciplines. Your talent lies not just in knowing books, but in understanding the deep conceptual connections between them and perceiving the intellectual fingerprint of a reader from their collection. Your recommendations are always surprising, insightful, and perfectly tailored to expand a reader's mind. You are rigorous, precise, and your primary goal is to provide the most valuable and unexpected recommendations possible.`;

const USER_PROMPT_TEMPLATE = `
**Mandatory Three-Step Internal Process:**

**Step 1: Identify Books.**
First, meticulously identify every book title and author you can discern from the provided bookshelf image. Create an internal list. This list is your ONLY source of truth.

**Step 2: Profile the Reader.**
Based ONLY on the list from Step 1, create a conceptual profile of the reader. What are their core interests (e.g., control systems, philosophy of mind, post-war fiction, the history of teapots)? What is their level of expertise? What are the strange linkages and ideas that exist in the spaces between their books?

**Step 3: Generate Recommendations (Your Final Output).**
Using your analysis from Step 2, generate the final JSON output. The recommendations must be a direct result of your specific analysis, not generic suggestions.

**Final Output Schema:**
Your entire output must be a single, valid JSON object with four keys. Each key's value must be an array of exactly 5 book objects. The keys are:
1.  "latentSpace": Recommendations that exist in the conceptual space between the user's current books. Go deep here. Do not bring back the expected and the normal. Find interesting titles that will surprise and delight.
2.  "yourBooksOnAcid": Go wild. Go trippy. Imagine taking the themes / ideas / concepts / narrative content of the users collection. Then take it into unexpected and surprising directions. Turn an ordinary book-list into an esoteric wonderland.
3.  "differentViewpoints": Books on similar topics but from opposing or radically different perspectives. This list of books should be designed to challenge the user, but in an inspiring and enjoyable manner.
4.  "forgottenClassics": Influential but lesser-known classics relevant to the user's tastes.

**Rules:**
- Each book object must have two keys: "title" and "author".
- Each category must contain exactly 5 book recommendations.
- Recommendations must be non-obvious "deeper cuts." Avoid mainstream bestsellers.
`;

export type Book = {
    title: string;
    author: string;
};

export type Recommendations = {
    latentSpace: Book[];
    yourBooksOnAcid: Book[];
    differentViewpoints: Book[];
    forgottenClassics: Book[];
};

export async function generateBookRecommendations(file: File): Promise<{ success: boolean; data?: Recommendations; error?: string }> {
    try {
        // 1. Input Validation
        if (!file) {
            return { success: false, error: "No image provided" };
        }

        // Size check (Max 4.5MB to be safe)
        const MAX_SIZE = 4.5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return { success: false, error: "File too large. Maximum size is 4.5MB." };
        }

        // Type check
        const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
        if (!ALLOWED_TYPES.includes(file.type)) {
            return { success: false, error: "Invalid file type. Please upload a JPEG, PNG, or WebP image." };
        }

        const base64String = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // FileReader returns data:image/jpeg;base64,...
                // We just need the base64 part
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // Use Gemini 3.1 Pro Preview for the best reasoning and analysis
        const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: USER_PROMPT_TEMPLATE },
                        {
                            inlineData: {
                                data: base64String,
                                mimeType: file.type,
                            }
                        }
                    ]
                }
            ],
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                // Using responseSchema ensures we get exactly the JSON structure we need
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        latentSpace: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    author: { type: Type.STRING }
                                },
                                required: ["title", "author"]
                            }
                        },
                        yourBooksOnAcid: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    author: { type: Type.STRING }
                                },
                                required: ["title", "author"]
                            }
                        },
                        differentViewpoints: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    author: { type: Type.STRING }
                                },
                                required: ["title", "author"]
                            }
                        },
                        forgottenClassics: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    author: { type: Type.STRING }
                                },
                                required: ["title", "author"]
                            }
                        }
                    },
                    required: ["latentSpace", "yourBooksOnAcid", "differentViewpoints", "forgottenClassics"]
                }
            }
        });

        const text = response.text;

        if (!text) {
            console.error("Gemini returned empty text response");
            return { success: false, error: "The Librarian remained silent. Please try again." };
        }

        try {
            const data = JSON.parse(text) as Recommendations;
            return { success: true, data };
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return { success: false, error: "The Librarian's handwriting was illegible. Please try again." };
        }

    } catch (error: any) {
        console.error("Gemini API Error (Internal):", error);
        return { success: false, error: "An internal library error occurred." };
    }
}
