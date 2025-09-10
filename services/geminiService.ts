import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Insight, Task, TaskPrep, ActionItem, Note, StrategicBriefing, ChatMessage, SearchResult, Goal, MindMapNode, MindMapEdge, HealthData, Category, ActionableInsight, TaskStatus, InsightWidgetData, CompletionSummary, WeatherWidget, Project, ProjectStatusReport, MissionBriefing } from '../types';
import { DEFAULT_CATEGORIES } from "../constants";
import { applyWatermark } from "../utils/imageUtils";
import { extractJson } from "../utils/jsonUtils";


const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// In a real app, you would manage chat instances more robustly.
let chatInstance: Chat | null = null;
let chatSystemInstruction = `You are Kiko, the smartest and most positive AI assistant. You are a hyper-intelligent, encouraging partner to Pratt, founder of the creative brand 'Surface Tension'. Your tone is confident, insightful, and slightly edgy. Your primary goal is to help Pratt turn his ideas into highly monetizable, industry-leading projects.`;

export const generateMapsEmbedUrl = (query: string): string => {
    if (!API_KEY) {
        console.warn("API Key not found, returning basic maps link.");
        return `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
    }
    return `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(query)}`;
};

export const generateMapsStaticImageUrl = (task: Task): string => {
     if (!API_KEY || !task.location || task.isVirtual) {
        return `https://source.unsplash.com/random/1920x1080?${encodeURIComponent(task.title)}`;
    }
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(task.location)}&zoom=15&size=1280x720&maptype=roadmap&key=${API_KEY}`;
}

export const generateImageWithImagen = async (prompt: string, aspectRatio: '16:9' | '4:3' | '1:1' | '9:16'): Promise<string> => {
    if (!ai) {
        return `https://source.unsplash.com/random/1920x1080?${encodeURIComponent(prompt)}`;
    }
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001', prompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio }
        });
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const watermarkedImage = await applyWatermark(`data:image/jpeg;base64,${base64ImageBytes}`);
        return watermarkedImage;
    } catch (error) {
        console.error("Error generating image with Imagen:", error);
        return `https://source.unsplash.com/random/1920x1080?error`;
    }
};


export const getAutocompleteSuggestions = async (query: string): Promise<{place_name: string; address: string}[]> => {
    if (!ai || query.length < 3) return [];
    const prompt = `Act as a location autocomplete service. Given the user query "${query}" and assuming the user is located in San Francisco, provide 5 realistic Google Maps address suggestions. The response MUST be ONLY a valid JSON array of objects, each with "place_name" and "address" keys. Do not include any other text or markdown.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                place_name: { type: Type.STRING },
                address: { type: Type.STRING }
            },
            required: ['place_name', 'address']
        }
    };
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, thinkingConfig: { thinkingBudget: 0 } }});
        
        try {
          return JSON.parse(response.text);
        } catch (e) {
          console.warn("Direct JSON parsing failed for autocomplete, attempting extraction.");
          const jsonString = extractJson(response.text);
          if (!jsonString) {
              throw new Error("No valid JSON found in response after extraction.");
          }
          return JSON.parse(jsonString);
        }
    } catch(e) {
        console.error("Failed to get autocomplete suggestions", e);
        return [];
    }
}

export const generateActionableInsights = async (task: Task, healthData: HealthData, notes: Note[], inferredHomeLocation: string | null, goals: Goal[], allTasks: Task[], isRegeneration = false): Promise<ActionableInsight | null> => {
    if (!ai) { return null; }

    const primaryGoal = goals.find(g => g.term === 'mid' && g.status === 'active')?.text || "achieve peak performance and build a successful business";
    
    const systemInstruction = `You are Kiko, an AI strategist. Your goal is to provide concise, actionable data for pre-defined UI widgets. Strictly adhere to the provided JSON schema. The current date and time is ${new Date().toString()}. Your responses must be sharp, direct, and ONLY the requested JSON object.`;
    
    const playbook = task.status === TaskStatus.Completed ? `
        **PLAYBOOK: REFLECTION & INTEGRATION (Task is COMPLETE)**
        Your mission is to generate 2-3 widgets that reflect on the completed task.
        1.  **Performance Analysis (MANDATORY):** Generate a 'KeyMetricWidget'. Analyze a key performance indicator from the completed task. For a 'Workout', analyze pace or duration. For 'Prototyping', estimate 'Features Shipped'. Be creative. 'title' should be a punchy metric name, 'value' a number, and 'unit' its label (e.g., 'min/km', 'features'). 'icon' should be 'ChartBarIcon'.
        2.  **Monetization Idea (MANDATORY):** Generate a 'TextWidget'. The 'title' must be "Monetization Idea". The 'content' must be a brief, creative, single-sentence idea on how this completed work could be productized or leveraged for business growth. 'icon' must be 'RocketIcon'.
        3.  **Health Connection (OPTIONAL):** If health data indicates poor sleep or low energy, generate a 'TextWidget'. The 'title' must be "Strategic Recovery". The 'content' should suggest a specific, actionable schedule adjustment for tomorrow. 'icon' must be 'HeartIcon'.
        ` : `
        **PLAYBOOK: PREPARATION & STRATEGY (Task is PENDING)**
        Your mission is to generate 2-3 widgets to prepare the user for the upcoming task.
        1.  **Readiness Score (MANDATORY):** Generate a 'RadialChartWidget'. Assess readiness based on health data. 'value' must be a percentage (0-100) combining energy and sleep quality. 'label' must be a single word like "Primed", "Charged", or "Ready". 'title' must be "Readiness".
        2.  **Strategic Context (MANDATORY):** Generate a 'TextWidget'. Link the task to the user's primary goal. 'title' must be "Mission Critical". 'content' must explain *why* this task is important for their goal in 1-2 sharp sentences. 'icon' must be 'FlagIcon'.
        3.  **Anticipate Needs (Choose ONE most relevant):**
            - For 'Meeting', 'Prototyping', or 'Learning': Generate a 'TextWidget' with 'title': "Key Questions" and 'content' as 2-3 bullet-pointed, creative prompts to stimulate thinking. 'icon' must be 'ChatBubbleLeftEllipsisIcon'.
            - For tasks with a physical location: Generate a 'MapWidget' ('locationQuery' is the task's location) AND a 'WeatherWidget' ('location' is the task's location).
            - For 'Personal' tasks with food keywords ('cook', 'dinner', 'lunch', 'recipe'): Generate a 'RecipeWidget' (use the task title for the 'name' and as the search query).
        `;

    const prompt = `
    **System Instruction:** ${systemInstruction}
    ${playbook}

    **CONTEXT:**
    - **User's Primary Goal:** ${primaryGoal}
    - **Task:** "${task.title}" (Category: ${task.category}, Status: ${task.status}, Location: ${task.location || 'N/A'})
    - **Task Notes:** ${task.notes || 'None'}
    - **Reference URL:** ${task.referenceUrl || 'None'}
    - **User Health:** Energy is ${healthData.energyLevel}, Sleep is ${healthData.sleepQuality}.
    - **Regeneration Requested:** ${isRegeneration}

    **MISSION:** Generate a JSON object with a "widgets" array containing 2 to 4 diverse, highly relevant widgets based on the playbook and context. Be concise and accurate. Respond with ONLY the valid JSON object.
    `;
    
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
        const jsonString = extractJson(response.text);
        if (!jsonString) throw new Error("No valid JSON found in response.");
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Error in generateActionableInsights:", e);
        // Throw the error to be caught by the kiko orchestrator
        throw e;
    }
};

export const generateTaskPrimer = async (task: Task): Promise<TaskPrep> => {
    const defaultPrep: TaskPrep = { action_plan: [], key_takeaways: [], inquiry_prompts: [], related_links: [] };
    if (!ai) return defaultPrep;

    const prompt = `Generate a concise "Task Prep" document for the task: "${task.title}". The goal is to provide a quick, scannable briefing to help the user focus.
    - action_plan: 3 brief, sequential steps to start the task.
    - key_takeaways: 2 core concepts or goals to remember during the task.
    - inquiry_prompts: 3 thought-provoking questions related to the task to spark deeper thinking.
    - related_links: 2 relevant, high-quality URLs (e.g., documentation, articles) if applicable.
    Respond ONLY with a valid JSON object.`;

    const schema = { type: Type.OBJECT, properties: { /* schema definition */ } };
    
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
        const jsonString = extractJson(response.text);
        return jsonString ? JSON.parse(jsonString) : defaultPrep;
    } catch (error) {
        console.error("Error generating task primer:", error);
        return defaultPrep;
    }
};

export const generateCompletionSummaryWithGemini = async (task: Task): Promise<CompletionSummary> => {
    const prompt = `The user just completed the task: "${task.title}". Generate a short, triumphant new title and a one-sentence, insightful summary of the accomplishment. Respond ONLY with a valid JSON object.`;
    const schema = { type: Type.OBJECT, properties: { newTitle: { type: Type.STRING }, shortInsight: { type: Type.STRING } }, required: ['newTitle', 'shortInsight'] };
    
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
        const jsonString = extractJson(response.text);
        if (!jsonString) throw new Error("No valid JSON found for completion summary.");
        return JSON.parse(jsonString);
    } catch (e) {
        return { newTitle: task.title, shortInsight: "Task completed successfully." };
    }
};

export const generateTextWithGemini = async (prompt: string): Promise<string> => {
    if (!ai) {
        console.error("Gemini AI service is not initialized.");
        throw new Error("Gemini AI not available.");
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating text with Gemini:", error);
        throw error; // Re-throw to be handled by the orchestrator
    }
};

export const parseCommandWithGemini = async (command: string): Promise<Partial<Task>> => {
    // This is a simplified fallback parser
    const prompt = `Parse this command: "${command}". Extract title, category, plannedDuration. Respond ONLY with a valid JSON object.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
        const jsonString = extractJson(response.text);
        if (!jsonString) throw new Error("Fallback parse failed.");
        return JSON.parse(jsonString);
    } catch (e) {
        return { title: command.substring(1).trim() || "Parsed Task" };
    }
};

// Placeholder for other functions from the original file to prevent import errors
export const performInternetSearch = async (query: string): Promise<any> => ({ text: 'Search results not available.', sources: [] });
export const generateProjectStatusReport = async (project: Project, notes: Note[]): Promise<any> => ({ summary: "Report not available." });
export const getChatContextualPrompts = (tab: string): string[] => ["Summarize my day.", "What's my top priority?"];
export const getChatFollowUp = async (messages: ChatMessage[]): Promise<string> => "I'm ready for your next question.";