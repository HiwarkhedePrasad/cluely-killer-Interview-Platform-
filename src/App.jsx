import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  Play, Code2, PhoneOff, Users, Clock, Settings,
  Maximize2, Minimize2, ChevronRight, Terminal,
  FileText, CheckCircle2, XCircle, AlertCircle,
  MessageSquare, X, GripVertical
} from 'lucide-react';
import './App.css';

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

  const format = useCallback(() => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [seconds]);

  return { seconds, running, start, stop, format };
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

function VideoCallScreen({ onToggleCoding, videoOn, setVideoOn, micOn, setMicOn, screenShare, setScreenShare, timer, stream }) {
  return (
    <div className="video-fullscreen">
      {/* Main video grid */}
      <div className="video-fullscreen__grid">
        {/* Interviewer — placeholder (remote peer would go here) */}
        <div className="video-fullscreen__participant video-fullscreen__participant--main">
          <div className="video-fullscreen__avatar">
            <Users size={48} />
          </div>
          <div className="video-fullscreen__name">
            <span className="type-label" style={{ color: '#fff', textTransform: 'none', letterSpacing: 'normal' }}>Interviewer</span>
          </div>
          <div className="video-fullscreen__status-badge">
            <Mic size={12} />
          </div>
        </div>

        {/* You — live camera feed */}
        <div className="video-fullscreen__participant">
          {stream && videoOn ? (
            <VideoFeed stream={stream} muted={true} />
          ) : (
            <div className="video-fullscreen__avatar">
              <Users size={48} />
            </div>
          )}
          <div className="video-fullscreen__name">
            <span className="type-label" style={{ color: '#fff', textTransform: 'none', letterSpacing: 'normal' }}>You (Candidate)</span>
          </div>
          {!videoOn && (
            <div className="video-fullscreen__camera-off">
              <VideoOff size={24} />
              <span className="type-caption">Camera Off</span>
            </div>
          )}
        </div>
      </div>

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
          <Clock size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <span className="type-mono" style={{ color: '#fff' }}>{timer.format()}</span>
        </div>
      </div>

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
            className="video-ctrl-btn video-ctrl-btn--code"
            onClick={onToggleCoding}
            title="Open coding environment"
          >
            <Code2 size={20} />
            <span>Start Coding</span>
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
  timer, stream
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
            Interview
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
          <button className="btn-icon" onClick={onBackToVideo} title="Back to video view">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <div className="workspace">
        {/* Sidebar — Questions */}
        <div className="workspace-sidebar no-select">
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

        {/* Main — Editor + Output */}
        <div className="workspace-main">
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
              <button className="btn btn-primary btn-sm" onClick={onRun} disabled={isRunning}>
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

          {/* Output Panel */}
          <div className="workspace-bottom">
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
   MAIN APP — Mode Controller
   ═══════════════════════════════════════════════════════════ */

function App() {
  // View mode: 'video' (full-screen call) or 'coding' (workspace)
  const [mode, setMode] = useState('video');

  // Shared state
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

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

  // Timer
  const timer = useTimer();

  // Start timer + camera on first render
  useEffect(() => {
    timer.start();
    camera.startCamera();
    return () => {
      timer.stop();
      camera.stopCamera();
    };
  }, []);

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

  if (mode === 'video') {
    return (
      <VideoCallScreen
        onToggleCoding={() => setMode('coding')}
        videoOn={videoOn}
        setVideoOn={setVideoOn}
        micOn={micOn}
        setMicOn={setMicOn}
        screenShare={screenShare}
        setScreenShare={setScreenShare}
        timer={timer}
        stream={camera.stream}
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
      onBackToVideo={() => setMode('video')}
      videoOn={videoOn}
      micOn={micOn}
      setVideoOn={setVideoOn}
      setMicOn={setMicOn}
      timer={timer}
      stream={camera.stream}
    />
  );
}

export default App;
