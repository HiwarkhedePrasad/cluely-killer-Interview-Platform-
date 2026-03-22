import { useState, useCallback, useRef, useEffect } from 'react';
import { AGENTS, AGENT_STATUS } from '../components/AgentPanel';
import { getAgentVoiceConfig, getAgentPrompt, getAgentIntroduction } from '../services/agents';
import { chat } from '../services/ollama';
import { createSession, appendTranscriptEntry, endSession } from '../services/interviewBackend';

/**
 * Hook for managing multi-agent voice interviews
 * Handles STT, TTS with distinct voices, and agent coordination
 */
export function useAgentVoice(model = 'llama3') {
  // Agent states
  const [agentStatuses, setAgentStatuses] = useState({
    peer: AGENT_STATUS.IDLE,
    teamLead: AGENT_STATUS.IDLE,
    veteran: AGENT_STATUS.IDLE
  });
  const [activeAgent, setActiveAgent] = useState(null);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  
  // Conversation state
  const [conversationHistory, setConversationHistory] = useState({
    peer: [],
    teamLead: [],
    veteran: []
  });
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [candidateData, setCandidateData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  
  // Refs
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const agentVoicesRef = useRef({});
  const isListeningRef = useRef(false);
  const isInterviewActiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  const agentSpeakingRef = useRef(false);
  const userStartedSpeakingRef = useRef(false);
  const handleTranscriptCompleteRef = useRef(null);
  const sessionIdRef = useRef(null);
  const sessionStartTimeRef = useRef(null);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isInterviewActiveRef.current = isInterviewActive;
  }, [isInterviewActive]);

  // Load TTS voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Assign distinct voices to agents
        const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
        if (englishVoices.length >= 3) {
          agentVoicesRef.current = {
            peer: englishVoices[0],
            teamLead: englishVoices[1] || englishVoices[0],
            veteran: englishVoices[2] || englishVoices[0]
          };
        } else if (englishVoices.length > 0) {
          // Use same voice with different configs
          agentVoicesRef.current = {
            peer: englishVoices[0],
            teamLead: englishVoices[0],
            veteran: englishVoices[0]
          };
        }
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      speechSynthesis?.cancel();
    };
  }, []);

  /**
   * Update a single agent's status
   */
  const setAgentStatus = useCallback((agentId, status) => {
    setAgentStatuses(prev => ({ ...prev, [agentId]: status }));
  }, []);

  /**
   * Speak text as a specific agent
   */
  const speakAsAgent = useCallback((agentId, text) => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Get agent voice config
      const voiceConfig = getAgentVoiceConfig(agentId);
      const voice = agentVoicesRef.current[agentId];
      
      if (voice) utterance.voice = voice;
      utterance.rate = voiceConfig.rate || 1.0;
      utterance.pitch = voiceConfig.pitch || 1.0;
      
      utterance.onstart = () => {
        agentSpeakingRef.current = true;
        setIsSpeaking(true);
        setAgentStatus(agentId, AGENT_STATUS.SPEAKING);
        setActiveAgent(agentId);
      };
      
      utterance.onend = () => {
        agentSpeakingRef.current = false;
        setIsSpeaking(false);
        setAgentStatus(agentId, AGENT_STATUS.IDLE);
        resolve();
      };

      utterance.onerror = () => {
        agentSpeakingRef.current = false;
        setIsSpeaking(false);
        setAgentStatus(agentId, AGENT_STATUS.IDLE);
        resolve();
      };
      
      speechSynthesis.speak(utterance);
    });
  }, [setAgentStatus]);

  /**
   * Get AI response from agent
   */
  const getAgentResponse = useCallback(async (agentId, userMessage) => {
    setAgentStatus(agentId, AGENT_STATUS.THINKING);
    
    const systemPrompt = getAgentPrompt(agentId, candidateData, conversationHistory);
    const history = conversationHistory[agentId] || [];
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ];
    
    try {
      const response = await chat({
        model,
        messages,
        stream: false
      });
      
      // Update conversation history
      setConversationHistory(prev => ({
        ...prev,
        [agentId]: [
          ...prev[agentId],
          { role: 'user', content: userMessage },
          { role: 'assistant', content: response }
        ]
      }));
      
      return response;
    } catch (error) {
      console.error(`Agent ${agentId} failed to respond:`, error);
      return "I'm having trouble responding right now. Let me try again.";
    } finally {
      setAgentStatus(agentId, AGENT_STATUS.IDLE);
    }
  }, [candidateData, conversationHistory, model, setAgentStatus]);

  /**
   * Initialize speech recognition with improved settings for better accuracy
   */
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    
    // Optimized settings for best accuracy
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5; // More alternatives = better accuracy
    
    // Add grammar hints if supported (helps with technical terms)
    if (recognition.grammars) {
      const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
      if (SpeechGrammarList) {
        const grammarList = new SpeechGrammarList();
        // Common technical terms
        const grammar = '#JSGF V1.0; grammar tech; public <tech> = react | javascript | typescript | python | database | api | frontend | backend ;';
        grammarList.addFromString(grammar, 1);
        recognition.grammars = grammarList;
      }
    }
    
    let finalTranscript = '';
    let interimTranscript = '';
    let silenceTimeout = null;

    // Cut agent speech when user starts talking
    const interruptAgentIfSpeaking = () => {
      if (agentSpeakingRef.current) {
        speechSynthesis.cancel();
        agentSpeakingRef.current = false;
        setIsSpeaking(false);
        setActiveAgent(null);
        // Reset all agent statuses to listening
        Object.keys(AGENTS).forEach(id => {
          setAgentStatus(id, AGENT_STATUS.LISTENING);
        });
      }
    };

    recognition.onresult = (event) => {
      interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        // Use the most confident alternative
        const result = event.results[i];
        let bestTranscript = result[0].transcript;
        let bestConfidence = result[0].confidence;

        // Check all alternatives for better confidence
        for (let j = 1; j < result.length; j++) {
          if (result[j].confidence > bestConfidence) {
            bestTranscript = result[j].transcript;
            bestConfidence = result[j].confidence;
          }
        }

        if (result.isFinal) {
          finalTranscript += bestTranscript + ' ';

          // Only process after user has started speaking
          if (!userStartedSpeakingRef.current && bestTranscript.trim()) {
            userStartedSpeakingRef.current = true;
            interruptAgentIfSpeaking();
          }

          // Clear silence timeout and set new one only after user started
          clearTimeout(silenceTimeout);
          if (userStartedSpeakingRef.current) {
            silenceTimeout = setTimeout(() => {
              if (finalTranscript.trim()) {
                // User has stopped speaking, process the transcript
                if (handleTranscriptCompleteRef.current) {
                  void handleTranscriptCompleteRef.current(finalTranscript.trim());
                }
                finalTranscript = '';
                interimTranscript = '';
                userStartedSpeakingRef.current = false;
                setCurrentTranscript('');
              }
            }, 1500); // 1.5 seconds of silence after user started speaking
          }
        } else {
          // Interim result - user is still speaking
          if (!userStartedSpeakingRef.current && bestTranscript.trim()) {
            userStartedSpeakingRef.current = true;
            interruptAgentIfSpeaking();
          }
          interimTranscript += bestTranscript;
        }
      }

      // Show both final and interim for live feedback
      const fullTranscript = (finalTranscript + interimTranscript).trim();
      setCurrentTranscript(fullTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle specific errors gracefully
      switch (event.error) {
        case 'no-speech':
          // User didn't speak, just restart
          console.log('No speech detected, continuing to listen...');
          break;
        case 'audio-capture':
          console.error('No microphone detected');
          isListeningRef.current = false;
          setIsListening(false);
          break;
        case 'not-allowed':
          console.error('Microphone permission denied');
          isListeningRef.current = false;
          setIsListening(false);
          break;
        case 'network':
          console.error('Network error, speech recognition unavailable');
          setTimeout(() => {
            if (isListeningRef.current && !isProcessingRef.current) {
              console.log('Retrying speech recognition...');
              try {
                recognition.start();
              } catch (e) {
                if (!String(e?.message || '').includes('already started')) {
                  console.error('Retry failed:', e);
                }
              }
            }
          }, 2000);
          break;
        default:
          console.error('Unknown error:', event.error);
          isListeningRef.current = false;
          setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still in listening mode
      if (isListeningRef.current && !isProcessingRef.current) {
        console.log('Recognition ended, restarting...');
        try {
          recognition.start();
        } catch (e) {
          // Ignore "already started" errors
          if (!e.message.includes('already started')) {
            console.error('Error restarting recognition:', e);
            isListeningRef.current = false;
            setIsListening(false);
          }
        }
      }
    };

    return recognition;
  }, []);

  /**
   * Handle completed transcript (when user stops speaking)
   */
  const handleTranscriptComplete = useCallback(async (transcript) => {
    if (!transcript || transcript.length < 3) return;
    if (!isInterviewActiveRef.current || isProcessingRef.current) return;

    console.log('Complete transcript:', transcript);
    isProcessingRef.current = true;

    // Timestamp relative to session start
    const timestampMs = sessionStartTimeRef.current
      ? Date.now() - sessionStartTimeRef.current
      : 0;

    try {
      // Log candidate answer to backend
      if (sessionIdRef.current) {
        void appendTranscriptEntry(
          sessionIdRef.current,
          'candidate',
          'Candidate',
          'candidate',
          transcript,
          timestampMs
        ).catch((e) => console.error('Failed to log candidate answer:', e));
      }

      // Pause listening while model is thinking and speaking
      if (recognitionRef.current && isListeningRef.current) {
        recognitionRef.current.stop();
      }
      isListeningRef.current = false;
      setIsListening(false);

      // Reset statuses
      Object.keys(AGENTS).forEach(id => {
        setAgentStatus(id, AGENT_STATUS.IDLE);
      });

      // Pick a random agent to respond
      const agentIds = Object.keys(AGENTS);
      let selectedAgent = agentIds[Math.floor(Math.random() * agentIds.length)];

      // 30% chance for a different agent to follow up
      if (activeAgent && Math.random() < 0.3) {
        const otherAgents = agentIds.filter(id => id !== activeAgent);
        selectedAgent = otherAgents[Math.floor(Math.random() * otherAgents.length)];
      }

      const agentName = AGENTS[selectedAgent]?.name || selectedAgent;

      // Get response and speak it back
      const response = await getAgentResponse(selectedAgent, transcript);
      if (response && response.trim()) {
        // Log agent response to backend
        if (sessionIdRef.current) {
          const responseTimestampMs = sessionStartTimeRef.current
            ? Date.now() - sessionStartTimeRef.current
            : 0;
          void appendTranscriptEntry(
            sessionIdRef.current,
            selectedAgent,
            agentName,
            'agent',
            response,
            responseTimestampMs
          ).catch((e) => console.error('Failed to log agent response:', e));
        }
        await speakAsAgent(selectedAgent, response);
      }
    } catch (error) {
      console.error('Failed to process transcript:', error);
    } finally {
      setCurrentTranscript('');
      isProcessingRef.current = false;

      // Resume listening for the next turn
      if (isInterviewActiveRef.current && recognitionRef.current) {
        userStartedSpeakingRef.current = false;
        try {
          recognitionRef.current.start();
          isListeningRef.current = true;
          setIsListening(true);
          Object.keys(AGENTS).forEach(id => {
            setAgentStatus(id, AGENT_STATUS.LISTENING);
          });
        } catch (e) {
          if (!String(e?.message || '').includes('already started')) {
            console.error('Failed to resume listening:', e);
          }
        }
      }
    }
  }, [activeAgent, getAgentResponse, setAgentStatus, speakAsAgent]);

  useEffect(() => {
    handleTranscriptCompleteRef.current = handleTranscriptComplete;
  }, [handleTranscriptComplete]);

  /**
   * Start listening to candidate
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    
    if (recognitionRef.current) {
      setCurrentTranscript('');
      try {
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
      } catch (e) {
        if (!String(e?.message || '').includes('already started')) {
          console.error('Failed to start listening:', e);
        }
      }
      
      // Set all agents to listening
      Object.keys(AGENTS).forEach(id => {
        setAgentStatus(id, AGENT_STATUS.LISTENING);
      });
    }
  }, [initRecognition, setAgentStatus]);

  /**
   * Stop listening and process response
   */
  const stopListening = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    isListeningRef.current = false;
    setIsListening(false);
    
    const transcript = currentTranscript.trim();
    if (!transcript) return;
    
    // Reset agent statuses
    Object.keys(AGENTS).forEach(id => {
      setAgentStatus(id, AGENT_STATUS.IDLE);
    });
    
    // Pick random agent to respond (or based on context)
    const agentIds = Object.keys(AGENTS);
    const respondingAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
    
    // Get and speak response
    const response = await getAgentResponse(respondingAgent, transcript);
    await speakAsAgent(respondingAgent, response);
    
    // Clear transcript
    setCurrentTranscript('');
    
    // Maybe trigger follow-up from another agent (30% chance)
    if (Math.random() < 0.3) {
      const otherAgents = agentIds.filter(id => id !== respondingAgent);
      const followUpAgent = otherAgents[Math.floor(Math.random() * otherAgents.length)];
      
      const followUp = await getAgentResponse(followUpAgent, `Follow up on what the candidate just said: "${transcript}"`);
      await speakAsAgent(followUpAgent, followUp);
    }
    
  }, [currentTranscript, getAgentResponse, setAgentStatus, speakAsAgent]);

  /**
   * Start the interview
   */
  const startInterview = useCallback(async (candidate) => {
    setCandidateData(candidate);
    setIsInterviewActive(true);
    userStartedSpeakingRef.current = false;

    // Clear histories
    setConversationHistory({
      peer: [],
      teamLead: [],
      veteran: []
    });

    // Create backend session
    try {
      const sid = await createSession(candidate?.name || 'Candidate');
      sessionIdRef.current = sid;
      setSessionId(sid);
      sessionStartTimeRef.current = Date.now();
      console.log('[interview] Session created:', sid);
    } catch (e) {
      console.error('Failed to create session:', e);
      sessionIdRef.current = null;
    }

    // Peer introduces first
    const intro = getAgentIntroduction('peer', candidate?.name);

    // Log agent introduction to backend
    if (sessionIdRef.current) {
      const ts = sessionStartTimeRef.current ? Date.now() - sessionStartTimeRef.current : 0;
      void appendTranscriptEntry(
        sessionIdRef.current,
        'peer',
        AGENTS['peer']?.name || 'Alex',
        'agent',
        intro,
        ts
      ).catch((e) => console.error('Failed to log intro:', e));
    }

    await speakAsAgent('peer', intro);

    // Start listening
    startListening();
  }, [speakAsAgent, startListening]);

  /**
   * End the interview
   * @param {number} [durationSeconds] - optional, will calculate from sessionStartTime if not provided
   */
  const endInterview = useCallback(async (durationSeconds) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    speechSynthesis?.cancel();

    // End backend session
    if (sessionIdRef.current) {
      const duration = durationSeconds ?? (sessionStartTimeRef.current
        ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
        : 0);
      try {
        await endSession(sessionIdRef.current, duration);
        console.log('[interview] Session ended:', sessionIdRef.current, 'duration:', duration, 's');
      } catch (e) {
        console.error('Failed to end session:', e);
      }
      sessionIdRef.current = null;
      sessionStartTimeRef.current = null;
      setSessionId(null);
    }

    setIsInterviewActive(false);
    isInterviewActiveRef.current = false;
    isListeningRef.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    setActiveAgent(null);

    Object.keys(AGENTS).forEach(id => {
      setAgentStatus(id, AGENT_STATUS.IDLE);
    });
  }, [setAgentStatus]);

  /**
   * Send a message to the currently active agent or pick a random one
   */
  const sendToActiveAgent = useCallback(async (message) => {
    const agentToUse = activeAgent || Object.keys(AGENTS)[Math.floor(Math.random() * Object.keys(AGENTS).length)];
    
    const response = await getAgentResponse(agentToUse, message);
    await speakAsAgent(agentToUse, response);
    
    return response;
  }, [activeAgent, getAgentResponse, speakAsAgent]);

  /**
   * Manually trigger a specific agent to ask a question
   */
  const triggerAgent = useCallback(async (agentId, prompt = 'Ask your next question based on the conversation so far.') => {
    const response = await getAgentResponse(agentId, prompt);
    await speakAsAgent(agentId, response);
  }, [getAgentResponse, speakAsAgent]);

  return {
    // State
    agentStatuses,
    activeAgent,
    isInterviewActive,
    isListening,
    isSpeaking,
    currentTranscript,
    conversationHistory,
    candidateData,

    // Session
    sessionId,

    // Actions
    startInterview,
    endInterview,
    startListening,
    stopListening,
    triggerAgent,
    sendToActiveAgent,
    speakAsAgent,
    setCandidateData,

    // Utilities
    voices
  };
}

export default useAgentVoice;
