import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  Play, Code2, PhoneOff, Users, Clock, Settings,
  Maximize2, Minimize2, ChevronRight, Terminal,
  FileText, CheckCircle2, XCircle, AlertCircle,
  MessageSquare, X, GripVertical, Bot, PanelRightClose, PanelRight
} from 'lucide-react';
import './App.css';
import { AgentPanel } from './components/AgentPanel';
import { InterviewSetup } from './components/InterviewSetup';
import { useAgentVoice } from './hooks/useAgentVoice';
import { useWorkspaceResize } from './hooks/useResize';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'typescript', label: 'TypeScript', monaco: 'typescript' },
  { id: 'java', label: 'Java', monaco: 'java' },
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
  { id: 'go', label: 'Go', monaco: 'go' },
  { id: 'rust', label: 'Rust', monaco: 'rust' },
];

const DEFAULT_CODE = {
  javascript: `// Two Sum Problem
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test
console.log(twoSum([2, 7, 11, 15], 9));
console.log(twoSum([3, 2, 4], 6));
`,
  python: `# Two Sum Problem
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test
print(two_sum([2, 7, 11, 15], 9))
print(two_sum([3, 2, 4], 6))
`,
  typescript: `// Two Sum Problem
function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9));
`,
  java: `// Two Sum Problem
import java.util.*;

class Solution {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}
`,
  cpp: `// Two Sum Problem
#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.count(complement)) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};
`,
  go: `// Two Sum Problem
package main

import "fmt"

func twoSum(nums []int, target int) []int {
    m := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := m[complement]; ok {
            return []int{j, i}
        }
        m[num] = i
    }
    return []int{}
}

func main() {
    fmt.Println(twoSum([]int{2, 7, 11, 15}, 9))
}
`,
  rust: `// Two Sum Problem
use std::collections::HashMap;

fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
    let mut map = HashMap::new();
    for (i, &num) in nums.iter().enumerate() {
        let complement = target - num;
        if let Some(&j) = map.get(&complement) {
            return vec![j as i32, i as i32];
        }
        map.insert(num, i);
    }
    vec![]
}

fn main() {
    println!("{:?}", two_sum(vec![2, 7, 11, 15], 9));
}
`,
};

const SAMPLE_QUESTIONS = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    testCases: [
      { input: [2, 7, 11, 15], target: 9, expected: [0, 1] },
      { input: [3, 2, 4], target: 6, expected: [1, 2] },
      { input: [3, 3], target: 6, expected: [0, 1] },
    ],
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: 'Given a string `s` containing just the characters \'(\', \')\', \'{\', \'}\', \'[\', \']\', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    testCases: [],
  },
  {
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
    ],
    testCases: [],
  },
];

/* ═══════════════════════════════════════════════════════════
   TIMER HOOK
   ═══════════════════════════════════════════════════════════ */

const INTERVIEW_DURATION_SECS = 20 * 60; // 20 minutes
const LAST_MINUTE_SECS = 60;

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);
  const [running, setRunning] = useState(false);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setSeconds(0);
  }, []);

  const format = useCallback(() => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [seconds]);

  const remaining = INTERVIEW_DURATION_SECS - seconds;
  const isLastMinute = running && remaining > 0 && remaining <= LAST_MINUTE_SECS;
  const isTimeUp = seconds >= INTERVIEW_DURATION_SECS;

  return { seconds, running, start, stop, reset, format, remaining, isLastMinute, isTimeUp };
}

/* ═══════════════════════════════════════════════════════════
   CAMERA / MIC HOOK
   ═══════════════════════════════════════════════════════════ */

function useCamera() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error('Camera access error:', err);
      setError(err.message || 'Camera access denied');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const toggleVideo = useCallback((enabled) => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = enabled;
      });
    }
  }, []);

  const toggleAudio = useCallback((enabled) => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = enabled;
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return { stream, error, startCamera, stopCamera, toggleVideo, toggleAudio };
}

/* ═══════════════════════════════════════════════════════════
   VIDEO FEED COMPONENT — renders a MediaStream into <video>
   ═══════════════════════════════════════════════════════════ */

function VideoFeed({ stream, muted = true, className = '', style = {} }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)',
        ...style,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   VIDEO CALL SCREEN (Full-screen, default view)
   ═══════════════════════════════════════════════════════════ */

function VideoCallScreen({
  onToggleCoding, videoOn, setVideoOn, micOn, setMicOn, screenShare, setScreenShare,
  timer, stream, candidateData, agentVoice, showAgentPanel, setShowAgentPanel,
  isPendingTransition = false
}) {
  const isLastMinute = timer.isLastMinute;
  const timerColor = isLastMinute ? 'var(--color-status-error)' : '#fff';
  const timerPulse = isLastMinute;
  return (
    <div className={`video-fullscreen video-fullscreen--with-agents${isPendingTransition ? ' video-fullscreen--transitioning' : ''}`}>
      {/* Main content area */}
      <div className="video-fullscreen__main">
        {/* Candidate video */}
        <div className="video-fullscreen__candidate">
          {stream && videoOn ? (
            <VideoFeed stream={stream} muted={true} />
          ) : (
            <div className="video-fullscreen__avatar video-fullscreen__avatar--large">
              <Users size={64} />
            </div>
          )}
          <div className="video-fullscreen__name">
            <span className="type-label" style={{ color: '#fff', textTransform: 'none', letterSpacing: 'normal' }}>
              {candidateData?.name || 'Candidate'}
            </span>
          </div>
          {!videoOn && (
            <div className="video-fullscreen__camera-off">
              <VideoOff size={32} />
              <span className="type-caption">Camera Off</span>
            </div>
          )}
        </div>
      </div>

      {/* Agent Panel on the right */}
      {showAgentPanel && (
        <div className="video-fullscreen__agents">
          <AgentPanel
            agentStatuses={agentVoice?.agentStatuses || {}}
            activeAgent={agentVoice?.activeAgent}
            isInterviewActive={agentVoice?.isInterviewActive || false}
            currentTranscript={agentVoice?.currentTranscript || ''}
            onStartInterview={() => agentVoice?.startInterview(candidateData)}
            onStopInterview={() => agentVoice?.stopListening()}
          />
        </div>
      )}

      {/* Top bar overlay */}
      <div className="video-fullscreen__topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-gap-sm)' }}>
          <Code2 size={18} style={{ color: 'var(--color-text-accent)' }} />
          <span className="type-label" style={{ color: '#fff', textTransform: 'uppercase', letterSpacing: 'var(--type-tracking-wide)' }}>Interview</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-gap-md)' }}>
          <span className="status-dot status-dot--live" />
          <span className="type-caption" style={{ color: 'var(--color-status-success)' }}>Live</span>
          <span className="divider--vertical" style={{ height: '16px' }} />
          <Clock size={14} style={{ color: isLastMinute ? 'var(--color-status-error)' : 'var(--color-text-tertiary)' }} />
          <span
            className={`type-mono ${timerPulse ? 'timer-warning' : ''}`}
            style={{ color: timerColor, fontWeight: timerPulse ? 700 : 400 }}
          >
            {timer.format()}
          </span>
        </div>
      </div>

      {/* Last minute warning banner */}
      {isLastMinute && (
        <div className="last-minute-banner">
          <AlertCircle size={16} />
          <span>Last minute — finish your current answer</span>
        </div>
      )}

      {/* Bottom controls */}
      <div className="video-fullscreen__controls">
        <div className="video-fullscreen__controls-group">
          <button
            className={`video-ctrl-btn ${!micOn ? 'video-ctrl-btn--off' : ''}`}
            onClick={() => setMicOn(!micOn)}
            title={micOn ? 'Mute' : 'Unmute'}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            className={`video-ctrl-btn ${!videoOn ? 'video-ctrl-btn--off' : ''}`}
            onClick={() => setVideoOn(!videoOn)}
            title={videoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            className={`video-ctrl-btn ${screenShare ? 'video-ctrl-btn--active' : ''}`}
            onClick={() => setScreenShare(!screenShare)}
            title={screenShare ? 'Stop sharing' : 'Share screen'}
          >
            {screenShare ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>

          <span className="video-controls-divider" />

          <button
            className={`video-ctrl-btn video-ctrl-btn--code ${isPendingTransition ? 'video-ctrl-btn--transitioning' : ''}`}
            onClick={isPendingTransition ? undefined : onToggleCoding}
            title={isPendingTransition ? 'Switching to coding...' : 'Open coding environment'}
            disabled={isPendingTransition}
          >
            <Code2 size={20} />
            <span>{isPendingTransition ? 'Switching...' : 'Start Coding'}</span>
          </button>

          <span className="video-controls-divider" />

          <button className="video-ctrl-btn video-ctrl-btn--end" title="End interview">
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PIP VIDEO — DRAGGABLE (corner video during coding mode)
   ═══════════════════════════════════════════════════════════ */

function PipVideo({ onExpand, videoOn, micOn, stream }) {
  const pipRef = useRef(null);
  const [pos, setPos] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const rect = pipRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
  }, []);

  React.useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      const maxX = window.innerWidth - 270;
      const maxY = window.innerHeight - 200;
      setPos({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging]);

  const style = {
    ...(pos.x !== null ? { left: pos.x, top: pos.y, right: 'auto' } : {}),
    cursor: dragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={pipRef}
      className={`pip-video ${dragging ? 'pip-video--dragging' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      <div className="pip-video__drag-handle">
        <GripVertical size={14} />
      </div>
      {/* Interviewer — placeholder */}
      <div className="pip-video__feed pip-video__feed--main">
        <div className="video-fullscreen__avatar" style={{ transform: 'scale(0.6)' }}>
          <Users size={24} />
        </div>
        <span className="pip-video__label">Interviewer</span>
        <div className="pip-video__mic-status">
          <Mic size={10} />
        </div>
      </div>
      {/* Self — live camera */}
      <div className="pip-video__feed pip-video__feed--self">
        {stream && videoOn ? (
          <VideoFeed stream={stream} muted={true} style={{ borderRadius: 0 }} />
        ) : (
          <>
            <div className="video-fullscreen__avatar" style={{ transform: 'scale(0.5)' }}>
              <Users size={16} />
            </div>
            {!videoOn && <VideoOff size={12} style={{ color: 'var(--color-status-error)', position: 'absolute' }} />}
          </>
        )}
      </div>
      <button className="pip-video__expand" onClick={onExpand} title="Expand video">
        <Maximize2 size={12} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CODING WORKSPACE
   ═══════════════════════════════════════════════════════════ */

function CodingWorkspace({
  language, setLanguage,
  code, setCode,
  activeQuestion, setActiveQuestion,
  questions,
  onRun, output, testResults, isRunning,
  activeTab, setActiveTab,
  onBackToVideo,
  videoOn, micOn, setVideoOn, setMicOn,
  timer, stream,
  showAgentPanel, setShowAgentPanel,
  candidateData,
  agentVoice,
  sidebarWidth,
  sidebarOnMouseDown,
  bottomHeight,
  bottomOnMouseDown,
}) {
  const editorRef = useRef(null);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <div className="app-shell">
      {/* Topbar */}
      <div className="app-topbar">
        <div className="app-topbar__section">
          <Code2 size={18} style={{ color: 'var(--color-text-accent)' }} />
          <span className="type-label" style={{ letterSpacing: 'var(--type-tracking-wide)', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
            AI Interview
          </span>
          <span className="divider--vertical" style={{ height: '20px' }} />
          <span className="badge badge-info">{LANGUAGES.find(l => l.id === language)?.label}</span>
        </div>
        <div className="app-topbar__section">
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-gap-xs)' }}>
            <span className="status-dot status-dot--live" />
            <span className="type-caption" style={{ color: 'var(--color-status-success)' }}>Live</span>
          </span>
          <span className="divider--vertical" style={{ height: '20px' }} />
          <Clock size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <span className="type-mono" style={{ color: 'var(--color-text-secondary)' }}>{timer.format()}</span>
          <span className="divider--vertical" style={{ height: '20px' }} />

          <button className="btn-icon" onClick={() => setMicOn(!micOn)} title={micOn ? 'Mute' : 'Unmute'}
            style={!micOn ? { color: 'var(--color-status-error)' } : {}}>
            {micOn ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
          <button className="btn-icon" onClick={() => setVideoOn(!videoOn)} title={videoOn ? 'Camera off' : 'Camera on'}
            style={!videoOn ? { color: 'var(--color-status-error)' } : {}}>
            {videoOn ? <Video size={16} /> : <VideoOff size={16} />}
          </button>
          <span className="divider--vertical" style={{ height: '20px' }} />

          {/* Agent Panel Toggle */}
          <button
            className={`btn-icon ${showAgentPanel ? 'btn-icon--active' : ''}`}
            onClick={() => setShowAgentPanel(!showAgentPanel)}
            title={showAgentPanel ? 'Hide Agents' : 'Show Agents'}
            style={showAgentPanel ? { color: 'var(--color-text-primary)', background: 'var(--color-primary-alpha)' } : {}}
          >
            {showAgentPanel ? <PanelRightClose size={16} /> : <Bot size={16} />}
          </button>

          <button className="btn-icon" onClick={onBackToVideo} title="Back to video view">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="workspace">
        {/* Sidebar — Questions (resizable) */}
        <div
          className="workspace-sidebar no-select"
          style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
        >
          <div className="questions-list">
            <div className="panel-header" style={{ border: 'none', padding: '0 0 var(--space-gap-sm) 0' }}>
              <span className="type-label">Problems</span>
              <span className="badge badge-info">{questions.length}</span>
            </div>
            {questions.map((q, i) => (
              <div
                key={i}
                className={`question-card ${i === activeQuestion ? 'question-card--active' : ''}`}
                onClick={() => setActiveQuestion(i)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="question-card__number">Q{i + 1}</div>
                  <span className={`badge ${q.difficulty === 'Easy' ? 'badge-success' : q.difficulty === 'Medium' ? 'badge-warning' : 'badge-error'}`}>
                    {q.difficulty}
                  </span>
                </div>
                <div className="question-card__title truncate">{q.title}</div>
              </div>
            ))}
          </div>

          {/* Problem Detail */}
          <div className="divider" style={{ margin: '0 var(--space-gap-md)' }} />
          <div className="question-detail">
            <h3 className="type-subheading" style={{ marginBottom: 'var(--space-gap-md)' }}>
              {questions[activeQuestion]?.title}
            </h3>
            <div className="type-body" style={{ fontSize: 'var(--type-size-label)', whiteSpace: 'pre-wrap' }}>
              {questions[activeQuestion]?.description}
            </div>
            {questions[activeQuestion]?.examples?.length > 0 && (
              <div style={{ marginTop: 'var(--space-gap-lg)' }}>
                <span className="type-label" style={{ marginBottom: 'var(--space-gap-sm)', display: 'block' }}>Examples</span>
                {questions[activeQuestion].examples.map((ex, i) => (
                  <div key={i} className="example-block">
                    <div className="type-mono" style={{ color: 'var(--color-text-secondary)' }}>
                      <strong>Input:</strong> {ex.input}
                    </div>
                    <div className="type-mono" style={{ color: 'var(--color-text-secondary)' }}>
                      <strong>Output:</strong> {ex.output}
                    </div>
                    {ex.explanation && (
                      <div className="type-caption" style={{ color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vertical resize handle (sidebar ↔ editor) */}
        <div
          className="resize-handle resize-handle--vertical"
          onMouseDown={sidebarOnMouseDown}
        />

        {/* Main — Editor + Output */}
        <div className="workspace-main" style={{ flex: 1 }}>
          {/* Editor Toolbar */}
          <div className="editor-toolbar">
            <div className="editor-toolbar__group">
              <select
                className="lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="editor-toolbar__group">
              <button className="btn btn-primary text-black btn-sm" onClick={onRun} disabled={isRunning}>
                {isRunning ? (
                  <>
                    <span className="spinner" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Run Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="workspace-editor">
            <Editor
              height="100%"
              language={LANGUAGES.find(l => l.id === language)?.monaco || 'javascript'}
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                padding: { top: 16, bottom: 16 },
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                scrollBeyondLastLine: false,
                bracketPairColorization: { enabled: true },
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>

          {/* Horizontal resize handle (editor ↔ bottom) */}
          <div
            className="resize-handle"
            onMouseDown={bottomOnMouseDown}
          />

          {/* Output Panel (resizable) */}
          <div className="workspace-bottom" style={{ height: bottomHeight, minHeight: bottomHeight, maxHeight: bottomHeight }}>
            <div className="workspace-bottom__tabs">
              {['Output', 'Test Results'].map((tab) => (
                <button
                  key={tab}
                  className={`workspace-bottom__tab ${activeTab === tab ? 'workspace-bottom__tab--active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'Output' && <Terminal size={12} style={{ marginRight: '4px' }} />}
                  {tab === 'Test Results' && <CheckCircle2 size={12} style={{ marginRight: '4px' }} />}
                  {tab}
                </button>
              ))}
            </div>
            <div className="workspace-bottom__content">
              {activeTab === 'Output' && (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                  {output || '// Run your code to see output here...'}
                </pre>
              )}
              {activeTab === 'Test Results' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gap-sm)' }}>
                  {testResults.length === 0 ? (
                    <span className="type-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                      Run your code to see test results...
                    </span>
                  ) : (
                    testResults.map((r, i) => (
                      <div key={i} className="test-result-row">
                        {r.passed ? (
                          <CheckCircle2 size={16} style={{ color: 'var(--color-status-success)', flexShrink: 0 }} />
                        ) : (
                          <XCircle size={16} style={{ color: 'var(--color-status-error)', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <span className="type-caption" style={{ fontWeight: 'var(--type-weight-medium)' }}>
                            Test Case {i + 1}
                          </span>
                          {!r.passed && r.detail && (
                            <div className="type-caption" style={{ color: 'var(--color-status-error)', marginTop: '2px' }}>
                              Expected: {r.detail}
                            </div>
                          )}
                        </div>
                        <span className={`badge ${r.passed ? 'badge-success' : 'badge-error'}`}>
                          {r.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agent Panel */}
        {showAgentPanel && (
          <div className="workspace-agent-panel">
            <AgentPanel
              agentStatuses={agentVoice?.agentStatuses || {}}
              activeAgent={agentVoice?.activeAgent}
              isInterviewActive={agentVoice?.isInterviewActive || false}
              currentTranscript={agentVoice?.currentTranscript || ''}
              onStartInterview={() => agentVoice?.startInterview(candidateData)}
              onStopInterview={() => agentVoice?.stopListening()}
            />
          </div>
        )}

        {/* PiP Video */}
        <PipVideo
          onExpand={onBackToVideo}
          videoOn={videoOn}
          micOn={micOn}
          stream={stream}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REPORT DOWNLOAD HELPER
   ═══════════════════════════════════════════════════════════ */

function buildReportHTML(report, candidateData) {
  const avgScore = report.qa_analysis.length > 0
    ? (report.qa_analysis.reduce((sum, qa) => sum + qa.quality_score, 0) / report.qa_analysis.length).toFixed(1)
    : 'N/A';

  const qaRows = report.qa_analysis.map((qa, idx) => `
    <div class="qa-item">
      <div class="qa-header">
        <span class="badge">${qa.topic}</span>
        <span class="score">${qa.quality_score}/10</span>
      </div>
      <p class="question"><strong>Q${idx + 1}:</strong> ${qa.question}</p>
      <p class="answer"><strong>Your Answer:</strong> ${qa.candidate_answer || '<em>No answer provided</em>'}</p>
      <p class="preferred"><strong>Preferred Answer:</strong> ${qa.preferred_answer}</p>
      <p class="feedback ${qa.quality_score >= 7 ? 'good' : 'warn'}">${qa.feedback}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Interview Report — ${candidateData?.name || 'Candidate'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0e0e0e; color: #e0e0e0; padding: 40px; line-height: 1.6; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 1.8rem; margin-bottom: 8px; color: #fff; }
  h2 { font-size: 1.2rem; margin: 28px 0 12px; color: #fff; border-bottom: 1px solid #2c2c2c; padding-bottom: 8px; }
  .meta { color: #888; font-size: 0.9rem; margin-bottom: 32px; }
  .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .card { background: #1a1a1a; border: 1px solid #2c2c2c; border-radius: 10px; padding: 20px; text-align: center; }
  .card.big .val { font-size: 2.5rem; font-weight: 700; color: #7c6af7; font-family: monospace; }
  .card .val { font-size: 1.8rem; font-weight: 600; color: #fff; font-family: monospace; }
  .card .lbl { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-top: 4px; }
  .section { margin-bottom: 32px; }
  ul { list-style: none; padding: 0; }
  ul li { padding: 6px 0; display: flex; align-items: flex-start; gap: 8px; color: #aaa; }
  .qalist { display: flex; flex-direction: column; gap: 20px; }
  .qa-item { background: #1a1a1a; border: 1px solid #2c2c2c; border-radius: 10px; padding: 20px; }
  .qa-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .badge { background: #2a2a3a; color: #a0a0d0; padding: 3px 10px; border-radius: 20px; font-size: 0.8rem; }
  .score { font-family: monospace; font-weight: 600; color: #a0a0d0; }
  .question { color: #fff; margin-bottom: 10px; }
  .answer, .preferred { color: #999; font-size: 0.9rem; margin-bottom: 8px; }
  .preferred { background: #141420; border-radius: 6px; padding: 10px; border-left: 3px solid #7c6af7; }
  .feedback { font-size: 0.85rem; padding: 8px 12px; border-radius: 6px; }
  .feedback.good { background: rgba(34,197,94,0.1); color: #4ade80; border-left: 3px solid #22c55e; }
  .feedback.warn { background: rgba(250,204,21,0.1); color: #facc15; border-left: 3px solid #eab308; }
  .strengths-grid, .weaknesses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .str-card, .weak-card { background: #1a1a1a; border-radius: 8px; padding: 14px; display: flex; gap: 10px; align-items: flex-start; }
  .str-card { border-left: 3px solid #22c55e; }
  .weak-card { border-left: 3px solid #ef4444; }
  .print-btn { display: inline-flex; align-items: center; gap: 8px; background: #7c6af7; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 0.9rem; cursor: pointer; margin-top: 20px; }
  @media print { body { background: #fff; color: #000; } .card { background: #f5f5f5; border-color: #ccc; } .print-btn { display: none; } }
</style>
</head>
<body>
<div class="container">
  <h1>Interview Report</h1>
  <p class="meta">${candidateData?.name || 'Candidate'} &nbsp;·&nbsp; ${report.overall_summary.match(/\d+ minutes/)?.[0] || ''} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

  <div class="summary-cards">
    <div class="card big"><div class="val">${avgScore}</div><div class="lbl">Avg Score</div></div>
    <div class="card"><div class="val">${report.qa_analysis.length}</div><div class="lbl">Questions</div></div>
    <div class="card"><div class="val">${report.strengths.length}</div><div class="lbl">Strengths</div></div>
    <div class="card"><div class="val">${report.weaknesses.length}</div><div class="lbl">Areas to Improve</div></div>
  </div>

  <div class="section">
    <h2>Overall Summary</h2>
    <p>${report.overall_summary}</p>
  </div>

  <div class="section">
    <h2>Q&amp;A Analysis</h2>
    <div class="qalist">${qaRows}</div>
  </div>

  <div class="section">
    <h2>Strengths</h2>
    <div class="strengths-grid">
      ${report.strengths.map(s => `<div class="str-card"><span style="color:#22c55e">&#10003;</span><p>${s}</p></div>`).join('')}
    </div>
  </div>

  <div class="section">
    <h2>Areas to Improve</h2>
    <div class="weaknesses-grid">
      ${report.weaknesses.map(w => `<div class="weak-card"><span style="color:#ef4444">&#10007;</span><p>${w}</p></div>`).join('')}
    </div>
  </div>

  <div class="section">
    <h2>Recommended Focus Areas</h2>
    <ul>
      ${report.recommended_focus_areas.map(a => `<li>&#9679; ${a}</li>`).join('')}
    </ul>
  </div>

  <button class="print-btn" onclick="window.print()">&#128439; Print / Save as PDF</button>
</div>
</body>
</html>`;
}

function downloadReport(report, candidateData) {
  const html = buildReportHTML(report, candidateData);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-report-${candidateData?.name?.replace(/\s+/g, '-').toLowerCase() || 'candidate'}-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════
   REPORT SCREEN — Post-Interview Analysis
   ═══════════════════════════════════════════════════════════ */

function ReportScreen({ report, reportLoading, candidateData, onStartNew }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedQA, setExpandedQA] = useState({});

  const toggleQA = (idx) => {
    setExpandedQA((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (reportLoading || !report) {
    return (
      <div className="report-loading">
        <div className="report-loading__spinner" />
        <h2>Generating your interview report...</h2>
        <p className="type-body">Analyzing your responses and preparing feedback.</p>
      </div>
    );
  }

  const avgScore = report.qa_analysis.length > 0
    ? (report.qa_analysis.reduce((sum, qa) => sum + qa.quality_score, 0) / report.qa_analysis.length).toFixed(1)
    : 'N/A';

  return (
    <div className="report-screen">
      {/* Header */}
      <div className="report-header">
        <div className="report-header__left">
          <Bot size={28} style={{ color: 'var(--color-action-primary)' }} />
          <div>
            <h1 className="type-heading">Interview Report</h1>
            <p className="type-body">
              {candidateData?.name || 'Candidate'} — {report.overall_summary.match(/\d+ minutes/)?.[0] || ''}
            </p>
          </div>
        </div>
        <div className="report-header__actions">
          <button className="btn btn-secondary" onClick={() => downloadReport(report, candidateData)}>
            Download Report
          </button>
          <button className="btn btn-primary" onClick={onStartNew}>
            Start New Interview
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="report-summary-cards">
        <div className="report-card report-card--score">
          <div className="report-card__value">{avgScore}</div>
          <div className="report-card__label">Avg Score</div>
        </div>
        <div className="report-card">
          <div className="report-card__value">{report.qa_analysis.length}</div>
          <div className="report-card__label">Questions</div>
        </div>
        <div className="report-card">
          <div className="report-card__value">{report.strengths.length}</div>
          <div className="report-card__label">Strengths</div>
        </div>
        <div className="report-card">
          <div className="report-card__value">{report.weaknesses.length}</div>
          <div className="report-card__label">Areas to Improve</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="report-tabs">
        {['overview', 'q&a', 'strengths', 'weaknesses'].map((tab) => (
          <button
            key={tab}
            className={`report-tab ${activeTab === tab ? 'report-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'q&a' ? 'Q&A Analysis' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="report-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="report-section">
            <h3 className="type-subheading">Overall Summary</h3>
            <p className="type-body" style={{ marginTop: 'var(--space-gap-sm)', color: 'var(--color-text-secondary)' }}>
              {report.overall_summary}
            </p>

            <h3 className="type-subheading" style={{ marginTop: 'var(--space-gap-xl)' }}>Recommended Focus Areas</h3>
            <ul className="report-list">
              {report.recommended_focus_areas.map((area, i) => (
                <li key={i}>
                  <AlertCircle size={14} style={{ color: 'var(--color-text-accent)', flexShrink: 0 }} />
                  {area}
                </li>
              ))}
            </ul>

            <h3 className="type-subheading" style={{ marginTop: 'var(--space-gap-xl)' }}>Strengths</h3>
            <ul className="report-list">
              {report.strengths.map((s, i) => (
                <li key={i}>
                  <CheckCircle2 size={14} style={{ color: 'var(--color-status-success)', flexShrink: 0 }} />
                  {s}
                </li>
              ))}
            </ul>

            <h3 className="type-subheading" style={{ marginTop: 'var(--space-gap-xl)' }}>Areas to Improve</h3>
            <ul className="report-list">
              {report.weaknesses.map((w, i) => (
                <li key={i}>
                  <XCircle size={14} style={{ color: 'var(--color-status-error)', flexShrink: 0 }} />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Q&A Tab */}
        {activeTab === 'q&a' && (
          <div className="report-qa-list">
            {report.qa_analysis.map((qa, idx) => (
              <div key={idx} className={`report-qa-card ${expandedQA[idx] ? 'report-qa-card--expanded' : ''}`}>
                <div className="report-qa-card__header" onClick={() => toggleQA(idx)}>
                  <div className="report-qa-card__meta">
                    <span className="badge badge-info">{qa.topic}</span>
                    <span className="report-qa-card__score">
                      {qa.quality_score}/10
                    </span>
                  </div>
                  <p className="report-qa-card__question">{qa.question}</p>
                  <span className="report-qa-card__toggle">
                    {expandedQA[idx] ? '▲ Collapse' : '▼ Expand'}
                  </span>
                </div>

                {expandedQA[idx] && (
                  <div className="report-qa-card__body">
                    <div className="report-qa-card__section">
                      <h4 className="type-label">Your Answer</h4>
                      <p className="type-body" style={{ color: 'var(--color-text-secondary)' }}>
                        {qa.candidate_answer || <em style={{ color: 'var(--color-text-disabled)' }}>No answer provided</em>}
                      </p>
                    </div>
                    <div className="report-qa-card__section">
                      <h4 className="type-label">Preferred Answer</h4>
                      <p className="type-body" style={{ color: 'var(--color-text-secondary)' }}>
                        {qa.preferred_answer}
                      </p>
                    </div>
                    <div className="report-qa-card__section">
                      <h4 className="type-label">Feedback</h4>
                      <p className="type-body" style={{ color: qa.quality_score >= 7 ? 'var(--color-status-success)' : 'var(--color-text-accent)' }}>
                        {qa.feedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Strengths Tab */}
        {activeTab === 'strengths' && (
          <div className="report-section">
            <h3 className="type-subheading">Your Strengths</h3>
            <div className="report-strengths-grid">
              {report.strengths.map((s, i) => (
                <div key={i} className="report-strength-card">
                  <CheckCircle2 size={20} style={{ color: 'var(--color-status-success)' }} />
                  <p className="type-body">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses Tab */}
        {activeTab === 'weaknesses' && (
          <div className="report-section">
            <h3 className="type-subheading">Areas to Focus On</h3>
            <div className="report-weaknesses-grid">
              {report.weaknesses.map((w, i) => (
                <div key={i} className="report-weakness-card">
                  <XCircle size={20} style={{ color: 'var(--color-status-error)' }} />
                  <p className="type-body">{w}</p>
                </div>
              ))}
            </div>

            <h3 className="type-subheading" style={{ marginTop: 'var(--space-gap-xl)' }}>Recommended Focus Areas</h3>
            <p className="type-body" style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-gap-md)' }}>
              Based on your interview performance, focus on improving in these areas:
            </p>
            <ul className="report-list">
              {report.recommended_focus_areas.map((area, i) => (
                <li key={i}>
                  <AlertCircle size={14} style={{ color: 'var(--color-text-accent)', flexShrink: 0 }} />
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP — Mode Controller
   ═══════════════════════════════════════════════════════════ */

function App() {
  // View mode: 'setup' (interview setup), 'video' (full-screen call), or 'coding' (workspace)
  const [mode, setMode] = useState('setup');
  // Pending mode switch — used for graceful video→coding transition
  const [pendingMode, setPendingMode] = useState(null);

  // Candidate data from interview setup
  const [candidateData, setCandidateData] = useState(null);

  // Shared state
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

  // Agent Panel visibility
  const [showAgentPanel, setShowAgentPanel] = useState(true);

  // Agent Voice system
  // Model can be switched via VITE_OLLAMA_MODEL for fast cloud models.
  const agentVoice = useAgentVoice(import.meta.env.VITE_OLLAMA_MODEL || 'llama3');

  // Camera
  const camera = useCamera();

  // Coding state
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [activeTab, setActiveTab] = useState('Output');
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const { sidebar: sidebarResize, bottomHeight: bottomResize } = useWorkspaceResize();

  // Timer
  const timer = useTimer();

  // Report state
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Interview ending state (for graceful close at 20 min)
  const interviewEndingRef = useRef(false);

  // Handle starting interview from setup
  const handleStartInterview = (data) => {
    setCandidateData(data);
    timer.reset();
    interviewEndingRef.current = false;
    setReport(null);
    setMode('video');
  };

  // Handle joining interview with code
  const handleJoinWithCode = (data) => {
    setCandidateData(data);
    setMode('video');
  };

  // Graceful transition from video → coding: fade out and wait for agent to finish speaking
  const transitionToCoding = useCallback(() => {
    setPendingMode('coding');
  }, []);

  // When pendingMode is set, wait for agent speech to finish then actually switch modes
  useEffect(() => {
    if (!pendingMode) return;

    // If agent is not currently speaking, switch immediately
    if (!agentVoice.isSpeaking) {
      // Pause interview (stop recognition) before switching modes so VoiceControls can use the mic
      agentVoice.pauseInterview();
      setMode(pendingMode);
      setPendingMode(null);
      return;
    }

    // Otherwise wait for the agent to finish, then switch
    const timeout = setTimeout(() => {
      agentVoice.pauseInterview();
      setMode(pendingMode);
      setPendingMode(null);
    }, 2000); // max wait 2s even if still speaking

    const checkInterval = setInterval(() => {
      if (!agentVoice.isSpeaking) {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        agentVoice.pauseInterview();
        setMode(pendingMode);
        setPendingMode(null);
      }
    }, 200);

    return () => {
      clearTimeout(timeout);
      clearInterval(checkInterval);
    };
  }, [pendingMode, agentVoice.isSpeaking, agentVoice]);

  // ── Interview auto-close at 20 min with graceful speech finish ──────────────────
  useEffect(() => {
    if (!timer.isTimeUp) return;
    if (mode === 'setup' || mode === 'report') return;
    if (interviewEndingRef.current) return;
    interviewEndingRef.current = true;

    // Agent is speaking → wait up to 5s for them to finish
    const waitForAgent = () => {
      const maxWait = setTimeout(() => {
        closeAndGenerateReport();
      }, 5000);

      const check = setInterval(() => {
        if (!agentVoice.isSpeaking) {
          clearTimeout(maxWait);
          clearInterval(check);
          closeAndGenerateReport();
        }
      }, 300);

      return () => {
        clearTimeout(maxWait);
        clearInterval(check);
      };
    };

    const closeAndGenerateReport = async () => {
      // Tell agents the interview is ending (they'll finish current thought)
      const duration = timer.seconds;
      timer.stop();

      // End the voice session
      if (agentVoice.isInterviewActive) {
        await agentVoice.endInterview(duration);
      }

      // Generate report
      if (agentVoice.sessionId) {
        setReportLoading(true);
        try {
          const { generateReport } = await import('./services/interviewBackend');
          const r = await generateReport(agentVoice.sessionId);
          setReport(r);
        } catch (e) {
          console.error('Failed to generate report:', e);
        } finally {
          setReportLoading(false);
        }
      }

      setMode('report');
      interviewEndingRef.current = false;
    };

    if (agentVoice.isSpeaking) {
      return waitForAgent();
    } else {
      closeAndGenerateReport();
    }
  }, [timer.isTimeUp, mode, agentVoice.isSpeaking, agentVoice.isInterviewActive, agentVoice.sessionId]);

  // Start timer + camera when entering video mode
  useEffect(() => {
    if (mode === 'video' || mode === 'coding') {
      timer.start();
      camera.startCamera();
      return () => {
        timer.stop();
        camera.stopCamera();
      };
    }
  }, [mode]);

  // Sync video track enabled state
  useEffect(() => {
    camera.toggleVideo(videoOn);
  }, [videoOn]);

  // Sync audio track enabled state
  useEffect(() => {
    camera.toggleAudio(micOn);
  }, [micOn]);

  // Switch code when language changes
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || `// Start coding in ${lang}...\n`);
  };

  // Run code (JavaScript is executed locally, others simulated)
  const handleRun = () => {
    setIsRunning(true);
    setActiveTab('Output');
    setOutput('');
    setTestResults([]);

    setTimeout(() => {
      if (language === 'javascript') {
        try {
          // Capture console.log output
          const logs = [];
          const originalLog = console.log;
          console.log = (...args) => {
            logs.push(args.map(a => {
              if (typeof a === 'object') return JSON.stringify(a);
              return String(a);
            }).join(' '));
          };

          // eslint-disable-next-line no-new-func
          const fn = new Function(code);
          const startTime = performance.now();
          fn();
          const elapsed = (performance.now() - startTime).toFixed(1);

          console.log = originalLog;

          const outputText = logs.length > 0
            ? `${logs.join('\n')}\n\n✓ Execution complete (${elapsed}ms)`
            : `✓ Execution complete (${elapsed}ms) — no output`;

          setOutput(outputText);

          // Run test cases for current question
          const question = SAMPLE_QUESTIONS[activeQuestion];
          if (question?.testCases?.length > 0) {
            const results = question.testCases.map((tc, i) => {
              try {
                const testLogs = [];
                console.log = (...args) => testLogs.push(args.join(' '));

                const testFn = new Function(`
                  ${code}
                  return twoSum([${tc.input}], ${tc.target});
                `);
                const result = testFn();
                console.log = originalLog;

                const passed = JSON.stringify(result) === JSON.stringify(tc.expected);
                return {
                  passed,
                  detail: passed ? null : `[${tc.expected}], got [${result}]`
                };
              } catch (e) {
                console.log = originalLog;
                return { passed: false, detail: e.message };
              }
            });
            setTestResults(results);
          }
        } catch (e) {
          setOutput(`✗ Error: ${e.message}`);
          setTestResults([]);
        }
      } else {
        // Simulated execution for non-JS languages
        setOutput(`> Compiling ${LANGUAGES.find(l => l.id === language)?.label}...\n\n[0, 1]\n[1, 2]\n\n✓ Execution complete (234ms)`);
        setTestResults([
          { passed: true },
          { passed: true },
          { passed: false, detail: 'Time limit exceeded' },
        ]);
      }
      setIsRunning(false);
    }, 800);
  };

  // Setup screen
  if (mode === 'setup') {
    return (
      <div className="interview-setup-screen">
        <div className="interview-setup-header">
          <Code2 size={32} style={{ color: 'var(--color-action-primary)' }} />
          <h1>AI Interview Platform</h1>
          <p>Voice-based technical interviews with 3 AI agents</p>
        </div>
        <InterviewSetup
          onStartInterview={handleStartInterview}
          onJoinWithCode={handleJoinWithCode}
        />
      </div>
    );
  }

  if (mode === 'report') {
    return (
      <ReportScreen
        report={report}
        reportLoading={reportLoading}
        candidateData={candidateData}
        onStartNew={() => {
          setMode('setup');
          setReport(null);
          timer.reset();
          interviewEndingRef.current = false;
        }}
      />
    );
  }

  if (mode === 'video') {
    return (
      <VideoCallScreen
        onToggleCoding={transitionToCoding}
        videoOn={videoOn}
        setVideoOn={setVideoOn}
        micOn={micOn}
        setMicOn={setMicOn}
        screenShare={screenShare}
        setScreenShare={setScreenShare}
        timer={timer}
        stream={camera.stream}
        candidateData={candidateData}
        agentVoice={agentVoice}
        showAgentPanel={showAgentPanel}
        setShowAgentPanel={setShowAgentPanel}
        isPendingTransition={pendingMode !== null}
      />
    );
  }

  return (
    <CodingWorkspace
      language={language}
      setLanguage={handleLanguageChange}
      code={code}
      setCode={setCode}
      activeQuestion={activeQuestion}
      setActiveQuestion={setActiveQuestion}
      questions={SAMPLE_QUESTIONS}
      onRun={handleRun}
      output={output}
      testResults={testResults}
      isRunning={isRunning}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onBackToVideo={() => {
        agentVoice.resumeInterview();
        setMode('video');
      }}
      videoOn={videoOn}
      micOn={micOn}
      setVideoOn={setVideoOn}
      setMicOn={setMicOn}
      timer={timer}
      stream={camera.stream}
      showAgentPanel={showAgentPanel}
      setShowAgentPanel={setShowAgentPanel}
      candidateData={candidateData}
      agentVoice={agentVoice}
      sidebarWidth={sidebarResize.size}
      sidebarOnMouseDown={sidebarResize.onMouseDown}
      bottomHeight={bottomResize.size}
      bottomOnMouseDown={bottomResize.onMouseDown}
    />
  );
}

export default App;
