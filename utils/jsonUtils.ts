// A robust function to extract a JSON string from a larger text block
export const extractJson = (text: string): string | null => {
    if (!text) return null;

    // First, try to find a JSON blob inside markdown ```json ... ```
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        try {
            JSON.parse(markdownMatch[1].trim());
            return markdownMatch[1].trim();
        } catch (e) {
            console.warn("Invalid JSON found inside markdown block.");
        }
    }

    // If no markdown, find the first '{' or '[' to start from
    const firstBracketIndex = text.search(/[{[]/);
    if (firstBracketIndex === -1) {
        return null; // No JSON structure found
    }

    const startChar = text[firstBracketIndex];
    const endChar = startChar === '{' ? '}' : ']';
    let balance = 0;

    // Iterate through the string to find the matching closing bracket
    for (let i = firstBracketIndex; i < text.length; i++) {
        if (text[i] === startChar) {
            balance++;
        } else if (text[i] === endChar) {
            balance--;
        }

        if (balance === 0) {
            // Found a balanced structure, let's try to parse it.
            const potentialJson = text.substring(firstBracketIndex, i + 1);
            try {
                JSON.parse(potentialJson);
                // It's valid JSON, so we can return it.
                return potentialJson;
            } catch (e) {
                // It was a false positive (e.g., mismatched brackets in a string literal).
                // Continue searching for another balanced structure.
            }
        }
    }

    return null; // Return null if no valid JSON is found
};