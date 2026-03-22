#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, WebviewWindowBuilder};
use uuid::Uuid;

// ─── Data Structures ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptEntry {
    pub agent_id: String,
    pub agent_name: String,
    pub role: String,
    pub content: String,
    pub timestamp_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterviewSession {
    pub session_id: String,
    pub candidate_name: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration_seconds: Option<u64>,
    pub transcript: Vec<TranscriptEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisReport {
    pub session_id: String,
    pub candidate_name: String,
    pub generated_at: String,
    pub overall_summary: String,
    pub qa_analysis: Vec<QaAnalysis>,
    pub strengths: Vec<String>,
    pub weaknesses: Vec<String>,
    pub recommended_focus_areas: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QaAnalysis {
    pub question: String,
    pub candidate_answer: String,
    pub preferred_answer: String,
    pub quality_score: u8,
    pub feedback: String,
    pub topic: String,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn get_sessions_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    let dir = app_dir.join("sessions");
    if !dir.exists() {
        fs::create_dir_all(&dir).expect("Failed to create sessions dir");
    }
    dir
}

fn get_reports_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    let dir = app_dir.join("reports");
    if !dir.exists() {
        fs::create_dir_all(&dir).expect("Failed to create reports dir");
    }
    dir
}

fn timestamp_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("{}", now)
}

// ─── Tauri Commands ────────────────────────────────────────────────────────────

#[tauri::command]
fn create_session(app_handle: tauri::AppHandle, candidate_name: String) -> Result<String, String> {
    let session_id = Uuid::new_v4().to_string();
    let session = InterviewSession {
        session_id: session_id.clone(),
        candidate_name,
        started_at: timestamp_now(),
        ended_at: None,
        duration_seconds: None,
        transcript: Vec::new(),
    };

    let path = get_sessions_dir(&app_handle).join(format!("{}.json", session_id));
    let json = serde_json::to_string_pretty(&session).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    println!("[interview] Created session {}", session_id);
    Ok(session_id)
}

#[tauri::command]
fn append_transcript_entry(
    app_handle: tauri::AppHandle,
    session_id: String,
    agent_id: String,
    agent_name: String,
    role: String,
    content: String,
    timestamp_ms: u64,
) -> Result<(), String> {
    let path = get_sessions_dir(&app_handle).join(format!("{}.json", session_id));

    let mut session: InterviewSession = if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&raw).map_err(|e| e.to_string())?
    } else {
        return Err(format!("Session {} not found", session_id));
    };

    session.transcript.push(TranscriptEntry {
        agent_id,
        agent_name,
        role,
        content,
        timestamp_ms,
    });

    let json = serde_json::to_string_pretty(&session).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn end_session(
    app_handle: tauri::AppHandle,
    session_id: String,
    duration_seconds: u64,
) -> Result<(), String> {
    let path = get_sessions_dir(&app_handle).join(format!("{}.json", session_id));
    let mut session: InterviewSession = if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&raw).map_err(|e| e.to_string())?
    } else {
        return Err(format!("Session {} not found", session_id));
    };

    session.ended_at = Some(timestamp_now());
    session.duration_seconds = Some(duration_seconds);

    let json = serde_json::to_string_pretty(&session).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    println!("[interview] Ended session {} ({}s)", session_id, duration_seconds);
    Ok(())
}

#[tauri::command]
fn get_session(app_handle: tauri::AppHandle, session_id: String) -> Result<InterviewSession, String> {
    let path = get_sessions_dir(&app_handle).join(format!("{}.json", session_id));
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
fn generate_report(
    app_handle: tauri::AppHandle,
    session_id: String,
) -> Result<AnalysisReport, String> {
    let path = get_sessions_dir(&app_handle).join(format!("{}.json", session_id));
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let session: InterviewSession = serde_json::from_str(&raw).map_err(|e| e.to_string())?;

    let qa_pairs = build_qa_pairs(&session.transcript);
    let overall_summary = generate_overall_summary(&session);
    let (strengths, weaknesses) = extract_strengths_weaknesses(&qa_pairs);
    let recommended = extract_focus_areas(&qa_pairs);

    let report = AnalysisReport {
        session_id: session_id.clone(),
        candidate_name: session.candidate_name.clone(),
        generated_at: timestamp_now(),
        overall_summary,
        qa_analysis: qa_pairs,
        strengths,
        weaknesses,
        recommended_focus_areas: recommended,
    };

    let report_path = get_reports_dir(&app_handle).join(format!("{}.json", session_id));
    let report_json = serde_json::to_string_pretty(&report).map_err(|e| e.to_string())?;
    fs::write(&report_path, report_json).map_err(|e| e.to_string())?;

    println!("[interview] Generated report for session {}", session_id);
    Ok(report)
}

#[tauri::command]
fn get_report(app_handle: tauri::AppHandle, session_id: String) -> Result<AnalysisReport, String> {
    let report_path = get_reports_dir(&app_handle).join(format!("{}.json", session_id));
    let raw = fs::read_to_string(&report_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

// ─── Analysis Helpers ──────────────────────────────────────────────────────────

fn build_qa_pairs(transcript: &[TranscriptEntry]) -> Vec<QaAnalysis> {
    let mut pairs = Vec::new();
    let mut i = 0;

    while i < transcript.len() {
        let entry = &transcript[i];

        if entry.role == "agent" {
            let question = entry.content.clone();
            let topic = extract_topic(&question);

            let mut candidate_answer = String::new();
            let mut j = i + 1;
            while j < transcript.len() && transcript[j].role == "candidate" {
                if !candidate_answer.is_empty() {
                    candidate_answer.push(' ');
                }
                candidate_answer.push_str(&transcript[j].content);
                j += 1;
            }

            let preferred = generate_preferred_answer(&question, &topic);
            let (quality_score, feedback) = evaluate_answer(&candidate_answer, &topic);

            pairs.push(QaAnalysis {
                question,
                candidate_answer,
                preferred_answer: preferred,
                quality_score,
                feedback,
                topic,
            });
        }
        i += 1;
    }

    pairs
}

fn extract_topic(question: &str) -> String {
    let q = question.to_lowercase();
    if q.contains("project")
        || q.contains("built")
        || q.contains("worked on")
        || q.contains("tell me about")
    {
        "Projects & Experience".into()
    } else if q.contains("skill")
        || q.contains("technology")
        || q.contains("react")
        || q.contains("python")
        || q.contains("javascript")
    {
        "Technical Skills".into()
    } else if q.contains("trade-off")
        || q.contains("design")
        || q.contains("architect")
        || q.contains("scale")
    {
        "System Design".into()
    } else if q.contains("team")
        || q.contains("collab")
        || q.contains("conflict")
        || q.contains("communicat")
    {
        "Teamwork & Communication".into()
    } else if q.contains("challenge")
        || q.contains("problem")
        || q.contains("bug")
        || q.contains("debug")
    {
        "Problem Solving".into()
    } else if q.contains("production") || q.contains("incident") || q.contains("deploy") {
        "Production Experience".into()
    } else {
        "General".into()
    }
}

fn generate_preferred_answer(question: &str, topic: &str) -> String {
    if topic == "Projects & Experience" {
        "Describe the project goal and your specific role, highlight 2-3 key technical decisions \
         with reasoning, mention measurable outcomes (e.g. performance, users), and discuss the \
         biggest challenge and how you overcame it.".into()
    } else if topic == "Technical Skills" {
        "Show depth beyond syntax - explain how it works internally, compare with alternatives and \
         explain trade-offs, give a specific real-world use case, and mention any advanced patterns \
         or limitations you encountered.".into()
    } else if topic == "System Design" {
        "Ask clarifying questions to define scope and constraints, outline 2-3 design alternatives \
         with pros and cons, justify the chosen approach, and address scalability, reliability, \
         and maintenance.".into()
    } else if topic == "Teamwork & Communication" {
        "Describe the specific situation honestly, focus on YOUR actions and reasoning (not others'), \
         show self-awareness about what you could have done better, and end with what you learned.".into()
    } else if topic == "Problem Solving" {
        "Define the problem clearly, walk through your debugging/thinking process step by step, \
         show how you iterated or researched, and end with the measurable outcome and key lesson.".into()
    } else {
        "Be specific, honest, and show clear reasoning. Use real examples and focus on your \
         specific contributions.".into()
    }
}

fn evaluate_answer(answer: &str, topic: &str) -> (u8, String) {
    let answer_len = answer.trim().len();
    let a_lower = answer.to_lowercase();

    if answer_len == 0 {
        return (1, "No answer provided.".to_string());
    }
    if answer_len < 20 {
        return (3, "Answer was too brief. More detail and specific examples are needed.".to_string());
    }

    let has_specifics = answer_len > 80
        && (a_lower.contains("because")
            || a_lower.contains("when ")
            || a_lower.contains("how ")
            || a_lower.contains("result")
            || a_lower.contains("decided")
            || a_lower.contains("chose")
            || a_lower.contains("learned")
            || a_lower.contains("built"));

    let has_tech_details = (topic == "Technical Skills" || topic == "System Design")
        && (a_lower.contains("api")
            || a_lower.contains("database")
            || a_lower.contains("framework")
            || a_lower.contains("deploy")
            || a_lower.contains("cache")
            || a_lower.contains("queue")
            || a_lower.contains("test"));

    let score = if has_specifics && has_tech_details { 9 }
        else if has_specifics { 8 }
        else if answer_len > 150 { 7 }
        else if answer_len > 80 { 6 }
        else { 5 };

    let feedback = match score {
        8..=9 => "Good specific answer with concrete examples and clear reasoning.",
        6..=7 => "Adequate answer but could benefit from more specific examples and deeper reasoning.",
        _ => "Answer lacks specificity. Include concrete examples, outcomes, and your specific contribution.",
    };

    (score, feedback.to_string())
}

fn generate_overall_summary(session: &InterviewSession) -> String {
    let q_count = session.transcript.iter().filter(|e| e.role == "agent").count();
    let a_count = session
        .transcript
        .iter()
        .filter(|e| e.role == "candidate")
        .count();
    let duration = session.duration_seconds.unwrap_or(0);
    let mins = duration / 60;
    let engagement = if a_count >= q_count { "good" } else { "moderate" };

    format!(
        "Interview with {} lasted {} minutes. {} questions asked, {} responses recorded. \
         Candidate showed {} engagement across project discussion, technical skills, \
         and collaborative problem-solving.",
        session.candidate_name, mins, q_count, a_count, engagement
    )
}

fn extract_strengths_weaknesses(qa_pairs: &[QaAnalysis]) -> (Vec<String>, Vec<String>) {
    let mut topic_scores: HashMap<&str, Vec<u8>> = HashMap::new();
    for pair in qa_pairs {
        topic_scores.entry(&pair.topic).or_default().push(pair.quality_score);
    }

    let mut strengths = Vec::new();
    let mut weaknesses = Vec::new();

    for (topic, scores) in topic_scores.iter() {
        let avg =
            scores.iter().sum::<u8>() as f32 / (scores.len() as f32).max(1.0);
        if avg >= 7.0 {
            strengths.push(format!("Strong in {} (avg: {:.1}/10)", topic, avg));
        } else if avg < 5.0 {
            weaknesses.push(format!("Needs improvement in {} (avg: {:.1}/10)", topic, avg));
        }
    }

    if strengths.is_empty() {
        strengths.push("Shows engagement and willingness to discuss experience".to_string());
    }
    if weaknesses.is_empty() {
        weaknesses.push("Could benefit from more detailed, example-based responses".to_string());
    }

    (strengths, weaknesses)
}

fn extract_focus_areas(qa_pairs: &[QaAnalysis]) -> Vec<String> {
    let mut topic_scores: HashMap<String, Vec<u8>> = HashMap::new();
    for pair in qa_pairs {
        topic_scores
            .entry(pair.topic.clone())
            .or_default()
            .push(pair.quality_score);
    }

    let mut scored: Vec<(String, f32)> = topic_scores
        .iter()
        .map(|(t, scores)| {
            let avg =
                scores.iter().sum::<u8>() as f32 / (scores.len() as f32).max(1.0);
            (t.clone(), avg)
        })
        .collect();

    scored.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());
    scored.into_iter().take(3).map(|(t, _)| t).collect()
}

// ─── Main ─────────────────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_session,
            append_transcript_entry,
            end_session,
            get_session,
            generate_report,
            get_report,
        ])
        .setup(|app| {
            let window = WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("Interview Lock")
            .maximized(true)
            .decorations(false)
            .always_on_top(true)
            .transparent(true)
            .build()?;

            #[cfg(target_os = "windows")]
            {
                use windows::Win32::Foundation::HWND;
                use windows::Win32::UI::WindowsAndMessaging::{
                    SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE,
                };

                if let Ok(hwnd) = window.hwnd() {
                    unsafe {
                        let _ = SetWindowDisplayAffinity(
                            HWND(hwnd.0 as _),
                            WDA_EXCLUDEFROMCAPTURE,
                        );
                    }
                }
            }

            #[cfg(target_os = "macos")]
            {
                let panel = window.to_panel()?;
                panel.set_level(4);
                panel.set_style_mask(1 << 7);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
