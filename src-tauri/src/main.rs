#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use uuid::Uuid;

// State to hold the IPC Nonce
struct AppState {
    ipc_nonce: Mutex<String>,
}

#[tauri::command]
fn get_ipc_nonce(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let nonce = state.ipc_nonce.lock().map_err(|e| e.to_string())?.clone();
    Ok(nonce)
}

fn main() {
    // 1. Generate the random UUID v4 Nonce
    let ipc_nonce = Uuid::new_v4().to_string();
    let sidecar_nonce = ipc_nonce.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(AppState {
            ipc_nonce: Mutex::new(ipc_nonce),
        })
        .invoke_handler(tauri::generate_handler![get_ipc_nonce])
        .setup(move |app| {
            #[cfg(desktop)]
            app.listen("tauri://url", |event| {
                println!("Received deep link: {:?}", event.payload());
                // The Next.js frontend will listen to this event, extract the agent parameter,
                // and call localhost:8080/api/models/install
            });

            // 2. Spawn the Bun sidecar ("orchestrator") and pass the Nonce
            let sidecar_command = app.shell().sidecar("orchestrator")
                .expect("failed to create `orchestrator` binary command")
                .env("IPC_NONCE", &sidecar_nonce);
            
            let (mut rx, _child) = sidecar_command
                .spawn()
                .expect("Failed to spawn sidecar");

            tauri::async_runtime::spawn(async move {
                // Read events such as stdout
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line) = event {
                        if let Ok(line_str) = String::from_utf8(line) {
                            println!("Sidecar: {}", line_str);
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}