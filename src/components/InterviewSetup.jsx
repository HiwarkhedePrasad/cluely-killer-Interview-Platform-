import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, User, Briefcase, Code, Sparkles, Copy, Check, ArrowRight, Plus, X, Terminal } from 'lucide-react';
import { parseResume } from '../services/resumeParser';
import * as pdfjsLib from 'pdfjs-dist';
import './InterviewSetup.css';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Extract text from a file — handles PDFs via pdfjs-dist, plain text otherwise
 */
async function extractTextFromFile(file) {
  if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText.trim();
    } catch (err) {
      console.error('PDF parsing failed:', err);
      return await file.text();
    }
  }
  return await file.text();
}

function generateInterviewCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function InterviewSetup({ onStartInterview, onJoinWithCode }) {
  const [mode, setMode] = useState('setup');
  const [candidateName, setCandidateName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [projects, setProjects] = useState([{ name: '', description: '', technologies: '' }]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await extractTextFromFile(file);
    setResumeText(text);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const text = await extractTextFromFile(file);
      setResumeText(text);
    }
  };

  const addProject = () => setProjects([...projects, { name: '', description: '', technologies: '' }]);
  const updateProject = (index, field, value) => {
    const updated = [...projects];
    updated[index][field] = value;
    setProjects(updated);
  };
  const removeProject = (index) => setProjects(projects.filter((_, i) => i !== index));

  const handleGenerateInterview = () => {
    const code = generateInterviewCode();
    setGeneratedCode(code);
    const parsedResume = parseResume(resumeText);
    const candidateData = {
      name: candidateName,
      resume: resumeText,
      parsedResume,
      skills: parsedResume.skills,
      experienceLevel: parsedResume.experienceLevel,
      yearsOfExperience: parsedResume.yearsOfExperience,
      projects: projects.filter(p => p.name.trim()).length > 0
        ? projects.filter(p => p.name.trim()).map(p => ({
            name: p.name,
            description: p.description,
            technologies: p.technologies.split(',').map(t => t.trim()).filter(Boolean)
          }))
        : parsedResume.projects,
      interviewCode: code
    };
    localStorage.setItem(`interview_${code}`, JSON.stringify(candidateData));
  };

  const handleStartInterview = () => {
    const candidateData = JSON.parse(localStorage.getItem(`interview_${generatedCode}`) || '{}');
    onStartInterview?.(candidateData);
  };

  const handleJoinWithCode = () => {
    const candidateData = JSON.parse(localStorage.getItem(`interview_${joinCode}`) || 'null');
    if (candidateData) {
      onJoinWithCode?.(candidateData);
    } else {
      alert('Invalid interview code');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="is">
      {/* Left decorative strip */}
      <div className="is__strip" aria-hidden="true">
        <span className="is__strip-text">INTERVIEW</span>
        <span className="is__strip-text">PLATFORM</span>
        <span className="is__strip-dot" />
      </div>

      <div className="is__body">
        {/* Header row */}
        <header className="is__header">
          <div className="is__header-left">
            <Terminal size={16} strokeWidth={2.5} />
            <span className="is__badge">SETUP</span>
          </div>
          <nav className="is__nav">
            <button className={`is__nav-btn ${mode === 'setup' ? 'is__nav-btn--on' : ''}`} onClick={() => setMode('setup')}>New</button>
            <span className="is__nav-sep">/</span>
            <button className={`is__nav-btn ${mode === 'join' ? 'is__nav-btn--on' : ''}`} onClick={() => setMode('join')}>Join</button>
          </nav>
        </header>

        {/* Content */}
        <div className="is__content">
          {mode === 'setup' ? (
            !generatedCode ? (
              <div className="is__grid">
                {/* LEFT COLUMN — Name + Resume */}
                <div className="is__col">
                  <div className="is__field">
                    <label className="is__lbl"><span className="is__num">01</span>Candidate</label>
                    <input className="is__inp" type="text" value={candidateName} onChange={e => setCandidateName(e.target.value)} placeholder="Full name" autoComplete="off" />
                  </div>

                  <div className="is__field">
                    <label className="is__lbl"><span className="is__num">02</span>Resume</label>
                    <div
                      className={`is__drop ${dragActive ? 'is__drop--on' : ''} ${resumeText ? 'is__drop--done' : ''}`}
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                      onClick={() => !resumeText && fileInputRef.current?.click()}
                    >
                      <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
                      {resumeText ? (
                        <div className="is__drop-ok">
                          <FileText size={14} />
                          <span>{resumeText.length} chars loaded</span>
                          <button className="is__drop-x" onClick={e => { e.stopPropagation(); setResumeText(''); }}><X size={12} /></button>
                        </div>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Drop file or click</span>
                        </>
                      )}
                    </div>
                    <textarea className="is__ta" value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Or paste resume / background..." rows={3} />
                  </div>
                </div>

                {/* RIGHT COLUMN — Projects + CTA */}
                <div className="is__col">
                  <div className="is__field is__field--grow">
                    <label className="is__lbl"><span className="is__num">03</span>Projects</label>
                    <div className="is__projects">
                      {projects.map((project, i) => (
                        <div key={i} className="is__proj">
                          <div className="is__proj-top">
                            <span className="is__proj-n">{String(i + 1).padStart(2, '0')}</span>
                            {projects.length > 1 && <button className="is__proj-rm" onClick={() => removeProject(i)}><X size={12} /></button>}
                          </div>
                          <input className="is__inp is__inp--s" value={project.name} onChange={e => updateProject(i, 'name', e.target.value)} placeholder="Name" />
                          <input className="is__inp is__inp--s" value={project.description} onChange={e => updateProject(i, 'description', e.target.value)} placeholder="Description" />
                          <input className="is__inp is__inp--s" value={project.technologies} onChange={e => updateProject(i, 'technologies', e.target.value)} placeholder="Tech (comma sep)" />
                        </div>
                      ))}
                    </div>
                    <button className="is__add" onClick={addProject}><Plus size={12} /> Add project</button>
                  </div>
                </div>

                {/* CTA — full width below grid */}
                <div className="is__cta-row">
                  <button className="is__cta" onClick={handleGenerateInterview} disabled={!candidateName.trim()}>
                    <span>Generate Code</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* Success state */
              <div className="is__done">
                <div className="is__done-icon"><Check size={24} strokeWidth={3} /></div>
                <h2 className="is__done-h">Ready.</h2>
                <p className="is__done-p">Share the code or start now.</p>
                <div className="is__code">
                  {generatedCode.split('').map((c, i) => (
                    <span key={i} className="is__code-c" style={{ animationDelay: `${i * 0.07}s` }}>{c}</span>
                  ))}
                  <button className="is__code-cp" onClick={copyCode}>{codeCopied ? <Check size={12} /> : <Copy size={12} />}</button>
                </div>
                <div className="is__done-btns">
                  <button className="is__cta" onClick={handleStartInterview}><span>Start Interview</span><ArrowRight size={16} /></button>
                  <button className="is__ghost" onClick={() => setGeneratedCode('')}>New Setup</button>
                </div>
              </div>
            )
          ) : (
            /* Join mode */
            <div className="is__join">
              <Code size={32} strokeWidth={1.5} className="is__join-icon" />
              <h2 className="is__join-h">Enter Code</h2>
              <p className="is__join-p">6-character interview code</p>
              <input
                ref={el => { if (el && mode === 'join') setTimeout(() => el.focus(), 100); }}
                type="text"
                className="is__join-real-inp"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="XXXXXX"
                spellCheck={false}
                autoComplete="off"
              />
              <button className="is__cta is__cta--narrow" onClick={handleJoinWithCode} disabled={joinCode.length !== 6}>
                <span>Join</span><ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewSetup;
