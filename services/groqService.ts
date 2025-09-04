// NOTE: This service requires the GROQ_API_KEY environment variable to be set.
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
        // Simple mock for testing UI flow without an API key
        if (command.toLowerCase().includes('meeting')) {
             return { title: 'Mocked Meeting', category: 'Meeting', plannedDuration: 30 };
        }
        const fallbackTitle = command.startsWith('/') ? command.substring(1).trim() : command;
        return { title: fallbackTitle };
    }
    
    const prompt = `
    You are an expert command parsing agent. Your task is to analyze the user's natural language input and convert it into a structured JSON object representing a task.
    
    **Rules:**
    - The current date is: ${new Date().toString()}. Assume all relative times ('tomorrow', 'in 2 hours') are from now.
    - If a time is mentioned without AM/PM (e.g., "at 2"), use your best judgment based on context (e.g., "meeting at 2" is likely 2 PM).
    - **The "title" should be the main subject of the command.** For example, in "/schedule a meeting with marketing team tomorrow", the title is "Meeting with marketing team". If it's a simple command like "/run 5k", the title is "Run 5k".
    - Do not invent a title. Extract it directly from the user's input.
    - The output MUST be only the JSON object, with no surrounding text, explanations, or markdown formatting.
    
    **JSON Schema:**
    {
      "title": "string // The core action or subject of the task. EXTRACT THIS FROM THE USER INPUT.",
      "category": "string // Choose one from the following list: [${DEFAULT_CATEGORIES.join(', ')}]",
      "isVirtual": "boolean // True if it mentions online platforms like Zoom, Google Meet, etc.",
      "location": "string // A full, specific street address if a location is mentioned. For virtual events, this can be null.",
      "linkedUrl": "string // The URL for a virtual meeting if provided.",
      "startTime": "string // The calculated start time in ISO 8601 format (e.g., 'YYYY-MM-DDTHH:mm:ss.sssZ').",
      "plannedDuration": "number // The duration in minutes."
    }
    
    **User Input:** "${command.substring(1).trim()}"
    
    **Your JSON Output:**
    `;

    const body = {
        model: "llama3-8b-8192", // Fast and efficient model for parsing
        messages: [{ role: "user", content: prompt }],
        temperature: 0, // We want deterministic output for parsing
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

        // Convert startTime string to Date object
        if (parsedResult.startTime) {
            parsedResult.startTime = new Date(parsedResult.startTime);
        }

        return parsedResult as Partial<Task>;

    } catch (error) {
        console.error("Error calling Groq API for command parsing:", error);
        // Re-throw the error to be caught by the orchestrator for failover.
        throw error;
    }
};