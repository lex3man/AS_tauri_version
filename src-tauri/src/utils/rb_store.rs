use std::collections::HashMap;

use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use tauri_plugin_android_fs::{AndroidFsExt, PrivateDir, Result};

use crate::race::types::RBSlide;

const MANIFEST_FILE: &str = "manifest.json";

/// Per-slide change fingerprint cache: maps a roadbook image URL to the
/// ETag/Last-Modified value it had the last time it was actually downloaded.
/// Persisted alongside the cached images so it survives app restarts, and
/// keyed by URL (which already includes the SU's own path segment), so
/// re-entering an unchanged day code re-checks every image cheaply instead
/// of re-downloading the whole roadbook.
fn load_manifest(path: &std::path::Path) -> HashMap<String, String> {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

fn save_manifest(path: &std::path::Path, manifest: &HashMap<String, String>) {
    if let Ok(content) = serde_json::to_string(manifest) {
        let _ = std::fs::write(path, content);
    }
}

/// Extracts a change fingerprint from response headers — ETag when the
/// server provides one, else Last-Modified — tagged with which kind it is
/// so a later request can send it back as the matching conditional header.
/// None means the server gave us nothing to compare against, so the slide
/// is always re-downloaded.
fn fingerprint(headers: &reqwest::header::HeaderMap) -> Option<String> {
    if let Some(v) = headers
        .get(reqwest::header::ETAG)
        .and_then(|v| v.to_str().ok())
    {
        return Some(format!("etag:{}", v));
    }
    headers
        .get(reqwest::header::LAST_MODIFIED)
        .and_then(|v| v.to_str().ok())
        .map(|v| format!("lm:{}", v))
}

/// Turns a stored fingerprint back into the conditional-request header that
/// produced it. Returns None for a fingerprint saved by an older build of
/// this cache (no tag prefix) — that slide just does one untagged GET and
/// gets a freshly-tagged fingerprint going forward.
fn conditional_header(fp: &str) -> Option<(reqwest::header::HeaderName, &str)> {
    if let Some(v) = fp.strip_prefix("etag:") {
        Some((reqwest::header::IF_NONE_MATCH, v))
    } else if let Some(v) = fp.strip_prefix("lm:") {
        Some((reqwest::header::IF_MODIFIED_SINCE, v))
    } else {
        None
    }
}

pub async fn download_images(
    app: tauri::AppHandle<impl tauri::Runtime>,
    links: &Vec<RBSlide>,
) -> Result<()> {
    let ps = app.android_fs_async().private_storage();

    let cache_dir_path: std::path::PathBuf = ps.resolve_path(PrivateDir::Cache).await?;
    let cache_dir_path = cache_dir_path.join("roadbooks");
    let _ = std::fs::create_dir_all(&cache_dir_path);

    let manifest_path = cache_dir_path.join(MANIFEST_FILE);
    let manifest = load_manifest(&manifest_path);

    // One shared, connection-pooling client for every slide in this call.
    let client = reqwest::blocking::Client::new();

    // Per-slide change check, run in parallel: a single conditional GET
    // (If-None-Match / If-Modified-Since from the cached fingerprint) either
    // comes back 304 Not Modified — no body, nothing to write — or a fresh
    // 200 body to save. One round trip per slide either way, instead of a
    // separate HEAD-then-GET pair.
    let results: Vec<(String, Option<String>)> = links
        .par_iter()
        .map(|slide| {
            let mut strct: Vec<&str> = slide.url.split("/").collect();
            let file_name = strct.pop().unwrap();
            let subdir = strct.pop().unwrap();
            let file_path = cache_dir_path.join(format!("{}/{}", subdir, file_name));
            let cached_fingerprint = manifest.get(&slide.url).cloned();

            let mut request = client.get(&slide.url);
            if file_path.exists() {
                if let Some((name, value)) = cached_fingerprint
                    .as_deref()
                    .and_then(conditional_header)
                {
                    request = request.header(name, value);
                }
            }

            let response = match request.send() {
                Ok(r) => r,
                Err(_) => return (slide.url.clone(), cached_fingerprint),
            };

            if response.status() == reqwest::StatusCode::NOT_MODIFIED {
                // Unchanged — keep the cached file, nothing to download.
                return (slide.url.clone(), cached_fingerprint);
            }
            if !response.status().is_success() {
                // Fetch failed (404/500/...) — don't overwrite a good cached
                // file with an error body, and don't cache this failure as
                // "the current state": keep whatever fingerprint we had (or
                // none) so the next config pull retries instead of treating
                // the slide as up to date.
                return (slide.url.clone(), cached_fingerprint);
            }

            let new_fingerprint = fingerprint(response.headers()).or_else(|| cached_fingerprint.clone());
            let saved = response.bytes().is_ok_and(|bytes| {
                std::fs::create_dir_all(file_path.parent().unwrap()).is_ok()
                    && std::fs::write(&file_path, &bytes).is_ok()
            });
            if saved {
                (slide.url.clone(), new_fingerprint)
            } else {
                // Body read or disk write failed — don't cache a fingerprint
                // for content that never actually made it to disk.
                (slide.url.clone(), cached_fingerprint)
            }
        })
        .collect();

    let mut manifest = manifest;
    for (url, fp) in results {
        match fp {
            Some(fp) => {
                manifest.insert(url, fp);
            }
            None => {
                manifest.remove(&url);
            }
        }
    }
    save_manifest(&manifest_path, &manifest);

    Ok(())
}
