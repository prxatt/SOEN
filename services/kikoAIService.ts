import { GoogleGenAI, Type } from "@google/genai";
import { parseCommandWithLlama3, parseUpdateCommandWithLlama3 } from './groqService';
import { analyzeImageWithGPT4o, generateTextWithGPT4o, generateBriefingWithGPT4o, generateActionableInsightsWithGPT4o } from './openAIService';
import { generateImageWithImagen, parseCommandWithGemini, generateCompletionSummaryWithGemini, generateActionableInsights, getAutocompleteSuggestions, generateTextWithGemini } from './geminiService';
import { Task, Note, HealthData, MissionBriefing, CompletionSummary, ActionItem, Goal, ActionableInsight } from '../types';
import { extractJson } from "../utils/jsonUtils";
import { inferHomeLocation } from "../utils/taskUtils";

const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// This function is moved here from geminiService to be part of the "Analyst Agent"
const generateMissionBriefingWithGemini = async (
    timeframe: 'day' | 'week' | 'month',
    tasks: Task[],
    notes: Note[],
    healthData: HealthData
): Promise<MissionBriefing> => {
    if (!ai) throw new Error("Gemini AI not available.");

    const tasksSummary = tasks.map(t => `- ${t.title} (${t.category}, Status: ${t.status})`).slice(0, 20).join('\n');
    const notesSummary = notes.map(n => `- ${n.title}`).slice(0, 10).join('\n');
    
    const prompt = `
    Act as Kiko, a world-class AI Systems Architect and strategic advisor for Pratt. Your mission is to provide a hyper-relevant, fun, and gamified intelligence report for the upcoming ${timeframe}. The current date is ${new Date().toDateString()}.

    **Core Objective:** Analyze the provided data to find an actionable opportunity for a new prototype for his brand 'Surface Tension'. Your tone should be sharp, encouraging, and slightly edgy.

    **Data for Analysis:**
    - **Tasks for this period:**\n${tasksSummary || 'None'}
    - **Health Data:** Energy level is '${healthData.energyLevel}', Sleep quality is '${healthData.sleepQuality}'.
    - **Goals:** Pratt's primary goal is to build monetizable digital products.

    **JSON Output Instructions (BE CONCISE):**
    1.  **title**: Create a compelling, mission-oriented title (e.g., "Today's Mission: Prototype Velocity").
    2.  **summary**: A brief, insightful summary. What's the main objective for this period?
    3.  **metrics**: Generate 4 fun, gamified metrics. Examples: 'Flow Earned', 'Skills Unlocked', 'Completed Quests', 'Creative Sparks'. Use icons: [BrainCircuitIcon, CheckCircleIcon, BookOpenIcon, BoltIcon, FireIcon, FlagIcon, RocketIcon].
    4.  **healthRings**: Generate 3 metrics for a ring chart: 'Activity', 'Energy', and 'Sleep'. Value is a percentage (0-100) based on health data. Use fills: '#EC4899' (Activity), '#F59E0B' (Energy), '#3B82F6' (Sleep).
    5.  **focusBreakdown**: Analyze task categories. Provide data for a pie chart showing time distribution (value is total minutes).
    6.  **activityTrend**: Analyze task completions over the period. Provide data for a bar chart.
    7.  **commentary**: **CRITICAL.** A sharp, actionable analysis. Identify ONE key opportunity for a new prototype based on the data. Keep it to 1-2 sentences.
    8.  **categoryAnalysis**: For each category from the focusBreakdown, create an object containing "category" (string) and "analysis" (string). The analysis is a short, edgy, one-sentence insight. Return a JSON array of these objects.

    Respond ONLY with the valid JSON object.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            metrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING }, icon: { type: Type.STRING } }, required: ['label', 'value', 'icon'] } },
            healthRings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING, enum: ['Activity', 'Energy', 'Sleep'] }, value: { type: Type.NUMBER }, fill: { type: Type.STRING } }, required: ['name', 'value', 'fill'] } },
            focusBreakdown: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER }, fill: { type: Type.STRING } }, required: ['name', 'value', 'fill'] } },
            activityTrend: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER }, fill: { type: Type.STRING } }, required: ['name', 'value', 'fill'] } },
            commentary: { type: Type.STRING },
            categoryAnalysis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        analysis: { type: Type.STRING }
                    },
                    required: ['category', 'analysis']
                }
            }
        },
        required: ['title', 'summary', 'metrics', 'healthRings', 'focusBreakdown', 'activityTrend', 'commentary', 'categoryAnalysis']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 0 } // Prioritize speed
            }
        });
        const jsonString = extractJson(response.text);
        if (!jsonString) { throw new Error("Briefing generation failed: No valid JSON found."); }
        return JSON.parse(jsonString) as MissionBriefing;
    } catch (e: any) {
        console.error("Error generating mission briefing with Gemini:", e);
        // Throw error to be caught by orchestrator for failover
        throw e;
    }
}

const getErrorFallbackData = (taskType: KikoTaskType, payload: any): any => {
    switch (taskType) {
        case 'parse_command':
        case 'parse_task_update':
             const title = payload.command.startsWith('/') ? payload.command.substring(1).trim().split('@')[0].trim() : payload.command;
             return { title: title || "New Task", category: 'Personal', plannedDuration: 60 };
        case 'generate_completion_summary':
            return { newTitle: payload.task.title, shortInsight: "Task completed successfully!" };
        case 'generate_task_insights':
            return {
                widgets: [
                    {
                        type: 'text',
                        title: 'AI Connection Error',
                        icon: 'BoltSlashIcon',
                        content: "Kiko is currently unable to connect to the strategic insight network. Please check your API key configuration or try again later.",
                    },
                    {
                        type: 'metric',
                        title: 'Mock Readiness',
                        value: 75,
                        unit: '%',
                        icon: 'SparklesIcon',
                        color: 'text-amber-400'
                    }
                ]
            } as ActionableInsight;
        default:
            return null;
    }
};


export type KikoTaskType = 
    | 'generate_briefing' 
    | 'analyze_image' 
    | 'parse_command'
    | 'parse_task_update'
    | 'generate_completion_summary'
    | 'generate_completion_image'
    | 'generate_note_thumbnail'
    | 'generate_note_text'
    | 'generate_note_tags'
    | 'generate_note_title'
    | 'generate_task_insights'
    | 'generate_note_from_template'
    | 'generate_daily_image';

export const kikoRequest = async (
    taskType: KikoTaskType,
    payload: any
): Promise<{ data: any; fallbackUsed: boolean; }> => {
    console.log('Kiko orchestrator received request:', taskType);
    let primaryAgent: Function, fallbackAgent: Function | null = null;
    let finalPayload = payload;

    switch(taskType) {
        // --- ANALYST AGENT ---
        case 'generate_briefing': {
            const { timeframe, tasks, notes, healthData } = payload;
            primaryAgent = () => generateMissionBriefingWithGemini(timeframe, tasks, notes, healthData);
            fallbackAgent = () => generateBriefingWithGPT4o(timeframe, tasks, notes, healthData);
            break;
        }
        case 'generate_task_insights': {
            const { task, healthData, notes, goals, allTasks, isRegeneration } = payload;
            primaryAgent = () => generateActionableInsights(task, healthData, notes, inferHomeLocation(allTasks), goals, allTasks, isRegeneration);
            fallbackAgent = () => generateActionableInsightsWithGPT4o(task, healthData, goals);
            break;
        }
        // --- ARCHITECT AGENT ---
        case 'parse_command': {
            primaryAgent = async () => {
                const parsedData = await parseCommandWithLlama3(payload.command);
                
                // Location enrichment step for physical locations
                if (parsedData.location && !parsedData.isVirtual) {
                    const suggestions = await getAutocompleteSuggestions(parsedData.location);
                    if (suggestions && suggestions.length > 0) {
                        parsedData.location = suggestions[0].address; // Use the top suggestion
                    }
                }
                // Location enrichment for virtual events from URL
                if (parsedData.isVirtual && parsedData.linkedUrl) {
                    try {
                        const url = new URL(parsedData.linkedUrl);
                        if (url.hostname.includes('zoom.us')) {
                            const pathParts = url.pathname.split('/').filter(p => p);
                            parsedData.location = (pathParts[0] === 'j' && pathParts[1]) ? `Zoom: ${pathParts[1]}` : 'Zoom Meeting';
                        } else if (url.hostname.includes('meet.google.com')) {
                            const path = url.pathname.replace('/', '');
                            parsedData.location = path ? `Google Meet: ${path}` : 'Google Meet';
                        } else {
                            parsedData.location = `Virtual Event: ${url.hostname}`;
                        }
                    } catch (e) {
                        console.warn('Could not parse linkedUrl for virtual location:', parsedData.linkedUrl);
                    }
                }

                // --- NEW: Title Refinement Step ---
                const isTitleGeneric = parsedData.title && parsedData.category && parsedData.title.toLowerCase() === parsedData.category.toLowerCase();

                if (isTitleGeneric && (parsedData.location || parsedData.linkedUrl)) {
                    const context = `Category: ${parsedData.category}\nLocation: ${parsedData.location || 'N/A'}\nVirtual Meeting Link: ${parsedData.linkedUrl || 'N/A'}`;
                    const prompt = `Based on the following task details, generate a short, descriptive, and engaging title for a to-do list item. The current title is too generic.
                    
                    **Task Details:**
                    ${context}

                    **Examples:**
                    - Details: Category: Meeting, Location: Google Meet: abc-def-ghi -> Title: "Sync on Google Meet"
                    - Details: Category: Workout, Location: 24 Hour Fitness, San Francisco -> Title: "Workout at 24 Hour Fitness"
                    - Details: Category: Learning, Location: N/A -> Title: "Learning Session" (No change if not enough context)

                    Respond ONLY with the new title.`;

                    try {
                        const newTitle = await generateTextWithGPT4o(prompt);
                        parsedData.title = newTitle.replace(/"/g, '').trim();
                    } catch (e) {
                        console.warn("Title refinement with GPT-4o failed. Using generic title.", e);
                    }
                }
                
                return parsedData;
            };
            fallbackAgent = () => parseCommandWithGemini(payload.command);
            break;
        }
        case 'parse_task_update': {
            const { command, task } = payload;
            primaryAgent = async () => {
                const parsedUpdate = await parseUpdateCommandWithLlama3(command);

                // Title refinement logic for updates
                const isTitleGeneric = task.title && (parsedUpdate.category || task.category) && task.title.toLowerCase() === (parsedUpdate.category || task.category).toLowerCase();
                
                if (isTitleGeneric && (parsedUpdate.location || parsedUpdate.linkedUrl || task.location || task.linkedUrl)) {
                    const contextTask = { ...task, ...parsedUpdate }; // use updated context for refinement
                    const context = `Category: ${contextTask.category}\nLocation: ${contextTask.location || 'N/A'}\nVirtual Meeting Link: ${contextTask.linkedUrl || 'N/A'}`;
                    const prompt = `Based on the following task details, generate a short, descriptive, and engaging title. The current title is a generic placeholder.
                    
                    **Task Details:**
                    ${context}

                    **Examples:**
                    - Details: Category: Meeting, Location: Google Meet: abc-def-ghi -> Title: "Sync on Google Meet"
                    - Details: Category: Workout, Location: 24 Hour Fitness, San Francisco -> Title: "Workout at 24 Hour Fitness"
                    - Details: Category: Learning, Location: N/A -> Title: "Learning Session" (No change if not enough context)

                    Respond ONLY with the new title.`;

                    try {
                        const refinedTitle = await generateTextWithGPT4o(prompt);
                        parsedUpdate.title = refinedTitle.replace(/"/g, '').trim();
                    } catch (e) {
                        console.warn("Title refinement for update failed. Using user-provided title.", e);
                    }
                }
                return parsedUpdate;
            };
            break;
        }
         // --- MUSE AGENT (Creative Text) ---
        case 'generate_completion_summary': {
            const { task } = payload;
            // Primary for creative text is GPT-4o as per strategy
            const prompt = `The user just completed the task: "${task.title}". Generate a short, triumphant, and slightly edgy new title for this completed task (e.g., "5k Run" becomes "5k Conquered"). Also, provide a one-sentence, insightful, and encouraging summary of the accomplishment. Ensure the response is grammatically correct and spelled perfectly.`;
            const schema = { newTitle: 'string', shortInsight: 'string' };
            primaryAgent = () => generateTextWithGPT4o(prompt, schema);
            fallbackAgent = () => generateCompletionSummaryWithGemini(task);
            break;
        }
        case 'generate_note_from_template': {
            const { type } = payload;
            let prompt = '';
            let schema = {};

            if (type === 'daily_planner') {
                prompt = `Generate a JSON object for a daily planner for a creative entrepreneur. Include an array of 3 inspiring priorities, a schedule array with 4 example tasks (with 'time' and 'task' string properties), a short 'mindfulness_moment' string, and an empty 'notes' string.`;
                schema = { priorities: ["string"], schedule: [{time: "string", task: "string"}], mindfulness_moment: "string", notes: "string" };
            } else if (type === 'case_study') {
                prompt = `Generate a JSON object for a business case study template. Include a 'title' string (e.g., "Case Study: [Client Name]") and a 'content' string with HTML placeholders for sections like Summary, Problem, Solution, and Results.`;
                schema = { title: "string", content: "string" };
            } else {
                return { data: { title: 'New Note', content: '<p>Start here...</p>', error: "Invalid template type" }, fallbackUsed: true };
            }
            
            primaryAgent = () => generateTextWithGPT4o(prompt, schema);
            // No Gemini fallback defined for this creative task for now.
            break;
        }
        // --- VISION AGENT ---
        case 'analyze_image': {
            const { base64, mimeType, prompt } = payload;
            primaryAgent = () => analyzeImageWithGPT4o(base64, mimeType, prompt);
            // No fallback for vision, as GPT-4o is the specialized model
            break;
        }
        // --- MUSE AGENT (Image Generation) ---
        case 'generate_completion_image': {
            const { task } = payload as { task: Task };
             let prompt: string;
            const workoutKeywords = ['run', 'jog', 'cardio', 'tempo run', '5k', '10k', 'marathon', 'boxing', 'workout'];
            const isWorkout = task.category === 'Workout' || workoutKeywords.some(kw => task.title.toLowerCase().includes(kw));

            if (isWorkout) {
                prompt = `4k cinematic, stunning, high-resolution. Epic anime-style illustration of a triumphant male athlete after completing "${task.title}". Dynamic motion, glowing energy aura, dramatic lighting. Focus on power and achievement. No text, no words, no watermarks.`;
            } else if (task.category === 'Learning') {
                prompt = `4k cinematic, visually stunning, abstract representation of knowledge and creativity blossoming. Digital art, neural network visuals, flowing light particles, dark sophisticated background. A beautiful visual motif that could inspire a monetizable idea. No text, no words. Topic: "${task.title}".`;
            } else if (task.category === 'Editing') {
                prompt = `4k, cinematic, professional photograph. A sleek, minimalist, high-fashion creative studio. Soft lighting, sophisticated equipment, focused on the art of creation. No text, no words. Task context: "${task.title}".`;
            } else {
                 prompt = `4k cinematic, stunning, high-resolution. A visually stunning, triumphant, abstract, artistic representation of successfully completing the task: "${task.title}". Use a sophisticated, minimalist style with a motivational feel. No text, no words, no watermarks.`;
            }
            primaryAgent = () => generateImageWithImagen(prompt, '16:9');
            // No LLM fallback for image generation
            break;
        }
        case 'generate_daily_image': {
            const { date, tasks } = payload as { date: Date; tasks: Task[] };
            const tasksString = tasks.map(t => `${t.title} (${t.category})`).join(', ');
            const prompt = `Generate an ultra-high quality, visually stunning, inspirational piece of art that serves as a phone wallpaper. The image should symbolize the user's achievements for the day.
            
            **Daily Activities:** ${tasksString || 'A day of focus and creative potential.'}
            
            **Artistic Style:** A masterful blend of painterly strokes, masterful film direction lighting, abstract concepts, and the clean aesthetic of a legendary anime creator or 3D modeler. The mood should be triumphant, inspiring, and sophisticated. It needs to be beautiful and something a user would want to save and share.
            
            **Constraints:** Absolutely no text, words, letters, or watermarks. The image should be purely visual. 4k cinematic quality.
            `;
            primaryAgent = () => generateImageWithImagen(prompt, '9:16');
            break;
        }
        // --- Other agents without specific failovers defined yet ---
        case 'generate_note_text': {
             const { instruction, text, noteContent } = payload as { instruction: 'summarize' | 'expand' | 'findActionItems' | 'createTable' | 'generateProposal', text: string, noteContent?: string };
            if (instruction === 'findActionItems') {
                const prompt = `Analyze the following text and extract any clear, actionable tasks or to-do items. If no specific action items are found, return an empty array. Text:\n\n---\n${text}\n---`;
                const schema = { action_items: [{ title: 'string' }] };
                primaryAgent = async () => {
                    const result = await generateTextWithGPT4o(prompt, schema);
                    return (result as { action_items: ActionItem[] }).action_items || [];
                }
            } else {
                let prompt = '';
                if (instruction === 'summarize') prompt = `Summarize the following text concisely:\n\n---\n${text}\n---`;
                if (instruction === 'expand') prompt = `Expand on the following point, adding more detail, context, or examples:\n\n---\n${text}\n---`;
                if (instruction === 'createTable') prompt = `Based on the following text, create a simple HTML table. The text is: "${text}". Only return the <table>...</table> HTML.`;
                if (instruction === 'generateProposal') prompt = `I am Pratt from Surface Tension. Draft a short, professional proposal introduction for a new project with "${text}" (the client's name). Use the following case study content from my notes as a reference: \n\n---\n${(noteContent || '').replace(/<[^>]*>?/gm, '')}\n---\n\nThe tone should be confident, luxurious, and underground.`;
                primaryAgent = () => generateTextWithGPT4o(prompt);
                fallbackAgent = () => generateTextWithGemini(prompt);
            }
            break;
        }
        case 'generate_note_tags': {
            if (!ai) throw new Error("Gemini AI not available.");
            const { title, content } = payload as { title: string, content: string };
            const prompt = `Analyze the following note title and content. Extract 3 to 5 relevant single-word or two-word tags for categorization. Focus on key concepts, technologies, people, or themes. Respond ONLY with a valid JSON object with a single key "tags" containing an array of strings. Note Title: "${title}". Content: "${(content || '').replace(/<[^>]*>?/gm, '').substring(0, 500)}...".`;
            const schema = { type: Type.OBJECT, properties: { tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["tags"] };
            
            primaryAgent = async () => {
                const response = await ai.models.generateContent({ 
                    model: "gemini-2.5-flash", 
                    contents: prompt, 
                    config: { responseMimeType: "application/json", responseSchema: schema } 
                });
                const jsonString = extractJson(response.text);
                if (!jsonString) return [];
                const result = JSON.parse(jsonString);
                return result.tags || [];
            };
            
            fallbackAgent = async () => {
                const gptPrompt = `Analyze the note title and content, then return a JSON object with a single key "tags" containing an array of 3-5 relevant string tags. Title: "${title}", Content: "${(content || '').replace(/<[^>]*>?/gm, '').substring(0, 500)}..."`;
                const result = await generateTextWithGPT4o(gptPrompt, { tags: [] });
                return result.tags || [];
            }
            break;
        }

        default:
             console.error(`Unknown Kiko task type or no primary agent defined: ${taskType}`);
             return { data: null, fallbackUsed: false };

    }

    try {
        const data = await primaryAgent();
        return { data, fallbackUsed: false };
    } catch (primaryError) {
        console.warn(`Primary AI agent for ${taskType} failed. Reason:`, primaryError);
        
        if (fallbackAgent) {
            console.log(`Executing fallback for ${taskType}.`);
            try {
                const data = await fallbackAgent();
                return { data, fallbackUsed: true };
            } catch (fallbackError) {
                console.error(`Fallback AI agent for ${taskType} also failed. Reason:`, fallbackError);
                return { data: getErrorFallbackData(taskType, payload), fallbackUsed: true };
            }
        }
        
        // If no fallback agent, return default error data
        return { data: getErrorFallbackData(taskType, payload), fallbackUsed: true };
    }
};

// FIX: Export a wrapper for the 'parse_command' Kiko task to be used in the NewTaskModal.
export const parseTaskFromString = (command: string): Promise<{ data: Partial<Task>, fallbackUsed: boolean }> => {
    return kikoRequest('parse_command', { command });
};