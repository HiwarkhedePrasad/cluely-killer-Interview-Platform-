/**
 * Resume Parser Service
 * Extracts skills, technologies, and projects from resume text
 * for use in AI interview question generation
 */

// Common technical skills to look for
const SKILL_PATTERNS = {
  languages: [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'Perl', 'R', 'MATLAB'
  ],
  frontend: [
    'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Gatsby',
    'HTML', 'CSS', 'SCSS', 'Sass', 'Tailwind', 'Bootstrap', 'Material UI',
    'Redux', 'MobX', 'Zustand', 'Webpack', 'Vite', 'Babel'
  ],
  backend: [
    'Node.js', 'Express', 'Fastify', 'Nest.js', 'Django', 'Flask', 'FastAPI',
    'Spring', 'Spring Boot', 'Rails', 'Laravel', 'ASP.NET', 'GraphQL', 'REST',
    'gRPC', 'WebSocket', 'Microservices'
  ],
  database: [
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
    'DynamoDB', 'Cassandra', 'Elasticsearch', 'Neo4j', 'Firebase', 'Supabase'
  ],
  devops: [
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible',
    'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Nginx', 'Linux'
  ],
  tools: [
    'Git', 'VS Code', 'IntelliJ', 'Jira', 'Confluence', 'Figma', 'Postman'
  ]
};

// Project section indicators
const PROJECT_INDICATORS = [
  'project', 'developed', 'built', 'created', 'implemented', 'designed',
  'architected', 'led', 'managed', 'deployed', 'launched', 'maintained'
];

// Experience level indicators
const EXPERIENCE_INDICATORS = {
  junior: ['intern', 'junior', 'associate', 'entry', 'graduate', '0-2 years', '1 year'],
  mid: ['mid', 'intermediate', '2-5 years', '3 years', '4 years'],
  senior: ['senior', 'lead', 'principal', 'staff', '5+ years', '6+ years', 'architect']
};

/**
 * Extract skills from resume text
 */
export function extractSkills(text) {
  const normalizedText = text.toLowerCase();
  const foundSkills = {
    languages: [],
    frontend: [],
    backend: [],
    database: [],
    devops: [],
    tools: []
  };

  for (const [category, skills] of Object.entries(SKILL_PATTERNS)) {
    for (const skill of skills) {
      // Check for exact match (case insensitive)
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        foundSkills[category].push(skill);
      }
    }
  }

  return foundSkills;
}

/**
 * Extract potential projects from resume text
 */
export function extractProjects(text) {
  const projects = [];
  const lines = text.split('\n');
  let currentProject = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();

    // Check if this line starts a new project
    const isProjectLine = PROJECT_INDICATORS.some(indicator => 
      lowerLine.includes(indicator)
    );

    if (isProjectLine && line.length > 15 && line.length < 200) {
      // Extract project name (usually the first significant phrase)
      const projectMatch = line.match(/^[•\-\*]?\s*(.+?)(?:[:\-–]|$)/);
      if (projectMatch) {
        currentProject = {
          name: projectMatch[1].trim().slice(0, 80),
          description: line,
          technologies: []
        };

        // Look for technologies in this line and next few lines
        const techContext = lines.slice(i, i + 3).join(' ');
        const allSkills = extractSkills(techContext);
        currentProject.technologies = [
          ...allSkills.languages,
          ...allSkills.frontend,
          ...allSkills.backend,
          ...allSkills.database
        ].slice(0, 6); // Limit to 6 most relevant

        if (currentProject.name && currentProject.name.length > 3) {
          projects.push(currentProject);
        }
      }
    }
  }

  return projects.slice(0, 5); // Return top 5 projects
}

/**
 * Estimate experience level from resume
 */
export function estimateExperienceLevel(text) {
  const lowerText = text.toLowerCase();

  // Check for senior indicators first
  for (const indicator of EXPERIENCE_INDICATORS.senior) {
    if (lowerText.includes(indicator)) {
      return 'senior';
    }
  }

  // Check for mid indicators
  for (const indicator of EXPERIENCE_INDICATORS.mid) {
    if (lowerText.includes(indicator)) {
      return 'mid';
    }
  }

  // Default to junior
  return 'junior';
}

/**
 * Extract years of experience
 */
export function extractYearsOfExperience(text) {
  const patterns = [
    /(\d+)\+?\s*years?\s*(?:of\s+)?experience/i,
    /experience\s*[:\-]?\s*(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*years?\s*in\s+(?:software|development|programming)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Main function to parse resume and extract all relevant information
 */
export function parseResume(text) {
  if (!text || typeof text !== 'string') {
    return {
      skills: { languages: [], frontend: [], backend: [], database: [], devops: [], tools: [] },
      projects: [],
      experienceLevel: 'junior',
      yearsOfExperience: null,
      summary: ''
    };
  }

  const skills = extractSkills(text);
  const projects = extractProjects(text);
  const experienceLevel = estimateExperienceLevel(text);
  const yearsOfExperience = extractYearsOfExperience(text);

  // Create a summary for AI context
  const allSkills = [
    ...skills.languages,
    ...skills.frontend,
    ...skills.backend,
    ...skills.database.slice(0, 3),
    ...skills.devops.slice(0, 2)
  ];

  const summary = `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)} developer` +
    (yearsOfExperience ? ` with ${yearsOfExperience}+ years of experience` : '') +
    (allSkills.length > 0 ? `. Skills: ${allSkills.slice(0, 8).join(', ')}` : '') +
    (projects.length > 0 ? `. Key projects: ${projects.map(p => p.name).join(', ')}` : '');

  return {
    skills,
    projects,
    experienceLevel,
    yearsOfExperience,
    summary
  };
}

/**
 * Generate AI context from parsed resume
 */
export function generateCandidateContext(parsedResume, candidateName = 'Candidate') {
  const { skills, projects, experienceLevel, yearsOfExperience, summary } = parsedResume;

  let context = `## Candidate Profile: ${candidateName}\n\n`;
  context += `**Experience Level:** ${experienceLevel}\n`;
  if (yearsOfExperience) {
    context += `**Years of Experience:** ${yearsOfExperience}+\n`;
  }

  if (Object.values(skills).some(arr => arr.length > 0)) {
    context += '\n### Technical Skills:\n';
    if (skills.languages.length > 0) context += `- **Languages:** ${skills.languages.join(', ')}\n`;
    if (skills.frontend.length > 0) context += `- **Frontend:** ${skills.frontend.join(', ')}\n`;
    if (skills.backend.length > 0) context += `- **Backend:** ${skills.backend.join(', ')}\n`;
    if (skills.database.length > 0) context += `- **Database:** ${skills.database.join(', ')}\n`;
    if (skills.devops.length > 0) context += `- **DevOps:** ${skills.devops.join(', ')}\n`;
  }

  if (projects.length > 0) {
    context += '\n### Projects to Discuss:\n';
    projects.forEach((project, i) => {
      context += `${i + 1}. **${project.name}**\n`;
      if (project.description) context += `   ${project.description}\n`;
      if (project.technologies.length > 0) {
        context += `   Technologies: ${project.technologies.join(', ')}\n`;
      }
    });
  }

  context += '\n### Interview Focus:\n';
  context += '- Ask about specific implementations and decisions in their projects\n';
  context += '- Explore architecture choices and tradeoffs\n';
  context += '- Discuss challenges faced and how they were solved\n';
  context += '- DO NOT ask DSA/algorithm questions\n';
  context += '- Focus on practical, real-world scenarios\n';

  return context;
}

export default {
  parseResume,
  extractSkills,
  extractProjects,
  estimateExperienceLevel,
  extractYearsOfExperience,
  generateCandidateContext
};
