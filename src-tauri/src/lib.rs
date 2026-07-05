// ============================================
// TTBar — Main Application Entry (Rust Backend)
// ============================================

use tauri::{
    AppHandle, Manager, Emitter,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    menu::{Menu, MenuItem},
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, ShortcutState};
use serde::{Deserialize, Serialize};

mod search;

/// Represents a search result item sent to the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub result_type: String,
    pub score: i64,
}

/// Search command — called from frontend via invoke('search', { query })
#[tauri::command]
fn search(query: &str) -> Vec<SearchResult> {
    search::perform_search(query)
}

/// Open a result item — launches the file/app
#[tauri::command]
fn open_result(path: &str) -> Result<(), String> {
    use std::process::Command;

    // Use Windows 'start' command to open files/apps
    Command::new("cmd")
        .args(["/C", "start", "", path])
        .spawn()
        .map_err(|e| format!("Failed to open: {}", e))?;

    Ok(())
}

/// Delete a file or folder directly
#[tauri::command]
fn delete_file(path: &str) -> Result<(), String> {
    use std::fs;
    let path_buf = std::path::PathBuf::from(path);

    if path_buf.is_file() {
        fs::remove_file(&path_buf).map_err(|e| format!("Dosya silinemedi: {}", e))?;
    } else if path_buf.is_dir() {
        fs::remove_dir_all(&path_buf).map_err(|e| format!("Klasör silinemedi: {}", e))?;
    }

    Ok(())
}

/// Create a shortcut in the Windows Startup folder to run TTBar on boot
fn setup_autostart() -> Result<(), String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Executable yolu alınamadı: {}", e))?;
    let exe_str = exe_path.to_string_lossy();
    let working_dir = exe_path.parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    // PowerShell script to create the startup shortcut
    let script = format!(
        r#"$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\TTBar.lnk"); $Shortcut.TargetPath = '{}'; $Shortcut.WorkingDirectory = '{}'; $Shortcut.Save()"#,
        exe_str, working_dir
    );

    std::process::Command::new("powershell")
        .args(["-WindowStyle", "Hidden", "-Command", &script])
        .spawn()
        .map_err(|e| format!("PowerShell başlatılamadı: {}", e))?;

    Ok(())
}

/// Toggle window visibility
fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.center();
            // Emit show event to frontend
            let _ = window.emit("tt-show", ());
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        // Check if it's our Alt+Space shortcut
                        if shortcut.matches(Modifiers::ALT, Code::Space) {
                            toggle_window(app);
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![search, open_result, delete_file])
        .setup(|app| {
            // Register Alt+Space global shortcut
            app.global_shortcut()
                .register(tauri_plugin_global_shortcut::Shortcut::new(
                    Some(Modifiers::ALT),
                    Code::Space,
                ))?;

            // Setup autostart shortcut
            if let Err(e) = setup_autostart() {
                println!("[TTBar] Başlangıçta çalıştırma ayarlanamadı: {}", e);
            }

            // Initialize the search index in background
            search::init_index();

            // Build system tray
            let show_item = MenuItem::with_id(app, "show", "TTBar'ı Göster", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let tray_icon = app.default_window_icon().cloned();
            let mut tray_builder = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("TTBar — Alt+Space ile aç");

            if let Some(icon) = tray_icon {
                tray_builder = tray_builder.icon(icon);
            }

            let _tray = tray_builder
                .on_menu_event(move |app, event| {
                    match event.id().as_ref() {
                        "show" => toggle_window(app),
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        toggle_window(app);
                    }
                })
                .build(app)?;

            Ok(())
        })
        // Hide instead of close on window close
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running TTBar");
}
