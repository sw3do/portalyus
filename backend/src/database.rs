use sqlx::{PgPool};
use anyhow::Result;
use crate::models::*;
use uuid::Uuid;
use slug::slugify;

pub async fn create_pool(database_url: &str) -> Result<PgPool> {
    let pool = PgPool::connect(database_url).await?;
    Ok(pool)
}

pub async fn get_channels(pool: &PgPool) -> Result<Vec<Channel>> {
    let channels = sqlx::query_as::<_, Channel>(
        "SELECT * FROM channels ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;
    Ok(channels)
}

pub async fn get_channel_by_slug(pool: &PgPool, slug: &str) -> Result<Option<Channel>> {
    let channel = sqlx::query_as::<_, Channel>(
        "SELECT * FROM channels WHERE slug = $1"
    )
    .bind(slug)
    .fetch_optional(pool)
    .await?;
    Ok(channel)
}

pub async fn create_channel(pool: &PgPool, channel: CreateChannel) -> Result<Channel> {
    let slug = slugify(&channel.name);
    let new_channel = sqlx::query_as::<_, Channel>(
        "INSERT INTO channels (name, image, slug) VALUES ($1, $2, $3) RETURNING *"
    )
    .bind(&channel.name)
    .bind(&channel.image)
    .bind(&slug)
    .fetch_one(pool)
    .await?;
    Ok(new_channel)
}

pub async fn update_channel(pool: &PgPool, id: Uuid, channel: CreateChannel) -> Result<Channel> {
    let slug = slugify(&channel.name);
    let updated_channel = sqlx::query_as::<_, Channel>(
        "UPDATE channels SET name = $1, image = $2, slug = $3, updated_at = NOW() WHERE id = $4 RETURNING *"
    )
    .bind(&channel.name)
    .bind(&channel.image)
    .bind(&slug)
    .bind(id)
    .fetch_one(pool)
    .await?;
    Ok(updated_channel)
}

pub async fn delete_channel(pool: &PgPool, id: Uuid) -> Result<()> {
    sqlx::query("DELETE FROM channels WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_categories(pool: &PgPool) -> Result<Vec<Category>> {
    let categories = sqlx::query_as::<_, Category>(
        "SELECT * FROM categories ORDER BY name ASC"
    )
    .fetch_all(pool)
    .await?;
    Ok(categories)
}

pub async fn get_category_by_slug(pool: &PgPool, slug: &str) -> Result<Option<Category>> {
    let category = sqlx::query_as::<_, Category>(
        "SELECT * FROM categories WHERE slug = $1"
    )
    .bind(slug)
    .fetch_optional(pool)
    .await?;
    Ok(category)
}

pub async fn create_category(pool: &PgPool, category: CreateCategory) -> Result<Category> {
    let slug = slugify(&category.name);
    let new_category = sqlx::query_as::<_, Category>(
        "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *"
    )
    .bind(&category.name)
    .bind(&slug)
    .fetch_one(pool)
    .await?;
    Ok(new_category)
}

pub async fn update_category(pool: &PgPool, id: Uuid, category: CreateCategory) -> Result<Category> {
    let slug = slugify(&category.name);
    let updated_category = sqlx::query_as::<_, Category>(
        "UPDATE categories SET name = $1, slug = $2, updated_at = NOW() WHERE id = $3 RETURNING *"
    )
    .bind(&category.name)
    .bind(&slug)
    .bind(id)
    .fetch_one(pool)
    .await?;
    Ok(updated_category)
}

pub async fn delete_category(pool: &PgPool, id: Uuid) -> Result<()> {
    sqlx::query("DELETE FROM categories WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_videos_with_details(pool: &PgPool, limit: Option<i64>, offset: Option<i64>) -> Result<Vec<VideoWithDetails>> {
    let videos = sqlx::query_as::<_, VideoWithDetails>(
        "SELECT v.id, v.title, v.description, v.slug, v.thumbnail, v.video_file, v.duration, 
                v.views, v.is_featured, v.created_at,
                c.name as channel_name, c.slug as channel_slug, c.image as channel_profile_image,
                cat.name as category_name, cat.slug as category_slug
         FROM videos v
         JOIN channels c ON v.channel_id = c.id
         JOIN categories cat ON v.category_id = cat.id
         ORDER BY v.created_at DESC
         LIMIT $1 OFFSET $2"
    )
    .bind(limit.unwrap_or(50))
    .bind(offset.unwrap_or(0))
    .fetch_all(pool)
    .await?;
    Ok(videos)
}

pub async fn get_video_by_slug(pool: &PgPool, slug: &str) -> Result<Option<VideoWithDetails>> {
    let video = sqlx::query_as::<_, VideoWithDetails>(
        "SELECT v.id, v.title, v.description, v.slug, v.thumbnail, v.video_file, v.duration, 
                v.views, v.is_featured, v.created_at,
                c.name as channel_name, c.slug as channel_slug, c.image as channel_profile_image,
                cat.name as category_name, cat.slug as category_slug
         FROM videos v
         JOIN channels c ON v.channel_id = c.id
         JOIN categories cat ON v.category_id = cat.id
         WHERE v.slug = $1"
    )
    .bind(slug)
    .fetch_optional(pool)
    .await?;
    Ok(video)
}

pub async fn get_videos_by_channel(pool: &PgPool, channel_slug: &str) -> Result<Vec<VideoWithDetails>> {
    let videos = sqlx::query_as::<_, VideoWithDetails>(
        "SELECT v.id, v.title, v.description, v.slug, v.thumbnail, v.video_file, v.duration, 
                v.views, v.is_featured, v.created_at,
                c.name as channel_name, c.slug as channel_slug, c.image as channel_profile_image,
                cat.name as category_name, cat.slug as category_slug
         FROM videos v
         JOIN channels c ON v.channel_id = c.id
         JOIN categories cat ON v.category_id = cat.id
         WHERE c.slug = $1
         ORDER BY v.created_at DESC"
    )
    .bind(channel_slug)
    .fetch_all(pool)
    .await?;
    Ok(videos)
}

pub async fn get_videos_by_category(pool: &PgPool, category_slug: &str) -> Result<Vec<VideoWithDetails>> {
    let videos = sqlx::query_as::<_, VideoWithDetails>(
        "SELECT v.id, v.title, v.description, v.slug, v.thumbnail, v.video_file, v.duration, 
                v.views, v.is_featured, v.created_at,
                c.name as channel_name, c.slug as channel_slug, c.image as channel_profile_image,
                cat.name as category_name, cat.slug as category_slug
         FROM videos v
         JOIN channels c ON v.channel_id = c.id
         JOIN categories cat ON v.category_id = cat.id
         WHERE cat.slug = $1
         ORDER BY v.created_at DESC"
    )
    .bind(category_slug)
    .fetch_all(pool)
    .await?;
    Ok(videos)
}

pub async fn get_featured_videos(pool: &PgPool) -> Result<Vec<VideoWithDetails>> {
    let videos = sqlx::query_as::<_, VideoWithDetails>(
        "SELECT v.id, v.title, v.description, v.slug, v.thumbnail, v.video_file, v.duration, 
                v.views, v.is_featured, v.created_at,
                c.name as channel_name, c.slug as channel_slug, c.image as channel_profile_image,
                cat.name as category_name, cat.slug as category_slug
         FROM videos v
         JOIN channels c ON v.channel_id = c.id
         JOIN categories cat ON v.category_id = cat.id
         WHERE v.is_featured = true
         ORDER BY v.created_at DESC
         LIMIT 10"
    )
    .fetch_all(pool)
    .await?;
    Ok(videos)
}

pub async fn create_video(pool: &PgPool, video: CreateVideo) -> Result<Video> {
    let slug = slugify(&video.title);
    let video_file = video.video_file.unwrap_or_else(|| "default.mp4".to_string());
    let new_video = sqlx::query_as::<_, Video>(
        "INSERT INTO videos (title, description, slug, channel_id, category_id, is_featured, video_file, thumbnail, disk_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *"
    )
    .bind(&video.title)
    .bind(&video.description)
    .bind(&slug)
    .bind(video.channel_id)
    .bind(video.category_id)
    .bind(video.is_featured.unwrap_or(false))
    .bind(&video_file)
    .bind(&video.thumbnail)
    .bind(video.disk_id)
    .fetch_one(pool)
    .await?;
    Ok(new_video)
}

pub async fn update_video_view_count(pool: &PgPool, id: Uuid) -> Result<()> {
    sqlx::query("UPDATE videos SET views = views + 1 WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_video(pool: &PgPool, id: Uuid, video: CreateVideo) -> Result<Video> {
    let slug = slugify(&video.title);
    let mut query = "UPDATE videos SET title = $1, description = $2, slug = $3, channel_id = $4, category_id = $5, is_featured = $6, updated_at = NOW()";
    let mut bind_count = 6;
    
    if video.video_file.is_some() {
        bind_count += 1;
        query = "UPDATE videos SET title = $1, description = $2, slug = $3, channel_id = $4, category_id = $5, is_featured = $6, video_file = $7, updated_at = NOW()";
    }
    
    if video.thumbnail.is_some() {
        bind_count += 1;
        if video.video_file.is_some() {
            query = "UPDATE videos SET title = $1, description = $2, slug = $3, channel_id = $4, category_id = $5, is_featured = $6, video_file = $7, thumbnail = $8, updated_at = NOW()";
        } else {
            query = "UPDATE videos SET title = $1, description = $2, slug = $3, channel_id = $4, category_id = $5, is_featured = $6, thumbnail = $7, updated_at = NOW()";
        }
    }
    
    let final_query = format!("{} WHERE id = ${} RETURNING *", query, bind_count + 1);
    
    let mut query_builder = sqlx::query_as::<_, Video>(&final_query)
        .bind(&video.title)
        .bind(&video.description)
        .bind(&slug)
        .bind(video.channel_id)
        .bind(video.category_id)
        .bind(video.is_featured.unwrap_or(false));
    
    if video.video_file.is_some() {
        query_builder = query_builder.bind(&video.video_file);
    }
    
    if video.thumbnail.is_some() {
        query_builder = query_builder.bind(&video.thumbnail);
    }
    
    let updated_video = query_builder
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(updated_video)
}

pub async fn delete_video(pool: &PgPool, id: Uuid) -> Result<()> {
    sqlx::query("DELETE FROM videos WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_available_disk(pool: &PgPool) -> Result<Option<DiskStorage>> {
    let disk = sqlx::query_as::<_, DiskStorage>(
        "SELECT * FROM disk_storage WHERE is_active = true AND used_space < total_space ORDER BY used_space ASC LIMIT 1"
    )
    .fetch_optional(pool)
    .await?;
    Ok(disk)
}

pub async fn update_disk_usage(pool: &PgPool, disk_id: Uuid, size_bytes: i64) -> Result<()> {
    sqlx::query("UPDATE disk_storage SET used_space = used_space + $1 WHERE id = $2")
        .bind(size_bytes)
        .bind(disk_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_all_disks(pool: &PgPool) -> Result<Vec<DiskStorage>> {
    let disks = sqlx::query_as::<_, DiskStorage>(
        "SELECT * FROM disk_storage ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;
    Ok(disks)
}

pub async fn create_disk_storage(pool: &PgPool, disk: CreateDiskStorage) -> Result<DiskStorage> {
    let new_disk = sqlx::query_as::<_, DiskStorage>(
        "INSERT INTO disk_storage (name, path, total_space, is_active) VALUES ($1, $2, $3, $4) RETURNING *"
    )
    .bind(&disk.name)
    .bind(&disk.path)
    .bind(disk.total_space)
    .bind(disk.is_active.unwrap_or(true))
    .fetch_one(pool)
    .await?;
    Ok(new_disk)
}

pub async fn update_disk_storage(pool: &PgPool, id: Uuid, disk: CreateDiskStorage) -> Result<DiskStorage> {
    let updated_disk = sqlx::query_as::<_, DiskStorage>(
        "UPDATE disk_storage SET name = $1, path = $2, total_space = $3, is_active = $4, updated_at = NOW() WHERE id = $5 RETURNING *"
    )
    .bind(&disk.name)
    .bind(&disk.path)
    .bind(disk.total_space)
    .bind(disk.is_active.unwrap_or(true))
    .bind(id)
    .fetch_one(pool)
    .await?;
    Ok(updated_disk)
}

pub async fn delete_disk_storage(pool: &PgPool, id: Uuid) -> Result<()> {
    sqlx::query("DELETE FROM disk_storage WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}