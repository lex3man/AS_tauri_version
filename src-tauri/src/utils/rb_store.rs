use std::io::Write;

use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use tauri_plugin_android_fs::{AndroidFsExt, PrivateDir, Result};

use crate::race::types::RBSlide;

pub async fn download_images(
    app: tauri::AppHandle<impl tauri::Runtime>,
    links: &Vec<RBSlide>,
) -> Result<()> {
    let ps = app.android_fs_async().private_storage();

    let cache_dir_path: std::path::PathBuf = ps.resolve_path(PrivateDir::Cache).await?;
    let cache_dir_path = cache_dir_path.join("roadbooks");

    links.par_iter().for_each(|slide| {
        let client = reqwest::blocking::Client::new();
        let response = client.get(&slide.url).send().unwrap();
        let mut strct: Vec<&str> = slide.url.split("/").collect();
        let file_name = strct.pop().unwrap();
        let subdir = strct.pop().unwrap();
        let file_path = cache_dir_path.join(format!("{}/{}", subdir, file_name));
        std::fs::create_dir_all(file_path.parent().unwrap()).unwrap();
        if let Ok(mut file) = std::fs::File::create(file_path) {
            file.write_all(&response.bytes().unwrap()).unwrap();
        }
    });

    Ok(())
}
