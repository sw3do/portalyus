use axum::{
    extract::{Path, Query, State},
    http::{StatusCode, header},
    Json, response::Response,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;
use tokio::fs;
use std::path::PathBuf;
use crate::{
    database::*,
    models::*,
};

#[derive(Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

pub async fn get_videos_handler(
    State(pool): State<PgPool>,
    Query(params): Query<PaginationQuery>,
) -> Result<Json<ApiResponse<Vec<VideoWithDetails>>>, StatusCode> {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(20) as i64;
    let offset = ((page - 1) * (limit as u32)) as i64;

    match get_videos_with_details(&pool, Some(limit), Some(offset)).await {
        Ok(videos) => Ok(Json(ApiResponse::success(videos))),
        Err(_) => Ok(Json(ApiResponse::error("Videolar alınamadı".to_string()))),
    }
}

pub async fn get_video_handler(
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<VideoWithDetails>>, StatusCode> {
    match get_video_by_slug(&pool, &slug).await {
        Ok(Some(video)) => {
            if let Err(_) = update_video_view_count(&pool, video.id).await {
                tracing::warn!("Failed to update view count for video: {}", video.id);
            }
            Ok(Json(ApiResponse::success(video)))
        }
        Ok(None) => Ok(Json(ApiResponse::error("Video bulunamadı".to_string()))),
        Err(_) => Ok(Json(ApiResponse::error("Video alınamadı".to_string()))),
    }
}

pub async fn get_featured_videos_handler(
    State(pool): State<PgPool>,
) -> Result<Json<ApiResponse<Vec<VideoWithDetails>>>, StatusCode> {
    match get_featured_videos(&pool).await {
        Ok(videos) => Ok(Json(ApiResponse::success(videos))),
        Err(_) => Ok(Json(ApiResponse::error("Öne çıkan videolar alınamadı".to_string()))),
    }
}

pub async fn create_video_handler(
    State(pool): State<PgPool>,
    Json(video_data): Json<CreateVideo>,
) -> Result<Json<ApiResponse<Video>>, StatusCode> {
    match create_video(&pool, video_data).await {
        Ok(video) => Ok(Json(ApiResponse::success(video))),
        Err(_) => Ok(Json(ApiResponse::error("Video oluşturulamadı".to_string()))),
    }
}

pub async fn update_video_handler(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(video_data): Json<CreateVideo>,
) -> Result<Json<ApiResponse<Video>>, StatusCode> {
    match update_video(&pool, id, video_data).await {
        Ok(video) => Ok(Json(ApiResponse::success(video))),
        Err(_) => Ok(Json(ApiResponse::error("Video güncellenemedi".to_string()))),
    }
}

pub async fn delete_video_handler(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    match delete_video(&pool, id).await {
        Ok(_) => Ok(Json(ApiResponse::success("Video silindi".to_string()))),
        Err(_) => Ok(Json(ApiResponse::error("Video silinemedi".to_string()))),
    }
}

pub async fn get_channels_handler(
    State(pool): State<PgPool>,
) -> Result<Json<ApiResponse<Vec<Channel>>>, StatusCode> {
    match get_channels(&pool).await {
        Ok(channels) => Ok(Json(ApiResponse::success(channels))),
        Err(_) => Ok(Json(ApiResponse::error("Kanallar alınamadı".to_string()))),
    }
}

pub async fn get_channel_handler(
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<Channel>>, StatusCode> {
    match get_channel_by_slug(&pool, &slug).await {
        Ok(Some(channel)) => Ok(Json(ApiResponse::success(channel))),
        Ok(None) => Ok(Json(ApiResponse::error("Kanal bulunamadı".to_string()))),
        Err(_) => Ok(Json(ApiResponse::error("Kanal alınamadı".to_string()))),
    }
}

pub async fn get_channel_videos_handler(
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<Vec<VideoWithDetails>>>, StatusCode> {
    match get_videos_by_channel(&pool, &slug).await {
        Ok(videos) => Ok(Json(ApiResponse::success(videos))),
        Err(_) => Ok(Json(ApiResponse::error("Kanal videoları alınamadı".to_string()))),
    }
}

pub async fn create_channel_handler(
    State(pool): State<PgPool>,
    Json(channel_data): Json<CreateChannel>,
) -> Result<Json<ApiResponse<Channel>>, StatusCode> {
    match create_channel(&pool, channel_data).await {
        Ok(channel) => Ok(Json(ApiResponse::success(channel))),
        Err(_) => Ok(Json(ApiResponse::error("Kanal oluşturulamadı".to_string()))),
    }
}

pub async fn update_channel_handler(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(channel_data): Json<CreateChannel>,
) -> Result<Json<ApiResponse<Channel>>, StatusCode> {
    match update_channel(&pool, id, channel_data).await {
        Ok(channel) => Ok(Json(ApiResponse::success(channel))),
        Err(_) => Ok(Json(ApiResponse::error("Kanal güncellenemedi".to_string()))),
    }
}

pub async fn delete_channel_handler(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    match delete_channel(&pool, id).await {
        Ok(_) => Ok(Json(ApiResponse::success("Kanal silindi".to_string()))),
        Err(_) => Ok(Json(ApiResponse::error("Kanal silinemedi".to_string()))),
    }
}

pub async fn get_categories_handler(
    State(pool): State<PgPool>,
) -> Result<Json<ApiResponse<Vec<Category>>>, StatusCode> {
    match get_categories(&pool).await {
        Ok(categories) => Ok(Json(ApiResponse::success(categories))),
        Err(_) => Ok(Json(ApiResponse::error("Kategoriler alınamadı".to_string()))),
    }
}

pub async fn get_category_handler(
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<Category>>, StatusCode> {
    match get_category_by_slug(&pool, &slug).await {
        Ok(Some(category)) => Ok(Json(ApiResponse::success(category))),
        Ok(None) => Ok(Json(ApiResponse::error("Kategori bulunamadı".to_string()))),
        Err(_) => Ok(Json(ApiResponse::error("Kategori alınamadı".to_string()))),
    }
}

pub async fn get_category_videos_handler(
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<Vec<VideoWithDetails>>>, StatusCode> {
    match get_videos_by_category(&pool, &slug).await {
        Ok(videos) => Ok(Json(ApiResponse::success(videos))),
        Err(_) => Ok(Json(ApiResponse::error("Kategori videoları alınamadı".to_string()))),
    }
}

pub async fn create_category_handler(
    State(pool): State<PgPool>,
    Json(category_data): Json<CreateCategory>,
) -> Result<Json<ApiResponse<Category>>, StatusCode> {
    match create_category(&pool, category_data).await {
        Ok(category) => Ok(Json(ApiResponse::success(category))),
        Err(_) => Ok(Json(ApiResponse::error("Kategori oluşturulamadı".to_string()))),
    }
}

pub async fn update_category_handler(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(category_data): Json<CreateCategory>,
) -> Result<Json<ApiResponse<Category>>, StatusCode> {
    match update_category(&pool, id, category_data).await {
        Ok(category) => Ok(Json(ApiResponse::success(category))),
        Err(_) => Ok(Json(ApiResponse::error("Kategori güncellenemedi".to_string()))),
    }
}

pub async fn delete_category_handler(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    match delete_category(&pool, id).await {
        Ok(_) => Ok(Json(ApiResponse::success("Kategori silindi".to_string()))),
        Err(_) => Ok(Json(ApiResponse::error("Kategori silinemedi".to_string()))),
    }
}

pub async fn get_disks_handler(
    State(pool): State<PgPool>,
) -> Result<Json<ApiResponse<Vec<DiskStorage>>>, StatusCode> {
    match get_all_disks(&pool).await {
        Ok(disks) => Ok(Json(ApiResponse::success(disks))),
        Err(_) => Ok(Json(ApiResponse::error("Diskler alınamadı".to_string()))),
    }
}

pub async fn create_disk_handler(
    State(pool): State<PgPool>,
    Json(disk_data): Json<CreateDiskStorage>,
) -> Result<Json<ApiResponse<DiskStorage>>, StatusCode> {
    println!("Creating disk with data: {:?}", disk_data);
    match create_disk_storage(&pool, disk_data).await {
        Ok(disk) => Ok(Json(ApiResponse::success(disk))),
        Err(e) => {
            println!("Error creating disk: {:?}", e);
            Ok(Json(ApiResponse::error(format!("Disk oluşturulamadı: {}", e))))
        }
    }
}

pub async fn update_disk_handler(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(disk_data): Json<CreateDiskStorage>,
) -> Result<Json<ApiResponse<DiskStorage>>, StatusCode> {
    match update_disk_storage(&pool, id, disk_data).await {
        Ok(disk) => Ok(Json(ApiResponse::success(disk))),
        Err(_) => Ok(Json(ApiResponse::error("Disk güncellenemedi".to_string()))),
    }
}

pub async fn delete_disk_handler(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    match delete_disk_storage(&pool, id).await {
        Ok(_) => Ok(Json(ApiResponse::success("Disk silindi".to_string()))),
        Err(_) => Ok(Json(ApiResponse::error("Disk silinemedi".to_string()))),
    }
}

pub async fn scan_system_disks_handler() -> Result<Json<ApiResponse<Vec<SystemDiskInfo>>>, StatusCode> {
    match scan_system_disks().await {
        Ok(disks) => Ok(Json(ApiResponse::success(disks))),
        Err(_) => Ok(Json(ApiResponse::error("Sistem diskleri taranamadı".to_string()))),
    }
}

async fn scan_system_disks() -> Result<Vec<SystemDiskInfo>, Box<dyn std::error::Error>> {
    let mut disks = Vec::new();
    
    if cfg!(target_os = "windows") {
        let drives = get_windows_drives().await?;
        for drive in drives {
            if let Ok(space_info) = get_disk_space(&drive).await {
                let drive_name = drive.trim_end_matches('\\').to_string();
                disks.push(SystemDiskInfo {
                    name: drive_name.clone(),
                    path: drive.clone(),
                    total_space: space_info.total,
                    available_space: space_info.available,
                    used_space: space_info.total - space_info.available,
                    mount_point: drive,
                });
            }
        }
    } else {
        let home_dir = if cfg!(target_os = "windows") {
            std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\Users".to_string())
        } else {
            std::env::var("HOME").unwrap_or_else(|_| "/Users".to_string())
        };
        let paths_to_check = vec![
            "/",
            "/tmp",
            &home_dir,
            "/Volumes",
        ];
        
        for path in paths_to_check {
            if let Ok(metadata) = fs::metadata(path).await {
                if metadata.is_dir() {
                    if let Ok(space_info) = get_disk_space(path).await {
                        disks.push(SystemDiskInfo {
                            name: path.split('/').last().unwrap_or(path).to_string(),
                            path: path.to_string(),
                            total_space: space_info.total,
                            available_space: space_info.available,
                            used_space: space_info.total - space_info.available,
                            mount_point: path.to_string(),
                        });
                    }
                }
            }
        }
    }
    
    Ok(disks)
}

async fn get_windows_drives() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    use std::process::Command;
    
    let output = Command::new("wmic")
        .args(["logicaldisk", "get", "caption"])
        .output()?;
    
    let output_str = String::from_utf8(output.stdout)?;
    let mut drives = Vec::new();
    
    for line in output_str.lines().skip(1) {
        let trimmed = line.trim();
        if trimmed.len() == 2 && trimmed.ends_with(':') {
            let drive = format!("{}\\", trimmed);
            drives.push(drive);
        }
    }
    
    if drives.is_empty() {
        for letter in 'A'..='Z' {
            let drive = format!("{}:\\", letter);
            if std::path::Path::new(&drive).exists() {
                drives.push(drive);
            }
        }
    }
    
    Ok(drives)
}

async fn get_disk_space(path: &str) -> Result<DiskSpaceInfo, Box<dyn std::error::Error>> {
    use std::process::Command;
    
    if cfg!(target_os = "windows") {
        let drive_letter = path.chars().next().unwrap_or('C');
        let output = Command::new("wmic")
            .args(["logicaldisk", "where", &format!("caption='{}:'", drive_letter), "get", "size,freespace"])
            .output()?;
        
        let output_str = String::from_utf8(output.stdout)?;
        let lines: Vec<&str> = output_str.lines().collect();
        
        for line in lines {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                if let (Ok(available), Ok(total)) = (parts[0].parse::<u64>(), parts[1].parse::<u64>()) {
                    return Ok(DiskSpaceInfo {
                        total,
                        available,
                    });
                }
            }
        }
        
        Err("Could not parse Windows disk space information".into())
    } else {
        let output = Command::new("df")
            .arg("-k")
            .arg(path)
            .output()?;
        
        let output_str = String::from_utf8(output.stdout)?;
        let lines: Vec<&str> = output_str.lines().collect();
        
        if lines.len() >= 2 {
            let parts: Vec<&str> = lines[1].split_whitespace().collect();
            if parts.len() >= 4 {
                let total = parts[1].parse::<u64>()? * 1024;
                let available = parts[3].parse::<u64>()? * 1024;
                
                return Ok(DiskSpaceInfo {
                    total,
                    available,
                });
            }
        }
        
        Err("Could not parse Unix disk space information".into())
    }
}

pub async fn serve_video_handler(
    State(pool): State<PgPool>,
    Path(filename): Path<String>,
) -> Result<Response, StatusCode> {
    let video_path = match get_video_file_path(&pool, &filename).await {
        Ok(Some(path)) => path,
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    let file_data = match fs::read(&video_path).await {
        Ok(data) => data,
        Err(_) => return Err(StatusCode::NOT_FOUND),
    };

    let content_type = "video/mp4";
    
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CONTENT_LENGTH, file_data.len())
        .header(header::ACCEPT_RANGES, "bytes")
        .body(file_data.into())
        .unwrap())
}

async fn get_video_file_path(pool: &PgPool, filename: &str) -> Result<Option<PathBuf>, sqlx::Error> {
    let result = sqlx::query_as::<_, (String, String)>(
        "SELECT ds.path, v.video_file 
         FROM videos v 
         JOIN disk_storage ds ON v.disk_id = ds.id 
         WHERE v.video_file = $1"
    )
    .bind(filename)
    .fetch_optional(pool)
    .await?;

    if let Some((disk_path, video_file)) = result {
        let full_path = PathBuf::from(&disk_path).join(&video_file);
        Ok(Some(full_path))
    } else {
        let fallback_path = PathBuf::from("uploads/videos").join(filename);
        if fallback_path.exists() {
            Ok(Some(fallback_path))
        } else {
            Ok(None)
        }
    }
}