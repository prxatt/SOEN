// services/openAIService.ts
import { ActionableInsight, Goal, HealthData, MissionBriefing, Task, Note, CompletionSummary } from "../types";

// NOTE: This service requires the OPENAI_API_KEY environment variable to be set.
// If it is not provided, the service will fall back to mocked responses.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Analyzes an image with a text prompt using the OpenAI GPT-4o vision model.
 * @param base64Image The base64 encoded string of the image.
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @param prompt The text prompt to accompany the image.
 * @returns A promise that resolves to the AI's analysis string.
 */
export const analyzeImageWithGPT4o = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    if (!OPENAI_API_KEY) {
        console.warn("OpenAI API key not found. Returning mocked response.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `This is a mocked analysis as the OpenAI API key is not configured. Your prompt was: "${prompt}"`;
    }

    const body = {
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${mimeType};base64,${base64Image}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 400
    };

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenAI API error:", errorData);
            throw new Error(`OpenAI API request failed: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "Sorry, I couldn't get a response from the model.";

    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw error;
    }
};


/**
 * Generates creative text using OpenAI's GPT-4o model.
 * @param prompt The prompt to send to the model.
 * @param schema An optional object describing the desired JSON structure.
 * @returns A promise that resolves to the generated text or a parsed JSON object.
 */
export const generateTextWithGPT4o = async (prompt: string, schema?: object): Promise<any> => {
    if (!OPENAI_API_KEY) {
        console.warn("OpenAI API key not found. Returning mocked text response.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (schema) {
            if (prompt.includes("completion_summary")) return { newTitle: "Task Complete (Mock)", shortInsight: "This is a mocked insight." };
            if (prompt.includes("mission briefing")) {
                const mockBriefing: MissionBriefing = {
                    title: "Mocked Daily Briefing",
                    summary: "This is a fallback briefing as the primary AI service is unavailable.",
                    metrics: [
                        { label: "Flow Earned", value: "N/A", icon: "SparklesIcon" },
                        { label: "Tasks Done", value: "N/A", icon: "CheckCircleIcon" },
                        { label: "Focus", value: "N/A", icon: "BrainCircuitIcon" },
                        { label: "Streak", value: "N/A", icon: "FireIcon" },
                    ],
                    healthRings: [
                        { name: 'Activity', value: 50, fill: '#EC4899' },
                        { name: 'Energy', value: 50, fill: '#F59E0B' },
                        { name: 'Sleep', value: 50, fill: '#3B82F6' },
                    ],
                    focusBreakdown: [],
                    activityTrend: [],
                    commentary: "Unable to generate AI commentary at this time. Please check your API key configuration.",
                    categoryAnalysis: [],
                };
                return mockBriefing;
            }
            return { mock: true };
        }
        return "This is a mocked response because the OpenAI API key is not configured.";
    }

    const body: any = {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
    };

    if (schema) {
        body.response_format = { type: "json_object" };
        body.messages.push({
            role: "system",
            content: `Please respond with a valid JSON object. Do not include any other text or markdown.`
        });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API request failed: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        if (schema) {
            try {
                return JSON.parse(content);
            } catch (e) {
                console.error("Failed to parse JSON from GPT-4o:", content);
                throw new Error("Model returned invalid JSON.");
            }
        }
        return content || "Sorry, I couldn't get a response.";

    } catch (error) {
        console.error("Error calling OpenAI text generation:", error);
        throw error;
    }
};

/**
 * Fallback function to generate actionable insights using GPT-4o if Gemini fails.
 */
export const generateActionableInsightsWithGPT4o = async (task: Task, healthData: HealthData, goals: Goal[]): Promise<ActionableInsight> => {
    if (!OPENAI_API_KEY) {
        console.warn("OpenAI API key missing for insights fallback. Returning mock insight.");
        return {
            widgets: [{
                type: 'text',
                title: 'AI Insight Unavailable',
                icon: 'SparklesIcon',
                content: "Insights from our secondary AI model are unavailable. Please check your OpenAI API key configuration to enable this feature."
            }]
        };
    }
    const primaryGoal = goals.find(g => g.term === 'mid' && g.status === 'active')?.text || "achieve peak performance and build a successful business";
    
    const prompt = `
    You are Kiko, an AI strategist. The primary model (Gemini) failed, so you are the fallback. Your goal is to provide a diverse set of 2-3 actionable, visually engaging widgets for the user's task. 
    
    **Task Data:**
    - Title: "${task.title}"
    - Category: "${task.category}"
    - Reference URL: ${task.referenceUrl || 'None'}
    - User Primary Goal: "${primaryGoal}"
    - Health: Energy is ${healthData.energyLevel}, Sleep is ${healthData.sleepQuality}.

    **Your Mission:**
    - Analyze the task and generate 2-3 widgets.
    - If it's a 'Learning' task, focus on key concepts and monetization ideas.
    - If it's a 'Workout', focus on performance metrics and readiness.
    - For other tasks, provide a mix of strategic context and creative ideas.
    - The output MUST be a valid JSON object with a single key "widgets", which is an array of widget objects.
    - Adhere strictly to the widget types and their properties.
    `;
    
    const schema = { widgets: [] };
    
    try {
        const result = await generateTextWithGPT4o(prompt, schema) as ActionableInsight;
        return result;
    } catch (error) {
        console.error("Error generating insights with GPT-4o fallback:", error);
        throw error;
    }
};

/**
 * Fallback function to generate the mission briefing using GPT-4o.
 */
export const generateBriefingWithGPT4o = async (
    timeframe: 'day' | 'week' | 'month',
    tasks: Task[],
    notes: Note[],
    healthData: HealthData
): Promise<MissionBriefing> => {
     const prompt = `You are Kiko, an AI Systems Architect, acting as a fallback model. Generate a mission briefing JSON based on the provided data. The output must be a valid JSON object matching the specified structure precisely.

    **Data for Analysis:**
    - Timeframe: ${timeframe}
    - Tasks: ${tasks.length} tasks, including titles like "${tasks.slice(0, 2).map(t => t.title).join(', ')}..."
    - Health Data: Energy is '${healthData.energyLevel}', Sleep is '${healthData.sleepQuality}'.

    Respond ONLY with the valid JSON object.`;

    const schema = { title: "string", summary: "string", metrics: [], healthRings: [], focusBreakdown: [], activityTrend: [], commentary: "string", categoryAnalysis: [] };
    
    try {
        const result = await generateTextWithGPT4o(prompt, schema);
        return result as MissionBriefing;
    } catch(e) {
        console.error("Error in GPT-4o briefing fallback:", e);
        throw e;
    }
}