/**
 * Question Generation Service
 * Generates project-based technical interview questions
 * based on candidate's resume and skills
 */

import { parseResume, generateCandidateContext } from './resumeParser';

/**
 * Question templates for different categories
 * These are NOT DSA questions - they focus on practical experience
 */
const QUESTION_TEMPLATES = {
  projectDeepDive: [
    "Tell me about {project}. What was your role and what were the main challenges you faced?",
    "In {project}, how did you decide on the architecture? What alternatives did you consider?",
    "What would you do differently if you were to rebuild {project} from scratch?",
    "Can you walk me through the most complex feature you implemented in {project}?",
    "How did you handle testing and quality assurance in {project}?",
    "What was the deployment process like for {project}? Any CI/CD involved?"
  ],
  
  skillBased: {
    'React': [
      "How do you manage state in your React applications? When would you use Context vs Redux vs something else?",
      "Tell me about a performance optimization you've done in a React app.",
      "How do you handle side effects in React? Compare useEffect patterns you've used.",
      "What's your approach to component composition and reusability?"
    ],
    'Node.js': [
      "How do you handle errors and logging in your Node.js applications?",
      "Tell me about a time you had to optimize a Node.js API for better performance.",
      "How do you handle authentication and authorization in your backend services?",
      "What's your experience with event-driven architecture in Node.js?"
    ],
    'Python': [
      "How do you structure larger Python projects? What patterns do you follow?",
      "Tell me about your experience with async programming in Python.",
      "How do you handle dependencies and virtual environments?",
      "What testing frameworks and practices do you use with Python?"
    ],
    'PostgreSQL': [
      "How do you design database schemas? Walk me through your thought process.",
      "Tell me about a complex query you've written and optimized.",
      "How do you handle database migrations in production?",
      "What's your experience with database indexing strategies?"
    ],
    'MongoDB': [
      "When would you choose MongoDB over a relational database?",
      "How do you design document schemas? When do you embed vs reference?",
      "Tell me about aggregation pipelines you've built.",
      "How do you handle data consistency in MongoDB?"
    ],
    'Docker': [
      "Walk me through how you containerize an application.",
      "How do you handle multi-container applications? Docker Compose experience?",
      "What's your experience with container orchestration?",
      "How do you handle secrets and configuration in containers?"
    ],
    'AWS': [
      "What AWS services have you worked with? Tell me about a typical architecture you've built.",
      "How do you handle infrastructure as code? Terraform, CloudFormation?",
      "Tell me about a scaling challenge you solved on AWS.",
      "What's your experience with serverless architectures?"
    ],
    'TypeScript': [
      "How has TypeScript improved your development workflow?",
      "Tell me about a time when TypeScript caught a bug before runtime.",
      "How do you handle typing for API responses and complex objects?",
      "What's your approach to organizing types in a large codebase?"
    ]
  },
  
  architecture: [
    "How do you approach designing a new system from scratch?",
    "Tell me about a time you had to refactor a poorly designed system.",
    "How do you balance technical debt with feature delivery?",
    "What's your experience with microservices vs monolithic architectures?",
    "How do you handle cross-cutting concerns like logging, monitoring, and security?"
  ],
  
  teamwork: [
    "How do you approach code reviews? What do you look for?",
    "Tell me about a time you had a technical disagreement with a colleague.",
    "How do you onboard new team members to a complex codebase?",
    "What's your experience with agile methodologies?"
  ],
  
  problemSolving: [
    "Tell me about the most difficult bug you've had to track down.",
    "How do you approach debugging production issues?",
    "Walk me through how you'd investigate a performance bottleneck.",
    "Tell me about a time you had to learn a new technology quickly."
  ]
};

/**
 * Generate questions based on candidate's profile
 */
export function generateQuestions(candidateData) {
  const questions = [];
  const { skills, projects } = candidateData.parsedResume || parseResume(candidateData.resume || '');

  // Project-based questions (highest priority)
  const candidateProjects = candidateData.projects || projects || [];
  candidateProjects.slice(0, 3).forEach(project => {
    const projectName = project.name || project;
    const templates = QUESTION_TEMPLATES.projectDeepDive;
    const template = templates[Math.floor(Math.random() * templates.length)];
    questions.push({
      category: 'project',
      question: template.replace('{project}', projectName),
      relatedTo: projectName,
      priority: 1
    });
  });

  // Skill-based questions
  const allSkills = [
    ...(skills?.languages || []),
    ...(skills?.frontend || []),
    ...(skills?.backend || []),
    ...(skills?.database || []),
    ...(skills?.devops || [])
  ];

  allSkills.slice(0, 5).forEach(skill => {
    const skillQuestions = QUESTION_TEMPLATES.skillBased[skill];
    if (skillQuestions) {
      const question = skillQuestions[Math.floor(Math.random() * skillQuestions.length)];
      questions.push({
        category: 'technical',
        question,
        relatedTo: skill,
        priority: 2
      });
    }
  });

  // Architecture questions (for mid/senior)
  if (candidateData.experienceLevel !== 'junior') {
    const archQ = QUESTION_TEMPLATES.architecture;
    questions.push({
      category: 'architecture',
      question: archQ[Math.floor(Math.random() * archQ.length)],
      priority: 3
    });
  }

  // Problem-solving questions
  const problemQ = QUESTION_TEMPLATES.problemSolving;
  questions.push({
    category: 'problem-solving',
    question: problemQ[Math.floor(Math.random() * problemQ.length)],
    priority: 4
  });

  // Sort by priority and return
  return questions.sort((a, b) => a.priority - b.priority);
}

/**
 * Get a follow-up question based on previous answer
 */
export function getFollowUpPrompt(previousQuestion, skill) {
  return `Based on the candidate's answer to "${previousQuestion}", ask a thoughtful follow-up question that digs deeper into their experience. Focus on specifics, trade-offs, or lessons learned.`;
}

/**
 * Generate an opening question for the interview
 */
export function getOpeningQuestion(candidateData) {
  const projects = candidateData.projects || [];
  if (projects.length > 0) {
    const project = projects[0];
    return `I see you worked on ${project.name || project}. That sounds interesting! Can you give me a brief overview of what it does and what your main contributions were?`;
  }
  
  return "Let's start by having you tell me about a recent project you're proud of. What did you build and what was your role?";
}

/**
 * Create agent-specific question prompts
 */
export function getAgentQuestionPrompt(agentType, candidateData, conversationHistory) {
  const context = generateCandidateContext(
    candidateData.parsedResume || parseResume(candidateData.resume || ''),
    candidateData.name
  );

  const basePrompts = {
    peer: `You are Alex, a friendly peer developer conducting a casual technical conversation. 
Ask about fundamentals and day-to-day development practices. Be encouraging and conversational.
Focus on: How they approach problems, their learning process, tools they use daily.`,
    
    teamLead: `You are Sarah, a tech lead evaluating architecture and system design capabilities.
Ask about design decisions, scalability considerations, and team collaboration.
Focus on: Why they made certain choices, how they handle complexity, cross-team communication.`,
    
    veteran: `You are James, a principal engineer with deep expertise. 
Dig into edge cases, performance implications, and long-term maintainability.
Focus on: Trade-offs, failure scenarios, production issues, technical debt management.`
  };

  return `${basePrompts[agentType]}

${context}

IMPORTANT RULES:
- Ask ONE question at a time
- Base questions on their specific projects and skills listed above
- DO NOT ask DSA, leetcode, or algorithm questions
- Focus on their real experience and decision-making
- Keep responses conversational (2-3 sentences max)

${conversationHistory.length > 0 ? 'Continue the conversation naturally based on what has been discussed.' : 'Start with a warm greeting and your first question.'}`;
}

export default {
  generateQuestions,
  getFollowUpPrompt,
  getOpeningQuestion,
  getAgentQuestionPrompt
};
