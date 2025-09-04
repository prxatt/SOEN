import { ActionableInsight, Goal, HealthData, Task } from "../types";

// NOTE: This service requires the OPENAI_API_KEY environment variable to be set.
// Use the primary API_KEY if the specific one isn't available, for proxy/gateway compatibility.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.API_KEY;

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
                            // The API expects a data URL for the image content.
                            url: `data:${mimeType};base64,${base64Image}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 400 // Limit the response length for performance
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
        return `Sorry, an error occurred while analyzing the image. ${error instanceof Error ? error.message : ''}`;
    }
};


/**
 * Generates creative text using OpenAI's GPT-4o model.
 * @param prompt The prompt to send to the model.
 * @param schema An optional object describing the desired JSON structure.
 * @returns A promise that resolves to the generated text or a parsed JSON object.
 */
export const generateTextWithGPT4o = async (prompt: string, schema?: object): Promise<string | object> => {
    if (!OPENAI_API_KEY) {
        console.warn("OpenAI API key not found. Returning mocked text response.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (schema) return { mock: true, ...schema };
        return "This is a mocked response because the OpenAI API key is not configured.";
    }

    const body: any = {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
    };

    if (schema) {
        body.response_format = { type: "json_object" };
        body.messages.push({
            role: "system",
            content: `Please respond with a valid JSON object that adheres to the following structure: ${JSON.stringify(schema)}`
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
        if (schema) return {};
        return `Sorry, an error occurred during text generation. ${error instanceof Error ? error.message : ''}`;
    }
};

/**
 * Fallback function to generate actionable insights using GPT-4o if Gemini fails.
 */
export const generateActionableInsightsWithGPT4o = async (task: Task, healthData: HealthData, goals: Goal[]): Promise<ActionableInsight> => {
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

    **JSON Schema for your response:**
    {
      "widgets": [
        {
          "type": "'metric' | 'text' | 'radial'", // Choose from these
          "title": "string",
          // --- For 'metric' type ---
          "value": "string",
          "unit": "string",
          "icon": "string // e.g., 'LightBulbIcon', 'RocketIcon', 'BoltIcon'",
          "color": "string // e.g., 'text-green-400'",
          // --- For 'text' type ---
          "icon": "string",
          "content": "string // Concise and insightful content",
          // --- For 'radial' type ---
          "value": "number // 0-100",
          "label": "string",
          "color": "string // hex color e.g., '#A855F7'"
        }
      ]
    }
    `;
    
    const schema = {
        widgets: [
            {
                type: 'string',
                title: 'string',
                value: 'string',
                unit: 'string',
                icon: 'string',
                color: 'string',
                content: 'string',
                label: 'string'
            }
        ]
    };
    
    try {
        const result = await generateTextWithGPT4o(prompt, schema) as ActionableInsight;
        return result;
    } catch (error) {
        console.error("Error generating insights with GPT-4o fallback:", error);
        return { widgets: [{ type: 'text', title: 'Fallback Error', icon: 'SparklesIcon', content: 'The primary and backup AI models are currently unavailable. Please try again later.' }] };
    }
};