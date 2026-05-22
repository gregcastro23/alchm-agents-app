#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use hex;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Emitter;
use tauri::Listener;
use tauri::Manager;
use tauri::Runtime;
use tauri::State;
use tauri::WindowEvent;
use tauri::Wry;
use tauri_plugin_global_shortcut::ShortcutState;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;
use url::Url;
use uuid::Uuid;

type HmacSha256 = Hmac<Sha256>;
const TRAY_ID: &str = "alchm-tray";

// State to hold the IPC Nonce
struct AppState {
    ipc_nonce: Mutex<String>,
}

#[tauri::command]
fn get_ipc_nonce(state: State<'_, AppState>) -> Result<String, String> {
    let nonce = state.ipc_nonce.lock().map_err(|e| e.to_string())?.clone();
    Ok(nonce)
}

fn tint_tray_icon<R: Runtime>(app: &tauri::AppHandle<R>, state: &str) -> Option<Image<'static>> {
    let base = app.default_window_icon()?;
    let mut rgba = base.rgba().to_vec();

    for pixel in rgba.chunks_exact_mut(4) {
        let alpha = pixel[3];
        if alpha == 0 {
            continue;
        }

        let luminance = ((pixel[0] as u16 + pixel[1] as u16 + pixel[2] as u16) / 3) as u8;
        match state {
            "fire" => {
                pixel[0] = 255;
                pixel[1] = luminance.saturating_add(72);
                pixel[2] = luminance / 5;
            }
            "water" => {
                pixel[0] = luminance / 4;
                pixel[1] = luminance.saturating_add(56);
                pixel[2] = 255;
            }
            "earth" => {
                pixel[0] = luminance.saturating_add(32);
                pixel[1] = luminance.saturating_add(86);
                pixel[2] = luminance / 4;
            }
            _ => {}
        }
    }

    Some(Image::new_owned(rgba, base.width(), base.height()))
}

fn tray_label(state: &str) -> (&'static str, &'static str) {
    match state {
        "fire" => ("ALCHM FIRE", "Alchm is executing a Fire Jing move"),
        "water" => ("ALCHM WATER", "Alchm is executing a Water Jing move"),
        "earth" => ("ALCHM EARTH", "Alchm is executing an Earth Jing move"),
        _ => ("ALCHM", "Alchm desktop agents are idle"),
    }
}

fn apply_tray_state<R: Runtime>(app: &tauri::AppHandle<R>, state: &str) -> Result<(), String> {
    let (title, tooltip) = tray_label(state);
    let Some(tray) = app.tray_by_id(TRAY_ID) else {
        println!("Tray state changed to {state}, but tray icon is not initialized");
        return Ok(());
    };

    let icon = if state == "idle" {
        app.default_window_icon().cloned().map(Image::to_owned)
    } else {
        tint_tray_icon(app, state)
            .or_else(|| app.default_window_icon().cloned().map(Image::to_owned))
    };

    if let Some(icon) = icon {
        tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
        let _ = tray.set_icon_as_template(false);
    }

    tray.set_title(Some(title)).map_err(|e| e.to_string())?;
    tray.set_tooltip(Some(tooltip)).map_err(|e| e.to_string())?;
    println!("Tray state changed to {state}");

    Ok(())
}

fn setup_tray(app: &tauri::App<Wry>) -> tauri::Result<()> {
    let status = MenuItem::with_id(app, "tray-status", "Alchm idle", false, None::<&str>)?;
    let open_main = MenuItem::with_id(app, "open-main", "Open Alchm", true, None::<&str>)?;
    let open_composer = MenuItem::with_id(
        app,
        "open-composer",
        "Open Live Composer",
        true,
        None::<&str>,
    )?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = PredefinedMenuItem::quit(app, Some("Quit Alchm"))?;
    let menu = Menu::with_items(
        app,
        &[&status, &open_main, &open_composer, &separator, &quit],
    )?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .menu(&menu)
        .show_menu_on_left_click(true)
        .title("ALCHM")
        .tooltip("Alchm desktop agents are idle")
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open-main" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "open-composer" => toggle_live_composer_window(app),
            _ => {}
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone().to_owned());
    }

    builder.build(app)?;
    Ok(())
}

fn hide_live_composer_window<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<(), String> {
    let Some(window) = app.get_webview_window("live-composer") else {
        return Err("live-composer window not found".to_string());
    };

    window.hide().map_err(|e| e.to_string())
}

fn toggle_live_composer_window<R: Runtime>(app: &tauri::AppHandle<R>) {
    let Some(window) = app.get_webview_window("live-composer") else {
        eprintln!("live-composer window not found");
        return;
    };

    match window.is_visible() {
        Ok(true) => {
            let _ = window.hide();
            println!("Live composer hidden");
        }
        _ => {
            let _ = window.center();
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.emit("composer-open", serde_json::json!({}));
            println!("Live composer shown");
        }
    }
}

#[tauri::command]
fn hide_live_composer(app: tauri::AppHandle) -> Result<(), String> {
    hide_live_composer_window(&app)
}

#[tauri::command]
fn set_tray_state(app: tauri::AppHandle, state: String) -> Result<(), String> {
    let normalized = match state.as_str() {
        "fire" | "water" | "earth" => state,
        _ => "idle".to_string(),
    };

    apply_tray_state(&app, &normalized)
}

fn verify_deep_link(url_str: &str) -> Result<serde_json::Value, String> {
    let secret = std::env::var("TAURI_DEEP_LINK_SECRET")
        .or_else(|_| std::env::var("DEEP_LINK_SHARED_SECRET"))
        .unwrap_or_else(|_| {
            option_env!("TAURI_DEEP_LINK_SECRET")
                .or(option_env!("DEEP_LINK_SHARED_SECRET"))
                .unwrap_or("DEV_SECRET_DO_NOT_USE_IN_PROD")
                .to_string()
        });

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
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    if now > expires_at {
        return Err("Deep link expired".to_string());
    }

    let payload = format!("{}:{}:{}:{}", id, name, tier, expires_at_str);

    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).map_err(|_| "Invalid secret key length")?;
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
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            ipc_nonce: Mutex::new(ipc_nonce),
        })
        .invoke_handler(tauri::generate_handler![
            get_ipc_nonce,
            hide_live_composer,
            set_tray_state
        ])
        .setup(move |app| {
            #[cfg(desktop)]
            {
                setup_tray(app)?;

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_shortcuts([
                            "CommandOrControl+Shift+A",
                            "CommandOrControl+Shift+Space",
                        ])?
                        .with_handler(|app, _shortcut, event| {
                            if event.state == ShortcutState::Pressed {
                                toggle_live_composer_window(app);
                            }
                        })
                        .build(),
                )?;

                if let Some(window) = app.get_webview_window("live-composer") {
                    let handle = app.handle().clone();
                    window.on_window_event(move |event| {
                        if let WindowEvent::Focused(false) = event {
                            let _ = hide_live_composer_window(&handle);
                        }
                    });
                }

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
                        }
                        Err(e) => {
                            eprintln!("Deep link verification failed: {}", e);
                            // Log securely, but drop the payload
                        }
                    }
                });
            }

            // 2. Spawn the Bun sidecar ("orchestrator") and pass the Nonce
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap()
                .to_string_lossy()
                .to_string();
            let sidecar_command = app
                .shell()
                .sidecar("orchestrator")
                .expect("failed to create `orchestrator` binary command")
                .env("IPC_NONCE", &sidecar_nonce)
                .env("APP_DATA_DIR", &app_data_dir);

            let (mut rx, _child) = sidecar_command.spawn().expect("Failed to spawn sidecar");

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
