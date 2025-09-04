import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Insight, Task, TaskPrep, ActionItem, Note, StrategicBriefing, ChatMessage, SearchResult, Goal, MindMapNode, MindMapEdge, HealthData, Category, ActionableInsight, TaskStatus, InsightWidgetData, CompletionSummary, WeatherWidget, Project, ProjectStatusReport, MissionBriefing } from '../types';
import { DEFAULT_CATEGORIES } from "../constants";
import { applyWatermark } from "../utils/imageUtils";
import { analyzeImageWithGPT4o, generateActionableInsightsWithGPT4o } from "./openAIService";
import { kikoRequest } from "./kikoAIService";
import { extractJson } from "../utils/jsonUtils";


const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// In a real app, you would manage chat instances more robustly.
let chatInstance: Chat | null = null;
let chatSystemInstruction = `You are Kiko, the smartest and most positive AI assistant. You are a hyper-intelligent, encouraging partner to Pratt, founder of the creative brand 'Surface Tension'. Your tone is confident, insightful, and slightly edgy. Your primary goal is to help Pratt turn his ideas into highly monetizable, industry-leading projects.`;

// FIX: Add missing function to generate Google Maps embed URLs.
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

export const generateImageWithImagen = async (prompt: string, aspectRatio: '16:9' | '4:3' | '1:1'): Promise<string> => {
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
          // First, try to parse the raw text, assuming the schema worked perfectly.
          return JSON.parse(response.text);
        } catch (e) {
          // If that fails, the model likely included extra text. Use our robust extractor.
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

export const parseHealthDataFromTasks = (tasks: Task[]): HealthData => {
    const healthData: HealthData = {
        totalWorkouts: 0,
        totalWorkoutMinutes: 0,
        workoutTypes: {},
        avgSleepHours: 0,
        sleepQuality: 'fair',
        energyLevel: 'medium'
    };
    
    let sleepCount = 0;
    let totalSleepHours = 0;

    tasks.forEach(task => {
        if (task.category === 'Workout' && task.status === 'Completed') {
            const duration = task.actualDuration || task.plannedDuration;
            const title = task.title.toLowerCase();
            
            if (title.includes('sleep')) {
                sleepCount++;
                totalSleepHours += duration / 60;
            } else {
                healthData.totalWorkouts += 1;
                healthData.totalWorkoutMinutes += duration;
                
                let type = 'General Workout';
                if (title.includes('runna') || title.includes('run')) type = 'Running';
                if (title.includes('boxing')) type = 'Boxing';
                
                healthData.workoutTypes[type] = (healthData.workoutTypes[type] || 0) + duration;
            }
        }
    });

    healthData.avgSleepHours = sleepCount > 0 ? totalSleepHours / sleepCount : 7.5; // Default if no sleep tracked

    if (healthData.avgSleepHours < 6) {
        healthData.sleepQuality = 'poor';
        healthData.energyLevel = 'low';
    } else if (healthData.avgSleepHours > 8) {
        healthData.sleepQuality = 'good';
        healthData.energyLevel = 'high';
    }

    return healthData;
};

export const getProactiveHealthSuggestion = (healthData: HealthData, tasks: Task[]): string | null => {
    // This is a simulation. In a real app, this would use live health data.
    if (healthData.sleepQuality === 'poor' && Math.random() > 0.5) {
        const demandingTask = tasks.find(t => t.status === 'Pending' && (t.category === 'Workout' || t.category === 'Prototyping'));
        if (demandingTask) {
            return `Kiko noticed your sleep was short. To maximize performance, consider moving your "${demandingTask.title}" task to later in the day.`;
        }
    }
    return null;
}

const findRecipeForTask = async (recipeQuery: string): Promise<InsightWidgetData | null> => {
    if (!ai) return null;
    const prompt = `Find a highly-rated, simple recipe for two people for "${recipeQuery}". Provide a popular source URL (like a major recipe blog or site), a list of main ingredients, and a very short summary of instructions. Also find a direct image URL for the dish.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            sourceUrl: { type: Type.STRING },
            imageUrl: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            quick_instructions: { type: Type.STRING },
        }
    };
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        const recipeData = JSON.parse(response.text);
        return { type: 'recipe', ...recipeData };
    } catch (error) {
        console.error("Error finding recipe:", error);
        return null;
    }
}

const generateImageFromNoteContext = async (task: Task, notes: Note[]): Promise<InsightWidgetData | null> => {
     if(!ai || !task.notebookId) return null;
     const note = notes.find(n => n.id === task.notebookId);
     if(!note) return null;

     const prompt = `The user is working on a task "${task.title}". Based on the context of their note titled "${note.title}", generate a visually striking, artistic image that could inspire them. Note Content: "${(note?.content || '').replace(/<[^>]*>?/gm, '').substring(0, 300)}...". The image should be abstract and high-concept.`;
     const imageUrl = await generateImageWithImagen(prompt, '1:1');
     if (imageUrl.includes('unsplash')) return null; // Check for fallback
     return {
        type: 'generated_image',
        title: "Creative Spark",
        prompt: `Inspired by your note: "${note.title}"`,
        imageUrl
     };
}


export const parseTaskFromString = async (input: string): Promise<{ data: Partial<Task>, fallbackUsed: boolean }> => {
    if (!input.startsWith('/')) {
        return { data: { title: input }, fallbackUsed: false };
    }

    try {
        const result = await kikoRequest('parse_command', { command: input });
        const taskData = result.data as Partial<Task>;

        // Post-processing to ensure startTime is a Date object
        if (taskData.startTime && typeof taskData.startTime === 'string') {
            const date = new Date(taskData.startTime);
            if (!isNaN(date.getTime())) {
                taskData.startTime = date;
            } else {
                delete taskData.startTime; 
            }
        }
        
        if (!taskData.startTime) {
             const date = new Date();
             date.setHours(date.getHours() + 1, 0, 0, 0);
             taskData.startTime = date;
        }

        return { data: taskData, fallbackUsed: result.fallbackUsed };
    } catch (error) {
        console.error("Fatal error in parseTaskFromString:", error);
        return { data: { title: input.substring(1).trim() }, fallbackUsed: true }; // Fallback on total error
    }
}


export const generateActionableInsights = async (task: Task, healthData: HealthData, notes: Note[], inferredHomeLocation: string | null, goals: Goal[], allTasks: Task[], isRegeneration = false): Promise<ActionableInsight | null> => {
    if (!ai) { return null; }

    const primaryGoal = goals.find(g => g.term === 'mid' && g.status === 'active')?.text || "achieve peak performance and build a successful business";
    const todaysOtherTasks = allTasks.filter(t => t.id !== task.id && new Date(t.startTime).toDateString() === new Date().toDateString() && t.status !== TaskStatus.Completed).map(t => t.title).join(', ');

    // Sanitize note content to prevent API errors
    const linkedNoteContent = task.notebookId ? (notes.find(n => n.id === task.notebookId)?.content || '').replace(/<[^>]*>?/gm, '').substring(0, 500) : '';

    const systemInstruction = `You are Kiko, a hyper-intelligent AI strategist. Your goal is to provide diverse, actionable, and visually engaging widgets to help Pratt, founder of 'Surface Tension', achieve his goals. Strictly adhere to the provided JSON schema. Ensure all content is concise, directly relevant, and spelled perfectly. The current date and time is ${new Date().toString()}.`;
    
    let mission: string;
    const isLearningTask = task.category === 'Learning' || (task.referenceUrl && (task.referenceUrl.includes('youtube.com') || task.referenceUrl.includes('coursera.org') || task.referenceUrl.includes('edx.org'))) || (task.title.toLowerCase().includes('learning'));

    if (isLearningTask) {
        mission = `
        **MISSION: ACT AS A LEARNING ACCELERATOR & STRATEGIST**
        The user is engaged in a learning task. Analyze the task title and linked URL to provide visually engaging, actionable insights that connect this knowledge to their primary goal of building monetizable products.
        
        **TASK DATA:**
        - **Task Title:** "${task.title}"
        - **Reference URL:** ${task.referenceUrl || 'Not provided.'}
        - **User Primary Goal:** "${primaryGoal}"

        **YOUR DIRECTIVES (Generate 3-4 diverse, visual widgets):**
        1.  **Key Concepts (KeyMetricWidget):** Identify 2-3 core concepts from the learning topic. Use icons like 'LightBulbIcon', 'BrainCircuitIcon', 'BookOpenIcon'. Be creative and assign a relevant value/unit, e.g., Value: "8/10", Unit: "Complexity".
        2.  **Learning Velocity (RadialChartWidget):** Create a "Learning Velocity" score. For this task, give a score of 85% to show progress and encourage completion. Label it "Focus". Use color '#A855F7' (purple).
        3.  **Monetization Idea (TextWidget):** Generate one novel, specific idea for a digital product or feature that applies the concepts from this learning task to the user's industry (creative events, branding). Use icon 'RocketIcon'.
        4.  **Related Resources (TextWidget with links):** Find 1-2 real, high-quality online articles or tools related to the topic. Provide valid URLs. Use icon 'LinkIcon'.
        `;
    } else if (task.category === 'Workout') {
        const workoutData = `
        - **Workout Title:** "${task.title}"
        - **Planned Duration:** ${task.plannedDuration} minutes.
        - **User's Overall Health State:** Energy level is '${healthData.energyLevel}', Sleep quality is '${healthData.sleepQuality}'.
        - **Recent Workout Mix:** ${Object.keys(healthData.workoutTypes).join(', ')}.
        - **User Primary Goal:** "${primaryGoal}"
        `;

        mission = `
        **MISSION: ACT AS AN ELITE PERFORMANCE & RECOVERY COACH**
        The user, Pratt, is preparing for a workout. Analyze the following data to provide insights like Apple Health or Whoop. The goal here is peak physical and cognitive performance, not business monetization. Emphasize data visualization.
        
        **WORKOUT DATA:**
        ${workoutData}

        **YOUR DIRECTIVES (Generate 3-4 diverse widgets, prioritizing visual charts):**
        1.  **Performance Metrics (KeyMetricWidget):** Generate 2-3 key performance indicators. For a run, this could be "Target Pace" or "Distance Goal". For boxing, "Intensity Focus" or "Est. Calories Burn". Be creative and realistic. Use icons like 'FireIcon', 'BoltIcon', 'RocketIcon'.
        2.  **Readiness Score (RadialChartWidget):** Create a "Readiness Score" as a percentage. Base it on the provided energy/sleep data. A 'poor' sleep quality should result in a score below 60%. 'Good' sleep should be above 85%. Label it "Readiness". Use color '#06B6D4' (cyan).
        3.  **Coaching Insight (TextWidget):** Provide a concise, actionable tip. Connect the workout to cognitive performance. Example: "This high-intensity session boosts BDNF, critical for creative thinking. Prioritize hydration to maintain focus for your afternoon 'Prototyping' task." Use icon 'BrainCircuitIcon'.
        4.  **Recovery Nutrition (RecipeWidget):** Suggest a simple, healthy post-workout meal or snack. Provide a name, a short list of key ingredients (3-5), and a one-sentence instruction. For sourceUrl, use a placeholder like "https://example.com/health-recipes".
        `;
    } else {
        mission = `
        **MISSION BRIEFING FOR TASK: "${task.title}"**
        - **User:** Pratt, founder of 'Surface Tension'.
        - **Primary Goal:** "${primaryGoal}"
        - **Task in Focus:** "${task.title}" (Category: ${task.category}, Status: ${task.status})
        - **Linked Note Context (Sanitized):** ${linkedNoteContent || 'None'}
        - **Today's Other Tasks:** ${todaysOtherTasks || 'None'}
        
        **YOUR DIRECTIVES (Generate 2-4 diverse widgets):**
        1.  **Mission Context:** How does this task connect to his primary goal? Is there an industry gap this relates to? (Use TextWidget).
        2.  **Operations Expert:** Provide practical tools, data, or efficiency tips. (Use KeyMetricWidget, AreaChartWidget, MapWidget, WeatherWidget).
        3.  **Creative Muse:** Offer an unexpected, inspiring idea. If a note is linked, generate an inspiring image from its context (Use GeneratedImageWidget).
        `;
    }
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            widgets: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['area', 'radial', 'metric', 'text', 'map', 'generated_image', 'weather', 'recipe'] },
                        title: { type: Type.STRING },
                        // ChartWidget properties
                        data: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER }, fill: { type: Type.STRING } } } },
                        commentary: { type: Type.STRING },
                        stroke: { type: Type.STRING },
                        // RadialChartWidget properties
                        value: { type: Type.NUMBER }, 
                        label: { type: Type.STRING },
                        // KeyMetricWidget properties
                        unit: { type: Type.STRING },
                        icon: { type: Type.STRING },
                        color: { type: Type.STRING },
                        // TextWidget properties
                        content: { type: Type.STRING },
                        links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } } } },
                        // MapWidget properties
                        locationQuery: { type: Type.STRING },
                        embedUrl: { type: Type.STRING },
                        // GeneratedImageWidget properties
                        prompt: { type: Type.STRING },
                        imageUrl: { type: Type.STRING },
                        // WeatherWidget properties
                        location: { type: Type.STRING },
                        currentTemp: { type: Type.NUMBER },
                        conditionIcon: { type: Type.STRING },
                        hourlyForecast: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: {type: Type.STRING}, temp: {type: Type.NUMBER}, icon: {type: Type.STRING} } } },
                        // RecipeWidget properties
                        name: { type: Type.STRING },
                        sourceUrl: { type: Type.STRING },
                        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                        quick_instructions: { type: Type.STRING }
                    }
                }
            }
        },
        required: ['widgets'],
    };
    
    try {
        const config = { 
            responseMimeType: "application/json", 
            responseSchema: schema, 
            systemInstruction: systemInstruction,
            // Use no thinking budget for initial load for speed, allow more for quality on regeneration.
            thinkingConfig: isRegeneration ? undefined : { thinkingBudget: 0 } 
        };
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: mission, config });
        const jsonString = extractJson(response.text);
        if (!jsonString) { throw new Error("Primary insight generation failed: No valid JSON found."); }
        
        const result = JSON.parse(jsonString) as ActionableInsight;

        // Post-process to fill in generated content
        for (let i = 0; i < result.widgets.length; i++) {
            const widget = result.widgets[i];
            if (widget.type === 'generated_image' && !widget.imageUrl) { // Only generate if URL is missing
                const generatedImageWidget = await generateImageFromNoteContext(task, notes);
                if (generatedImageWidget) result.widgets[i] = generatedImageWidget;
            }
        }
        if (task.recipeQuery) {
            const recipeWidget = await findRecipeForTask(task.recipeQuery);
            if(recipeWidget) result.widgets.push(recipeWidget);
        }
        return result;

    } catch (error: any) {
        console.error("Primary insight generation failed with Gemini:", error);
        // Fallback to GPT-4o on rate limit error
        if (error.toString().includes("429") || error.toString().includes("RESOURCE_EXHAUSTED")) {
            console.warn("Gemini rate limit hit. Falling back to GPT-4o for insights.");
            return generateActionableInsightsWithGPT4o(task, healthData, goals);
        }

        return { widgets: [{ type: 'text', title: 'Insight Error', icon: 'SparklesIcon', content: `Kiko had trouble generating insights. This might be due to the content of the task or linked note. Please try regenerating.\n\n*Error: ${error instanceof Error ? error.message : String(error)}*` }] };
    }
};

export const getChatFollowUp = async (task: Task, chatHistory: ChatMessage[]): Promise<string> => {
    if (!ai) return "This is a mocked response.";
    
    const historyString = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `You are Kiko, an AI assistant. The user is looking at the task "${task.title}". Continue the following conversation concisely and helpfully.
    
    CONVERSATION HISTORY:
    ${historyString}
    
    YOUR RESPONSE:`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text || "Sorry, I had trouble responding. Please try again.";
    } catch (error) {
        console.error("Error in chat follow-up:", error);
        return "Sorry, I had trouble responding. Please try again.";
    }
};


export const generateTaskPrimer = async (task: Task, customPrompt?: string): Promise<TaskPrep> => {
    if (!ai) {
        console.warn("Gemini API key not found. Returning mock data.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            action_plan: [`1. Review goals for "${task.title}".`, `2. Block out distractions.`, `3. Prepare tools and assets.`],
            key_takeaways: [`"${task.title}" is crucial for progress.`, `Staying focused is key.`],
            inquiry_prompts: [`How can I apply the 80/20 principle to "${task.title}"?`, `What's one thing I can do differently this time?`],
            related_links: task.category === 'Learning' ? [{title: "Google", url: "https://google.com"}] : [],
        };
    }
    
    const prompt = customPrompt || `You are an expert productivity assistant. For the task "${task.title}" (Category: ${task.category}), provide a concise, 3-step action plan, 2-3 key takeaways or learning points, and 3 stimulating "inquiry prompts" (questions or creative challenges to encourage deeper thinking). If the category is "Learning", provide 2-3 high-quality, relevant web links (articles, documentation, or videos). IMPORTANT: Only provide valid, real URLs from reputable sources. Do not invent links. If you cannot find a suitable link, leave the array empty. Respond ONLY with the JSON.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            action_plan: { type: Type.ARRAY, items: { type: Type.STRING } },
            key_takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            inquiry_prompts: { type: Type.ARRAY, items: { type: Type.STRING } },
            related_links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } }, required: ["title", "url"] } },
        },
        required: ["action_plan", "key_takeaways", "inquiry_prompts", "related_links"],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema },
        });
        return JSON.parse(response.text) as TaskPrep;
    } catch (error) {
        console.error("Error generating AI Primer:", error);
        return { action_plan: ["Could not generate primer. Just dive in!"], key_takeaways: [], inquiry_prompts: [], related_links: [] };
    }
}

export const generateTagsForNote = async (noteTitle: string, noteContent: string): Promise<string[]> => {
    if (!ai) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return ["mock-tag", "ai-generated", "test"];
    }
    const prompt = `Analyze the following note title and content. Extract the 3 to 5 most relevant single-word or two-word tags for categorization. Note Title: "${noteTitle}". Content: "${noteContent}".`;
    const schema = { type: Type.OBJECT, properties: { tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["tags"] };
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        return (JSON.parse(response.text)).tags || [];
    } catch (error) { console.error("Error generating tags:", error); return []; }
};

export const generateNoteFromTemplate = async (templateType: 'daily_planner' | 'case_study'): Promise<any> => {
     if (templateType === 'case_study') {
        return {
            title: 'Case Study: [Project Name]',
            content: '<h2>Project</h2><p>[Project Name]</p><h2>Client</h2><p>[Client Name]</p><h2>Challenge</h2><p>[Describe the challenge]</p><h2>Solution</h2><p>[Describe your solution]</p><h2>Outcome</h2><p>[Describe the outcome]</p><hr><h2>Proposal Draft</h2><p>Click the AI tools to generate a proposal based on this case study.</p>'
        };
    }
    // For other types that need AI
    if (!ai) return { error: "AI not available" };
    let prompt = `Generate a structured daily plan for a creative entrepreneur. Include 2-3 top priorities, a simple schedule with 3-5 key time blocks, a short mindfulness prompt, and a section for open notes.`;
    let schema = { type: Type.OBJECT, properties: { priorities: { type: Type.ARRAY, items: { type: Type.STRING } }, schedule: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, task: { type: Type.STRING } }, required: ["time", "task"] } }, mindfulness_moment: { type: Type.STRING }, notes: { type: Type.STRING } }, required: ["priorities", "schedule", "mindfulness_moment", "notes"] };
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        return JSON.parse(response.text);
    } catch (error) { return { error: "Could not generate template content." }; }
};

export const setChatContext = (goals: Goal[]) => {
    const goalsSummary = goals.map(g => `(${g.term}-term) ${g.text}`).join('\n');
    chatSystemInstruction = `You are Kiko, the smartest and most positive AI assistant. You are a hyper-intelligent, encouraging partner to Pratt, founder of the creative brand 'Surface Tension'. Your tone is confident, insightful, and slightly edgy. You are aware of his goals:\n${goalsSummary}`;
    chatInstance = null;
}

export const continueChat = async (history: ChatMessage[]): Promise<string> => {
    if (!ai) return "This is a mocked response from the AI assistant.";

    if (!chatInstance) {
        chatInstance = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: chatSystemInstruction } });
    }
    
    const lastUserMessage = history[history.length - 1];
    if (lastUserMessage.role !== 'user') return "An error occurred.";

    try {
        const response = await chatInstance.sendMessage({ message: lastUserMessage.text });
        return response.text || "Sorry, I encountered an error. Please try again.";
    } catch (error) {
        console.error("Error continuing chat:", error);
        return "Sorry, I encountered an error. Please try again.";
    }
};


export const getChatContextualPrompts = (tab: 'mission_control' | 'goals_strategy' | 'insights'): string[] => {
    switch(tab) {
        case 'mission_control':
            return [
                "What's my biggest opportunity today?",
                "Summarize my main focus areas.",
                "How can I improve my energy levels?"
            ];
        case 'goals_strategy':
            return [
                "Break down my long-term goal into smaller steps.",
                "Suggest a new short-term goal based on my notes.",
                "How do my recent tasks align with my mid-term goal?"
            ];
        case 'insights':
            return [
                "Find more insights from my 'AI' related notes.",
                "Turn my latest insight into a project plan.",
                "Connect two different insights into a new idea."
            ];
        default:
            return [];
    }
};


export const performInternetSearch = async (query: string): Promise<SearchResult> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 1000));
        return {
            text: `This is a mocked search result for "${query}". The web is a vast place with many answers.`,
            sources: [{ title: "Mock Source: A Visual Approach to AI", uri: "https://example.com/1" }]
        };
    }
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: query, config: { tools: [{ googleSearch: {} }] } });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];
        return { text: response.text, sources };
    } catch (error) {
        console.error("Error performing internet search:", error);
        return { text: "Sorry, I couldn't perform the search right now.", sources: [] };
    }
}

export const analyzeImageWithPrompt = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    // Per the AI strategy, route all vision tasks to the specialized GPT-4o model via our service.
    return await analyzeImageWithGPT4o(base64Image, mimeType, prompt);
}

export const generateProjectStatusReport = async (project: Project, tasks: Task[], notes: Note[]): Promise<ProjectStatusReport> => {
    if (!ai) {
        // Return mock data if AI is not available
        return {
            summary: "This is a mock summary. The project is progressing well, with key tasks related to prototyping being completed.",
            progress_percentage: 65,
            risks_and_blockers: ["Mock: Potential delay in third-party API integration.", "Mock: Finalizing monetization strategy requires more research."],
            key_decisions: ["Mock: Decided to use React for the frontend.", "Mock: Prioritized user onboarding flow for the next sprint."],
            suggested_next_steps: ["Mock: Draft the technical specification for the backend.", "Mock: Schedule a design review for the new UI mockups."]
        };
    }

    const linkedTasks = tasks.filter(t => t.projectId === project.id);
    const linkedNotes = notes.filter(n => project.noteIds?.includes(n.id)); // Assuming project.noteIds is populated

    const tasksSummary = linkedTasks.map(t => `- ${t.title} (Status: ${t.status})`).join('\n');
    const notesSummary = linkedNotes.map(n => `Note: ${n.title}\nContent: ${(n?.content || '').replace(/<[^>]*>?/gm, '').substring(0, 200)}...\n---`).join('\n');

    const prompt = `You are Kiko, an expert project manager. Analyze the following project data and generate a concise, insightful status report.
    
    **Project:** ${project.title}
    **Description:** ${project.description}
    
    **Associated Tasks:**
    ${tasksSummary || 'No tasks linked.'}
    
    **Associated Notes:**
    ${notesSummary || 'No notes linked.'}
    
    **YOUR MISSION (respond in JSON):**
    1.  **summary:** A brief, high-level overview of the project's current state.
    2.  **progress_percentage:** An estimated completion percentage based on task statuses.
    3.  **risks_and_blockers:** Identify 2-3 potential risks or blockers based on the data.
    4.  **key_decisions:** Extract any key decisions or findings from the notes.
    5.  **suggested_next_steps:** Recommend 2-3 actionable next steps.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            progress_percentage: { type: Type.INTEGER },
            risks_and_blockers: { type: Type.ARRAY, items: { type: Type.STRING } },
            key_decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggested_next_steps: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "progress_percentage", "risks_and_blockers", "key_decisions", "suggested_next_steps"]
    };

    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        const jsonString = extractJson(response.text);
        if (!jsonString) throw new Error("No valid JSON found for project report");
        return JSON.parse(jsonString) as ProjectStatusReport;
    } catch (error) {
        console.error("Error generating project status report:", error);
        throw new Error("Failed to generate project status report.");
    }
};

/**
 * Fallback function to parse a command using Gemini.
 */
export const parseCommandWithGemini = async (command: string): Promise<Partial<Task>> => {
    if (!ai) {
        throw new Error("Gemini AI not available for command parsing fallback.");
    }

    const prompt = `
    You are a fallback command parsing agent. Analyze the user's natural language input and convert it into a structured JSON object representing a task.
    - Current date is: ${new Date().toString()}.
    - The "title" is the main subject. Extract it from the input.
    - Respond ONLY with the JSON object.

    **User Input:** "${command.substring(1).trim()}"
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING, enum: DEFAULT_CATEGORIES },
            isVirtual: { type: Type.BOOLEAN },
            location: { type: Type.STRING },
            linkedUrl: { type: Type.STRING },
            startTime: { type: Type.STRING },
            plannedDuration: { type: Type.NUMBER }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema, thinkingConfig: { thinkingBudget: 0 } },
        });
        const jsonString = extractJson(response.text);
        if (!jsonString) throw new Error("No valid JSON from Gemini fallback");
        return JSON.parse(jsonString) as Partial<Task>;
    } catch (error) {
        console.error("Error in Gemini command parsing fallback:", error);
        throw error;
    }
};

/**
 * Fallback function to generate a completion summary using Gemini.
 */
export const generateCompletionSummaryWithGemini = async (task: Task): Promise<CompletionSummary> => {
    if (!ai) {
        throw new Error("Gemini AI not available for summary fallback.");
    }

    const prompt = `The user completed the task: "${task.title}". Generate a short, triumphant new title and a one-sentence insightful summary. Respond ONLY with the JSON.`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            newTitle: { type: Type.STRING },
            shortInsight: { type: Type.STRING }
        },
        required: ['newTitle', 'shortInsight']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema },
        });
        const jsonString = extractJson(response.text);
        if (!jsonString) throw new Error("No valid JSON from Gemini summary fallback");
        return JSON.parse(jsonString) as CompletionSummary;
    } catch (error) {
        console.error("Error in Gemini completion summary fallback:", error);
        throw error;
    }
};