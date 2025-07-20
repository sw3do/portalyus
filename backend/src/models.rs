use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Channel {
    pub id: Uuid,
    pub name: String,
    pub image: Option<String>,
    pub slug: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateChannel {
    pub name: String,
    pub image: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCategory {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Video {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub slug: String,
    pub thumbnail: Option<String>,
    pub video_file: String,
    pub duration: Option<String>,
    pub views: i32,
    pub is_featured: bool,
    pub channel_id: Uuid,
    pub category_id: Uuid,
    pub disk_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateVideo {
    pub title: String,
    pub description: Option<String>,
    pub channel_id: Uuid,
    pub category_id: Uuid,
    pub is_featured: Option<bool>,
    pub video_file: Option<String>,
    pub thumbnail: Option<String>,
    pub disk_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct VideoWithDetails {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub slug: String,
    pub thumbnail: Option<String>,
    pub video_file: String,
    pub duration: Option<String>,
    pub views: i32,
    pub is_featured: bool,
    pub created_at: DateTime<Utc>,
    pub channel_name: String,
    pub channel_slug: String,
    pub channel_profile_image: Option<String>,
    pub category_name: String,
    pub category_slug: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct DiskStorage {
    pub id: Uuid,
    pub name: String,
    pub path: String,
    pub total_space: i64,
    pub used_space: i64,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDiskStorage {
    pub name: String,
    pub path: String,
    #[serde(deserialize_with = "deserialize_string_to_i64")]
    pub total_space: i64,
    pub is_active: Option<bool>,
}

fn deserialize_string_to_i64<'de, D>(deserializer: D) -> Result<i64, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Error;
    let s = String::deserialize(deserializer)?;
    s.parse::<i64>().map_err(D::Error::custom)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemDiskInfo {
    pub name: String,
    pub path: String,
    pub total_space: u64,
    pub used_space: u64,
    pub available_space: u64,
    pub mount_point: String,
}

#[derive(Debug)]
pub struct DiskSpaceInfo {
    pub total: u64,
    pub available: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            message: Some(message),
        }
    }
}