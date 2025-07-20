mod auth;
mod database;
mod handlers;
mod models;
mod upload;

use axum::{
    extract::DefaultBodyLimit,
    middleware,
    routing::{delete, get, post, put},
    Router,
};
use dotenv::dotenv;
use std::env;
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
};
use tracing_subscriber;

use auth::{auth_middleware, login, AuthConfig, AuthState};
use database::create_pool;
use handlers::*;
use upload::{
    upload_video_chunk, upload_thumbnail_chunk, upload_channel_image_chunk,
    get_upload_status, cancel_upload, cleanup_expired_uploads, UploadConfig, AppState
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    tracing_subscriber::fmt::init();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = create_pool(&database_url).await?;

    let auth_config = AuthConfig::from_env();
    let upload_config = UploadConfig::default();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let public_routes = Router::new()
        .route("/api/videos", get(get_videos_handler))
        .route("/api/videos/featured", get(get_featured_videos_handler))
        .route("/api/videos/:slug", get(get_video_handler))
        .route("/api/channels", get(get_channels_handler))
        .route("/api/channels/:slug", get(get_channel_handler))
        .route("/api/channels/:slug/videos", get(get_channel_videos_handler))
        .route("/api/categories", get(get_categories_handler))
        .route("/api/categories/:slug", get(get_category_handler))
        .route("/api/categories/:slug/videos", get(get_category_videos_handler))
        .route("/uploads/videos/:filename", get(serve_video_handler))
        .with_state(pool.clone());

    let auth_routes = Router::new()
        .route("/api/auth/login", post(login))
        .with_state(AuthState {
            pool: pool.clone(),
            auth_config: auth_config.clone(),
        });

    let admin_routes = Router::new()
        .route("/api/admin/videos", post(create_video_handler))
        .route("/api/admin/videos/:id", put(update_video_handler))
        .route("/api/admin/videos/:id", delete(delete_video_handler))
        .route("/api/admin/channels", post(create_channel_handler))
        .route("/api/admin/channels/:id", put(update_channel_handler))
        .route("/api/admin/channels/:id", delete(delete_channel_handler))
        .route("/api/admin/categories", post(create_category_handler))
        .route("/api/admin/categories/:id", put(update_category_handler))
        .route("/api/admin/categories/:id", delete(delete_category_handler))
        .route("/api/admin/disks", get(get_disks_handler))
        .route("/api/admin/disks", post(create_disk_handler))
        .route("/api/admin/disks/:id", put(update_disk_handler))
        .route("/api/admin/disks/:id", delete(delete_disk_handler))
        .route("/api/admin/disks/scan", get(scan_system_disks_handler))
        .layer(middleware::from_fn_with_state(
            auth_config.clone(),
            auth_middleware,
        ))
        .with_state(pool.clone());

    let upload_routes = Router::new()
        .route("/api/admin/upload/video/chunk", post(upload_video_chunk))
        .route("/api/admin/upload/thumbnail/chunk", post(upload_thumbnail_chunk))
        .route("/api/admin/upload/channel-image/chunk", post(upload_channel_image_chunk))
        .route("/api/admin/upload/status", get(get_upload_status))
        .route("/api/admin/upload/cancel", delete(cancel_upload))
        .layer(DefaultBodyLimit::max(50 * 1024 * 1024))
        .layer(middleware::from_fn_with_state(
            auth_config.clone(),
            auth_middleware,
        ))
        .with_state(AppState {
            pool: pool.clone(),
            upload_config,
        });

    let app = Router::new()
        .merge(public_routes)
        .merge(auth_routes)
        .merge(admin_routes)
        .merge(upload_routes)
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(ServiceBuilder::new().layer(cors));

    let cleanup_task = tokio::spawn(async {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3600)); // Every hour
        loop {
            interval.tick().await;
            if let Err(e) = cleanup_expired_uploads().await {
                tracing::error!("Failed to cleanup expired uploads: {}", e);
            }
        }
    });
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await?;
    println!("Server running on http://0.0.0.0:3001");
    
    tokio::select! {
        result = axum::serve(listener, app) => {
            if let Err(e) = result {
                tracing::error!("Server error: {}", e);
            }
        }
        _ = cleanup_task => {
            tracing::info!("Cleanup task finished");
        }
    }
    
    Ok(())
}
