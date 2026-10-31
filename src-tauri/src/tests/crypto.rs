//! At-rest encryption.
//!
//! Two layers are covered here. `Vault` is the envelope itself — sealing,
//! opening, and every way a stored value can fail to come back — and the free
//! functions are the fallback the app takes when no key could be derived.
//!
//! Nothing in this file may call `crypto::init`: the vault is a process-wide
//! `OnceLock`, all tests share one binary, and the first call would quietly
//! turn the no-key tests below into key-present ones. The vault is built
//! directly instead, which is also what lets two devices appear at once.

use crate::utils::crypto::{open, open_file, new_salt, seal, seal_file, Vault, SALT_LEN};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use serde_json::json;

const SALT: [u8; SALT_LEN] = [7u8; SALT_LEN];
/// What a sealed store value starts with, and what a sealed file starts with.
/// Spelled out rather than imported: a test that borrows the constant cannot
/// notice the constant changing.
const VALUE_MAGIC: &str = "ASE1.";
const FILE_MAGIC: &[u8] = b"ASE1\0";
/// A sealed payload carries its nonce in front of the ciphertext.
const NONCE_LEN: usize = 12;

fn device_a() -> Vault {
    Vault::derive("device-a", &SALT)
}

/// A stand-in for a roadbook slide: a recognisable header and a body big
/// enough that a cipher bug would not hide in the padding.
fn slide() -> Vec<u8> {
    let mut bytes = b"\x89PNG\r\n\x1a\nIHDR-roadbook-slide".to_vec();
    bytes.extend((0..4096u32).map(|i| (i.wrapping_mul(31).wrapping_add(7)) as u8));
    bytes
}

fn contains(haystack: &[u8], needle: &[u8]) -> bool {
    haystack.windows(needle.len()).any(|w| w == needle)
}

// ---------------------------------------------------------------- the cipher

#[test]
fn a_sealed_payload_comes_back_whole() {
    let vault = device_a();
    let plain = br#"{"lat":45.1,"lon":7.2}"#;

    let sealed = vault.seal_bytes(plain).expect("sealing works");
    assert_ne!(sealed.as_slice(), plain, "the payload must not be stored as it arrived");
    assert_eq!(vault.open_bytes(&sealed).as_deref(), Some(&plain[..]));
}

#[test]
fn the_same_payload_seals_differently_every_time() {
    // A fresh nonce per write: two stage configs that happen to be equal
    // must not produce equal ciphertext, or the file leaks that they match.
    let vault = device_a();
    let first = vault.seal_bytes(b"same").expect("sealing works");
    let second = vault.seal_bytes(b"same").expect("sealing works");
    assert_ne!(first, second);
    // Both still open, so the difference is the nonce and not a lost write.
    assert_eq!(vault.open_bytes(&first).as_deref(), Some(&b"same"[..]));
    assert_eq!(vault.open_bytes(&second).as_deref(), Some(&b"same"[..]));
}

#[test]
fn another_device_cannot_open_it() {
    // The point of the whole exercise: a store file copied off the device
    // decrypts nowhere else, because the device id is keying material and
    // is not in the file.
    let sealed = device_a().seal_bytes(b"roadbook").expect("sealing works");

    assert_eq!(Vault::derive("device-b", &SALT).open_bytes(&sealed), None);
}

#[test]
fn a_different_salt_cannot_open_it() {
    let sealed = device_a().seal_bytes(b"roadbook").expect("sealing works");

    assert_eq!(Vault::derive("device-a", &[9u8; SALT_LEN]).open_bytes(&sealed), None);
}

#[test]
fn the_same_device_derives_the_same_key_every_start() {
    // Restarting the app must not orphan what the last run wrote.
    let sealed = device_a().seal_bytes(b"after a restart").expect("sealing works");

    assert_eq!(
        device_a().open_bytes(&sealed).as_deref(),
        Some(&b"after a restart"[..])
    );
}

#[test]
fn tampering_is_rejected() {
    let vault = device_a();
    let mut sealed = vault.seal_bytes(b"roadbook").expect("sealing works");
    let last = sealed.len() - 1;
    sealed[last] ^= 0x01;

    assert_eq!(vault.open_bytes(&sealed), None, "GCM must reject an edited payload");
}

#[test]
fn an_edited_nonce_is_rejected() {
    let vault = device_a();
    let mut sealed = vault.seal_bytes(b"roadbook").expect("sealing works");
    sealed[0] ^= 0x01;

    assert_eq!(vault.open_bytes(&sealed), None);
}

#[test]
fn a_truncated_payload_is_rejected() {
    let vault = device_a();
    let sealed = vault.seal_bytes(b"roadbook").expect("sealing works");

    // A write cut short by a full storage: too short to hold a nonce at all,
    // exactly a nonce and nothing else, and a clipped tag.
    assert_eq!(vault.open_bytes(&sealed[..NONCE_LEN - 1]), None);
    assert_eq!(vault.open_bytes(&sealed[..NONCE_LEN]), None);
    assert_eq!(vault.open_bytes(&sealed[..sealed.len() - 1]), None);
    assert_eq!(vault.open_bytes(&[]), None);
}

#[test]
fn an_empty_payload_round_trips() {
    let vault = device_a();
    let sealed = vault.seal_bytes(b"").expect("sealing works");

    assert!(sealed.len() > NONCE_LEN, "nonce and tag are still there");
    assert_eq!(vault.open_bytes(&sealed).as_deref(), Some(&b""[..]));
}

#[test]
fn a_whole_slide_round_trips() {
    // Slides are the largest thing sealed, and the only binary one.
    let vault = device_a();
    let plain = slide();
    let sealed = vault.seal_bytes(&plain).expect("sealing works");

    assert!(
        !contains(&sealed, &plain[..16]),
        "the slide header must not survive into the stored bytes"
    );
    assert_eq!(vault.open_bytes(&sealed), Some(plain));
}

// ---------------------------------------------------------- store values

#[test]
fn a_stored_value_is_marked_and_unreadable() {
    let vault = device_a();
    let sealed = vault.seal_value(json!({"speed_limit": 50, "name": "DZ-7"}));

    let text = sealed.as_str().expect("a sealed value is stored as text");
    let body = text.strip_prefix(VALUE_MAGIC).expect("the marker names the format");
    let bytes = BASE64.decode(body).expect("the body is base64");
    assert!(!contains(&bytes, b"speed_limit"), "field names must not be left in the clear");
    assert!(!contains(&bytes, b"DZ-7"));
}

#[test]
fn every_json_shape_survives_the_round_trip() {
    // The store holds the whole race state, so whatever serde produces has
    // to come back as the same value — not merely as something parseable.
    let vault = device_a();
    let value = json!({
        "etape": "Этап 31101",
        "points": [{"lat": 45.123456, "lon": -7.5, "odo": 0}],
        "limits": [30, 50, 90],
        "finished": false,
        "last_report": null,
        "sequence": 18446744073709551615u64,
    });

    assert_eq!(vault.open_value(vault.seal_value(value.clone())), Some(value));
}

#[test]
fn a_bare_value_survives_the_round_trip() {
    // Half the store is plain strings and numbers rather than objects.
    let vault = device_a();
    for value in [json!("3e8bb6fa862e243f"), json!(42), json!(0.0), json!(true), json!(null)] {
        assert_eq!(vault.open_value(vault.seal_value(value.clone())), Some(value));
    }
}

#[test]
fn a_value_from_another_device_reads_as_nothing_stored() {
    let sealed = device_a().seal_value(json!({"race_number": "77"}));

    assert_eq!(Vault::derive("device-b", &SALT).open_value(sealed), None);
}

#[test]
fn an_edited_value_reads_as_nothing_stored() {
    let vault = device_a();
    let sealed = vault.seal_value(json!("77"));
    let body = sealed.as_str().unwrap().strip_prefix(VALUE_MAGIC).unwrap();

    // Re-encoded after the edit, so this is well-formed base64 of the wrong
    // ciphertext rather than a value that fails before it reaches the cipher.
    let mut bytes = BASE64.decode(body).expect("the body is base64");
    let last = bytes.len() - 1;
    bytes[last] ^= 0x01;
    let edited = json!(format!("{}{}", VALUE_MAGIC, BASE64.encode(&bytes)));

    assert_eq!(vault.open_value(edited), None);
}

#[test]
fn a_marked_value_that_is_not_a_payload_reads_as_nothing_stored() {
    let vault = device_a();

    // Not base64 at all, base64 of too few bytes to be a payload, and the
    // marker on its own.
    assert_eq!(vault.open_value(json!("ASE1.not base64 ###")), None);
    assert_eq!(vault.open_value(json!(format!("{}{}", VALUE_MAGIC, BASE64.encode([1, 2, 3])))), None);
    assert_eq!(vault.open_value(json!(VALUE_MAGIC)), None);
}

#[test]
fn values_from_an_older_install_still_read() {
    // The migration path: an install written before any of this existed is
    // opened with the key already derived, and must come back untouched
    // until the next write seals it.
    let vault = device_a();
    for value in [json!({"speed_limit": 50}), json!("plain"), json!(7), json!(null)] {
        assert_eq!(vault.open_value(value.clone()), Some(value));
    }
    // "ASE1" without the separator is somebody else's string, not a payload.
    assert_eq!(vault.open_value(json!("ASE1")), Some(json!("ASE1")));
}

// ----------------------------------------------------------------- slides

#[test]
fn a_slide_is_marked_and_round_trips() {
    let vault = device_a();
    let plain = slide();
    let stored = vault.seal_file_bytes(&plain);

    assert!(stored.starts_with(FILE_MAGIC), "the marker names the format");
    assert!(!contains(&stored, &plain[..16]), "the PNG header must not survive");
    assert_eq!(vault.open_file_bytes(stored), Some(plain));
}

#[test]
fn a_slide_from_another_device_is_refused() {
    // What makes get_roadbook_image report a slide it cannot decrypt rather
    // than hand the webview ciphertext to render.
    let stored = device_a().seal_file_bytes(&slide());

    assert_eq!(Vault::derive("device-b", &SALT).open_file_bytes(stored), None);
}

#[test]
fn a_half_written_slide_is_refused() {
    let vault = device_a();
    let mut stored = vault.seal_file_bytes(&slide());
    stored.truncate(stored.len() / 2);

    assert_eq!(vault.open_file_bytes(stored), None);
    // The marker and nothing behind it — an interrupted first write.
    assert_eq!(vault.open_file_bytes(FILE_MAGIC.to_vec()), None);
}

#[test]
fn slides_from_an_older_build_pass_through() {
    let vault = device_a();
    let plain = slide();
    assert_eq!(vault.open_file_bytes(plain.clone()), Some(plain));

    // Shorter than the marker, and the value marker rather than the file one:
    // neither is a sealed slide.
    assert_eq!(vault.open_file_bytes(b"ASE".to_vec()), Some(b"ASE".to_vec()));
    let lookalike = b"ASE1.still a png".to_vec();
    assert_eq!(vault.open_file_bytes(lookalike.clone()), Some(lookalike));
    assert_eq!(vault.open_file_bytes(vec![]), Some(vec![]));
}

// ------------------------------------------------------------ with no key

#[test]
fn without_a_key_everything_is_stored_as_it_was_before() {
    // No vault is initialised in this process, so these exercise the
    // fallback a platform that cannot report a device id takes.
    assert_eq!(seal(json!({"speed_limit": 50})), json!({"speed_limit": 50}));
    assert_eq!(open(Some(json!({"speed_limit": 50}))), Some(json!({"speed_limit": 50})));
    assert_eq!(open(None), None);

    let plain = slide();
    assert_eq!(seal_file(&plain), plain);
    assert_eq!(open_file(plain.clone()), Some(plain));
}

#[test]
fn without_a_key_sealed_data_reads_as_nothing_stored() {
    // A store carried over from a build that could derive a key: the text is
    // ciphertext, and passing it on would persist it as if it were the value.
    let sealed = device_a().seal_value(json!("77"));
    assert_eq!(open(Some(sealed)), None);

    let stored = device_a().seal_file_bytes(&slide());
    assert_eq!(open_file(stored), None);
}

// ------------------------------------------------------------------- salt

#[test]
fn a_fresh_salt_is_sixteen_unpredictable_bytes() {
    let first = new_salt().expect("the system has randomness");
    let second = new_salt().expect("the system has randomness");

    assert_eq!(BASE64.decode(&first).expect("base64").len(), SALT_LEN);
    assert_ne!(first, second, "every install salts its own key");
}
