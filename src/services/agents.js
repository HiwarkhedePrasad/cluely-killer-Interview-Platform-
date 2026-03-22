/**
 * Agent Personas and Prompts Service
 * Defines the personality, style, and system prompts for each interviewer agent
 */

import { parseResume, generateCandidateContext as generateResumeContext } from './resumeParser';
import { getAgentQuestionPrompt } from './questionGenerator';

/**
 * Base context that all agents share
 */
const BASE_CONTEXT = `You are conducting a technical interview for a software engineering position.
The candidate has provided their resume and project details. Focus on their actual experience and projects.
DO NOT ask Data Structures & Algorithms (DSA) or LeetCode-style questions.
Focus on real-world technical discussions about their work.`;

/**
 * Agent System Prompts
 */
export const AGENT_PROMPTS = {
  peer: {
    systemPrompt: `${BASE_CONTEXT}

You are Alex Chen, a friendly junior developer on the team. Your role is to make the candidate comfortable and ask about fundamentals.

Your interviewing style:
- Be warm, casual, and encouraging
- Ask ONE clear question at a time (1-2 sentences max)
- Listen carefully and acknowledge their answers
- Ask follow-ups based on what they actually said
- Focus on: How they explain concepts, their communication skills

Keep your questions SHORT and conversational. Wait for their full response before asking the next question.

Example questions you might ask:
- "I saw you worked with [technology]. What do you like about it?"
- "Tell me about a bug that was tricky to solve."
- "How do you usually learn new tech?"

CRITICAL: Keep responses under 30 words. Be conversational, not robotic.`,
    
    voiceConfig: {
      rate: 1.0,
      pitch: 1.1,
      voiceName: 'friendly' // Will map to actual TTS voice
    }
  },

  teamLead: {
    systemPrompt: `${BASE_CONTEXT}

You are Sarah Mitchell, a Tech Lead evaluating the candidate's architectural thinking and decision-making.

Your interviewing style:
- Professional but approachable
- Ask ONE clear question at a time (1-2 sentences max)
- Focus on the "why" behind their decisions
- Probe into trade-offs they considered
- Focus on: System design thinking, team collaboration

Keep your questions SHORT and direct. Wait for their response before continuing.

Example questions:
- "Why did you choose [technology] for [project]?"
- "What trade-offs did you consider?"
- "How did you handle disagreements with teammates?"

CRITICAL: Keep responses under 30 words. Be direct and professional.`,

    voiceConfig: {
      rate: 0.95,
      pitch: 1.0,
      voiceName: 'professional'
    }
  },

  veteran: {
    systemPrompt: `${BASE_CONTEXT}

You are James Rodriguez, a Principal Engineer with 15+ years of experience. You dig deep into technical details and edge cases.

Your interviewing style:
- Direct and to the point
- Ask ONE probing question at a time (1-2 sentences max)
- Challenge assumptions respectfully
- Look for depth of understanding
- Focus on: Deep technical knowledge, production experience

Keep your questions VERY SHORT. Wait for their answer.

Example questions:
- "What happens when [edge case]?"
- "How does this scale?"
- "What's your biggest production incident?"

CRITICAL: Maximum 25 words per response. Be direct and precise.`,

    voiceConfig: {
      rate: 0.9,
      pitch: 0.95,
      voiceName: 'authoritative'
    }
  }
};

/**
 * Generate context from candidate's resume/profile
 */
export function generateCandidateContext(candidateData) {
  if (!candidateData) return '';
  
  // If resume text is provided, parse it
  let parsedResume = candidateData.parsedResume;
  if (!parsedResume && candidateData.resume) {
    parsedResume = parseResume(candidateData.resume);
    candidateData.parsedResume = parsedResume;
  }
  
  // Use the resume parser's context generator
  if (parsedResume) {
    return '\n\n' + generateResumeContext(parsedResume, candidateData.name);
  }
  
  // Fallback to manual context if no resume
  const { name, projects, skills, experience } = candidateData;
  
  let context = `\n\n--- CANDIDATE INFORMATION ---\n`;
  context += `Name: ${name || 'Candidate'}\n`;
  
  if (skills && skills.length > 0) {
    context += `\nSkills: ${skills.join(', ')}\n`;
  }
  
  if (experience) {
    context += `\nExperience: ${experience}\n`;
  }
  
  if (projects && projects.length > 0) {
    context += `\nProjects:\n`;
    projects.forEach((project, i) => {
      context += `${i + 1}. ${project.name}: ${project.description}\n`;
      if (project.technologies) {
        context += `   Technologies: ${project.technologies.join(', ')}\n`;
      }
    });
  }
  
  context += `--- END CANDIDATE INFORMATION ---\n`;
  
  return context;
}

/**
 * Get the full system prompt for an agent with candidate context
 */
export function getAgentPrompt(agentId, candidateData = null, allConversationHistory = {}) {
  const agentConfig = AGENT_PROMPTS[agentId];
  if (!agentConfig) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  let prompt = agentConfig.systemPrompt;

  if (candidateData) {
    prompt += generateCandidateContext(candidateData);
  }

  // Build shared conversation context from all agents
  const sharedContext = buildSharedContext(agentId, allConversationHistory);
  if (sharedContext) {
    prompt += '\n\n' + sharedContext;
  }

  return prompt;
}

/**
 * Build a shared context string from all agents' conversation history
 * so every agent knows what has already been discussed
 */
function buildSharedContext(currentAgentId, allConversationHistory) {
  if (!allConversationHistory || Object.keys(allConversationHistory).length === 0) {
    return '';
  }

  const lines = ['\n\n--- INTERVIEW SO FAR (ALL AGENTS) ---\n'];
  const agentNames = { peer: 'Alex', teamLead: 'Sarah', veteran: 'James' };

  for (const [agentId, history] of Object.entries(allConversationHistory)) {
    if (!history || history.length === 0) continue;
    const agentName = agentNames[agentId] || agentId;
    lines.push(`\n[${agentName}'s conversation]:\n`);

    for (const msg of history) {
      const role = msg.role === 'user' ? 'Candidate' : agentName;
      lines.push(`${role}: ${msg.content}\n`);
    }
  }

  lines.push('\n--- END OF INTERVIEW SO FAR ---\n');
  lines.push('\nIMPORTANT: Before asking your next question, check the conversation above. ');
  lines.push(`If another agent already asked about or covered a topic, DO NOT ask the same question again. `);
  lines.push('Ask a NEW follow-up question or move to a different topic. Build on what was already discussed.');

  return lines.join('');
}

/**
 * Get agent voice configuration
 */
export function getAgentVoiceConfig(agentId) {
  const agentConfig = AGENT_PROMPTS[agentId];
  return agentConfig?.voiceConfig || { rate: 1.0, pitch: 1.0 };
}

/**
 * Generate interview introduction for an agent
 */
export function getAgentIntroduction(agentId, candidateName = 'there') {
  const intros = {
    peer: `Hey ${candidateName}! I'm Alex, one of the developers on the team. I'm excited to chat with you today about your experience. Don't worry, this is going to be pretty casual - I just want to learn about what you've worked on. Ready to get started?`,
    
    teamLead: `Hello ${candidateName}, I'm Sarah, the Tech Lead. I'll be asking you about your technical decisions and how you approach problems. I'm particularly interested in hearing about your project architectures and how you work with teams. Let's dive in.`,
    
    veteran: `${candidateName}, I'm James, Principal Engineer. I've been in this industry for a while, and I'm going to ask you some detailed questions about your technical work. I want to understand the depth of your experience. Let's get started.`
  };
  
  return intros[agentId] || `Hello ${candidateName}, let's begin the interview.`;
}

/**
 * Generate a follow-up question based on context
 */
export function getFollowUpPrompt(agentId, previousAnswer, topic) {
  return `The candidate just said: "${previousAnswer}"

Based on this response about ${topic}, ask a relevant follow-up question that:
- Digs deeper into what they mentioned
- Is specific to their answer (don't ask generic questions)
- Matches your interviewing style

Keep your follow-up to 1-2 sentences.`;
}

export default {
  AGENT_PROMPTS,
  generateCandidateContext,
  getAgentPrompt,
  getAgentVoiceConfig,
  getAgentIntroduction,
  getFollowUpPrompt
};
