use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE_NAME: &str = "slackteams";

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenResult {
    pub success: bool,
    pub error: Option<String>,
    pub value: Option<String>,
}

#[tauri::command]
pub fn store_token(key: String, value: String) -> TokenResult {
    match Entry::new(SERVICE_NAME, &key) {
        Ok(entry) => match entry.set_password(&value) {
            Ok(_) => TokenResult {
                success: true,
                error: None,
                value: None,
            },
            Err(e) => TokenResult {
                success: false,
                error: Some(format!("Failed to store token: {}", e)),
                value: None,
            },
        },
        Err(e) => TokenResult {
            success: false,
            error: Some(format!("Failed to create keyring entry: {}", e)),
            value: None,
        },
    }
}

#[tauri::command]
pub fn get_token(key: String) -> TokenResult {
    match Entry::new(SERVICE_NAME, &key) {
        Ok(entry) => match entry.get_password() {
            Ok(password) => TokenResult {
                success: true,
                error: None,
                value: Some(password),
            },
            Err(keyring::Error::NoEntry) => TokenResult {
                success: true,
                error: None,
                value: None,
            },
            Err(e) => TokenResult {
                success: false,
                error: Some(format!("Failed to get token: {}", e)),
                value: None,
            },
        },
        Err(e) => TokenResult {
            success: false,
            error: Some(format!("Failed to create keyring entry: {}", e)),
            value: None,
        },
    }
}

#[tauri::command]
pub fn delete_token(key: String) -> TokenResult {
    match Entry::new(SERVICE_NAME, &key) {
        Ok(entry) => match entry.delete_credential() {
            Ok(_) => TokenResult {
                success: true,
                error: None,
                value: None,
            },
            Err(keyring::Error::NoEntry) => TokenResult {
                success: true,
                error: None,
                value: None,
            },
            Err(e) => TokenResult {
                success: false,
                error: Some(format!("Failed to delete token: {}", e)),
                value: None,
            },
        },
        Err(e) => TokenResult {
            success: false,
            error: Some(format!("Failed to create keyring entry: {}", e)),
            value: None,
        },
    }
}
