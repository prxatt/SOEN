# How to Connect Other AI Models to Praxis

Praxis is designed to be a powerful, multi-agent AI system. While it comes with Google's Gemini pre-configured, you can enhance its capabilities by connecting other powerful AI models from providers like OpenAI (for vision) and Groq (for high-speed tasks).

This guide will show you how to do this by using something called "environment variables."

### What Are Environment Variables?

Think of environment variables as a secure password manager for a software application. Instead of writing your secret API keys directly in the code (which is insecure), the application is designed to read them from a secure place provided by the hosting environment.

You do **not** need to change any code to use these keys. You simply need to provide the keys to the environment where the app is running.

---

### Step 1: Get Your API Keys

First, you'll need to get the API keys from the services you want to use.

1.  **OpenAI API Key (for the Vision Agent):**
    *   Go to the OpenAI Platform website: [https://platform.openai.com/](https://platform.openai.com/)
    *   Sign up or log in to your account.
    *   Navigate to the "API Keys" section in your account settings.
    *   Create a new secret key and copy it immediately. **You won't be able to see it again.**

2.  **Groq API Key (for the high-speed Architect Agent):**
    *   Go to the Groq website: [https://groq.com/](https://groq.com/)
    *   Sign up or log in to your account.
    *   Go to the "API Keys" section of the dashboard.
    *   Create a new secret key and copy it.

---

### Step 2: Add the Keys to Your Environment

Now, you need to tell the Praxis application about these keys. The way you do this depends on where the application is hosted. In most modern hosting platforms (like Vercel, Netlify, or a custom server), you'll find a settings section for "Environment Variables."

You will need to add the following variables:

| Variable Name     | Value                                          | Description                                                |
| ----------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| `OPENAI_API_KEY`  | `sk-...` (The key you copied from OpenAI)      | Enables the advanced Vision Agent for image analysis.      |
| `GROQ_API_KEY`    | `gsk_...` (The key you copied from Groq)       | Enables the ultra-fast Architect Agent for command parsing. |

**Example:**

In your hosting provider's settings, you would create a new variable:

*   **Name:** `OPENAI_API_KEY`
*   **Value:** `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (Paste your key here)

And another one:

*   **Name:** `GROQ_API_KEY`
*   **Value:** `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (Paste your key here)

---

### That's It!

Once you have added these keys and redeployed or restarted your application, Praxis will automatically detect them and activate the corresponding AI agents. You'll notice faster command parsing and new capabilities for analyzing images in your notes and chats.
