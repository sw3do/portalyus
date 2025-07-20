# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Portalyus seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **sw3do@protonmail.com**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

* Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Preferred Languages

We prefer all communications to be in English or Turkish.

## Policy

* We will respond to your report within 48 hours with our evaluation of the report and an expected resolution date.
* If you have followed the instructions above, we will not take any legal action against you in regard to the report.
* We will handle your report with strict confidentiality, and not pass on your personal details to third parties without your permission.
* We will keep you informed of the progress towards resolving the problem.
* In the public information concerning the problem reported, we will give your name as the discoverer of the problem (unless you desire otherwise).

## Security Measures

Portalyus implements several security measures:

### Backend Security
- JWT token-based authentication
- Input validation and sanitization
- SQL injection prevention through SQLx
- File upload restrictions and validation
- CORS configuration
- Rate limiting (planned)

### Frontend Security
- XSS prevention through React's built-in protections
- Content Security Policy headers (planned)
- Secure cookie handling
- Input validation

### Infrastructure Security
- Environment variable management
- Secure database connections
- HTTPS enforcement (in production)
- Regular dependency updates

## Security Updates

Security updates will be released as soon as possible after a vulnerability is confirmed and a fix is developed. Users will be notified through:

- GitHub Security Advisories
- Release notes
- Email notifications (for critical vulnerabilities)

## Bug Bounty Program

Currently, we do not have a formal bug bounty program. However, we greatly appreciate security researchers who responsibly disclose vulnerabilities and will acknowledge their contributions in our security advisories.

## Contact

For any security-related questions or concerns, please contact:

**Email:** sw3do@protonmail.com
**GitHub:** [@sw3do](https://github.com/sw3do)

Thank you for helping keep Portalyus and our users safe!