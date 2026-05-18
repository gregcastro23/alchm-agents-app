#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Mutex;
use tauri::Manager;
use tauri::Listener;
use tauri::Emitter;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use uuid::Uuid;
use url::Url;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH};
use hex;

type HmacSha256 = Hmac<Sha256>;

// State to hold the IPC Nonce
struct AppState {
    ipc_nonce: Mutex<String>,
}

#[tauri::command]
fn get_ipc_nonce(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let nonce = state.ipc_nonce.lock().map_err(|e| e.to_string())?.clone();
    Ok(nonce)
}

fn verify_deep_link(url_str: &str) -> Result<serde_json::Value, String> {
    let secret = option_env!("TAURI_DEEP_LINK_SECRET").unwrap_or("DEV_SECRET_DO_NOT_USE_IN_PROD");
    
    let parsed_url = Url::parse(url_str).map_err(|_| "Invalid URL")?;
    
    let mut id = String::new();
    let mut name = String::new();
    let mut tier = String::new();
    let mut expires_at_str = String::new();
    let mut provided_sig = String::new();

    for (k, v) in parsed_url.query_pairs() {
        match k.as_ref() {
            "id" => id = v.into_owned(),
            "name" => name = v.into_owned(),
            "tier" => tier = v.into_owned(),
            "expiresAt" => expires_at_str = v.into_owned(),
            "sig" => provided_sig = v.into_owned(),
            _ => {}
        }
    }

    if provided_sig.is_empty() {
        return Err("Missing signature".to_string());
    }

    let expires_at: u64 = expires_at_str.parse().map_err(|_| "Invalid expiresAt")?;
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
    
    if now > expires_at {
        return Err("Deep link expired".to_string());
    }

    let payload = format!("{}:{}:{}:{}", id, name, tier, expires_at_str);
    
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|_| "Invalid secret key length")?;
    mac.update(payload.as_bytes());
    let expected_sig = hex::encode(mac.finalize().into_bytes());

    if provided_sig != expected_sig {
        return Err("Invalid signature".to_string());
    }

    Ok(serde_json::json!({
        "id": id,
        "name": name,
        "tier": tier
    }))
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
            {
                let handle = app.handle().clone();
                app.listen("deep-link://new-url", move |event| {
                    let raw_payload = event.payload();
                    let url_str = raw_payload.trim_matches('"');
                    println!("Received deep link: {}", url_str);
                    
                    match verify_deep_link(url_str) {
                        Ok(verified_payload) => {
                            println!("Deep link verified successfully");
                            if let Some(window) = handle.get_webview_window("main") {
                                let _ = window.emit("verified-install", verified_payload);
                            }
                        },
                        Err(e) => {
                            eprintln!("Deep link verification failed: {}", e);
                            // Log securely, but drop the payload
                        }
                    }
                });
            }

            // 2. Spawn the Bun sidecar ("orchestrator") and pass the Nonce
            let app_data_dir = app.path().app_data_dir().unwrap().to_string_lossy().to_string();
            let sidecar_command = app.shell().sidecar("orchestrator")
                .expect("failed to create `orchestrator` binary command")
                .env("IPC_NONCE", &sidecar_nonce)
                .env("APP_DATA_DIR", &app_data_dir);
            
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