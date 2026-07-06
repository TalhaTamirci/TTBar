// ============================================
// TTBar — Search Engine Module
// ============================================
//
// Scans Start Menu .lnk files and provides
// fast fuzzy search over the app index.
//

use crate::SearchResult;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

/// Global application index (thread-safe, initialized once)
static APP_INDEX: OnceLock<Mutex<Vec<AppEntry>>> = OnceLock::new();

/// An indexed application entry
#[derive(Debug, Clone)]
struct AppEntry {
    name: String,
    name_lower: String,
    path: String,
    entry_type: String,
}

/// Initialize the search index by scanning files and apps
pub fn init_index() {
    std::thread::spawn(|| {
        let entries = scan_system_and_files();
        let index = APP_INDEX.get_or_init(|| Mutex::new(Vec::new()));
        if let Ok(mut idx) = index.lock() {
            *idx = entries;
        }
        println!("[TTBar] Indexed {} entries", APP_INDEX.get().map(|m| m.lock().map(|v| v.len()).unwrap_or(0)).unwrap_or(0));
    });
}

/// Scan Start Menu shortcuts and user home directory files/folders
fn scan_system_and_files() -> Vec<AppEntry> {
    let mut entries = Vec::new();

    // Common Start Menu locations
    let mut search_dirs: Vec<PathBuf> = Vec::new();

    // System Start Menu
    if let Ok(programdata) = std::env::var("ProgramData") {
        search_dirs.push(PathBuf::from(programdata).join("Microsoft\\Windows\\Start Menu\\Programs"));
    }

    // User Start Menu
    if let Ok(appdata) = std::env::var("APPDATA") {
        search_dirs.push(PathBuf::from(appdata).join("Microsoft\\Windows\\Start Menu\\Programs"));
    }

    // Public Desktop
    search_dirs.push(PathBuf::from("C:\\Users\\Public\\Desktop"));

    for dir in &search_dirs {
        if !dir.exists() {
            continue;
        }
        scan_directory(dir, &mut entries);
    }

    // Scan user directories (Desktop, Documents, Downloads, Pictures, Videos, Music)
    if let Ok(userprofile) = std::env::var("USERPROFILE") {
        scan_user_files(&userprofile, &mut entries);
    }

    // Deduplicate by file/app path
    let mut seen = std::collections::HashSet::new();
    entries.retain(|e| seen.insert(e.path.clone()));

    entries
}

/// Recursively scan user home directory folders for files and directories
fn scan_user_files(user_profile: &str, entries: &mut Vec<AppEntry>) {
    use walkdir::WalkDir;

    let user_profile_path = PathBuf::from(user_profile);
    let folders_to_scan = [
        user_profile_path.join("Desktop"),
        user_profile_path.join("Documents"),
        user_profile_path.join("Downloads"),
        user_profile_path.join("Pictures"),
        user_profile_path.join("Videos"),
        user_profile_path.join("Music"),
    ];

    let mut count = 0;
    const MAX_USER_FILES: usize = 40000;

    for folder in &folders_to_scan {
        if !folder.exists() {
            continue;
        }

        let walker = WalkDir::new(folder)
            .max_depth(4) // Deep enough for normal document storage
            .into_iter()
            .filter_entry(|e| {
                let file_name = e.file_name().to_string_lossy();
                // Exclude hidden directories and common development targets
                !file_name.starts_with('.')
                    && file_name != "node_modules"
                    && file_name != "target"
                    && file_name != "dist"
                    && file_name != "build"
                    && file_name != "AppData"
            });

        for entry in walker.filter_map(|e| e.ok()) {
            if count >= MAX_USER_FILES {
                break;
            }

            let path = entry.path();
            if path.is_file() {
                // Determine extension
                let ext_str = path.extension()
                    .map(|ext| ext.to_string_lossy().to_ascii_lowercase())
                    .unwrap_or_default();

                // Skip standard shortcuts/exes in user folders to prevent duplication with system apps
                if ext_str == "lnk" || ext_str == "exe" {
                    // But if it is on the Desktop, we want to allow it!
                    if !path.starts_with(user_profile_path.join("Desktop")) {
                        continue;
                    }
                }

                if let Some(name) = path.file_name() {
                    let name_str = name.to_string_lossy().to_string();
                    entries.push(AppEntry {
                        name_lower: name_str.to_lowercase(),
                        name: name_str,
                        path: path.to_string_lossy().to_string(),
                        entry_type: "file".to_string(),
                    });
                    count += 1;
                }
            } else if path.is_dir() {
                // If it is a directory, don't index the root scanned folders themselves
                if folders_to_scan.contains(&path.to_path_buf()) {
                    continue;
                }

                if let Some(name) = path.file_name() {
                    let name_str = name.to_string_lossy().to_string();
                    entries.push(AppEntry {
                        name_lower: name_str.to_lowercase(),
                        name: name_str,
                        path: path.to_string_lossy().to_string(),
                        entry_type: "folder".to_string(),
                    });
                    count += 1;
                }
            }
        }
    }
}

/// Recursively scan a directory for .lnk files
fn scan_directory(dir: &PathBuf, entries: &mut Vec<AppEntry>) {
    if let Ok(walker) = std::fs::read_dir(dir) {
        for entry in walker.flatten() {
            let path = entry.path();

            if path.is_dir() {
                scan_directory(&path, entries);
                continue;
            }

            if let Some(ext) = path.extension() {
                if ext.to_ascii_lowercase() == "lnk" {
                    if let Some(name) = path.file_stem() {
                        let name_str = name.to_string_lossy().to_string();

                        // Try to resolve the .lnk target
                        let target_path = resolve_lnk_target(&path)
                            .unwrap_or_else(|| path.to_string_lossy().to_string());

                        entries.push(AppEntry {
                            name_lower: name_str.to_lowercase(),
                            name: name_str,
                            path: target_path,
                            entry_type: "app".to_string(),
                        });
                    }
                } else if ext.to_ascii_lowercase() == "exe" {
                    if let Some(name) = path.file_stem() {
                        let name_str = name.to_string_lossy().to_string();
                        entries.push(AppEntry {
                            name_lower: name_str.to_lowercase(),
                            name: name_str,
                            path: path.to_string_lossy().to_string(),
                            entry_type: "app".to_string(),
                        });
                    }
                }
            }
        }
    }
}

/// Try to resolve the target path of a .lnk file safely
fn resolve_lnk_target(lnk_path: &PathBuf) -> Option<String> {
    let lnk_path_clone = lnk_path.clone();
    let result = std::panic::catch_unwind(|| {
        match lnk::ShellLink::open(&lnk_path_clone) {
            Ok(shell_link) => {
                if let Some(link_info) = shell_link.link_info() {
                    if let Some(local_path) = link_info.local_base_path() {
                        return Some(local_path.to_string());
                    }
                }
                None
            }
            Err(_) => None,
        }
    });

    match result {
        Ok(Some(path)) => Some(path),
        _ => Some(lnk_path.to_string_lossy().to_string()),
    }
}

/// Perform a fuzzy search against the index
pub fn perform_search(query: &str) -> Vec<SearchResult> {
    let query_lower = query.to_lowercase();

    let index = match APP_INDEX.get() {
        Some(idx) => idx,
        None => return Vec::new(),
    };

    let entries = match index.lock() {
        Ok(e) => e,
        Err(_) => return Vec::new(),
    };

    let mut results: Vec<SearchResult> = entries
        .iter()
        .filter_map(|entry| {
            let score_name = fuzzy_score(&query_lower, &entry.name_lower);

            // Path match (matches directory structures, folder names, etc.)
            let score_path = fuzzy_score(&query_lower, &entry.path.to_lowercase()) / 2;

            // Raw filename match (e.g. matching 'chrome.exe' or 'code.exe' directly)
            let score_file_name = if let Some(file_name) = std::path::Path::new(&entry.path).file_name() {
                let file_name_lower = file_name.to_string_lossy().to_lowercase();
                if file_name_lower != entry.name_lower {
                    fuzzy_score(&query_lower, &file_name_lower) * 4 / 5
                } else {
                    0
                }
            } else {
                0
            };

            let score = std::cmp::max(score_name, std::cmp::max(score_path, score_file_name));

            if score > 0 {
                Some(SearchResult {
                    name: entry.name.clone(),
                    path: entry.path.clone(),
                    result_type: entry.entry_type.clone(),
                    score,
                })
            } else {
                None
            }
        })
        .collect();

    // Sort by score descending
    results.sort_by(|a, b| b.score.cmp(&a.score));

    // Return top 8 results
    results.truncate(8);
    results
}

/// Simple fuzzy scoring algorithm
/// Returns score > 0 for matches, 0 for non-matches
fn fuzzy_score(query: &str, name: &str) -> i64 {
    if query.is_empty() {
        return 1;
    }

    let query_chars: Vec<char> = query.chars().collect();
    let name_chars: Vec<char> = name.chars().collect();

    let mut score: i64 = 0;
    let mut query_idx = 0;
    let mut prev_match_idx: i64 = -2;
    let mut first_match_idx: i64 = -1;

    for (i, &nc) in name_chars.iter().enumerate() {
        if query_idx < query_chars.len() && nc == query_chars[query_idx] {
            if first_match_idx == -1 {
                first_match_idx = i as i64;
            }

            // Consecutive match bonus
            if i as i64 == prev_match_idx + 1 {
                score += 8;
            }

            // Word boundary bonus
            if i == 0
                || name_chars.get(i - 1).map_or(false, |&c| {
                    c == ' ' || c == '-' || c == '_' || c == '.'
                })
            {
                score += 10;
            }

            // Exact prefix bonus
            if query_idx == i {
                score += 6;
            }

            score += 4; // Base match
            prev_match_idx = i as i64;
            query_idx += 1;
        }
    }

    // All query characters must match
    if query_idx < query_chars.len() {
        return 0;
    }

    // Bonus for shorter names
    score += std::cmp::max(0, 20 - name_chars.len() as i64);

    // Penalty for late first match
    score -= first_match_idx * 2;

    std::cmp::max(score, 1)
}
