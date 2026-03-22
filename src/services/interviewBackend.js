/**
 * Interview Backend Service
 * Wraps Tauri commands for session management and report generation.
 * Falls back to localStorage when running outside of Tauri (dev mode).
 */

import { invoke } from '@tauri-apps/api/core';

// Track if we're running inside Tauri
const isTauri = !!window.__TAURI_INTERNALS__?.window;

// ─── LocalStorage Fallback ───────────────────────────────────────────────────────

function getStorageKey(sessionId) {
  return `interview_session_${sessionId}`;
}

function getReportKey(sessionId) {
  return `interview_report_${sessionId}`;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function timestampNow() {
  return Date.now().toString();
}

// ─── Session Storage ───────────────────────────────────────────────────────────

async function localCreateSession(candidateName) {
  const sessionId = uuid();
  const session = {
    session_id: sessionId,
    candidate_name: candidateName,
    started_at: timestampNow(),
    ended_at: null,
    duration_seconds: null,
    transcript: [],
  };
  localStorage.setItem(getStorageKey(sessionId), JSON.stringify(session));
  return sessionId;
}

async function localAppendTranscriptEntry(
  sessionId,
  agentId,
  agentName,
  role,
  content,
  timestampMs
) {
  const raw = localStorage.getItem(getStorageKey(sessionId));
  if (!raw) throw new Error(`Session ${sessionId} not found`);
  const session = JSON.parse(raw);
  session.transcript.push({
    agent_id: agentId,
    agent_name: agentName,
    role,
    content,
    timestamp_ms: timestampMs,
  });
  localStorage.setItem(getStorageKey(sessionId), JSON.stringify(session));
}

async function localEndSession(sessionId, durationSeconds) {
  const raw = localStorage.getItem(getStorageKey(sessionId));
  if (!raw) throw new Error(`Session ${sessionId} not found`);
  const session = JSON.parse(raw);
  session.ended_at = timestampNow();
  session.duration_seconds = durationSeconds;
  localStorage.setItem(getStorageKey(sessionId), JSON.stringify(session));
}

async function localGetSession(sessionId) {
  const raw = localStorage.getItem(getStorageKey(sessionId));
  if (!raw) throw new Error(`Session ${sessionId} not found`);
  return JSON.parse(raw);
}

async function localGenerateReport(sessionId) {
  const raw = localStorage.getItem(getStorageKey(sessionId));
  if (!raw) throw new Error(`Session ${sessionId} not found`);
  const session = JSON.parse(raw);

  const qaPairs = buildQaPairs(session.transcript);
  const overallSummary = generateOverallSummary(session);
  const { strengths, weaknesses } = extractStrengthsWeaknesses(qaPairs);
  const recommended = extractFocusAreas(qaPairs);

  const report = {
    session_id: sessionId,
    candidate_name: session.candidate_name,
    generated_at: timestampNow(),
    overall_summary: overallSummary,
    qa_analysis: qaPairs,
    strengths,
    weaknesses,
    recommended_focus_areas: recommended,
  };

  localStorage.setItem(getReportKey(sessionId), JSON.stringify(report));
  return report;
}

async function localGetReport(sessionId) {
  const raw = localStorage.getItem(getReportKey(sessionId));
  if (!raw) throw new Error(`Report ${sessionId} not found`);
  return JSON.parse(raw);
}

// ─── Analysis Helpers (mirrors Rust logic) ─────────────────────────────────────

function buildQaPairs(transcript) {
  const pairs = [];
  for (let i = 0; i < transcript.length; i++) {
    const entry = transcript[i];
    if (entry.role === 'agent') {
      const question = entry.content;
      const topic = extractTopic(question);

      let answer = '';
      let j = i + 1;
      while (j < transcript.length && transcript[j].role === 'candidate') {
        if (answer) answer += ' ';
        answer += transcript[j].content;
        j++;
      }

      const preferred = generatePreferredAnswer(question, topic);
      const [score, feedback] = evaluateAnswer(answer, topic);

      pairs.push({
        question,
        candidate_answer: answer,
        preferred_answer: preferred,
        quality_score: score,
        feedback,
        topic,
      });
    }
  }
  return pairs;
}

function extractTopic(question) {
  const q = question.toLowerCase();
  if (/project|built|worked on|tell me about/.test(q)) return 'Projects & Experience';
  if (/skill|technology|react|python|javascript/.test(q)) return 'Technical Skills';
  if (/trade-off|design|architect|scale/.test(q)) return 'System Design';
  if (/team|collab|conflict|communicat/.test(q)) return 'Teamwork & Communication';
  if (/challenge|problem|bug|debug/.test(q)) return 'Problem Solving';
  if (/production|incident|deploy/.test(q)) return 'Production Experience';
  return 'General';
}

function generatePreferredAnswer(question, topic) {
  if (topic === 'Projects & Experience')
    return 'Describe the project goal and your specific role, highlight 2-3 key technical decisions with reasoning, mention measurable outcomes, and discuss the biggest challenge and how you overcame it.';
  if (topic === 'Technical Skills')
    return 'Show depth beyond syntax - explain how it works internally, compare with alternatives and trade-offs, give a specific real-world use case, and mention advanced patterns or limitations encountered.';
  if (topic === 'System Design')
    return 'Ask clarifying questions to define scope, outline 2-3 design alternatives with pros and cons, justify the chosen approach, and address scalability, reliability, and maintenance.';
  if (topic === 'Teamwork & Communication')
    return 'Describe the specific situation honestly, focus on YOUR actions and reasoning, show self-awareness about what you could have done better, and end with what you learned.';
  if (topic === 'Problem Solving')
    return 'Define the problem clearly, walk through your debugging/thinking process step by step, show how you iterated or researched, and end with the measurable outcome and key lesson.';
  return 'Be specific, honest, and show clear reasoning. Use real examples and focus on your specific contributions.';
}

function evaluateAnswer(answer, topic) {
  const len = answer.trim().length;
  const a = answer.toLowerCase();

  if (len === 0) return [1, 'No answer provided.'];
  if (len < 20) return [3, 'Answer was too brief. More detail and specific examples are needed.'];

  const hasSpecifics =
    len > 80 &&
    /because|when |how |result|decided|chose|learned|built/.test(a);

  const hasTechDetails =
    (topic === 'Technical Skills' || topic === 'System Design') &&
    /api|database|framework|deploy|cache|queue|test/.test(a);

  let score;
  if (hasSpecifics && hasTechDetails) score = 9;
  else if (hasSpecifics) score = 8;
  else if (len > 150) score = 7;
  else if (len > 80) score = 6;
  else score = 5;

  const feedback =
    score >= 8
      ? 'Good specific answer with concrete examples and clear reasoning.'
      : score >= 6
      ? 'Adequate answer but could benefit from more specific examples and deeper reasoning.'
      : 'Answer lacks specificity. Include concrete examples, outcomes, and your specific contribution.';

  return [score, feedback];
}

function generateOverallSummary(session) {
  const qCount = session.transcript.filter((e) => e.role === 'agent').length;
  const aCount = session.transcript.filter((e) => e.role === 'candidate').length;
  const mins = Math.floor((session.duration_seconds || 0) / 60);
  const engagement = aCount >= qCount ? 'good' : 'moderate';
  return `Interview with ${session.candidate_name} lasted ${mins} minutes. ${qCount} questions asked, ${aCount} responses recorded. Candidate showed ${engagement} engagement.`;
}

function extractStrengthsWeaknesses(qaPairs) {
  const topicScores = {};
  for (const pair of qaPairs) {
    if (!topicScores[pair.topic]) topicScores[pair.topic] = [];
    topicScores[pair.topic].push(pair.quality_score);
  }

  const strengths = [];
  const weaknesses = [];

  for (const [topic, scores] of Object.entries(topicScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 7) strengths.push(`Strong in ${topic} (avg: ${avg.toFixed(1)}/10)`);
    else if (avg < 5) weaknesses.push(`Needs improvement in ${topic} (avg: ${avg.toFixed(1)}/10)`);
  }

  if (strengths.length === 0) strengths.push('Shows engagement and willingness to discuss experience');
  if (weaknesses.length === 0) weaknesses.push('Could benefit from more detailed, example-based responses');

  return { strengths, weaknesses };
}

function extractFocusAreas(qaPairs) {
  const topicScores = {};
  for (const pair of qaPairs) {
    if (!topicScores[pair.topic]) topicScores[pair.topic] = [];
    topicScores[pair.topic].push(pair.quality_score);
  }

  return Object.entries(topicScores)
    .map(([topic, scores]) => ({
      topic,
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3)
    .map((x) => x.topic);
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a new interview session.
 * @param {string} candidateName
 * @returns {Promise<string>} sessionId
 */
export async function createSession(candidateName) {
  if (isTauri) return invoke('create_session', { candidateName });
  return localCreateSession(candidateName);
}

/**
 * Append a transcript entry.
 */
export async function appendTranscriptEntry(
  sessionId,
  agentId,
  agentName,
  role,
  content,
  timestampMs
) {
  if (isTauri)
    return invoke('append_transcript_entry', {
      sessionId,
      agentId,
      agentName,
      role,
      content,
      timestampMs,
    });
  return localAppendTranscriptEntry(sessionId, agentId, agentName, role, content, timestampMs);
}

/**
 * End an interview session.
 */
export async function endSession(sessionId, durationSeconds) {
  if (isTauri) return invoke('end_session', { sessionId, durationSeconds });
  return localEndSession(sessionId, durationSeconds);
}

/**
 * Get a session by ID.
 */
export async function getSession(sessionId) {
  if (isTauri) return invoke('get_session', { sessionId });
  return localGetSession(sessionId);
}

/**
 * Generate and save an analysis report for a session.
 */
export async function generateReport(sessionId) {
  if (isTauri) return invoke('generate_report', { sessionId });
  return localGenerateReport(sessionId);
}

/**
 * Retrieve a previously generated report.
 */
export async function getReport(sessionId) {
  if (isTauri) return invoke('get_report', { sessionId });
  return localGetReport(sessionId);
}

export default {
  createSession,
  appendTranscriptEntry,
  endSession,
  getSession,
  generateReport,
  getReport,
};
