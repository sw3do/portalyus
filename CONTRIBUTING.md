# Contributing to Portalyus

First off, thank you for considering contributing to Portalyus! It's people like you that make Portalyus such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Portalyus. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

**Before Submitting A Bug Report:**
- Check the debugging guide
- Check the FAQ for a list of common questions and problems
- Perform a cursory search to see if the problem has already been reported

**How Do I Submit A (Good) Bug Report?**

Bugs are tracked as GitHub issues. Create an issue and provide the following information:

- **Use a clear and descriptive title**
- **Describe the exact steps which reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots and animated GIFs** if possible
- **Include your environment details** (OS, browser, versions)

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Portalyus.

**Before Submitting An Enhancement Suggestion:**
- Check if the enhancement has already been suggested
- Check if you're using the latest version
- Perform a cursory search to see if the enhancement has already been suggested

**How Do I Submit A (Good) Enhancement Suggestion?**

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior** and **explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Pull Requests

The process described here has several goals:

- Maintain Portalyus's quality
- Fix problems that are important to users
- Engage the community in working toward the best possible Portalyus
- Enable a sustainable system for Portalyus's maintainers to review contributions

**Before Submitting A Pull Request:**

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Process

### Setting Up Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sw3do/portalyus.git
   cd portalyus
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   cp .env.example .env
   cargo install sqlx-cli --no-default-features --features postgres
   sqlx migrate run
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   ```

### Coding Standards

#### Rust (Backend)
- Follow the official Rust style guide
- Use `cargo fmt` to format your code
- Use `cargo clippy` to lint your code
- Write tests for new functionality
- Document public APIs with doc comments

#### TypeScript/React (Frontend)
- Use TypeScript for all new code
- Follow React best practices
- Use functional components with hooks
- Write meaningful component and function names
- Add proper type annotations

#### General Guidelines
- Write clear, readable code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable and function names
- Follow the existing code style in the project

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples:**
```
feat(auth): add JWT token refresh functionality
fix(upload): resolve file size validation issue
docs(readme): update installation instructions
```

### Testing

#### Backend Tests
```bash
cd backend
cargo test
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### Running the Application

1. **Start the backend:**
   ```bash
   cd backend
   cargo run
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## Project Structure

```
portalyus/
├── backend/           # Rust backend
├── frontend/          # Astro + React frontend
├── .github/           # GitHub workflows
├── README.md          # Project documentation
├── CONTRIBUTING.md    # This file
└── LICENSE           # MIT license
```

## Getting Help

If you need help, you can:

- Open an issue with the `question` label
- Check existing issues and discussions
- Contact the maintainers

## Recognition

Contributors will be recognized in:
- The project's README
- Release notes for significant contributions
- GitHub's contributor graph

Thank you for contributing to Portalyus! 🚀