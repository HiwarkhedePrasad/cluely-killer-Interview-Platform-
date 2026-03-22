// lib.rs — just re-exports the mobile entry point, real logic is in main.rs

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // The actual run logic is in main.rs to keep window setup there.
    // On mobile this is the entry point; on desktop main.rs calls this.
}
