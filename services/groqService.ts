// services/groqService.ts
import { Task } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

// NOTE: This service requires the GROQ_API_KEY environment variable to be set.
// If it is not provided, the service will fall back to mocked responses.
const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Parses a natural language command into a structured task object using Groq's Llama 3 model.
 * This function acts as the "Architect Agent".
 * @param command The natural language command from the user (e.g., "/schedule meeting tomorrow at 2pm").
 * @returns A promise that resolves to a partial Task object.
 */
export const parseCommandWithLlama3 = async (command: string): Promise<Partial<Task>> => {
    if (!GROQ_API_KEY) {
        console.warn("Groq API key not found. Returning mocked response for Architect Agent.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (command.toLowerCase().includes('meeting')) {
             return { title: 'Mocked Meeting', category: 'Meeting', plannedDuration: 30 };
        }
        const fallbackTitle = command.startsWith('/') ? command.substring(1).trim() : command;
        return { title: fallbackTitle };
    }
    
    const prompt = `
    You are an expert command parsing agent. Analyze the user's natural language input and convert it into a structured JSON object representing a task.
    
    **Rules:**
    - The current date is: ${new Date().toString()}. Assume all relative times are from now.
    - The "title" should be the main subject of the command.
    - The output MUST be only the JSON object, with no surrounding text, explanations, or markdown.
    
    **JSON Schema:**
    {
      "title": "string",
      "category": "string // Choose one from: [${DEFAULT_CATEGORIES.join(', ')}]",
      "isVirtual": "boolean",
      "location": "string",
      "linkedUrl": "string",
      "startTime": "string // ISO 8601 format (e.g., 'YYYY-MM-DDTHH:mm:ss.sssZ').",
      "plannedDuration": "number // in minutes."
    }
    
    **User Input:** "${command.substring(1).trim()}"
    
    **Your JSON Output:**
    `;

    const body = {
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" },
    };

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Groq API request failed: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const responseContent = data.choices[0]?.message?.content;
        
        if (!responseContent) {
            throw new Error("Empty response from Groq API.");
        }

        const parsedResult = JSON.parse(responseContent);

        if (parsedResult.startTime) {
            const date = new Date(parsedResult.startTime);
            if (!isNaN(date.getTime())) {
                 parsedResult.startTime = date;
            } else {
                delete parsedResult.startTime;
            }
        }

        return parsedResult as Partial<Task>;

    } catch (error) {
        console.error("Error calling Groq API for command parsing:", error);
        throw error;
    }
};
