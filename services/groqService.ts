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
    You are an expert command parsing agent (Architect Agent). Your task is to analyze the user's natural language input and convert it into a structured JSON object representing a task. You must be extremely accurate and intelligent in your parsing.

    **Core Rules:**
    - The current date is: ${new Date().toString()}. All relative times ('tomorrow', 'in 2 days', 'next week', 'this afternoon') are relative to this date.
    - **Title:** The 'title' should be the core activity. Exclude time, location, or duration details unless they are part of the event name itself (e.g., "Digital Drip 0.2 Planning").
    - **Virtual vs. Physical:**
        - If a URL (e.g., zoom.us, meet.google.com) is detected, set \`isVirtual\` to \`true\` and populate \`linkedUrl\` with the full URL. DO NOT put the URL in the \`location\` field.
        - If a physical place is mentioned with 'at' or 'in' (e.g., "at Blue Bottle", "in the office"), populate the \`location\` field. \`isVirtual\` should be \`false\` or omitted.
    - **Duration:** If a duration is mentioned (e.g., 'for 120 mins', 'for 1 hr', 'for 30 minutes'), extract it to \`plannedDuration\` in MINUTES. If a meeting or learning session is mentioned but no duration is given, default to 60 minutes. For quick calls, default to 30 minutes.
    - **Category:** Infer the most logical category from this list: [${DEFAULT_CATEGORIES.join(', ')}]. Be smart: 'Run', 'boxing' -> 'Workout'. 'Client call', 'sync' -> 'Meeting'. 'Code', 'design' -> 'Prototyping'.
    - **Output:** The output MUST be only the JSON object, with no surrounding text, explanations, or markdown.

    **Example 1:**
    User Input: "/meeting with Apoorva for Praxis AI @ 3pm in Blue Bottle FiDi for 90 mins"
    JSON Output for Example 1:
    {
      "title": "Meeting with Apoorva for Praxis AI",
      "category": "Meeting",
      "location": "Blue Bottle FiDi",
      "plannedDuration": 90,
      "isVirtual": false
    }

    **Example 2:**
    User Input: "/Weekly design sync with the team on zoom https://zoom.us/j/12345 tomorrow at 10am"
    JSON Output for Example 2:
    {
      "title": "Weekly design sync with the team",
      "category": "Meeting",
      "isVirtual": true,
      "linkedUrl": "https://zoom.us/j/12345",
      "plannedDuration": 60
    }
    
    **User Input to Process:** "${command.substring(1).trim()}"
    
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