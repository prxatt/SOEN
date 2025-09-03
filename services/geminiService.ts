import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Insight, Task, TaskPrep, ActionItem, Note, StrategicBriefing, ChatMessage, SearchResult, Goal, MindMapNode, MindMapEdge, HealthData, Category, ActionableInsight, TaskStatus, InsightWidgetData, CompletionSummary, WeatherWidget, Project, ProjectStatusReport } from '../types';
import { DEFAULT_CATEGORIES } from "../constants";
import { applyWatermark } from "../utils/imageUtils";

const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// In a real app, you would manage chat instances more robustly.
let chatInstance: Chat | null = null;
let chatSystemInstruction = 'You are Kiko, a helpful and insightful AI assistant.';

// A robust function to extract a JSON string from a larger text block
const extractJson = (text: string): string | null => {
    if (!text) return null;

    // First, try to find a JSON blob inside markdown ```json ... ```
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        return markdownMatch[1].trim();
    }

    // If no markdown, find the first '{' or '[' to start from
    const firstBracketIndex = text.search(/[{[]/);
    if (firstBracketIndex === -1) {
        return null; // No JSON structure found
    }

    const startChar = text[firstBracketIndex];
    const endChar = startChar === '{' ? '}' : ']';
    let balance = 0;
    let endIndex = -1;

    // Iterate through the string to find the matching closing bracket
    for (let i = firstBracketIndex; i < text.length; i++) {
        if (text[i] === startChar) {
            balance++;
        } else if (text[i] === endChar) {
            balance--;
        }

        if (balance === 0) {
            endIndex = i;
            // Found a balanced structure, let's try to parse it.
            const potentialJson = text.substring(firstBracketIndex, endIndex + 1);
            try {
                JSON.parse(potentialJson);
                // It's valid JSON, so we can return it.
                return potentialJson;
            } catch (e) {
                // It was a false positive (e.g., mismatched brackets in a string literal).
                // Reset end index and continue searching.
                endIndex = -1;
            }
        }
    }
    
    // Fallback for cases where balancing fails but there's a clear structure.
    if (endIndex === -1) {
      const lastBracketIndex = text.lastIndexOf(endChar);
      if (lastBracketIndex > firstBracketIndex) {
        return text.substring(firstBracketIndex, lastBracketIndex + 1);
      }
    }

    return null; // Return null if no valid JSON is found
};


export const generateMapsEmbedUrl = (query: string): string => {
    // FIX: Use the environment variable for the API key as required for security.
    return `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(query)}`;
}

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


export const generateCompletionImage = async (task: Task): Promise<string> => {
     if (!ai) {
        return `https://source.unsplash.com/random/800x400?${encodeURIComponent(task.title)}`;
    }

    let prompt: string;
    const workoutKeywords = ['run', 'jog', 'cardio', 'tempo run', '5k', '10k', 'marathon', 'boxing'];
    const isWorkout = task.category === 'Workout' && workoutKeywords.some(kw => task.title.toLowerCase().includes(kw));

    if (isWorkout) {
        prompt = `Generate a visually stunning, artistic image for a completed workout: "${task.title}". The aesthetic should be like a premium fitness app's summary screen: dark, sleek, motivational, with vibrant accent colors. Instead of literal charts, use abstract shapes and dynamic lines to represent key metrics like speed, heart rate, and distance. The feeling should be energetic and triumphant.`;
    } else {
        prompt = `A visually stunning, triumphant, abstract, artistic representation of successfully completing the task: "${task.title}". Use a sophisticated, minimalist style with a motivational feel. Category is ${task.category}.`;
    }

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001', prompt: prompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' }
        });
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const watermarkedImage = await applyWatermark(`data:image/jpeg;base64,${base64ImageBytes}`);
        return watermarkedImage;
    } catch (error) {
        console.error("Error generating completion image:", error);
        return `https://source.unsplash.com/random/800x400?success`;
    }
}

export const generateCompletionSummary = async (task: Task): Promise<CompletionSummary> => {
    if(!ai) return { newTitle: `${task.title} - Done!`, shortInsight: 'Great work!'};
    const prompt = `The user just completed the task: "${task.title}". Generate a short, triumphant, and slightly edgy new title for this completed task (e.g., "5k Run" becomes "5k Conquered"). Also, provide a one-sentence, insightful, and encouraging summary of the accomplishment. Ensure the response is grammatically correct and spelled perfectly.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            newTitle: { type: Type.STRING },
            shortInsight: { type: Type.STRING }
        }
    };
     try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, thinkingConfig: { thinkingBudget: 0 } } });
        return JSON.parse(response.text) as CompletionSummary;
    } catch (error) {
        console.error("Error generating completion summary:", error);
        return { newTitle: `${task.title} - Completed`, shortInsight: 'Task finished successfully.'};
    }
};


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
     try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001', prompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' }
        });
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const watermarkedImage = await applyWatermark(`data:image/jpeg;base64,${base64ImageBytes}`);
        return {
            type: 'generated_image',
            title: "Creative Spark",
            prompt: `Inspired by your note: "${note.title}"`,
            imageUrl: watermarkedImage
        };
     } catch (error) {
         console.error("Error generating image from note context:", error);
         return null;
     }
}


export const parseTaskFromString = async (input: string): Promise<Partial<Task>> => {
    if (!ai || !input.startsWith('/')) {
        return { title: input.startsWith('/') ? input.substring(1).trim() : input };
    }

    const prompt = `Parse the user's natural language input, which starts with '/', into a structured task. The current date is ${new Date().toDateString()}.
    - Extract the core title.
    - Determine a category from this list: [${DEFAULT_CATEGORIES.join(', ')}].
    - Determine if it's an in-person or virtual event. An event is virtual if it mentions online platforms (Zoom, Google Meet) or is a digital activity (online course). Otherwise, it's in-person.
    - Extract location query if present (e.g., "near-by stores", "at Central Park").
    - Extract a recipe query if it's a food-related task (e.g., "Tofu Curry Bahn Mi").
    - Extract time, duration, and repetition.
    Input: "${input.substring(1).trim()}"
    
    Examples:
    - "Grocery shopping for Tofu Curry Bahn Mi for dinner @ 5pm near-by stores" -> { "title": "Grocery Shopping", "category": "Prototyping", "isVirtual": false, "location": "nearby grocery stores", "recipeQuery": "Tofu Curry Bahn Mi for 2 people", "startTime": "17:00" }
    - "Team sync on Zoom tomorrow at 10am for 30 minutes" -> { "title": "Team Sync", "category": "Meeting", "isVirtual": true, "linkedUrl": "Zoom", "startTime": "10:00", "plannedDuration": 30 }
    - "Run 5k every morning at 7" -> { "title": "Run 5k", "category": "Workout", "isVirtual": false, "repeat": "daily", "startTime": "07:00" }
    - "AI for Everyone course work" -> { "title": "AI for Everyone course work", "category": "Learning", "isVirtual": true }
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING, enum: DEFAULT_CATEGORIES },
            isVirtual: { type: Type.BOOLEAN },
            location: { type: Type.STRING },
            linkedUrl: { type: Type.STRING },
            recipeQuery: { type: Type.STRING },
            startTime: { type: Type.STRING, description: "Time in HH:MM format" },
            plannedDuration: { type: Type.INTEGER },
            repeat: { type: Type.STRING, enum: ['none', 'daily', 'weekly', 'monthly'] },
        }
    };

    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, thinkingConfig: { thinkingBudget: 0 } } });
        const result = JSON.parse(response.text);

        if (result.location) {
            result.locationEmbedUrl = generateMapsEmbedUrl(result.location);
        }
        
        if (result.startTime) {
            const [hours, minutes] = result.startTime.split(':');
            const date = new Date();
            date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            result.startTime = date;
        } else {
             const date = new Date();
             date.setHours(date.getHours() + 1, 0, 0, 0);
             result.startTime = date;
        }

        return result as Partial<Task>;
    } catch (error) {
        console.error("Error parsing task string:", error);
        return { title: input.substring(1).trim() };
    }
}


export const generateActionableInsights = async (task: Task, healthData: HealthData, notes: Note[], inferredHomeLocation: string | null, goals: Goal[], allTasks: Task[]): Promise<ActionableInsight | null> => {
    if (!ai) { return null; }

    const primaryGoal = goals.find(g => g.term === 'mid' && g.status === 'active')?.text || "achieve peak performance";
    const today = new Date().toDateString();
    const todaysOtherTasks = allTasks
        .filter(t => t.id !== task.id && new Date(t.startTime).toDateString() === today && t.status !== TaskStatus.Completed)
        .map(t => t.title)
        .join(', ');

    const systemInstruction = `You are Kiko, a multi-faceted AI agent acting as a strategic advisor, operations expert, and creative muse for Pratt, a creative entrepreneur. Your goal is to provide diverse, actionable, and insightful widgets related to his tasks. Strictly adhere to the provided JSON schema. Ensure all generated content is concise and directly relevant.`;
    
    let mission = `
    **MISSION BRIEFING:**
    - **Primary Goal:** "${primaryGoal}"
    - **Task in Focus:** "${task.title}" (Category: ${task.category}, Status: ${task.status})
    - **Today's Landscape:** Other tasks for today include: ${todaysOtherTasks || 'None'}.
    
    **YOUR DIRECTIVES (Generate 2-4 diverse widgets):**
    1.  **As a Strategic Advisor:** How does this task connect to the primary goal? What's the bigger picture? (e.g., a TextWidget with strategic commentary).
    2.  **As an Operations Expert:** Provide tools, data, or efficiency tips. (e.g., KeyMetricWidget, AreaChartWidget, MapWidget, WeatherWidget if location is present).
    3.  **As a Creative Muse:** Offer an unexpected angle or an inspiring idea. (e.g., GeneratedImageWidget based on linked notes, or a TextWidget with out-of-the-box ideas).
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            widgets: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['area', 'radial', 'metric', 'text', 'map', 'generated_image', 'weather'] },
                        title: { type: Type.STRING },
                        data: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER }, fill: { type: Type.STRING } } } },
                        commentary: { type: Type.STRING },
                        stroke: { type: Type.STRING },
                        value: { type: Type.NUMBER }, // FIX: Changed to NUMBER to align with RadialChartWidget type.
                        label: { type: Type.STRING },
                        unit: { type: Type.STRING },
                        icon: { type: Type.STRING },
                        color: { type: Type.STRING },
                        content: { type: Type.STRING },
                        links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } } } },
                        locationQuery: { type: Type.STRING },
                        embedUrl: { type: Type.STRING },
                        prompt: { type: Type.STRING },
                        imageUrl: { type: Type.STRING },
                        location: { type: Type.STRING },
                        currentTemp: { type: Type.NUMBER },
                        conditionIcon: { type: Type.STRING },
                        hourlyForecast: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: {type: Type.STRING}, temp: {type: Type.NUMBER}, icon: {type: Type.STRING} } } }
                    }
                }
            }
        },
        required: ['widgets'],
    };
    
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: mission, config: { responseMimeType: "application/json", responseSchema: schema, systemInstruction: systemInstruction } });
        const jsonString = extractJson(response.text);
        if (!jsonString) { throw new Error("Primary insight generation failed: No valid JSON found."); }
        
        const result = JSON.parse(jsonString) as ActionableInsight;

        // Post-process to fill in generated content
        for (let i = 0; i < result.widgets.length; i++) {
            const widget = result.widgets[i];
            if (widget.type === 'generated_image') {
                const generatedImageWidget = await generateImageFromNoteContext(task, notes);
                if (generatedImageWidget) result.widgets[i] = generatedImageWidget;
            }
        }
        if (task.recipeQuery) {
            const recipeWidget = await findRecipeForTask(task.recipeQuery);
            if(recipeWidget) result.widgets.push(recipeWidget);
        }
        return result;

    } catch (error) {
        console.error("Primary insight generation failed:", error, "Initiating self-healing protocol.");

        // SELF-HEALING: If the complex prompt fails, try a simpler one.
        try {
            const simplePrompt = `The user is working on a task: "${task.title}". Provide a single, helpful, and concise text-based insight or tip related to this task.`;
            const simpleSchema = {
                type: Type.OBJECT,
                properties: {
                    widgets: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING, enum: ['text'] },
                                title: { type: Type.STRING },
                                icon: { type: Type.STRING },
                                content: { type: Type.STRING },
                            },
                            required: ['type', 'title', 'icon', 'content'],
                        }
                    }
                },
                required: ['widgets'],
            };
            const fallbackResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: simplePrompt, config: { responseMimeType: "application/json", responseSchema: simpleSchema } });
            const jsonString = extractJson(fallbackResponse.text);
            if (!jsonString) { throw new Error("Self-healing failed: No JSON found in fallback."); }
            return JSON.parse(jsonString) as ActionableInsight;

        } catch (fallbackError) {
             console.error("Self-healing protocol failed:", fallbackError);
             return { widgets: [{ type: 'text', title: 'Insight Error', icon: 'SparklesIcon', content: 'Could not generate AI insights at this time. Please try regenerating.' }] };
        }
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

export const generateTextForNote = async (instruction: 'summarize' | 'expand' | 'findActionItems' | 'createTable' | 'generateProposal', text: string, noteContent?: string): Promise<string | ActionItem[]> => {
    if (!ai) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (instruction === 'findActionItems') return [{ title: "Schedule follow-up meeting" }, { title: "Draft proposal based on notes" }];
        return "Mock response.";
    }
    if (instruction === 'findActionItems') {
        const prompt = `Analyze the following text and extract any clear, actionable tasks or to-do items. If no specific action items are found, return an empty array. Text:\n\n---\n${text}\n---`;
        const schema = { type: Type.OBJECT, properties: { action_items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING } }, required: ["title"] }}}, required: ["action_items"] };
        try {
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            return (JSON.parse(response.text)).action_items || [];
        } catch (e) { console.error(e); return []; }
    }
    let prompt = '';
    if (instruction === 'summarize') prompt = `Summarize the following text concisely:\n\n---\n${text}\n---`;
    if (instruction === 'expand') prompt = `Expand on the following point, adding more detail, context, or examples:\n\n---\n${text}\n---`;
    if (instruction === 'createTable') prompt = `Based on the following text, create a simple HTML table. The text is: "${text}". Only return the <table>...</table> HTML.`;
    if (instruction === 'generateProposal') prompt = `I am Pratt from Surface Tension. Draft a short, professional proposal introduction for a new project with "${text}" (the client's name). Use the following case study content from my notes as a reference: \n\n---\n${(noteContent || '').replace(/<[^>]*>?/gm, '')}\n---\n\nThe tone should be confident, luxurious, and underground.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text || "Could not generate response.";
    } catch (error) { return "Could not generate response."; }
}

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


export const generateDailyBriefing = async (tasks: Task[], notes: Note[], goals: Goal[]): Promise<StrategicBriefing> => {
    const healthData = parseHealthDataFromTasks(tasks);

    if (!ai) {
        console.warn("Gemini API key not found. Returning mock data.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            goal_progress: { commentary: "Mock: You're making steady progress on your app prototype goal.", goals: [{ text: "Prototype an addictive app", progress_percentage: 25, aligned_tasks: ["App Monetization Strategy Prototype"] }] },
            health_and_performance: { commentary: "Mock: Consistent workouts this week. Consider scheduling deep work away from intense sessions.", metrics: [{ metric: "Total Workouts", value: "2" }] },
            learning_synthesis: { commentary: "Mock: Your notes on 'Prompt Engineering' and 'AI' are converging.", connections: [{ concept_A: "Chain of Thought", concept_B: "User Onboarding", novel_idea: "Use Chain of Thought prompting to generate a personalized, interactive onboarding flow for new app users." }] },
            resource_radar: [{ title: "Lenny's Newsletter - How the most successful apps monetize", url: "https://example.com", relevance_summary: "Directly relevant to your app monetization task." }],
            creative_sparks: [{ idea: "Gamify your app's onboarding using principles from your 'Advanced Prompting' notes.", rationale: "Creates an engaging, 'addictive' first impression." }]
        };
    }

    const completedTasksSummary = tasks.filter(t => t.status === 'Completed').map(t => `${t.title} (${t.category})`).join(', ');
    const recentNotesSummary = notes.slice(0, 5).map(n => `Title: ${n.title}\nContent: ${(n?.content || '').replace(/<[^>]*>?/gm, '').substring(0, 150)}...`).join('\n---\n');
    const goalsSummary = goals.map(g => `(${g.term}-term) ${g.text}`).join('\n');
    const healthSummary = `Recent workouts: ${healthData.totalWorkouts}. Total time: ${healthData.totalWorkoutMinutes} mins. Types: ${JSON.stringify(healthData.workoutTypes)}. Avg Sleep: ${healthData.avgSleepHours.toFixed(1)} hours.`;
    
    const prompt = `You are Kiko, a hyper-personalized AI advisor for Pratt, founder of 'Surface Tension'. His goal is to be at 100% in everything he does. Analyze his data to provide a strategic daily briefing. Be insightful, concise, and slightly edgy, like a trusted advisor.
    
    **CONTEXT:**
    - **His Goals:**\n${goalsSummary}
    - **Today's Tasks:** ${tasks.filter(t => t.startTime.toDateString() === new Date().toDateString()).map(t => t.title).join(', ')}
    - **Recent Health Data:** ${healthSummary}
    - **Recent Learning Notes:**\n${recentNotesSummary || 'None'}
    
    **BRIEFING STRUCTURE (generate JSON for each module):**
    
    1.  **Goal Progress:** Rate his recent activities against his goals. Provide commentary and a progress percentage for 1-2 key goals.
    2.  **Health & Performance:** Analyze his health data. Offer a key insight on how his physical activity might impact his cognitive performance. If simulated recovery data seems low, gently suggest rescheduling a demanding cognitive task to prioritize rest and peak performance.
    3.  **Learning Synthesis:** Connect concepts from DIFFERENT notes. Find a novel intersection relevant to his goals. Create a new, actionable idea from this synthesis.
    4.  **Resource Radar:** Provide 1-2 curated articles, videos, or tools directly related to his immediate goals and recent learning. Summarize WHY each is relevant. Provide real, valid URLs.
    5.  **Creative Sparks:** A fun, addictive section. Offer one unexpected, "out-of-the-box" idea. E.g., "Idea: Gamify your app's onboarding using principles from your 'Advanced Prompting' notes."`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            goal_progress: { type: Type.OBJECT, properties: { commentary: { type: Type.STRING }, goals: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, progress_percentage: { type: Type.NUMBER }, aligned_tasks: { type: Type.ARRAY, items: { type: Type.STRING } } } } } } },
            health_and_performance: { type: Type.OBJECT, properties: { commentary: { type: Type.STRING }, metrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { metric: { type: Type.STRING }, value: { type: Type.STRING } } } } } },
            learning_synthesis: { type: Type.OBJECT, properties: { commentary: { type: Type.STRING }, connections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { concept_A: { type: Type.STRING }, concept_B: { type: Type.STRING }, novel_idea: { type: Type.STRING } } } } } },
            resource_radar: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING }, relevance_summary: { type: Type.STRING } } } },
            creative_sparks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { idea: { type: Type.STRING }, rationale: { type: Type.STRING } } } }
        },
        required: ["goal_progress", "health_and_performance", "learning_synthesis", "resource_radar", "creative_sparks"]
    };

    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        return JSON.parse(response.text) as StrategicBriefing;
    } catch (error) {
        console.error("Error generating daily briefing:", error);
        throw new Error("Failed to generate briefing.");
    }
};


export const setChatContext = (goals: Goal[]) => {
    const goalsSummary = goals.map(g => `(${g.term}-term) ${g.text}`).join('\n');
    chatSystemInstruction = `You are Kiko, a helpful and insightful AI assistant. You are advising Pratt, the founder of a luxury brand called 'Surface Tension'. Be aware of his goals:\n${goalsSummary}`;
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
     if (!ai) {
        await new Promise(r => setTimeout(r, 1000));
        return `This is a mocked analysis of the uploaded image with the prompt: "${prompt}".`;
    }
    const imagePart = { inlineData: { mimeType: mimeType, data: base64Image } };
    const textPart = { text: prompt };
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, textPart] } });
        return response.text || "Sorry, I was unable to analyze the image.";
    } catch (error) {
        console.error("Error analyzing image:", error);
        return "Sorry, I was unable to analyze the image.";
    }
}

export const generateImageForNote = async (title: string): Promise<string> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 1000));
        return `https://source.unsplash.com/random/400x300?${encodeURIComponent(title)}`;
    }
    const prompt = `An abstract, visually stunning, artistic representation of the concept: "${title}". Use a minimalist, sophisticated style suitable for a luxury brand.`;
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001', prompt: prompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '4:3' }
        });
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const watermarkedImage = await applyWatermark(`data:image/jpeg;base64,${base64ImageBytes}`);
        return watermarkedImage;
    } catch (error) {
        console.error("Error generating image for note:", error);
        return `https://source.unsplash.com/random/400x300?error`;
    }
}

export const generateTitleForNote = async (noteContent: string): Promise<string> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 1000));
        return "AI Suggested Title";
    }
    const prompt = `Analyze the following note content and generate a concise, descriptive title for it (5 words or less). Content:\n\n---\n${(noteContent || '').replace(/<[^>]*>?/gm, '').substring(0, 500)}...\n---`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text?.replace(/["']/g, "") || "Untitled Note"; // Remove quotes from the response
    } catch (error) {
        console.error("Error generating title for note:", error);
        return "Untitled Note";
    }
}

export const generateMindMapData = async (goals: Goal[], tasks: Task[], notes: Note[]): Promise<{ nodes: MindMapNode[], edges: MindMapEdge[] }> => {
    const mockMindMap: { nodes: MindMapNode[], edges: MindMapEdge[] } = {
        nodes: [
            { id: 'root', label: 'Pratt', type: 'root', x: 400, y: 300 },
            { id: 'g1', label: 'Launch Product', type: 'goal', x: 250, y: 200 },
            { id: 't1', label: 'Prototype App', type: 'task', x: 550, y: 200 },
            { id: 'n1', label: 'AI Research', type: 'note', x: 400, y: 450 },
        ],
        edges: [{ from: 'root', to: 'g1' }, { from: 'root', to: 't1' }, { from: 'root', to: 'n1' }, {from: 'g1', to: 't1'}]
    };
    if (!ai) return mockMindMap;

    const goalsSummary = goals.map(g => `- (Goal) ${g.text} [ID: goal-${g.id}]`).join('\n');
    const tasksSummary = tasks.slice(0, 10).map(t => `- (Task) ${t.title} [ID: task-${t.id}]`).join('\n');
    const notesSummary = notes.slice(0, 10).map(n => `- (Note) ${n.title} [ID: note-${n.id}]`).join('\n');
    const prompt = `Analyze the following goals, tasks, and notes for Pratt. Create a mind map structure.
    - Create a central 'root' node labeled 'Pratt'.
    - Create nodes for each goal, task, and note provided.
    - Create edges to link related items (goal to task, task to note, etc.).
    - Focus on the strongest relationships.
    Data:
    ${goalsSummary}
    ${tasksSummary}
    ${notesSummary}`;
    const schema = { type: Type.OBJECT, properties: { nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING }, type: { type: Type.STRING } } } }, edges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { from: { type: Type.STRING }, to: { type: Type.STRING } } } } }, required: ["nodes", "edges"] };
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        const data = JSON.parse(response.text);
        const positionedNodes: MindMapNode[] = data.nodes.map((node: any, index: number) => {
            const angle = data.nodes.length > 1 ? (index / (data.nodes.length - 1)) * 2 * Math.PI : 0;
            const nodeType = node.type as MindMapNode['type'];
            const radius = nodeType === 'root' ? 0 : nodeType === 'goal' ? 150 : nodeType === 'task' ? 250 : 350;
            return { id: node.id, label: node.label, type: nodeType, x: 400 + radius * Math.cos(angle), y: 300 + radius * Math.sin(angle) };
        });
        const rootNode = positionedNodes.find(n => n.id === 'root');
        if (rootNode) { rootNode.x = 400; rootNode.y = 300; }
        return { nodes: positionedNodes, edges: data.edges };
    } catch (error) {
        console.error("Error generating mind map:", error);
        return mockMindMap;
    }
};


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