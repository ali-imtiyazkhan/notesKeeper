import { gemini_node } from "agents";

interface TodoOperation {
  type:
    | "create"
    | "update"
    | "remove"
    | "clear"
    | "list"
    | "complete"
    | "uncomplete";
  todoId?: string;
  data?: {
    title: string;
    description?: string;
    completed?: boolean;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
    category?: string;
    tags?: string[];
  };
  localStorageCommand?: string;
}

export function calculateRelativeDate(dateText: string): string | null {
  const lowerText = dateText.toLowerCase();
  const now = Date.now();

  if (lowerText.includes("tomorrow")) {
    const tomorrowMs = now + 24 * 60 * 60 * 1000;
    const tomorrow = new Date(tomorrowMs);
    return tomorrow.toISOString().split("T")[0] + "T00:00:00.000Z";
  }

  if (lowerText.includes("next week") || lowerText.includes("in a week")) {
    const nextWeekMs = now + 7 * 24 * 60 * 60 * 1000;
    const nextWeek = new Date(nextWeekMs);
    return nextWeek.toISOString().split("T")[0] + "T00:00:00.000Z";
  }

  const inDaysMatch = lowerText.match(/in (\d+) days?/);
  if (inDaysMatch && inDaysMatch[1]) {
    const days = parseInt(inDaysMatch[1]);
    const futureMs = now + days * 24 * 60 * 60 * 1000;
    const future = new Date(futureMs);
    return future.toISOString().split("T")[0] + "T00:00:00.000Z";
  }

  if (lowerText.includes("today")) {
    const today = new Date(now);
    return today.toISOString().split("T")[0] + "T00:00:00.000Z";
  }

  return null;
}

const convertor = async (
  message: string,
  apiKey: string,
  model: string,
  config: object,
  existingTodos?: string,
): Promise<string> => {
  try {
    const calculatedDate = calculateRelativeDate(message);
    const dateContext = calculatedDate
      ? `\n\n⚠️⚠️⚠️ CRITICAL: CALCULATED DATE PROVIDED ⚠️⚠️⚠️\n\nThe user message contains a relative date term. The server has calculated the exact date for you.\n\nYOU MUST USE THIS EXACT DATE STRING (do NOT calculate or modify it):\n"${calculatedDate}"\n\nIn your response:\n1. Set data.dueDate to exactly: "${calculatedDate}"\n2. In localStorageCommand, use the date string directly: dueDate: '${calculatedDate}'\n\nDO NOT use setDate(), Date.now(), or any date calculation. Just use the string '${calculatedDate}' directly.\n\n`
      : "";

    const systemPrompt = `

You are an intelligent AI-powered todo list assistant in a web application. Your primary role is to understand natural language messages from users and convert them into structured commands that can be executed using localStorage operations.

⚠️ CRITICAL RULE: If a CALCULATED DATE is provided below in the message, you MUST use that exact date string. Do NOT calculate dates yourself. Do NOT use setDate(), Date.now(), or any date manipulation. Simply use the provided date string as-is.

You can handle the following operations based on user messages:

### 1. CREATE TODO
When a user wants to add a new task, extract:
- Title/description (required)
- Priority (low/medium/high) if mentioned
- Due date if mentioned (parse dates like "tomorrow", "next week", "in 2 days", "Jan 15", etc.)
- Category/tags if mentioned
- Any additional details

Examples:
- "Add buy groceries" → create todo with title "buy groceries"
- "Remind me to call mom tomorrow" → create todo with title "call mom" and due date
- "High priority: fix the bug" → create todo with title "fix the bug" and priority "high"
- "Create a task for workout with tag fitness" → create todo with title "workout" and tag "fitness"

### 2. UPDATE TODO
When a user wants to modify an existing todo, you need to:
- Identify which todo (by ID from existingTodos, or by matching title/description if ID not provided)
- Update specific fields mentioned (title, description, priority, due date, category, tags, completion status)

Examples:
- "Mark 'buy groceries' as done" → update todo to completed: true
- "Change priority of workout to high" → update priority field
- "Update due date of call mom to next Friday" → update dueDate field
- "Add tag 'important' to the first task" → add to tags array

### 3. REMOVE/DELETE TODO
When a user wants to delete a todo:
- Identify the todo to delete (by ID or by matching title/description)
- Remove it from the todos array

Examples:
- "Delete 'buy groceries'" → remove that todo
- "Remove the first task" → remove todo at index 0
- "Cancel the workout task" → remove workout todo

### 4. CLEAR ALL TODOS
When a user wants to remove all todos:
- Examples: "clear all", "delete everything", "reset my todos", "remove all tasks"

### 5. LIST TODOS
When a user wants to see their todos:
- Examples: "show my todos", "list tasks", "what do I have to do", "what's on my list"

### 6. COMPLETE/UNCOMPLETE TODO
When a user wants to mark todos as done or undone:
- "Mark 'buy groceries' as done" → set completed: true
- "Uncheck the workout task" → set completed: false
- "Complete all tasks" → set all todos to completed: true

## Output Format:

You MUST return ONLY valid JSON in this exact format:

{
  "type": "create" | "update" | "remove" | "clear" | "list" | "complete" | "uncomplete",
  "todoId": "string (optional, required for update/remove operations)",
  "data": {
    "title": "string (required for create)",
    "description": "string (optional)",
    "completed": boolean (optional),
    "priority": "low" | "medium" | "high" (optional),
    "dueDate": "ISO 8601 date string (optional, e.g., '2024-01-15T00:00:00Z')",
    "category": "string (optional)",
    "tags": ["string"] (optional)
  },
  "localStorageCommand": "complete JavaScript localStorage command string"
}

## Important Rules:

1. **LocalStorage Structure**: All todos are stored in localStorage under the key "todos" as a JSON array: 
   \`localStorage.setItem("todos", JSON.stringify([{id, title, ...}]))\`

2. **Todo ID Format**: Generate unique IDs using: \`crypto.randomUUID()\` or \`Date.now().toString()\`

3. **For CREATE operations**: 
   - Generate a new UUID for the todo
   - Return: \`localStorage.setItem("todos", JSON.stringify([...existingTodos, {id: "uuid", ...newTodo}]))\`

4. **For UPDATE operations**:
   - Find the todo in existingTodos by ID (or match by title if no ID)
   - Update only the fields mentioned, keep others unchanged
   - Return: \`localStorage.setItem("todos", JSON.stringify([...updatedTodos]))\`

5. **For REMOVE operations**:
   - Filter out the todo from the array
   - Return: \`localStorage.setItem("todos", JSON.stringify([...filteredTodos]))\`

6. **For CLEAR operations**:
   - Return: \`localStorage.setItem("todos", JSON.stringify([]))\`

7. **Date Handling**:
   - If a CALCULATED DATE is provided below, use that exact ISO string in both data.dueDate and localStorageCommand
   - Simply use the date string directly: dueDate: "${calculatedDate || ""}"
   - In localStorageCommand, use the date string directly: dueDate: '${calculatedDate || ""}'
   - Do NOT calculate dates - the server has already calculated them correctly
   - For absolute dates (e.g., "Jan 15", "2025-03-20"), parse them normally
   - Return dates in ISO 8601 format: "YYYY-MM-DDTHH:mm:ss.sssZ"
   - For date-only fields (no time specified), use midnight UTC: "YYYY-MM-DDT00:00:00.000Z"
   - Understand priorities from words: "urgent", "important", "critical" → high; "low", "minor" → low
   - Parse natural language for todos: "I need to", "remind me", "add", "create", "make a note"

8. **Context Awareness**:
   - Use existingTodos to understand current state
   - Match todos by title/description when ID not provided
   - For "first", "second", "last" → use array indices
   - For "all" or "everything" → apply to all todos

9. **Conversational Understanding**:
   - Be flexible with phrasing: "do", "task", "item", "reminder" all mean todo
   - Handle typos and variations date.
   - If intent is unclear, default to CREATE operation

10. **Error Prevention**:
    - Always preserve existing todos unless explicitly clearing
    - Never return invalid JSON
    - Ensure localStorageCommand is executable JavaScript

## Example Interactions:

User: "Add buy milk"
Output: {
  "type": "create",
  "data": {
    "title": "buy milk"
  },
  "localStorageCommand": "const todos = JSON.parse(localStorage.getItem('todos') || '[]'); todos.push({id: crypto.randomUUID(), title: 'buy milk', completed: false, createdAt: new Date().toISOString()}); localStorage.setItem('todos', JSON.stringify(todos));"
}

User: "Add task due tomorrow"
(CALCULATED DATE PROVIDED: "2025-02-12T00:00:00.000Z")
Output: {
  "type": "create",
  "data": {
    "title": "task",
    "dueDate": "2025-02-12T00:00:00.000Z"
  },
  "localStorageCommand": "const todos = JSON.parse(localStorage.getItem('todos') || '[]'); todos.push({id: crypto.randomUUID(), title: 'task', completed: false, dueDate: '2025-02-12T00:00:00.000Z', createdAt: new Date().toISOString()}); localStorage.setItem('todos', JSON.stringify(todos));"
}

CORRECT: Uses the provided date string '2025-02-12T00:00:00.000Z' directly
WRONG: Would use setDate() or Date.now() calculations

User: "Add review code in 3 days"
(CALCULATED DATE PROVIDED: "2025-02-14T00:00:00.000Z")
Output: {
  "type": "create",
  "data": {
    "title": "review code",
    "dueDate": "2025-02-14T00:00:00.000Z"
  },
  "localStorageCommand": "const todos = JSON.parse(localStorage.getItem('todos') || '[]'); todos.push({id: crypto.randomUUID(), title: 'review code', completed: false, dueDate: '2025-02-14T00:00:00.000Z', createdAt: new Date().toISOString()}); localStorage.setItem('todos', JSON.stringify(todos));"
}

CORRECT: Uses the provided date string '2025-02-14T00:00:00.000Z' directly
WRONG: Would use Date.now() + calculations

User: "Remind me to call mom next week"
(CALCULATED DATE PROVIDED: "2025-02-18T00:00:00.000Z")
Output: {
  "type": "create",
  "data": {
    "title": "call mom",
    "dueDate": "2025-02-18T00:00:00.000Z"
  },
  "localStorageCommand": "const todos = JSON.parse(localStorage.getItem('todos') || '[]'); todos.push({id: crypto.randomUUID(), title: 'call mom', completed: false, dueDate: '2025-02-18T00:00:00.000Z', createdAt: new Date().toISOString()}); localStorage.setItem('todos', JSON.stringify(todos));"
}

CORRECT: Uses the provided date string '2025-02-18T00:00:00.000Z' directly
WRONG: Would use setDate() or Date.now() calculations

User: "Mark buy milk as done"
Output: {
  "type": "update",
  "todoId": "match-by-title",
  "data": {
    "completed": true
  },
  "localStorageCommand": "const todos = JSON.parse(localStorage.getItem('todos') || '[]'); const updated = todos.map(t => t.title === 'buy milk' ? {...t, completed: true} : t); localStorage.setItem('todos', JSON.stringify(updated));"
}

User: "Delete everything"
Output: {
  "type": "clear",
  "localStorageCommand": "localStorage.setItem('todos', JSON.stringify([]));"
}

Now, parse this user message and return ONLY the JSON response, no additional text:

USER MESSAGE:
${message}
${dateContext}
${existingTodos ? `\n\nCurrent todos in localStorage:\n${existingTodos}` : ""}`;

    const response = await gemini_node(apiKey, model, systemPrompt, config);

    if (typeof response === "string") {
      return response;
    }

    if (response && typeof response === "object" && "text" in response) {
      const text = (response as { text?: string }).text;
      if (text) {
        return text;
      }
    }

    return JSON.stringify(response);
  } catch (error) {
    console.error("Error in convertor:", error);
    throw error;
  }
};

const queryAgent = async (
  message: string,
  apiKey: string,
  model: string,
  config: object,
  notes?: string,
  folders?: string,
  conversationHistory?: Array<{ command: string; response: string }>,
): Promise<string> => {
  try {
    const calculatedDate = calculateRelativeDate(message);
    const dateContext = calculatedDate
      ? `\n\n⚠️⚠️⚠️ CRITICAL: CALCULATED DATE PROVIDED ⚠️⚠️⚠️\n\nThe user message contains a relative date term. The server has calculated the exact date for you.\n\nYOU MUST USE THIS EXACT DATE STRING (do NOT calculate or modify it):\n"${calculatedDate}"\n\nWhen mentioning dates or times in your response, use this calculated date: "${calculatedDate}"\n\nDO NOT use setDate(), Date.now(), or any date calculation. Just use the string "${calculatedDate}" directly.\n\n`
      : "";

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const currentDate = `${year}-${month}-${day}`;
    const currentTime = now.toISOString();
    const dayOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][now.getDay()];
    const monthName = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][now.getMonth()];

    const currentDateContext = `\n\n📅 CURRENT DATE/TIME CONTEXT (SERVER TIME - USE THIS FOR ALL DATE REFERENCES):\n- Today's date: ${currentDate} (${dayOfWeek}, ${monthName} ${now.getDate()}, ${year})\n- Current timestamp: ${currentTime}\n- Day of month: ${now.getDate()}\n- Month: ${monthName} (${month})\n- Year: ${year}\n\n**CRITICAL**: When the user asks about "today", "today's tasks", "today's date", or any reference to the current date, you MUST use: ${currentDate} (${dayOfWeek}, ${monthName} ${now.getDate()}, ${year}). The day of the month is ${now.getDate()}, NOT any other number. Always reference this exact date.\n\n`;

    const historyContext =
      conversationHistory && conversationHistory.length > 0
        ? `\n\n## Previous Conversation History (AVOID REPEATING THESE)\n\n**CRITICAL VARIETY REQUIREMENT**: The following are previous queries and responses. You MUST provide COMPLETELY DIFFERENT content than what you've already given. Do NOT repeat any quotes, tips, authors, formats, or responses from below.\n\n${conversationHistory
            .map((h, idx) => {
              const responsePreview =
                h.response.length > 300
                  ? h.response.substring(0, 300) + "..."
                  : h.response;
              return `**Previous Query ${idx + 1}:**\nUser: "${h.command}"\nYour Response: "${responsePreview}"\n\n**REQUIREMENT**: For this new request, you MUST provide a COMPLETELY DIFFERENT quote/tip/response. Do NOT use:\n- The same quote or author\n- The same format or structure\n- The same theme or message\n- Similar wording or phrasing\n\nChoose something ENTIRELY DIFFERENT.`;
            })
            .join(
              "\n\n---\n\n",
            )}\n\n**REMEMBER**: This is a NEW, FRESH request. Think creatively and provide unique content that hasn't been given before. Rotate through different authors, themes, formats, and styles completely.`
        : "\n\n## Conversation History\n\nNo previous conversation history. This is a fresh request - provide unique, inspiring content with full variety.\n\n";

    let notesData: any[] = [];
    let foldersData: any[] = [];

    try {
      if (notes) notesData = JSON.parse(notes);
    } catch (e) {
      console.warn("Failed to parse notes:", e);
    }

    try {
      if (folders) foldersData = JSON.parse(folders);
    } catch (e) {
      console.warn("Failed to parse folders:", e);
    }

    const contextSummary = `
## User's Knowledge Base Context

### Folders (${foldersData.length}):
${
  foldersData.length > 0
    ? foldersData
        .map(
          (f: any) =>
            `- **${f.name}** (ID: ${f.id})${f.color ? ` - Color: ${f.color}` : ""}${f.iconKey ? ` - Icon: ${f.iconKey}` : ""}`,
        )
        .join("\n")
    : "No folders found."
}

### Notes (${notesData.length}):
${
  notesData.length > 0
    ? notesData
        .map((n: any) => {
          const folderName =
            foldersData.find((f: any) => f.id === n.folderId)?.name ||
            "Uncategorized";
          let fullContent = "(empty)";
          if (n.content) {
            try {
              const parsed = JSON.parse(n.content);
              if (Array.isArray(parsed)) {
                const textBlocks = parsed.filter(
                  (b: any) => b.type === "text" || b.type === "link",
                );
                fullContent = textBlocks
                  .map((b: any) => b.content || b.url || "")
                  .join(" ");
              } else {
                fullContent = n.content;
              }
            } catch {
              fullContent = n.content;
            }
          }
          const tags =
            n.tags && n.tags.length > 0 ? ` [Tags: ${n.tags.join(", ")}]` : "";

          const extractStructuredInfo = (content: string): string => {
            const info: string[] = [];

            const phaseMatches = content.match(
              /Phase\s+(\d+)\s*-\s*([^(]+)\s*\(([^)]+)\)/gi,
            );
            if (phaseMatches && phaseMatches.length > 0) {
              info.push(`**EXTRACTED PHASES (${phaseMatches.length} total):**`);
              phaseMatches.forEach((match, idx) => {
                const cleaned = match.replace(
                  /Phase\s+(\d+)\s*-\s*([^(]+)\s*\(([^)]+)\)/i,
                  (_, num, name, duration) => {
                    return `  - Phase ${num}: ${name.trim()} (${duration.trim()})`;
                  },
                );
                info.push(cleaned);
              });
            }

            const teamMatch = content.match(/Team\s+size:\s*([^.]+)/i);
            if (teamMatch && teamMatch[1]) {
              info.push(`**EXTRACTED TEAM COMPOSITION:**`);
              info.push(`  - ${teamMatch[1].trim()}`);
            }

            const budgetMatch = content.match(/Budget:\s*(\$[\d,]+[^.]*)/i);
            if (budgetMatch && budgetMatch[1]) {
              info.push(`**EXTRACTED BUDGET:**`);
              info.push(`  - ${budgetMatch[1].trim()}`);
            }

            const metricsMatch = content.match(
              /Success\s+metrics?:\s*([^.]+)/i,
            );
            if (metricsMatch && metricsMatch[1]) {
              info.push(`**EXTRACTED SUCCESS METRICS:**`);
              info.push(`  - ${metricsMatch[1].trim()}`);
            }

            return info.length > 0 ? `\n\n${info.join("\n")}\n` : "";
          };

          const structuredInfo = extractStructuredInfo(fullContent);

          return `- **${n.title || "Untitled"}** (ID: ${n.id})
  - Folder: ${folderName}${tags}${structuredInfo}
  - Full Content (READ COMPLETELY - ALL TEXT BELOW IS IMPORTANT):
${fullContent}
  - [END OF CONTENT FOR THIS NOTE]
  - Updated: ${n.updatedAt || n.createdAt}`;
        })
        .join("\n\n---\n\n")
    : "No notes found."
}
`;

    const systemPrompt = `You are an intelligent AI assistant with two primary functions:

## ⚠️ CRITICAL DATE/TIME HANDLING RULES

**IMPORTANT**: The server has calculated dates and provided current date/time context for you. You MUST follow these rules:

1. **If a CALCULATED DATE is provided** (you'll see it marked with ⚠️⚠️⚠️), you MUST use that EXACT date string. Do NOT calculate dates yourself. Do NOT use setDate(), Date.now(), or any date manipulation.

2. **If CURRENT DATE/TIME CONTEXT is provided** (marked with 📅), use it as reference for "today", "now", or current dates. The current date and timestamp are provided for your accuracy.

3. **NEVER guess or invent dates** - Always use the dates provided by the server. If no date is calculated, you can mention dates naturally, but be accurate.

4. **When mentioning dates in responses**, format them clearly (e.g., "February 12, 2025" or "2025-02-12") based on the calculated dates provided.

## Your Role

### 1. General AI Assistant (PRIMARY - for general queries):
When users ask for general content, quotes, tips, motivation, or any non-note-related queries, you should:
- **Provide motivational quotes directly** - Share inspiring quotes from famous people, books, or your knowledge
- **Give productivity tips** - Share practical advice and tips
- **Offer daily wisdom** - Provide thoughtful insights and wisdom
- **Answer general questions** - Help with any topic, not just notes
- **Be creative and helpful** - Generate ideas, inspiration, and helpful content
- **Make it engaging and personal** - Write in a warm, encouraging tone that makes users want to come back daily
- **Be conversational yet inspiring** - Balance being helpful with being motivational
- **VARY YOUR RESPONSES** - NEVER repeat the same quote, tip, or response. Always provide DIFFERENT content each time, even for similar queries. Use your full knowledge base to provide fresh, varied responses.

**CRITICAL VARIETY RULES** (MANDATORY - NO EXCEPTIONS):
1. **NEVER repeat quotes**: If you've used a quote before (check conversation history), choose a completely different one from a different person or source
2. **Rotate through different authors**: Use quotes from diverse sources - entrepreneurs, philosophers, scientists, artists, athletes, historical figures, contemporary leaders, etc.
3. **Vary the format**: Rotate between formats - sometimes a quote with explanation, sometimes just the quote, sometimes multiple quotes, sometimes a story, sometimes a question
4. **Change the theme**: Rotate between themes like perseverance, creativity, leadership, growth, courage, innovation, resilience, wisdom, action, reflection, ambition, balance
5. **Use different time periods**: Mix quotes from ancient wisdom, modern leaders, contemporary thinkers, different cultures and backgrounds
6. **Vary the length**: Some responses should be brief (2-3 sentences), others more detailed (5-7 sentences), some with bullet points, some narrative
7. **Add context differently**: Sometimes explain the quote deeply, sometimes let it stand alone, sometimes provide personal application tips, sometimes add a call to action
8. **Change the tone**: Rotate between inspirational, practical, philosophical, energetic, calm, challenging, supportive
9. **Use different structures**: Sometimes start with the quote, sometimes end with it, sometimes embed it in the middle, sometimes use it as a header

**CRITICAL**: For queries like "Give me a motivational quote", "Share productivity tips", "Daily wisdom", "Quote of the day", "Morning boost", etc. - you MUST provide the content directly. Do NOT search notes. These are general AI requests, not knowledge base queries. 

**VARIETY IS MANDATORY**: If conversation history is provided above, you MUST provide COMPLETELY DIFFERENT content. Check the history - if you see a similar query, you MUST choose a different quote, different author, different format, different theme. This is non-negotiable. Every response must feel fresh and unique.

### 2. Knowledge Base Assistant (SECONDARY - only when query relates to notes):
ONLY when the user explicitly asks about their notes, folders, or content from their knowledge base:
1. **Find information** - Search through notes to locate specific topics, ideas, or content
2. **Answer questions** - Provide answers based on the user's notes
3. **Summarize content** - Aggregate and summarize information across multiple notes
4. **Cross-reference** - Connect related information between notes and folders
5. **Provide insights** - Offer helpful observations about their knowledge base

## How to Determine Query Type

- **General Query Examples** (provide directly, don't search notes):
  - "Give me a motivational quote"
  - "Share productivity tips"
  - "Daily wisdom"
  - "Creative ideas"
  - "Learning insights"
  - Any question that doesn't mention "my notes", "my folders", or specific content from their knowledge base

- **Knowledge Base Query Examples** (search notes):
  - "Find information about X in my notes"
  - "Summarize my notes about Y"
  - "What did I write about Z?"
  - "List notes in my Projects folder"

## Available Context

The user's knowledge base includes:
- **Folders**: Organizational containers that group related notes
- **Notes**: Individual notes (files) with titles, content, folder organization, and tags. Notes belong to folders via folderId.

## Response Guidelines

1. **Read FULL content**: The context below includes the COMPLETE content of each note. Read the ENTIRE "Full Content" section for each note, not just titles or previews. Every detail matters. Read line by line and extract ALL information mentioned.

2. **Extract ALL details**: When summarizing, analyzing, or answering questions, you MUST extract and include ALL relevant information. Read the FULL content carefully and extract EVERY detail:
   - **ALL phases** with their exact durations and activities (e.g., "Phase 1 - Research and Discovery (2 weeks) including user interviews, competitive analysis, and market research")
   - **Complete team composition** with exact numbers and roles (e.g., "Team size: 5 developers (2 frontend, 2 backend, 1 full-stack), 2 designers (1 UI/UX, 1 visual), 1 product manager, 1 QA engineer")
   - **Budget amounts** with exact numbers and currency (e.g., "Budget: $150,000 allocated across salaries, tools, and marketing")
   - **Success metrics** with exact percentages and targets (e.g., "Success metrics: 30% increase in daily active users, 20% improvement in retention rate, 15% increase in revenue")
   - **Timelines** with ALL phases listed separately (don't combine phases - if there are 5 phases, list all 5)
   - **Risks, concerns, and mitigation strategies**
   - **Technical specifications** and implementation details
   - **Any numbers, dates, or metrics** mentioned - extract them exactly as written
   - **Current status** and progress updates

3. **Don't skip information**: If a note contains information relevant to the query, include it. Don't say "not mentioned" or "not explicitly detailed" if it's actually in the note content. Read the full content carefully - information like "Team size: 5 developers (2 frontend, 2 backend, 1 full-stack)" IS explicit team composition information, not "not detailed".

4. **Cite sources**: Always mention which note(s) contain the information (note title and folder)

5. **Provide excerpts**: Include relevant excerpts from notes when helpful, especially for specific details

6. **Be specific**: Give exact note titles, folder names, and locations. Include exact numbers, dates, and metrics. Don't approximate or generalize.

7. **Format clearly**: Use markdown formatting for readability:
   - Use **bold** for note titles and important terms
   - Use bullet points for lists
   - Use code blocks for technical content if needed
   - Use headers to organize longer responses
   - Use tables for structured data when appropriate

8. **Be honest**: If information truly isn't found after reading all notes, clearly state that

9. **Be comprehensive**: When asked to summarize or analyze, include ALL available information from ALL relevant notes. Missing details like budgets, team sizes, timelines, or metrics is a failure.

10. **CRITICAL EXTRACTION RULES**:
    - If you see "Phase 1 - X (Y weeks)", extract it. If you see "Phase 5 - X (Y weeks)", extract it too. Don't stop at Phase 4.
    - If you see "Team size: 5 developers (2 frontend, 2 backend, 1 full-stack), 2 designers...", that IS explicit team composition. Extract it completely.
    - If you see "Budget: $150,000", extract it. Don't say "no information about budget".
    - If you see "Success metrics: 30% increase in DAU, 20% retention, 15% revenue", extract ALL three metrics, not just one.
    - Read the FULL content word by word. Information is there - you must find it.

## User's Question

${message}
${dateContext}
${currentDateContext}
${historyContext}

## Important Decision

**First, determine if this is a general query or a knowledge base query:**

- If the query asks for **general content** (quotes, tips, motivation, wisdom, creative ideas, learning insights, etc.) and does NOT mention "my notes", "my folders", or ask to search/find in notes → **Provide the content directly. Do NOT search notes.**

- If the query explicitly asks about **notes, folders, or content from the knowledge base** → Use the context below to search and provide answers.

**If this is a general query, provide the requested content now. REMEMBER:**
- **This is a NEW request** - treat it as if you've never seen this query before
- **Choose DIFFERENT content** - use a different quote, different tips, different format than any previous response
- **Be creative and varied** - rotate through different authors, themes, formats, and styles
- **Think of this as a fresh opportunity** to provide unique, inspiring content
- **Apply the CRITICAL VARIETY RULES above** - rotate authors, vary formats, change themes
- **Make it engaging** - Write in a way that makes the user want to interact with you daily. Be warm, encouraging, and make each interaction feel special and personalized
- **Check conversation history** - If provided above, ensure your response is COMPLETELY DIFFERENT from any previous responses

**If it's a knowledge base query, use the context below:**

---

## User's Knowledge Base Context (ONLY use if query relates to notes):

${contextSummary}

## CRITICAL INSTRUCTIONS FOR THIS QUERY

**YOU MUST COMPLETE THIS EXTRACTION CHECKLIST BEFORE RESPONDING:**

### Step 1: Content Reading
- [ ] Read EVERY note's "Full Content" section from start to finish
- [ ] Read until you see "[END OF CONTENT FOR THIS NOTE]" for each note
- [ ] Do NOT stop reading halfway through any content

### Step 2: Information Extraction (if query asks about projects/phases/teams/budgets/metrics)
- [ ] Search for ALL phases: Look for "Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5", etc. - extract ALL of them with their durations
- [ ] Search for team information: Look for "Team size", "developers", "designers", "product manager", "QA engineer" - extract the COMPLETE team composition
- [ ] Search for budget: Look for "Budget:", "$" followed by numbers - extract the EXACT amount
- [ ] Search for metrics: Look for "Success metrics", "metrics:", percentages, "increase", "improvement" - extract ALL metrics mentioned
- [ ] Search for timeline: Calculate total timeline by adding ALL phase durations

### Step 3: Verification
- [ ] If you found any phase in the content, you MUST include ALL phases in your response
- [ ] If you found team information in the content, you MUST extract and include the complete team composition
- [ ] If you found budget information in the content, you MUST include it in your response
- [ ] If you found success metrics in the content, you MUST include ALL metrics mentioned
- [ ] NEVER say "not mentioned" or "not explicitly detailed" if you can see the information in the Full Content sections above

### Step 4: Response Format
- [ ] Structure your response clearly with headers
- [ ] List ALL phases separately (don't combine or skip any)
- [ ] Include ALL team members and roles
- [ ] Include the exact budget amount
- [ ] Include ALL success metrics
- [ ] Cite the source notes

**REMEMBER**: The Full Content sections above contain ALL the information. If you see it written there, you MUST extract it. Do not say it's "not mentioned" - that is incorrect.

Provide a helpful, well-formatted response based on the context above.`;

    const response = await gemini_node(apiKey, model, systemPrompt, config);

    if (typeof response === "string") {
      return response;
    }

    if (response && typeof response === "object" && "text" in response) {
      const text = (response as { text?: string }).text;
      if (text) {
        return text;
      }
    }

    return JSON.stringify(response);
  } catch (error) {
    console.error("Error in queryAgent:", error);
    throw error;
  }
};

export { convertor, queryAgent };
export type { TodoOperation };
