import React from 'react';
import { Mic, Volume2, Brain, Coffee, Briefcase, Award, Play, Square } from 'lucide-react';

/**
 * Agent status states
 */
export const AGENT_STATUS = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking'
};

/**
 * Agent definitions with personas
 */
export const AGENTS = {
  peer: {
    id: 'peer',
    name: 'Alex Chen',
    role: 'Peer Developer',
    level: 'Junior',
    icon: Coffee,
    color: '#22c55e', // green
    voiceConfig: { rate: 1.0, pitch: 1.1 }, // friendly, casual
    description: 'Friendly peer who asks about fundamentals'
  },
  teamLead: {
    id: 'teamLead',
    name: 'Sarah Mitchell',
    role: 'Team Lead',
    level: 'Mid-Senior',
    icon: Briefcase,
    color: '#ffffff', // neutral accent for monochrome theme
    voiceConfig: { rate: 0.95, pitch: 1.0 }, // professional
    description: 'Tech lead focused on architecture decisions'
  },
  veteran: {
    id: 'veteran',
    name: 'James Rodriguez',
    role: 'Principal Engineer',
    level: 'Senior',
    icon: Award,
    color: '#f59e0b', // amber
    voiceConfig: { rate: 0.9, pitch: 0.95 }, // authoritative
    description: 'Expert who digs deep into edge cases'
  }
};

/**
 * Individual Agent Card Component
 */
export function AgentCard({ agent, status = AGENT_STATUS.IDLE, isActive = false, onClick }) {
  const Icon = agent.icon;
  
  const getStatusText = () => {
    switch (status) {
      case AGENT_STATUS.LISTENING: return 'Listening...';
      case AGENT_STATUS.THINKING: return 'Thinking...';
      case AGENT_STATUS.SPEAKING: return 'Speaking...';
      default: return 'Ready';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case AGENT_STATUS.LISTENING: return <Mic size={14} className="agent-card__status-icon agent-card__status-icon--pulse" />;
      case AGENT_STATUS.THINKING: return <Brain size={14} className="agent-card__status-icon agent-card__status-icon--spin" />;
      case AGENT_STATUS.SPEAKING: return <Volume2 size={14} className="agent-card__status-icon agent-card__status-icon--pulse" />;
      default: return null;
    }
  };

  return (
    <div 
      className={`agent-card ${isActive ? 'agent-card--active' : ''} agent-card--${status}`}
      onClick={onClick}
      style={{ '--agent-color': agent.color }}
    >
      {/* Avatar */}
      <div className="agent-card__avatar">
        <Icon size={24} />
        {status === AGENT_STATUS.SPEAKING && (
          <div className="agent-card__speaking-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="agent-card__info">
        <div className="agent-card__name">{agent.name}</div>
        <div className="agent-card__role">{agent.role}</div>
      </div>

      {/* Status */}
      <div className={`agent-card__status agent-card__status--${status}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>

      {/* Active indicator */}
      {isActive && <div className="agent-card__active-border" />}
    </div>
  );
}

/**
 * Agent Panel - Contains all 3 agents
 */
export function AgentPanel({ 
  agentStatuses = {},
  activeAgent = null,
  onAgentClick,
  isInterviewActive = false,
  onStartInterview,
  onStopInterview,
  currentTranscript = '',
  className = ''
}) {
  const agents = Object.values(AGENTS);

  return (
    <div className={`agent-panel ${className}`}>
      {/* Header */}
      <div className="agent-panel__header">
        <h3 className="agent-panel__title">Interview Panel</h3>
        {isInterviewActive && (
          <div className="agent-panel__live-indicator">
            <span className="agent-panel__live-dot" />
            <span>Live</span>
          </div>
        )}
      </div>

      {/* Agents */}
      <div className="agent-panel__agents">
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={agentStatuses[agent.id] || AGENT_STATUS.IDLE}
            isActive={activeAgent === agent.id}
            onClick={() => onAgentClick?.(agent.id)}
          />
        ))}
      </div>

      {/* Start/Stop Interview Button */}
      <div className="agent-panel__controls">
        {!isInterviewActive ? (
          <button className="agent-panel__start-btn" onClick={onStartInterview}>
            <Play size={18} />
            Start Interview
          </button>
        ) : (
          <button className="agent-panel__stop-btn" onClick={onStopInterview}>
            <Square size={18} />
            End Interview
          </button>
        )}
      </div>

      {/* Instructions */}
      {!isInterviewActive && (
        <div className="agent-panel__instructions">
          <p>Click "Start Interview" to begin voice conversation with the panel.</p>
        </div>
      )}

      {/* Voice transcript when listening */}
      {isInterviewActive && currentTranscript && (
        <div className="agent-panel__transcript">
          <div className="agent-panel__transcript-label">You're saying:</div>
          <div className="agent-panel__transcript-text">{currentTranscript}</div>
        </div>
      )}

      {/* Voice indicator when interview is active */}
      {isInterviewActive && !currentTranscript && (
        <div className="agent-panel__voice-hint">
          <Mic size={16} />
          <span>Speak to respond to the interviewers</span>
        </div>
      )}
    </div>
  );
}

export default AgentPanel;
