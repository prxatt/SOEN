// services/kikoAIService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { parseCommandWithLlama3 } from './groqService';
import { analyzeImageWithGPT4o, generateTextWithGPT4o, generateBriefingWithGPT4o } from './openAIService';
import { generateImageWithImagen, parseCommandWithGemini, generateCompletionSummaryWithGemini } from './geminiService';
import { Task, Note, HealthData, MissionBriefing, CompletionSummary, ActionItem } from '../types';
import { extractJson } from "../utils/jsonUtils";

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
            return { title: payload.command.startsWith('/') ? payload.command.substring(1).trim() : payload.command };
        case 'generate_completion_summary':
            return { newTitle: payload.task.title, shortInsight: "Task completed successfully!" };
        default:
            return null;
    }
};


export type KikoTaskType = 
    | 'generate_briefing' 
    | 'analyze_image' 
    | 'parse_command'
    | 'generate_completion_summary'
    | 'generate_completion_image'
    | 'generate_note_thumbnail'
    | 'generate_note_text'
    | 'generate_note_title';

export const kikoRequest = async (
    taskType: KikoTaskType,
    payload: any
): Promise<{ data: any; fallbackUsed: boolean; }> => {
    console.log('Kiko AI orchestrator received request:', taskType);
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
        // --- ARCHITECT AGENT ---
        case 'parse_command': {
            primaryAgent = () => parseCommandWithLlama3(payload.command);
            fallbackAgent = () => parseCommandWithGemini(payload.command);
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
        // --- Other agents without specific failovers defined yet ---
        case 'generate_note_text':
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
            }
            break;
        
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