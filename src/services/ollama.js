/**
 * Ollama API Client
 * Connects to Ollama-compatible endpoint (local or cloud)
 */

const OLLAMA_BASE_URL = (import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_API_KEY = import.meta.env.VITE_OLLAMA_API_KEY || '';
const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3';

/**
 * Interview system prompt for the AI interviewer
 */
export const INTERVIEW_SYSTEM_PROMPT = `You are an AI technical interviewer conducting a coding interview for a software engineering position.

Your responsibilities:
1. Ask clear, progressively difficult technical questions
2. Evaluate the candidate's problem-solving approach and thought process
3. Provide helpful hints when the candidate is genuinely stuck (but never give direct solutions)
4. Assess both technical skills and communication abilities
5. Be professional, encouraging, and fair throughout the interview
6. Give constructive feedback on code submissions

Interview guidelines:
- Start with a brief introduction and make the candidate comfortable
- Ask one question at a time and wait for responses
- Follow up on interesting points the candidate makes
- If reviewing code, focus on correctness, efficiency, and code quality
- Keep responses concise but helpful
- End with allowing the candidate to ask questions

Current interview context will be provided with each message.`;

/**
 * Check if Ollama server is running and accessible
 */
export async function checkOllamaHealth() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Ollama health check failed:', error);
    return false;
  }
}

/**
 * Get list of available models from Ollama
 */
export async function listModels() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Failed to list Ollama models:', error);
    throw error;
  }
}

/**
 * Send a chat message to an Ollama-compatible endpoint and get a response
 * @param {Object} options
 * @param {string} options.model - Model name (e.g., 'llama3', 'llama3.1:8b')
 * @param {Array} options.messages - Chat history [{role: 'user'|'assistant'|'system', content: string}]
 * @param {boolean} options.stream - Whether to stream the response
 * @param {Function} options.onToken - Callback for each streamed token (if streaming)
 * @returns {Promise<string>} The assistant's response
 */
export async function chat({ model, messages, stream = false, onToken = null }) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (OLLAMA_API_KEY) {
    headers.Authorization = `Bearer ${OLLAMA_API_KEY}`;
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages,
      stream,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama chat failed: ${response.status} - ${error}`);
  }

  if (stream && onToken) {
    return streamResponse(response, onToken);
  } else {
    const data = await response.json();
    return data.message?.content || '';
  }
}

/**
 * Stream response tokens from Ollama
 */
async function streamResponse(response, onToken) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            fullResponse += data.message.content;
            onToken(data.message.content, fullResponse);
          }
          if (data.done) {
            return fullResponse;
          }
        } catch (e) {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}

/**
 * Create a chat session helper with conversation history management
 */
export function createChatSession(model, systemPrompt = INTERVIEW_SYSTEM_PROMPT) {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  return {
    /**
     * Get current messages
     */
    getMessages() {
      return [...messages];
    },

    /**
     * Add context about the current question/code
     */
    setContext(context) {
      // Update or add context to system message
      const systemMsg = messages[0];
      systemMsg.content = `${systemPrompt}\n\n---\nCurrent Context:\n${context}`;
    },

    /**
     * Send a user message and get AI response
     */
    async sendMessage(userMessage, { stream = true, onToken = null } = {}) {
      messages.push({ role: 'user', content: userMessage });

      try {
        const response = await chat({
          model,
          messages,
          stream,
          onToken,
        });

        messages.push({ role: 'assistant', content: response });
        return response;
      } catch (error) {
        // Remove the failed user message
        messages.pop();
        throw error;
      }
    },

    /**
     * Clear conversation history (keep system prompt)
     */
    clearHistory() {
      messages.length = 1;
    },

    /**
     * Get conversation for export/review
     */
    exportConversation() {
      return messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString(),
      }));
    }
  };
}

/**
 * Generate code review feedback
 */
export async function reviewCode({ model, code, language, question, testResults }) {
  const prompt = `Please review the following ${language} code submission for this interview question:

**Question:** ${question}

**Submitted Code:**
\`\`\`${language}
${code}
\`\`\`

**Test Results:** ${testResults ? JSON.stringify(testResults) : 'Not yet run'}

Provide brief, constructive feedback on:
1. Correctness - Does the code solve the problem?
2. Efficiency - Time and space complexity
3. Suggestions - How could it be improved?

Keep your review concise (3-4 sentences max).`;

  return chat({
    model,
    messages: [
      { role: 'system', content: 'You are a code review assistant. Provide helpful, constructive feedback on code submissions. Be concise.' },
      { role: 'user', content: prompt }
    ],
    stream: false,
  });
}

export default {
  checkOllamaHealth,
  listModels,
  chat,
  createChatSession,
  reviewCode,
  INTERVIEW_SYSTEM_PROMPT,
};
