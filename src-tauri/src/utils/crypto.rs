//! At-rest encryption for everything the app keeps on the device.
//!
//! What this protects against, and what it does not, is worth being exact
//! about. The key is derived on the device from a build-time secret and the
//! device's own identifier, so:
//!
//! * a store file or a roadbook slide copied off the device — pulled from a
//!   backup, lifted off a shared card, handed to someone else — decrypts
//!   nowhere else, because the device identifier is not in the file;
//! * nothing on disk reads as JSON or as an image any more, so the race
//!   configuration is not there for the picking with a file manager;
//! * it does **not** stop someone who can run code as this app on this
//!   device (root, or a debuggable build): they can derive the same key the
//!   app does. Keeping a secret from the owner of the device needs a key
//!   that never lands on it at all, which is a different design.
//!
//! The build secret can be set at compile time with `AS_STORAGE_SECRET`.
//! Changing it, or moving the data to another device, makes existing stored
//! data undecryptable — every read treats that as "nothing stored", so the
//! app starts clean instead of dying.
//!
//! The envelope work lives on `Vault` rather than in the free functions, and
//! the free functions are only the "is there a key?" fork around it. That is
//! what makes the thing testable: the vault is a process-wide `OnceLock` that
//! can be set exactly once, so a test that initialised it would decide the
//! answer for every other test in the binary. Tests drive `Vault` directly.

use std::sync::OnceLock;

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use hkdf::Hkdf;
use serde_json::Value;
use sha2::Sha256;

/// Marks a sealed payload, and carries the format version so a later change
/// of cipher or key schedule can be told apart from this one rather than
/// decrypted as garbage.
const MAGIC: &str = "ASE1.";
/// The same marker for files, where there is no string to prefix.
const FILE_MAGIC: &[u8; 5] = b"ASE1\0";
const NONCE_LEN: usize = 12;
pub const SALT_LEN: usize = 16;

/// Overridable at build time; the fallback only keeps a source tree without
/// the variable set from being a special case.
fn build_secret() -> &'static str {
    option_env!("AS_STORAGE_SECRET").unwrap_or("adventuresmart/storage/v1")
}

pub struct Vault {
    key: [u8; 32],
}

impl Vault {
    pub(crate) fn derive(device_id: &str, salt: &[u8]) -> Self {
        // Device id goes into the keying material, not the salt: the salt is
        // stored in the clear next to the data, and the whole point is that
        // the device identifier is not.
        let ikm = format!("{}|{}", build_secret(), device_id);
        let hk = Hkdf::<Sha256>::new(Some(salt), ikm.as_bytes());
        let mut key = [0u8; 32];
        hk.expand(b"adventuresmart-at-rest", &mut key)
            .expect("32 bytes is a valid HKDF output length");
        Self { key }
    }

    fn cipher(&self) -> Aes256Gcm {
        Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&self.key))
    }

    pub(crate) fn seal_bytes(&self, plain: &[u8]) -> Option<Vec<u8>> {
        let mut nonce = [0u8; NONCE_LEN];
        getrandom::getrandom(&mut nonce).ok()?;
        let ct = self.cipher().encrypt(Nonce::from_slice(&nonce), plain).ok()?;
        let mut out = Vec::with_capacity(NONCE_LEN + ct.len());
        out.extend_from_slice(&nonce);
        out.extend_from_slice(&ct);
        Some(out)
    }

    pub(crate) fn open_bytes(&self, sealed: &[u8]) -> Option<Vec<u8>> {
        if sealed.len() <= NONCE_LEN {
            return None;
        }
        let (nonce, ct) = sealed.split_at(NONCE_LEN);
        self.cipher().decrypt(Nonce::from_slice(nonce), ct).ok()
    }

    /// A store value on its way to disk: JSON text, sealed, base64, marked.
    pub(crate) fn seal_value(&self, value: Value) -> Value {
        let Ok(plain) = serde_json::to_vec(&value) else {
            return value;
        };
        match self.seal_bytes(&plain) {
            Some(sealed) => Value::String(format!("{}{}", MAGIC, BASE64.encode(sealed))),
            None => value,
        }
    }

    /// The way back. An unmarked value is one an older build wrote and is
    /// returned as it is; a marked one that will not decrypt yields `None`.
    pub(crate) fn open_value(&self, value: Value) -> Option<Value> {
        let Some(text) = value.as_str() else {
            return Some(value);
        };
        let Some(b64) = text.strip_prefix(MAGIC) else {
            return Some(value);
        };
        let sealed = BASE64.decode(b64).ok()?;
        let plain = self.open_bytes(&sealed)?;
        serde_json::from_slice(&plain).ok()
    }

    pub(crate) fn seal_file_bytes(&self, plain: &[u8]) -> Vec<u8> {
        match self.seal_bytes(plain) {
            Some(sealed) => {
                let mut out = Vec::with_capacity(FILE_MAGIC.len() + sealed.len());
                out.extend_from_slice(FILE_MAGIC);
                out.extend_from_slice(&sealed);
                out
            }
            None => plain.to_vec(),
        }
    }

    pub(crate) fn open_file_bytes(&self, stored: Vec<u8>) -> Option<Vec<u8>> {
        if !stored.starts_with(FILE_MAGIC) {
            return Some(stored);
        }
        self.open_bytes(&stored[FILE_MAGIC.len()..])
    }
}

static VAULT: OnceLock<Option<Vault>> = OnceLock::new();

/// Derive the process-wide key. Called once, before anything reads the store.
///
/// A global rather than a field threaded through every caller: there are
/// fifty-odd places that write to the store, the key is the same for all of
/// them and never changes after startup, and passing it down would have
/// meant borrowing state in places that are already mutating it.
pub fn init(device_id: &str, salt: &[u8]) {
    let _ = VAULT.set(Some(Vault::derive(device_id, salt)));
}

/// Fresh salt for a first run.
pub fn new_salt() -> Option<String> {
    let mut salt = [0u8; SALT_LEN];
    getrandom::getrandom(&mut salt).ok()?;
    Some(BASE64.encode(salt))
}

fn vault() -> Option<&'static Vault> {
    VAULT.get().and_then(|v| v.as_ref())
}

/// Wrap a value on its way into the store.
///
/// With no vault — a platform where the device id could not be read — the
/// value passes through untouched. Refusing to store anything would be worse
/// than storing it the way every build before this one did.
pub fn seal(value: impl Into<Value>) -> Value {
    let value = value.into();
    match vault() {
        Some(vault) => vault.seal_value(value),
        None => value,
    }
}

/// Unwrap a value on its way out of the store.
///
/// A value without the marker is returned as it is: that is what an install
/// written by an older build looks like, and it keeps working until the next
/// write seals it. A value that *is* marked but will not decrypt yields
/// `None` — the data belongs to another device or another build secret, and
/// the caller treats it as nothing stored.
pub fn open(value: Option<Value>) -> Option<Value> {
    let value = value?;
    let Some(vault) = vault() else {
        // Without a key a marked value is ciphertext and nothing else:
        // handing back the `ASE1.…` text would have the caller persist it
        // as if it were the race number or the last report.
        return match value.as_str() {
            Some(text) if text.starts_with(MAGIC) => None,
            _ => Some(value),
        };
    };
    vault.open_value(value)
}

/// Wrap file bytes — roadbook slides. Returns the bytes unchanged when there
/// is no vault, for the same reason `seal` does.
pub fn seal_file(plain: &[u8]) -> Vec<u8> {
    match vault() {
        Some(vault) => vault.seal_file_bytes(plain),
        None => plain.to_vec(),
    }
}

/// Unwrap file bytes. Unmarked content is a slide cached by an older build
/// and is handed back as it is.
pub fn open_file(stored: Vec<u8>) -> Option<Vec<u8>> {
    match vault() {
        Some(vault) => vault.open_file_bytes(stored),
        None if stored.starts_with(FILE_MAGIC) => None,
        None => Some(stored),
    }
}
