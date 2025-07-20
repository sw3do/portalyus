use axum::{
    extract::{Multipart, State, FromRef, Query},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;
use std::{
    fs::{self},
    io::{Write},
    path::{Path, PathBuf},
    collections::HashMap,
};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use crate::{
    database::{get_available_disk, update_disk_usage},
    models::ApiResponse,
};

#[derive(Clone)]
pub struct UploadConfig {
    pub upload_dir: String,
    pub max_file_size: usize,
}

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub upload_config: UploadConfig,
}

impl FromRef<AppState> for PgPool {
    fn from_ref(state: &AppState) -> PgPool {
        state.pool.clone()
    }
}

impl FromRef<AppState> for UploadConfig {
    fn from_ref(state: &AppState) -> UploadConfig {
        state.upload_config.clone()
    }
}

impl Default for UploadConfig {
    fn default() -> Self {
        Self {
            upload_dir: "uploads".to_string(),
            max_file_size: 500 * 1024 * 1024, // 500MB
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct ChunkUploadRequest {
    pub chunk_number: u32,
    pub total_chunks: u32,
    pub chunk_size: u64,
    pub total_size: u64,
    pub file_name: String,
    pub upload_id: Option<String>,
}

#[derive(Serialize)]
pub struct ChunkUploadResponse {
    pub upload_id: String,
    pub chunk_number: u32,
    pub uploaded: bool,
    pub next_chunk: Option<u32>,
    pub completed: bool,
    pub file_path: Option<String>,
    pub disk_location: Option<String>,
    pub file_size: Option<u64>,
    pub disk_id: Option<String>,
}

#[derive(Serialize)]
pub struct UploadResponse {
    pub file_path: String,
    pub disk_location: String,
    pub file_size: u64,
}

#[derive(Serialize)]
pub struct UploadStatusResponse {
    pub upload_id: String,
    pub uploaded_chunks: Vec<u32>,
    pub total_chunks: u32,
    pub completed: bool,
    pub file_path: Option<String>,
}

fn get_temp_dir() -> PathBuf {
    PathBuf::from("uploads/temp")
}

fn get_chunk_file_path(upload_id: &str, chunk_number: u32) -> PathBuf {
    get_temp_dir().join(format!("{}_chunk_{}", upload_id, chunk_number))
}

fn get_upload_info_path(upload_id: &str) -> PathBuf {
    get_temp_dir().join(format!("{}_info.json", upload_id))
}

async fn save_upload_info(upload_id: &str, info: &ChunkUploadRequest) -> Result<(), std::io::Error> {
    let temp_dir = get_temp_dir();
    fs::create_dir_all(&temp_dir)?;
    
    let info_path = get_upload_info_path(upload_id);
    let info_json = serde_json::to_string(info).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    fs::write(info_path, info_json)?;
    Ok(())
}

pub async fn cleanup_expired_uploads() -> Result<(), std::io::Error> {
    let temp_dir = get_temp_dir();
    if !temp_dir.exists() {
        return Ok(());
    }
    
    let now = std::time::SystemTime::now();
    let expiry_duration = std::time::Duration::from_secs(24 * 60 * 60); // 24 hours
    
    if let Ok(entries) = fs::read_dir(&temp_dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(created) = metadata.created() {
                    if let Ok(elapsed) = now.duration_since(created) {
                        if elapsed > expiry_duration {
                            let path = entry.path();
                            if path.is_file() {
                                let _ = fs::remove_file(&path);
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(())
}

pub async fn cancel_upload(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    let upload_id = params.get("upload_id")
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let temp_dir = get_temp_dir();
    let mut removed_files = 0;
    
    if let Ok(entries) = fs::read_dir(&temp_dir) {
        for entry in entries.flatten() {
            if let Some(file_name) = entry.file_name().to_str() {
                if file_name.starts_with(&format!("{}_", upload_id)) {
                    if let Ok(_) = fs::remove_file(entry.path()) {
                        removed_files += 1;
                    }
                }
            }
        }
    }
    
    if removed_files > 0 {
        Ok(Json(ApiResponse::success("Upload iptal edildi".to_string())))
    } else {
        Ok(Json(ApiResponse::error("Upload bulunamadı".to_string())))
    }
}

async fn load_upload_info(upload_id: &str) -> Result<Option<ChunkUploadRequest>, std::io::Error> {
    let info_path = get_upload_info_path(upload_id);
    if !info_path.exists() {
        return Ok(None);
    }
    
    let info_json = fs::read_to_string(info_path)?;
    let info: ChunkUploadRequest = serde_json::from_str(&info_json)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    Ok(Some(info))
}

async fn get_uploaded_chunks(upload_id: &str) -> Vec<u32> {
    let temp_dir = get_temp_dir();
    let mut chunks = Vec::new();
    
    if let Ok(entries) = fs::read_dir(&temp_dir) {
        for entry in entries.flatten() {
            if let Some(file_name) = entry.file_name().to_str() {
                if file_name.starts_with(&format!("{}_chunk_", upload_id)) {
                    if let Some(chunk_str) = file_name.strip_prefix(&format!("{}_chunk_", upload_id)) {
                        if let Ok(chunk_num) = chunk_str.parse::<u32>() {
                            chunks.push(chunk_num);
                        }
                    }
                }
            }
        }
    }
    
    chunks.sort();
    chunks
}

async fn combine_chunks(upload_id: &str, info: &ChunkUploadRequest, final_path: &Path) -> Result<(), std::io::Error> {
    let mut final_file = fs::File::create(final_path)?;
    
    for chunk_num in 1..=info.total_chunks {
        let chunk_path = get_chunk_file_path(upload_id, chunk_num);
        if chunk_path.exists() {
            let chunk_data = fs::read(&chunk_path)?;
            final_file.write_all(&chunk_data)?;
            fs::remove_file(&chunk_path)?;
        }
    }
    
    let info_path = get_upload_info_path(upload_id);
    if info_path.exists() {
        fs::remove_file(&info_path)?;
    }
    
    Ok(())
}



pub async fn upload_video_chunk(
    State(pool): State<PgPool>,
    State(config): State<UploadConfig>,
    mut multipart: Multipart,
) -> Result<Json<ApiResponse<ChunkUploadResponse>>, StatusCode> {
    println!("Video chunk upload request received");
    let mut chunk_data: Option<Vec<u8>> = None;
    let mut upload_info: Option<ChunkUploadRequest> = None;
    
    while let Some(field) = multipart.next_field().await.map_err(|_| StatusCode::BAD_REQUEST)? {
        let name = field.name().unwrap_or("").to_string();
        
        match name.as_str() {
            "chunk" => {
                chunk_data = Some(field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?.to_vec());
            }
            "metadata" => {
                let metadata_str = String::from_utf8(
                    field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?.to_vec()
                ).map_err(|_| StatusCode::BAD_REQUEST)?;
                
                upload_info = Some(
                    serde_json::from_str::<ChunkUploadRequest>(&metadata_str)
                        .map_err(|_| StatusCode::BAD_REQUEST)?
                );
            }
            _ => {}
        }
    }
    
    let chunk_data = chunk_data.ok_or_else(|| {
        println!("No chunk data received");
        StatusCode::BAD_REQUEST
    })?;
    let mut info = upload_info.ok_or_else(|| {
        println!("No metadata received");
        StatusCode::BAD_REQUEST
    })?;
    
    println!("Received chunk {} of {} for file: {}", info.chunk_number, info.total_chunks, info.file_name);
    
    if chunk_data.len() > 10 * 1024 * 1024 {
        return Ok(Json(ApiResponse::error("Chunk boyutu çok büyük (max 10MB)".to_string())));
    }
    
    let upload_id = if let Some(id) = &info.upload_id {
        id.clone()
    } else {
        let new_id = Uuid::new_v4().to_string();
        info.upload_id = Some(new_id.clone());
        new_id
    };
    
    if info.total_size > config.max_file_size as u64 {
        return Ok(Json(ApiResponse::error("Dosya boyutu çok büyük".to_string())));
    }
    
    save_upload_info(&upload_id, &info)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let chunk_path = get_chunk_file_path(&upload_id, info.chunk_number);
    fs::create_dir_all(chunk_path.parent().unwrap())
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    fs::write(&chunk_path, &chunk_data)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let uploaded_chunks = get_uploaded_chunks(&upload_id).await;
    let completed = uploaded_chunks.len() == info.total_chunks as usize;
    
    if completed {
        let disk = get_available_disk(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .ok_or(StatusCode::INSUFFICIENT_STORAGE)?;
        
        let file_id = Uuid::new_v4();
        let extension = Path::new(&info.file_name)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("mp4");
        let new_filename = format!("{}.{}", file_id, extension);
        
        let disk_path = PathBuf::from(&disk.path);
        let final_path = disk_path.join(&new_filename);
        
        fs::create_dir_all(&disk_path)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        combine_chunks(&upload_id, &info, &final_path)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        update_disk_usage(&pool, disk.id, info.total_size as i64)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        return Ok(Json(ApiResponse::success(ChunkUploadResponse {
            upload_id,
            chunk_number: info.chunk_number,
            uploaded: true,
            next_chunk: None,
            completed: true,
            file_path: Some(new_filename),
            disk_location: Some(disk.name),
            file_size: Some(info.total_size),
            disk_id: Some(disk.id.to_string()),
        })));
    }
    
    let next_chunk = (1..=info.total_chunks)
        .find(|&chunk| !uploaded_chunks.contains(&chunk));
    
    Ok(Json(ApiResponse::success(ChunkUploadResponse {
        upload_id,
        chunk_number: info.chunk_number,
        uploaded: true,
        next_chunk,
        completed: false,
        file_path: None,
        disk_location: None,
        file_size: None,
        disk_id: None,
    })))
}

pub async fn get_upload_status(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<ApiResponse<UploadStatusResponse>>, StatusCode> {
    let upload_id = params.get("upload_id")
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let info = load_upload_info(upload_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;
    
    let uploaded_chunks = get_uploaded_chunks(upload_id).await;
    let completed = uploaded_chunks.len() == info.total_chunks as usize;
    
    Ok(Json(ApiResponse::success(UploadStatusResponse {
        upload_id: upload_id.clone(),
        uploaded_chunks,
        total_chunks: info.total_chunks,
        completed,
        file_path: None,
    })))
}

pub async fn upload_thumbnail_chunk(
    State(config): State<UploadConfig>,
    mut multipart: Multipart,
) -> Result<Json<ApiResponse<ChunkUploadResponse>>, StatusCode> {
    let mut chunk_data: Option<Vec<u8>> = None;
    let mut upload_info: Option<ChunkUploadRequest> = None;
    
    while let Some(field) = multipart.next_field().await.map_err(|_| StatusCode::BAD_REQUEST)? {
        let name = field.name().unwrap_or("").to_string();
        
        match name.as_str() {
            "chunk" => {
                chunk_data = Some(field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?.to_vec());
            }
            "metadata" => {
                let metadata_str = String::from_utf8(
                    field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?.to_vec()
                ).map_err(|_| StatusCode::BAD_REQUEST)?;
                
                upload_info = Some(
                    serde_json::from_str::<ChunkUploadRequest>(&metadata_str)
                        .map_err(|_| StatusCode::BAD_REQUEST)?
                );
            }
            _ => {}
        }
    }
    
    let chunk_data = chunk_data.ok_or(StatusCode::BAD_REQUEST)?;
    let mut info = upload_info.ok_or(StatusCode::BAD_REQUEST)?;
    
    if chunk_data.len() > 2 * 1024 * 1024 {
        return Ok(Json(ApiResponse::error("Chunk boyutu çok büyük (max 2MB)".to_string())));
    }
    
    if info.total_size > 5 * 1024 * 1024 {
        return Ok(Json(ApiResponse::error("Thumbnail boyutu çok büyük (max 5MB)".to_string())));
    }
    
    let upload_id = if let Some(id) = &info.upload_id {
        id.clone()
    } else {
        let new_id = Uuid::new_v4().to_string();
        info.upload_id = Some(new_id.clone());
        new_id
    };
    
    save_upload_info(&upload_id, &info)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let chunk_path = get_chunk_file_path(&upload_id, info.chunk_number);
    fs::create_dir_all(chunk_path.parent().unwrap())
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    fs::write(&chunk_path, &chunk_data)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let uploaded_chunks = get_uploaded_chunks(&upload_id).await;
    let completed = uploaded_chunks.len() == info.total_chunks as usize;
    
    if completed {
        let file_id = Uuid::new_v4();
        let extension = Path::new(&info.file_name)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("jpg");
        let new_filename = format!("{}.{}", file_id, extension);
        
        let thumbnails_dir = PathBuf::from(&config.upload_dir).join("thumbnails");
        fs::create_dir_all(&thumbnails_dir)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let final_path = thumbnails_dir.join(&new_filename);
        
        combine_chunks(&upload_id, &info, &final_path)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        return Ok(Json(ApiResponse::success(ChunkUploadResponse {
            upload_id,
            chunk_number: info.chunk_number,
            uploaded: true,
            next_chunk: None,
            completed: true,
            file_path: Some(format!("thumbnails/{}", new_filename)),
            disk_location: Some("local".to_string()),
            file_size: Some(info.total_size),
            disk_id: None,
        })));
    }
    
    let next_chunk = (1..=info.total_chunks)
        .find(|&chunk| !uploaded_chunks.contains(&chunk));
    
    Ok(Json(ApiResponse::success(ChunkUploadResponse {
        upload_id,
        chunk_number: info.chunk_number,
        uploaded: true,
        next_chunk,
        completed: false,
        file_path: None,
        disk_location: None,
        file_size: None,
        disk_id: None,
    })))
}



pub async fn upload_channel_image_chunk(
    State(config): State<UploadConfig>,
    mut multipart: Multipart,
) -> Result<Json<ApiResponse<ChunkUploadResponse>>, StatusCode> {
    let mut chunk_data: Option<Vec<u8>> = None;
    let mut upload_info: Option<ChunkUploadRequest> = None;
    
    while let Some(field) = multipart.next_field().await.map_err(|_| StatusCode::BAD_REQUEST)? {
        let name = field.name().unwrap_or("").to_string();
        
        match name.as_str() {
            "chunk" => {
                chunk_data = Some(field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?.to_vec());
            }
            "metadata" => {
                let metadata_str = String::from_utf8(
                    field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?.to_vec()
                ).map_err(|_| StatusCode::BAD_REQUEST)?;
                
                upload_info = Some(
                    serde_json::from_str::<ChunkUploadRequest>(&metadata_str)
                        .map_err(|_| StatusCode::BAD_REQUEST)?
                );
            }
            _ => {}
        }
    }
    
    let chunk_data = chunk_data.ok_or(StatusCode::BAD_REQUEST)?;
    let mut info = upload_info.ok_or(StatusCode::BAD_REQUEST)?;
    
    if chunk_data.len() > 1 * 1024 * 1024 {
        return Ok(Json(ApiResponse::error("Chunk boyutu çok büyük (max 1MB)".to_string())));
    }
    
    if info.total_size > 2 * 1024 * 1024 {
        return Ok(Json(ApiResponse::error("Görsel boyutu çok büyük (max 2MB)".to_string())));
    }
    
    let upload_id = if let Some(id) = &info.upload_id {
        id.clone()
    } else {
        let new_id = Uuid::new_v4().to_string();
        info.upload_id = Some(new_id.clone());
        new_id
    };
    
    save_upload_info(&upload_id, &info)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let chunk_path = get_chunk_file_path(&upload_id, info.chunk_number);
    fs::create_dir_all(chunk_path.parent().unwrap())
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    fs::write(&chunk_path, &chunk_data)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let uploaded_chunks = get_uploaded_chunks(&upload_id).await;
    let completed = uploaded_chunks.len() == info.total_chunks as usize;
    
    if completed {
        let file_id = Uuid::new_v4();
        let extension = Path::new(&info.file_name)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("jpg");
        let new_filename = format!("{}.{}", file_id, extension);
        
        let channels_dir = PathBuf::from(&config.upload_dir).join("channels");
        fs::create_dir_all(&channels_dir)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let final_path = channels_dir.join(&new_filename);
        
        combine_chunks(&upload_id, &info, &final_path)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        return Ok(Json(ApiResponse::success(ChunkUploadResponse {
            upload_id,
            chunk_number: info.chunk_number,
            uploaded: true,
            next_chunk: None,
            completed: true,
            file_path: Some(format!("channels/{}", new_filename)),
            disk_location: Some("local".to_string()),
            file_size: Some(info.total_size),
            disk_id: None,
        })));
    }
    
    let next_chunk = (1..=info.total_chunks)
        .find(|&chunk| !uploaded_chunks.contains(&chunk));
    
    Ok(Json(ApiResponse::success(ChunkUploadResponse {
        upload_id,
        chunk_number: info.chunk_number,
        uploaded: true,
        next_chunk,
        completed: false,
        file_path: None,
        disk_location: None,
        file_size: None,
        disk_id: None,
    })))
}