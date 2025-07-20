use axum::{
    extract::{Request, State, FromRef},
    http::{header::AUTHORIZATION, StatusCode},
    middleware::Next,
    response::Response,
    Json,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use std::env;
use chrono::{Duration, Utc};
use sqlx::PgPool;
use crate::models::{Claims, LoginRequest, LoginResponse, ApiResponse};

#[derive(Clone)]
pub struct AuthConfig {
    pub jwt_secret: String,
    pub admin_username: String,
    pub admin_password: String,
}

impl AuthConfig {
    pub fn from_env() -> Self {
        Self {
            jwt_secret: env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
            admin_username: env::var("ADMIN_USERNAME").expect("ADMIN_USERNAME must be set"),
            admin_password: env::var("ADMIN_PASSWORD").expect("ADMIN_PASSWORD must be set"),
        }
    }
}

#[derive(Clone)]
pub struct AuthState {
    pub pool: PgPool,
    pub auth_config: AuthConfig,
}

impl FromRef<AuthState> for PgPool {
    fn from_ref(state: &AuthState) -> PgPool {
        state.pool.clone()
    }
}

impl FromRef<AuthState> for AuthConfig {
    fn from_ref(state: &AuthState) -> AuthConfig {
        state.auth_config.clone()
    }
}

pub fn create_jwt(username: &str, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let now = Utc::now();
    let exp = now + Duration::hours(24);
    
    let claims = Claims {
        sub: username.to_string(),
        exp: exp.timestamp() as usize,
        iat: now.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
}

pub fn verify_jwt(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default(),
    )
    .map(|data| data.claims)
}

pub async fn login(
    State(auth_config): State<AuthConfig>,
    Json(login_request): Json<LoginRequest>,
) -> Result<Json<ApiResponse<LoginResponse>>, StatusCode> {
    if login_request.username != auth_config.admin_username
        || login_request.password != auth_config.admin_password
    {
        return Ok(Json(ApiResponse::error("Geçersiz kullanıcı adı veya şifre".to_string())));
    }

    match create_jwt(&login_request.username, &auth_config.jwt_secret) {
        Ok(token) => {
            let expires_at = Utc::now() + Duration::hours(24);
            Ok(Json(ApiResponse::success(LoginResponse {
                token,
                expires_at,
            })))
        }
        Err(_) => Ok(Json(ApiResponse::error("Token oluşturulamadı".to_string()))),
    }
}

pub async fn auth_middleware(
    State(auth_config): State<AuthConfig>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let token = match auth_header {
        Some(header) if header.starts_with("Bearer ") => &header[7..],
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    match verify_jwt(token, &auth_config.jwt_secret) {
        Ok(claims) => {
            request.extensions_mut().insert(claims);
            Ok(next.run(request).await)
        }
        Err(_) => Err(StatusCode::UNAUTHORIZED),
    }
}