
# Mira Multi-Agent Implementation Plan

This document outlines the step-by-step process to evolve Soen from using a single AI service into a sophisticated multi-agent system orchestrated by "Mira". Each step is written as a prompt for an AI engineering assistant to ensure precise execution.

---

### **Phase 1: Stabilize the Core & Build the Orchestrator**

**Objective:** Create the central "brain" for Mira and fix the critical `MissionBriefing` API error to stabilize the AI Hub.

**Step 1.1: Create the Mira Service and Orchestrator Stub**

*   **Act as a world-class senior frontend engineer.**
*   **Request:** Create a new service file that will house the central AI orchestrator, "Mira". This service will be responsible for routing requests to the correct AI model or agent based on the task type.
*   **Reasoning:** Centralizing AI logic in a single orchestrator (`miraRequest`) makes the system modular. It allows us to easily add new AI models (like OpenAI or Groq) in the future without refactoring every component that needs AI. This is the foundation of our multi-agent architecture.
*   **Implementation:**
    1.  Create a new file: `services/miraAIService.ts`.
    2.  Inside this file, define a type for the Mira request: `type MiraTaskType = 'generate_briefing' | 'analyze_image' | 'parse_command';`
    3.  Create an asynchronous function stub named `miraRequest(taskType: MiraTaskType, payload: any): Promise<any>`.
    4.  For now, the function body can simply log the request and return `null`: `console.log('Mira request received:', taskType, payload); return null;`
    5.  Export the function and type.

---

**Step 1.2: Fix the Mission Briefing API Schema (Critical Prerequisite)**

*   **Act as a Gemini API expert.**
*   **Request:** Correct the critical schema validation error in the `generateMissionBriefing` function that is preventing the AI Hub from loading.
*   **Reasoning:** The Gemini API is rejecting our request because the schema for `categoryAnalysis` is an `OBJECT` type with no defined properties, which is invalid. We must change this to an `ARRAY` of `OBJECT`s, where each object has defined `category` and `analysis` properties. This is a more robust and API-compliant structure.
*   **Implementation:**
    1.  Open `services/geminiService.ts`.
    2.  Locate the `generateMissionBriefing` function.
    3.  Find the `schema` definition inside it.
    4.  Modify the `categoryAnalysis` property in the schema. Change its type from `Type.OBJECT` with `additionalProperties: true` to `Type.ARRAY`.
    5.  Define the `items` for this array as an `OBJECT` with two required string properties: `category` and `analysis`.
    6.  Open `types.ts` and update the `MissionBriefing` interface. Change `categoryAnalysis: Record<string, string>` to `categoryAnalysis: { category: string; analysis: string; }[]`.
    7.  Finally, update the component that *displays* this data. In `components/SoenAI.tsx`, find the `MissionControl` component. Change the logic that looks up the analysis from `briefing.categoryAnalysis[activeFocus]` to `briefing.categoryAnalysis.find(a => a.category === activeFocus)?.analysis`.

---

**Step 1.3: Migrate Mission Briefing to the Analyst Agent**

*   **Act as a senior software architect.**
*   **Request:** Move the corrected `generateMissionBriefing` logic from `geminiService.ts` into the new `kikoAIService.ts`, framing it as the first function of our "Analyst Agent".
*   **Reasoning:** This is the first step in specializing our agents. `kikoAIService.ts` will not just be a router; it will contain the high-level logic for each agent. The Analyst Agent is responsible for all data analysis and reporting tasks.
*   **Implementation:**
    1.  Cut the entire `generateMissionBriefing` function from `geminiService.ts`.
    2.  Paste it into `services/kikoAIService.ts`.
    3.  Modify the `kikoRequest` orchestrator function. Add a `switch` statement based on `taskType`.
    4.  For the case `'generate_briefing'`, call the `generateMissionBriefing` function, passing in the `payload`.
    5.  In `SoenAI.tsx`, update the `MissionControl` component's `fetchBriefing` function. It should now call `kikoRequest('generate_briefing', { timeframe, tasks, notes, healthData })` instead of calling `generateMissionBriefing` directly.

---

### **Phase 2: Integrate a Second LLM for Vision**

**Objective:** Add OpenAI's GPT-4o model to Mira's toolkit to handle image analysis, fixing the broken "attach image" feature.

**Step 2.1: Create a Simulated OpenAI Service**

*   **Act as a senior AI engineer.**
*   **Request:** Create a new, simulated service file for interacting with the OpenAI API.
*   **Reasoning:** To keep our services clean, all interactions with a specific third-party API should be contained within their own service file. Even though we can't add a real API key now, creating this structure makes it trivial to integrate later. The function will return mocked data that matches the expected output format.
*   **Implementation:**
    1.  Create a new file: `services/openAIService.ts`.
    2.  Create an `async` function `analyzeImageWithGPT4o(base64Image: string, prompt: string): Promise<string>`.
    3.  Inside the function, add a `console.log` indicating it's a simulated call.
    4.  Return a mocked string response, like: `return Promise.resolve(\`This is a mocked analysis of the image for the prompt: "\${prompt}"\`);`
    5.  Export the function.

---

**Step 2.2: Implement the Vision Agent and Fix Image Attachments**

*   **Act as a full-stack engineer specializing in AI integration.**
*   **Request:** Implement the "Vision Agent" within the Mira orchestrator and use it to fix the image attachment functionality in both the Mira chat and the Event Detail modal.
*   **Reasoning:** Gemini Vision is good, but GPT-4o is currently state-of-the-art for complex visual reasoning. By creating a dedicated Vision Agent, we can route all image-based queries to the best model for the job. This fixes a broken feature and makes our system more powerful.
*   **Implementation:**
    1.  Open `services/kikoAIService.ts`.
    2.  Add `'analyze_image'` to the `MiraTaskType`.
    3.  Import the `analyzeImageWithGPT4o` function.
    4.  In the `kikoRequest` switch statement, add a case for `'analyze_image'`. This case should call `analyzeImageWithGPT4o` using the `payload` (which will contain the image and prompt).
    5.  In `components/SoenAI.tsx`, find the `handleChatSubmit` function. When a message has an attachment, it should now call `kikoRequest('analyze_image', { image: chatAttachment, prompt: chatInput })` and use the returned text to form the model's response. The old direct call in `continueChat` inside `geminiService.ts` for attachments can now be removed.
    6.  In `components/EventDetail.tsx`, the `handleAttachmentChange` function should be updated. After an image is uploaded, it could automatically trigger a `kikoRequest('analyze_image', ...)` call with a default prompt like "Describe this image and suggest a title for the task." The result can then be used to pre-fill the task's title or notes.

---
### **Phase 3: Finalize and Polish**

**Objective:** Ensure the new system is robust, visually appealing, and provides a great user experience.

**Step 3.1: Implement Visual Feedback for AI Interactions**

*   **Act as a UI/UX designer and frontend engineer.**
*   **Request:** Enhance the user interface to provide clear, real-time feedback during AI interactions.
*   **Reasoning:** Good UX requires keeping the user informed. When the AI is working, we should show it. This builds trust and makes the app feel more intelligent and responsive.
*   **Implementation:**
    1.  In `components/SoenAI.tsx` inside the `MissionControl` component, when the `isLoading` state is true, display the dynamic `loadingText` ("Generating daily intelligence...") to give the user more specific feedback.
    2.  When an image is being analyzed by the Vision Agent, overlay a shimmering or pulsing animation on the image thumbnail to indicate that Mira is actively "looking" at it.
    3.  In `components/EventDetail.tsx`, when regenerating insights, ensure the `ArrowPathIcon` has a CSS spinning animation applied to give immediate feedback that the button press was registered.

This structured plan will guide us through a complex architectural change, ensuring stability, scalability, and a superior user experience.