use std::{
    fs::{self, File},
    path::Path,
};

use rayon::iter::{IntoParallelRefIterator, ParallelIterator};

fn download_image(url: &str) {
    let client = reqwest::blocking::Client::new();
    let mut response = client.get(url).send().unwrap();
    let mut strct: Vec<&str> = url.split("/").collect();
    let file_name = strct.pop().unwrap();
    let subdir = strct.pop().unwrap();
    fs::create_dir_all(format!(
        "/Users/lex3man/Projects/FountCore/AS_tauri_version/src-tauri/src/tests/downloaded/{}/",
        subdir
    ))
    .unwrap();
    let file_path = format!(
        "/Users/lex3man/Projects/FountCore/AS_tauri_version/src-tauri/src/tests/downloaded/{}/{}",
        subdir, file_name
    );
    if let Ok(mut file) = File::create(file_path) {
        std::io::copy(&mut response, &mut file).unwrap();
    }
}

#[test]
fn load_images_test() {
    let test_response_file_path = "/Users/lex3man/Projects/FountCore/AS_tauri_version/src-tauri/src/tests/data/full_race.json";
    let request = fs::read_to_string(Path::new(test_response_file_path)).unwrap();
    let cfg =
        crate::utils::parser::upload_config(crate::utils::parser::FormatedData::Json(request));
    assert!(cfg.is_some());
    let binding = cfg.unwrap();
    let rb_images = &binding.areas.get("111111").unwrap().roadbook;
    assert_eq!(rb_images.len(), 18);
    fs::create_dir_all(
        "/Users/lex3man/Projects/FountCore/AS_tauri_version/src-tauri/src/tests/downloaded/",
    )
    .unwrap();
    rb_images.par_iter().for_each(|slide| {
        download_image(&slide.url);
    });
    assert!(Path::new("/Users/lex3man/Projects/FountCore/AS_tauri_version/src-tauri/src/tests/downloaded/18/rb001.png").exists());
    assert!(Path::new("/Users/lex3man/Projects/FountCore/AS_tauri_version/src-tauri/src/tests/downloaded/18/rb018.png").exists());
}
