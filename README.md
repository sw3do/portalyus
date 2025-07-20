# Portalyus

Modern video platform built with Rust backend and Astro + React frontend.

## 🚀 Technologies

### Backend
- **Rust** - Systems programming language
- **Axum** - Web application framework
- **Tokio** - Asynchronous runtime
- **SQLx** - Async SQL toolkit
- **PostgreSQL** - Database
- **Serde** - Serialization framework

### Frontend
- **Astro** - Static site generator
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

## 📋 Prerequisites

- **Rust** (latest stable version)
- **Node.js** (v18 or higher)
- **PostgreSQL** (v13 or higher)
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/sw3do/portalyus.git
cd portalyus
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install sqlx-cli for database migrations
cargo install sqlx-cli --no-default-features --features postgres

# Setup database (make sure PostgreSQL is running)
createdb portalyus

# Run migrations
sqlx migrate run

# Build and run
cargo run
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgres://username:password@localhost/portalyus
JWT_SECRET=your-jwt-secret-key
UPLOAD_DIR=uploads
MAX_FILE_SIZE=2147483648
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
PUBLIC_API_URL=http://localhost:8000
```

## 🏗️ Project Structure

```
portalyus/
├── backend/                 # Rust backend
│   ├── src/
│   │   ├── main.rs         # Application entry point
│   │   ├── handlers.rs     # HTTP request handlers
│   │   ├── models.rs       # Database models
│   │   ├── auth.rs         # Authentication logic
│   │   ├── upload.rs       # File upload handling
│   │   └── database.rs     # Database connection
│   ├── migrations/         # Database migrations
│   ├── uploads/           # File storage
│   └── Cargo.toml         # Rust dependencies
├── frontend/               # Astro + React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Astro pages
│   │   ├── layouts/       # Page layouts
│   │   └── assets/        # Static assets
│   ├── public/            # Public files
│   └── package.json       # Node.js dependencies
└── .github/
    └── workflows/         # CI/CD workflows
```

## 🚦 Development

### Running in Development Mode

1. **Backend** (Port 8000):
   ```bash
   cd backend
   cargo run
   ```

2. **Frontend** (Port 3000):
   ```bash
   cd frontend
   npm run dev
   ```

### Available Scripts

#### Backend
- `cargo run` - Start development server
- `cargo test` - Run tests
- `cargo build --release` - Build for production
- `cargo fmt` - Format code
- `cargo clippy` - Lint code

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type check

## 🧪 Testing

### Backend Tests
```bash
cd backend
cargo test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Building for Production

### Backend
```bash
cd backend
cargo build --release
```

### Frontend
```bash
cd frontend
npm run build
```

## 🚀 Deployment

The project includes GitHub Actions workflows for:
- **CI/CD Pipeline** - Automated testing and building
- **Release Management** - Automated releases with binaries
- **Security Auditing** - Dependency vulnerability scanning

### Manual Deployment

1. Build both frontend and backend for production
2. Set up PostgreSQL database on your server
3. Configure environment variables
4. Deploy the built artifacts to your server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**sw3do** - [GitHub](https://github.com/sw3do)

## 🙏 Acknowledgments

- Rust community for excellent tooling
- Astro team for the amazing framework
- All contributors and supporters

---

**Note**: This project is actively maintained. Feel free to open issues or submit pull requests!