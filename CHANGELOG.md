# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-14

### Added

#### Core Features
- **245 Detection Patterns** covering major services across 15 categories:
  - AI/ML Platforms (17 patterns): OpenAI, Anthropic Claude, Google AI, Hugging Face, Cohere, Replicate, Stability AI, ElevenLabs, AssemblyAI, Deepgram, Pinecone, Weaviate, LangSmith, Mistral AI, Together AI, and more
  - Cloud Platforms (25 patterns): AWS, Google Cloud, Azure, DigitalOcean, Vercel, Render, Heroku, Netlify, Railway, Fly.io, Cloudflare, Fastly, Linode, Vultr, Oracle Cloud, and more
  - Database Services (29 patterns): MongoDB, PostgreSQL, MySQL, Redis, Elasticsearch, Supabase, PlanetScale, Firebase, Airtable, Notion, FaunaDB, InfluxDB, ClickHouse, and more
  - Payment Processing (13 patterns): Stripe, PayPal, Square, Braintree, and more
  - Communication Services (13 patterns): Twilio, SendGrid, Postmark, Mailchimp, Mailjet, Slack, Discord, Telegram, and more
  - Development Tools (15 patterns): GitHub, GitLab, Bitbucket, NPM, Docker, CircleCI, Travis CI, Jenkins, and more
  - Monitoring and Analytics (25 patterns): Datadog, New Relic, Sentry, LogRocket, Amplitude, Mixpanel, Segment, Bugsnag, Rollbar, and more
  - Authentication Services (12 patterns): Auth0, Okta, Firebase Auth, Clerk, JWT tokens, OAuth tokens, and more
  - Storage and CDN (9 patterns): AWS S3, Azure Blob, Cloudinary, Imgix, BunnyCDN, KeyCDN, and more
  - Security and Certificates (13 patterns): Private keys (RSA, DSA, ECDSA, Ed25519), SSH keys, PGP keys, SSL/TLS certificates
  - E-commerce Platforms (8 patterns): Shopify, WooCommerce, BigCommerce, Magento, Etsy, and more
  - Content Management Systems (8 patterns): WordPress, Drupal, Ghost, Contentful, Sanity, Strapi, and more
  - CRM and Marketing (12 patterns): Salesforce, HubSpot, Zendesk, Intercom, Mailchimp, ConvertKit, ActiveCampaign, and more
  - Infrastructure as Code (8 patterns): Terraform, HashiCorp Vault, Consul, Nomad, Pulumi, and more
  - Generic Patterns (8 patterns): Generic API keys, secrets, JWT tokens, bearer tokens, passwords in URLs, connection strings

#### Advanced False Positive Reduction

- **Baseline/Ignore File System**:
  - Generate baseline files from current scan results with `--generate-baseline`
  - Filter known findings from future scans with `--baseline`
  - SHA-256 hashing for accurate finding tracking across code changes
  - Review tracking with reviewer, date, and reason fields
  - Baseline files can be version-controlled and shared across teams
  - Custom baseline path support with `--baseline-path`
  - Baseline file structure includes metadata, finding details, and review status

- **Inline Ignore Comments**:
  - ESLint-style comment directives for suppressing specific findings
  - Single-line ignore: `// hardcoded-detector:disable-line`
  - Next-line ignore: `// hardcoded-detector:disable-next-line`
  - Block-level ignore: `/* hardcoded-detector:disable */` ... `/* hardcoded-detector:enable */`
  - Works with all comment styles (JavaScript, Python, Shell, HTML, etc.)
  - Provides fine-grained control without external configuration
  - Documented directly in source code for maintainability

- **Entropy Detection (Shannon Entropy)**:
  - Calculates Shannon entropy (0.0 - 8.0 scale) for every finding
  - Classifies strings as low, medium, or high entropy
  - High-entropy strings (4.5+) more likely to be genuine secrets
  - Enable filtering with `--entropy-filter` flag
  - Dramatically reduces false positives for generic patterns
  - Filters out common variable names, placeholders, and test data
  - All findings include entropy value and level in output
  - Per-pattern entropy filtering configuration support

#### CLI Interface

- **Scan Command** with comprehensive options:
  - Basic scanning: `hardcoded-detector scan [directory]`
  - Severity filtering: `--severity <level>` (low, medium, high, critical)
  - Output formats: `--output <format>` (console, json, html, csv, txt, junit)
  - File output: `--file <path>`
  - Staged files only: `--staged` (for pre-commit hooks)
  - Exclude patterns: `--exclude <patterns...>`
  - Baseline filtering: `--baseline` and `--baseline-path <path>`
  - Baseline generation: `--generate-baseline`
  - Entropy filtering: `--entropy-filter`
  - Configuration file: `--config <path>`
  - Verbose logging: `--verbose`
  - Color control: `--no-colors`

- **Init Command**:
  - Initialize configuration file: `hardcoded-detector init`
  - Force overwrite: `--force`
  - Creates `.hardcoded-detector.json` with sensible defaults

- **Install Hooks Command**:
  - Install git pre-commit hooks: `hardcoded-detector install-hooks`
  - Automatic scanning of staged files before commit
  - Blocks commits with critical/high severity findings

- **Patterns Command**:
  - List all patterns: `hardcoded-detector patterns`
  - Filter by category: `--category <category>`
  - Filter by service: `--service <service>`
  - JSON output: `--json`

#### Output Formats

- **Console Output**:
  - Color-coded severity levels (critical, high, medium, low)
  - File paths, line numbers, and code context
  - Summary statistics and severity breakdown
  - Grouped by file or severity

- **JSON Output**:
  - Structured data with metadata
  - Complete finding details including entropy
  - Suitable for programmatic processing
  - CI/CD integration ready

- **HTML Reports**:
  - Comprehensive visual reports with syntax highlighting
  - Interactive filtering and sorting
  - Executive summary with charts
  - Exportable and shareable

- **CSV Output**:
  - Spreadsheet-compatible format
  - Easy data analysis and tracking
  - Custom field selection

- **TXT Output**:
  - Simple text-based format
  - File:Line - Token format
  - Easy parsing with grep/awk/sed
  - Email and chat friendly

- **JUnit XML**:
  - Jenkins and CI/CD compatible
  - Test suite format for build integration
  - Automatic failure reporting

#### Configuration System

- **Configuration File (`.hardcoded-detector.json`)**:
  - Customizable exclude/include patterns
  - Severity level thresholds
  - Output format preferences
  - Git hooks configuration
  - Custom pattern paths
  - Disabled pattern lists
  - Category exclusions
  - Reporting preferences (grouping, context)

- **Custom Patterns**:
  - JSON-based pattern definition
  - Organization-specific detection rules
  - Pattern metadata (severity, confidence, description)
  - Context-aware pattern matching
  - Easy contribution and sharing

#### Git Integration

- **Pre-commit Hooks**:
  - Automatic installation with `install-hooks` command
  - Scans staged files before commit
  - Blocks commits with high/critical findings
  - Clear feedback on detected issues
  - Can be bypassed with `--no-verify` (not recommended)

- **Staged File Scanning**:
  - `--staged` flag for pre-commit scenarios
  - Performance optimized for incremental changes
  - Git-aware file filtering

#### Performance

- **Parallel Processing**:
  - Worker thread pool for large codebases
  - Automatic worker count based on CPU cores
  - Configurable worker count
  - Scan 1000 files in under 10 seconds

- **Stream-based Analysis**:
  - Memory-efficient line-by-line processing
  - Handles large files without excessive memory usage
  - 64KB chunk size for optimal performance

- **ReDoS Protection**:
  - Safe regex execution with timeouts
  - Pattern validation against ReDoS vulnerabilities
  - Maximum match limits to prevent infinite loops
  - Graceful error handling

#### Programmatic API

- **Main Detector Class**:
  - `HardcodedApiDetector` with full configuration options
  - Async/await based scanning
  - Custom pattern support
  - Baseline integration
  - Worker pool configuration

- **Content Analyzer**:
  - Direct file analysis
  - Pattern-specific scanning
  - Entropy filtering
  - Inline ignore support

- **Report Generator**:
  - Multiple format generation
  - Custom reporting logic
  - Path sanitization
  - Grouped findings

#### CI/CD Integration

- **GitHub Actions**:
  - Example workflows included
  - Pull request scanning
  - Scheduled audits
  - Artifact uploads
  - PR commenting

- **GitLab CI/CD**:
  - Compatible with GitLab pipelines
  - Merge request integration
  - Security dashboards

- **Jenkins**:
  - JUnit XML output for build integration
  - Test result publishing
  - Build failure on findings

#### Documentation

- **Comprehensive README**:
  - Quick start guide
  - Advanced features documentation
  - Real-world use cases
  - Configuration examples
  - GitHub Actions integration
  - Programmatic API usage
  - Contributing guidelines

- **API Documentation**:
  - JSDoc comments throughout codebase
  - Type definitions for all public APIs
  - Usage examples

- **Example Reports**:
  - HTML report (5.4 MB example with 2,921 findings)
  - TXT report (729 KB example with clean formatting)
  - Real scan results from test files

### Security Features

- **Context-Aware Detection**: Variable names and assignment patterns reduce false positives
- **Confidence Levels**: Low, Medium, High ratings for each finding
- **Severity Classification**: Critical, High, Medium, Low levels
- **Entropy Analysis**: Shannon entropy identifies truly random secrets
- **Baseline Management**: Track and accept known findings
- **Inline Suppression**: Document and suppress false positives in code

### Platform Support

- **Node.js**: Compatible with Node.js 14.0.0 and higher
- **Cross-platform**: Windows, macOS, and Linux support
- **Package Managers**: Available via npm, works with yarn and pnpm
- **npx Support**: Use without installation

### Performance Metrics

- **Speed**: Scan 1000 files in under 10 seconds
- **Memory**: Stream-based processing for large files
- **Accuracy**: Context-aware patterns reduce false positives to under 10%
- **Scalability**: Worker threads for multi-core utilization

### License and Attribution

- **License**: MIT License
- **Author**: 686f6c61
- **Repository**: https://github.com/686f6c61/hardcoded-api-key-detector
- **Issues**: https://github.com/686f6c61/hardcoded-api-key-detector/issues

---

## Pattern Statistics

- **Total Patterns**: 245
- **Categories**: 15
- **Services Covered**: 100+
- **Pattern Types**: Context-aware, format-based, prefix-based
- **Average Confidence**: High (with entropy filtering)

## Quick Start

```bash
# Install globally
npm install -g hardcoded-api-key-detector

# Or use with npx (no installation required)
npx hardcoded-api-key-detector scan

# Initialize configuration
hardcoded-detector init

# Install git hooks
hardcoded-detector install-hooks

# Basic scan
hardcoded-detector scan

# Advanced scan with all features
hardcoded-detector scan --baseline --entropy-filter --severity high

# Generate baseline
hardcoded-detector scan --generate-baseline

# Scan with custom output
hardcoded-detector scan ./src --output html --file security-report.html
```

## Contributing

We welcome contributions! Areas for contribution:
- Adding new detection patterns
- Reporting false positives
- Improving documentation
- Code optimizations
- Bug fixes

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Security

If you discover a security vulnerability, please create an issue or contact the maintainers directly.

---

**Project**: Hardcoded API Key Detector
**Version**: 1.0.0
**Release Date**: December 14, 2024
**Total Patterns**: 245
**Test Coverage**: 80%+
**Status**: Production Ready
