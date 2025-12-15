# Hardcoded API Key Detector

[![npm version](https://img.shields.io/npm/v/hardcoded-api-key-detector.svg)](https://www.npmjs.com/package/hardcoded-api-key-detector)
[![npm downloads](https://img.shields.io/npm/dm/hardcoded-api-key-detector.svg)](https://www.npmjs.com/package/hardcoded-api-key-detector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/hardcoded-api-key-detector.svg)](https://nodejs.org)
[![GitHub issues](https://img.shields.io/github/issues/686f6c61/hardcoded-api-key-detector.svg)](https://github.com/686f6c61/hardcoded-api-key-detector/issues)

**[View Documentation & Examples →](https://hardcoded-api-key-detector.onrender.com)**

A comprehensive and high-performance Node.js security tool designed to detect hardcoded API keys, tokens, and sensitive credentials in your codebase before they reach production. With 245 detection patterns covering major cloud providers, AI platforms, databases, payment services, and development tools, plus advanced features like entropy analysis, baseline filtering, and inline ignore comments, this tool helps prevent accidental credential exposure that could lead to security breaches and financial loss.

## Why Use This Tool

Hardcoded credentials are one of the most common security vulnerabilities in modern software development. According to security research, thousands of API keys and secrets are accidentally committed to public repositories every day, leading to unauthorized access, data breaches, and compromised systems. This tool provides an automated, fast, and accurate way to detect these vulnerabilities before they become a problem.

**Key Benefits:**
- **Prevent Security Breaches**: Detect hardcoded credentials before they reach your repository
- **Save Time and Money**: Automated scanning is faster and more reliable than manual code review
- **Comprehensive Coverage**: 245 patterns covering AI platforms, cloud providers, databases, and more
- **High Accuracy**: Context-aware detection reduces false positives to less than 10%
- **CI/CD Integration**: Works seamlessly with GitHub Actions, GitLab CI, Jenkins, and other platforms
- **Developer Friendly**: Simple installation and configuration with minimal setup required

## Features

**Extensive Detection Coverage**

The tool includes 245 carefully crafted detection patterns that identify credentials from major service providers. Patterns are continuously updated and maintained by the community to ensure coverage of the latest services and credential formats.

**Context-Aware Pattern Matching**

Unlike simple regex-based tools, this detector uses context-aware patterns that look for variable names and assignment patterns in addition to credential formats. This approach dramatically reduces false positives while maintaining high detection accuracy. For example, it distinguishes between actual API keys and random strings that happen to match credential formats.

**Multiple Output Formats**

Generate reports in various formats to suit your workflow: console output for quick feedback, JSON for programmatic processing, HTML for comprehensive reporting, CSV for data analysis, TXT for simple text-based sharing, and JUnit XML for CI/CD integration. Each format provides detailed information about detected credentials including file location, line number, severity level, and service identification.

**Performance Optimized**

The tool supports parallel processing with worker threads for scanning large codebases efficiently. Stream-based analysis handles large files without excessive memory usage. A typical scan of a medium-sized project (1000 files) completes in under 10 seconds.

**Git Integration**

Automatic pre-commit hooks prevent credentials from being committed to your repository. The hooks scan staged files and block commits if high-severity issues are detected, providing immediate feedback to developers before code is pushed.

**Customizable Configuration**

Tailor the tool to your specific needs with flexible configuration options. Exclude test files or specific directories, set minimum severity thresholds, disable patterns that cause false positives in your codebase, and add custom patterns for proprietary services.

**Zero Dependencies for Runtime**

The core scanning engine has minimal runtime dependencies, making it lightweight and fast. All detection patterns are stored in JSON format, making them easy to read, modify, and contribute to.

**Advanced False Positive Reduction**

Three powerful mechanisms work together to dramatically reduce false positives:

Baseline/Ignore File: Generate a baseline of known findings and filter them from future scans. Review and mark findings as accepted risk, preventing alert fatigue from recurring issues. SHA-256 hashing ensures findings are tracked accurately even across file modifications.

Inline Ignore Comments: Use ESLint-style comments to suppress specific findings directly in your source code. Supports single-line ignores, next-line ignores, and block-level disabling for complete control over what gets flagged.

Entropy Detection: Shannon entropy analysis identifies high-randomness strings that are more likely to be secrets. Generic patterns can be configured to only report matches with high entropy, filtering out common variable names and test data.

**Baseline Management**

Generate and maintain baselines of known findings to focus on new issues. Each finding is hashed to track it uniquely across code changes. Mark findings as reviewed with reason and reviewer information for audit trails. Baseline files can be committed to version control to share accepted risks across teams.

## Installation

### Global Installation

Install the tool globally to use it across all your projects:

```bash
npm install -g hardcoded-api-key-detector
```

After global installation, the `hardcoded-detector` command will be available system-wide.

### Local Installation (Recommended for Projects)

Install as a development dependency in your project:

```bash
npm install --save-dev hardcoded-api-key-detector
```

This approach ensures consistent versions across your team and allows you to configure the tool specifically for your project.

### Using npx (No Installation Required)

Run the tool without installing it:

```bash
npx hardcoded-api-key-detector scan
```

This is useful for one-time scans or trying the tool before committing to an installation.

## Quick Start

### Basic Usage

Scan your current directory for hardcoded credentials:

```bash
hardcoded-detector scan
```

This command scans all files in the current directory and subdirectories, excluding common paths like `node_modules` and `.git`. Results are displayed in the console with color-coded severity levels.

### Scan Specific Directory

Target a specific directory for scanning:

```bash
hardcoded-detector scan ./src
```

This is useful when you want to focus on application code and exclude test files or documentation.

### Filter by Severity Level

Focus on high-priority issues by setting a minimum severity threshold:

```bash
hardcoded-detector scan --severity high
```

This command only reports credentials with "high" or "critical" severity, reducing noise from low-priority detections.

### Generate Reports in Different Formats

Output results to various file formats for different use cases:

```bash
# JSON format for programmatic processing
hardcoded-detector scan --output json --file security-report.json

# HTML format for comprehensive visual reports
hardcoded-detector scan --output html --file security-report.html

# TXT format for simple text-based sharing
hardcoded-detector scan --output txt --file security-report.txt

# CSV format for spreadsheet analysis
hardcoded-detector scan --output csv --file security-report.csv
```

The JSON output includes detailed metadata, severity breakdowns, and complete finding information suitable for integration with other security tools. HTML reports provide a comprehensive visual overview with syntax highlighting. TXT reports offer a simple, parseable format ideal for sharing via email or processing with text tools.

Real examples of generated reports are included in this repository:
- **[examples/example-report.txt](examples/example-report.txt)** - Text format report (729 KB) showing 2,921 findings with file paths, line numbers, and detected tokens
- **[examples/example-report.html](examples/example-report.html)** - HTML format report (5.4 MB) with interactive filtering and syntax highlighting

These reports were generated by scanning the test files in the `examples/` directory using:
```bash
hardcoded-detector scan examples/ --severity high --output txt --file examples/example-report.txt
hardcoded-detector scan examples/ --severity high --output html --file examples/example-report.html
```

### Scan Only Staged Files

Check staged files before committing:

```bash
hardcoded-detector scan --staged
```

This is particularly useful in pre-commit hooks or when you want to verify changes before creating a commit.

## Advanced Features

### Baseline/Ignore File

The baseline feature allows you to establish a snapshot of known findings and filter them from future scans. This is essential for managing existing codebases that may have legacy credentials or accepted risks.

#### Generate a Baseline

Create a baseline from your current scan results:

```bash
hardcoded-detector scan --generate-baseline
```

This creates a `.hardcoded-detector-baseline.json` file containing all current findings with SHA-256 hashes for tracking.

#### Use Baseline Filtering

Run scans with baseline filtering to see only new findings:

```bash
hardcoded-detector scan --baseline
```

Only findings not in the baseline will be reported, allowing you to focus on new issues.

#### Custom Baseline Path

Specify a custom baseline file location:

```bash
hardcoded-detector scan --baseline --baseline-path ./security/my-baseline.json
```

#### Baseline File Structure

The baseline file contains detailed information about each accepted finding:

```json
{
  "version": "1.0.0",
  "generatedAt": "2024-12-14T10:30:00.000Z",
  "totalFindings": 15,
  "files": {
    "src/config.js:42": {
      "type": "aws_access_key",
      "name": "AWS Access Key",
      "severity": "critical",
      "hash": "a1b2c3d4...",
      "reviewed": true,
      "reviewedBy": "security-team@company.com",
      "reviewDate": "2024-12-14T11:00:00.000Z",
      "reason": "Test credential for development environment only",
      "line": 42,
      "match": "AKIAIOSFODNN7EXAMPLE"
    }
  }
}
```

#### Workflow Integration

Typical workflow for managing baselines:

1. Initial scan: `hardcoded-detector scan --generate-baseline`
2. Review findings and mark as accepted risk
3. Commit baseline to version control
4. CI/CD scans: `hardcoded-detector scan --baseline`
5. Only new findings will fail the build

### Inline Ignore Comments

Suppress specific findings directly in your source code using ESLint-style comments. This provides fine-grained control without maintaining external configuration.

#### Disable Single Line

Ignore a finding on the same line:

```javascript
const apiKey = "your_api_key_here"; // hardcoded-detector:disable-line
```

#### Disable Next Line

Ignore a finding on the following line:

```javascript
// hardcoded-detector:disable-next-line
const apiKey = "your_api_key_here";
```

#### Disable Block

Disable detection for a block of code:

```javascript
/* hardcoded-detector:disable */
const config = {
  apiKey: "your_api_key_here",
  secret: "your_secret_here",
  token: "your_token_here"
};
/* hardcoded-detector:enable */
```

#### Supported Comment Styles

The tool recognizes various comment styles:

```javascript
// Single-line JavaScript/TypeScript comments
# Python/Shell comments
/* Multi-line C-style comments */
<!-- HTML comments -->
```

#### Best Practices

Use inline ignores sparingly for legitimate cases:
- Test fixtures and example code
- Documentation and comments
- Environment-specific configurations that are not secrets
- False positives from generic patterns

Do not use inline ignores to hide real secrets. Always rotate and externalize credentials.

### Entropy Detection

Shannon entropy analysis helps distinguish between random secrets and structured non-secret strings. High-entropy strings (high randomness) are more likely to be secrets.

#### Enable Entropy Filtering

Activate entropy-based filtering to reduce false positives:

```bash
hardcoded-detector scan --entropy-filter
```

When enabled, generic patterns will only report matches with high entropy (typically 4.5+ on a scale of 0-8).

#### How Entropy Works

Shannon entropy measures the randomness of a string:

- Low entropy (0-3.5): Common words, patterns, repeated characters
  - Example: "password123" - entropy ~3.2
  - Example: "aaabbbccc" - entropy ~1.5

- Medium entropy (3.5-4.5): Mixed alphanumeric with some structure
  - Example: "MyApiKey2024" - entropy ~3.8
  - Example: "user_token_abc" - entropy ~4.0

- High entropy (4.5+): Random strings, true secrets
  - Example: "xK9mP2qR7nL5wT3yH8" - entropy ~4.8
  - Example: random 32-character API keys typically have entropy ~5.0+

#### Entropy in Findings

All scan results include entropy information:

```json
{
  "match": "xK9mP2qR7nL5wT3yH8",
  "line": 15,
  "severity": "high",
  "entropy": {
    "value": 4.82,
    "level": "high"
  }
}
```

#### Pattern Configuration

Individual patterns can be configured to require high entropy using the `useEntropyFilter` flag in custom patterns:

```json
{
  "custom_api_key": {
    "name": "Custom API Key",
    "pattern": "[A-Za-z0-9]{32}",
    "useEntropyFilter": true,
    "severity": "high"
  }
}
```

#### Benefits

Entropy filtering dramatically reduces false positives for generic patterns:
- Filters out variable names like "apiKeyExample" or "testSecretKey"
- Filters out placeholder values like "your-api-key-here"
- Retains detection of actual random credentials
- Works particularly well with hex strings and Base64 patterns

### Combining Features

The most powerful approach combines all three features:

```bash
# Generate initial baseline
hardcoded-detector scan --generate-baseline

# Scan with baseline and entropy filtering
hardcoded-detector scan --baseline --entropy-filter

# Review new findings and add inline ignores for false positives
# Commit baseline and code changes together
```

This provides:
- Historical context (baseline)
- Inline documentation (ignore comments)
- Smart filtering (entropy detection)

## Real-World Use Cases

### Use Case 1: Pre-Commit Security Check

**Scenario**: You want to prevent developers from accidentally committing API keys to your repository.

**Solution**: Install pre-commit hooks that automatically scan staged files before each commit.

```bash
# Install the tool
npm install --save-dev hardcoded-api-key-detector

# Install git hooks
npx hardcoded-detector install-hooks

# Configure to block high-severity issues
npx hardcoded-detector init
```

Edit `.hardcoded-detector.json`:
```json
{
  "severity": "high",
  "hooks": {
    "preCommit": true
  }
}
```

**Result**: When developers try to commit files containing high-severity credentials, the commit is blocked with a detailed error message showing the detected issues.

### Use Case 2: CI/CD Pipeline Integration

**Scenario**: You want to scan all code in pull requests before merging to your main branch.

**Solution**: Add the detector to your GitHub Actions workflow.

Create `.github/workflows/security-scan.yml`:

```yaml
name: Security Scan

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install detector
        run: npm install -g hardcoded-api-key-detector

      - name: Run security scan
        run: hardcoded-detector scan --severity high --output json --file security-report.json

      - name: Check for high-severity issues
        run: |
          HIGH_COUNT=$(jq '.summary.severityBreakdown.high // 0' security-report.json)
          CRITICAL_COUNT=$(jq '.summary.severityBreakdown.critical // 0' security-report.json)
          TOTAL=$((HIGH_COUNT + CRITICAL_COUNT))

          if [ $TOTAL -gt 0 ]; then
            echo "Found $TOTAL high or critical severity issues"
            jq '.findings[] | select(.findings[].severity == "high" or .findings[].severity == "critical")' security-report.json
            exit 1
          fi

      - name: Upload security report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.json

      - name: Comment on PR with results
        if: github.event_name == 'pull_request' && failure()
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('security-report.json', 'utf8'));

            let comment = '## Security Scan Results\\n\\n';
            comment += `Found ${report.summary.totalFindings} potential credential(s) in ${report.summary.filesWithIssues} file(s)\\n\\n`;
            comment += '### Severity Breakdown\\n';
            comment += `- Critical: ${report.summary.severityBreakdown.critical || 0}\\n`;
            comment += `- High: ${report.summary.severityBreakdown.high || 0}\\n`;
            comment += `- Medium: ${report.summary.severityBreakdown.medium || 0}\\n`;
            comment += `- Low: ${report.summary.severityBreakdown.low || 0}\\n\\n`;
            comment += 'Please review and remove any hardcoded credentials before merging.';

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

**Result**: Every pull request is automatically scanned. If credentials are detected, the workflow fails and a comment is added to the PR with detailed findings.

### Use Case 3: Scheduled Repository Audits

**Scenario**: You want to periodically scan your entire repository to catch any credentials that may have been committed before the tool was implemented.

**Solution**: Set up a scheduled GitHub Actions workflow.

Create `.github/workflows/weekly-audit.yml`:

```yaml
name: Weekly Security Audit

on:
  schedule:
    # Run every Monday at 9 AM UTC
    - cron: '0 9 * * 1'
  workflow_dispatch: # Allow manual triggering

jobs:
  security-audit:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Run comprehensive scan
        run: |
          npx hardcoded-api-key-detector scan \
            --severity medium \
            --output html \
            --file audit-report.html

      - name: Upload audit report
        uses: actions/upload-artifact@v3
        with:
          name: weekly-audit-report
          path: audit-report.html
          retention-days: 90

      - name: Send notification if issues found
        if: failure()
        run: |
          # Send email, Slack notification, etc.
          echo "Security issues detected in weekly audit"
```

**Result**: Your repository is automatically scanned every week, and comprehensive HTML reports are archived for compliance and tracking purposes.

### Use Case 4: Development Environment Setup

**Scenario**: New developers joining your team should have the tool configured automatically.

**Solution**: Add setup instructions to your project's documentation and package.json.

In `package.json`:
```json
{
  "scripts": {
    "prepare": "hardcoded-detector install-hooks",
    "security:scan": "hardcoded-detector scan --severity high",
    "security:full": "hardcoded-detector scan --output html --file security-report.html"
  },
  "devDependencies": {
    "hardcoded-api-key-detector": "^1.0.0"
  }
}
```

In your project's README:
```markdown
## Setup

1. Install dependencies: `npm install`
2. Git hooks will be automatically installed
3. Run security scan: `npm run security:scan`
```

**Result**: When new developers run `npm install`, git hooks are automatically installed, ensuring consistent security practices across your team.

### Use Case 5: Integration with Existing Security Tools

**Scenario**: You want to integrate credential detection with your existing security scanning pipeline.

**Solution**: Use the JSON output format to pipe results to other tools or databases.

```bash
# Scan and process results with jq
hardcoded-detector scan --output json | jq '.findings[] | select(.findings[].severity == "critical")'

# Export to CSV for spreadsheet analysis
hardcoded-detector scan --output csv --file credentials-report.csv

# Generate JUnit XML for Jenkins or other CI tools
hardcoded-detector scan --output junit --file test-results.xml
```

**Integration with SonarQube example**:
```bash
# Generate JSON report
hardcoded-detector scan --output json --file sonar-security.json

# Convert to SonarQube format and import
node convert-to-sonar-format.js sonar-security.json > sonar-import.json
```

**Result**: Credential detection results are integrated into your broader security and quality assurance processes.

## GitHub Actions Integration

### Basic Configuration

The simplest GitHub Actions integration scans your code on every push and pull request:

```yaml
name: Credential Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npx hardcoded-api-key-detector scan --severity high
```

### Advanced Configuration with Failure Threshold

This configuration only fails the build if critical or high-severity credentials are found:

```yaml
name: Security Check

on:
  pull_request:
    branches: [ main ]

jobs:
  credential-scan:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Scan for credentials
        id: scan
        run: |
          npx hardcoded-api-key-detector scan \
            --output json \
            --file scan-results.json || true

      - name: Analyze results
        run: |
          CRITICAL=$(jq '.summary.severityBreakdown.critical // 0' scan-results.json)
          HIGH=$(jq '.summary.severityBreakdown.high // 0' scan-results.json)

          echo "Critical issues: $CRITICAL"
          echo "High issues: $HIGH"

          if [ $CRITICAL -gt 0 ] || [ $HIGH -gt 0 ]; then
            echo "::error::Found $CRITICAL critical and $HIGH high severity credential(s)"
            exit 1
          fi

      - name: Upload scan results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: credential-scan-results
          path: scan-results.json
```

### Scan Only Changed Files

For faster PR checks, scan only the files modified in the pull request:

```yaml
name: Scan Changed Files

on:
  pull_request:
    branches: [ main ]

jobs:
  scan-changes:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Get changed files
        id: changed-files
        run: |
          git diff --name-only origin/${{ github.base_ref }}...HEAD > changed-files.txt
          echo "Changed files:"
          cat changed-files.txt

      - name: Scan changed files
        run: |
          while IFS= read -r file; do
            if [ -f "$file" ]; then
              npx hardcoded-api-key-detector scan "$file" --severity high
            fi
          done < changed-files.txt
```

### Matrix Strategy for Multiple Node Versions

Ensure compatibility across different Node.js versions:

```yaml
name: Multi-Version Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [14, 16, 18, 20]

    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npx hardcoded-api-key-detector scan --severity high
```

### Slack Notification on Detection

Send notifications to Slack when credentials are detected:

```yaml
name: Scan with Notifications

on: [push]

jobs:
  scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Run scan
        id: scan
        run: |
          npx hardcoded-api-key-detector scan \
            --output json \
            --file results.json || true

          ISSUES=$(jq '.summary.totalFindings' results.json)
          echo "issues=$ISSUES" >> $GITHUB_OUTPUT

      - name: Send Slack notification
        if: steps.scan.outputs.issues > 0
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Hardcoded credentials detected!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Credential Scan Alert*\nFound ${{ steps.scan.outputs.issues }} potential credential(s) in commit ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Configuration

### Configuration File

Create a `.hardcoded-detector.json` file in your project root to customize behavior:

```json
{
  "version": "1.0.0",
  "exclude": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "test/**",
    "tests/**",
    "*.test.js",
    "*.spec.js",
    "*.min.js",
    ".git/**"
  ],
  "severity": "medium",
  "output": {
    "format": "console",
    "colors": true,
    "verbose": false
  },
  "hooks": {
    "preCommit": true,
    "prePush": false
  },
  "patterns": {
    "customPatterns": "./custom-patterns.json",
    "disabledPatterns": [
      "generic_api_key",
      "generic_secret_key"
    ],
    "excludeCategories": [
      "cryptocurrency"
    ]
  },
  "reporting": {
    "groupBy": "file",
    "showContext": true,
    "contextLines": 3
  }
}
```

### Configuration Options Explained

**exclude**: Array of glob patterns specifying files and directories to skip during scanning. By default, the tool excludes common paths like `node_modules`, `.git`, and build directories. Add your project-specific exclusions here.

**severity**: Minimum severity level for reporting. Options are `low`, `medium`, `high`, or `critical`. Setting this to `high` will only report high and critical severity findings, reducing noise from lower-priority detections.

**output**: Controls how results are displayed. The `format` option supports `console`, `json`, `html`, `csv`, and `junit`. Enable `colors` for terminal output and `verbose` for detailed information about each finding.

**hooks**: Configuration for git hooks. Enable `preCommit` to scan staged files before each commit, or `prePush` to scan before pushing to remote repositories.

**patterns.customPatterns**: Path to a JSON file containing custom detection patterns specific to your organization or proprietary services.

**patterns.disabledPatterns**: Array of pattern IDs to disable. Use this when specific patterns cause too many false positives in your codebase.

**patterns.excludeCategories**: Array of categories to exclude from scanning. For example, exclude `cryptocurrency` if you don't work with blockchain applications.

**reporting.groupBy**: How to organize findings in reports. Options are `file` (group by file path) or `severity` (group by severity level).

**reporting.showContext**: Whether to show surrounding code lines for each finding. This helps understand the context of detected credentials.

**reporting.contextLines**: Number of lines to show before and after each finding when `showContext` is enabled.

## Custom Detection Patterns

### Creating Custom Patterns

Organizations often have internal services with proprietary credential formats. You can add custom detection patterns to identify these credentials:

Create a `custom-patterns.json` file:

```json
{
  "metadata": {
    "version": "1.0.0",
    "description": "Custom patterns for Acme Corporation internal services",
    "author": "security-team@acme.com"
  },
  "patterns": {
    "acme_internal_api": {
      "name": "Acme Internal API Key",
      "pattern": "(?i)(?:acme|internal)_?(?:api|access)_?(?:key|token)\\s*[=:]\\s*['\"]?(ACME_[A-Z0-9]{32})['\"]?",
      "severity": "critical",
      "category": "custom",
      "service": "Acme Internal Services",
      "description": "Internal API key for Acme services with context",
      "confidence": "high",
      "references": [
        "https://docs.acme.internal/security/api-keys"
      ]
    },
    "acme_database_password": {
      "name": "Acme Database Password",
      "pattern": "(?i)(?:database|db)_?(?:password|pwd|pass)\\s*[=:]\\s*['\"]?([A-Za-z0-9!@#$%^&*]{16,})['\"]?",
      "severity": "critical",
      "category": "database",
      "service": "Acme Database",
      "description": "Database password with context (minimum 16 characters)",
      "confidence": "medium"
    },
    "acme_service_token": {
      "name": "Acme Service Token",
      "pattern": "(?i)(?:acme|service)_?(?:token|bearer)\\s*[=:]\\s*['\"]?(ast_[a-z0-9]{48})['\"]?",
      "severity": "high",
      "category": "authentication",
      "service": "Acme Service Authentication",
      "description": "Service authentication token with context",
      "confidence": "high"
    }
  }
}
```

### Pattern Design Guidelines

**Use Context-Aware Patterns**: Include variable names or assignment patterns to reduce false positives. The pattern should look for both the credential format and its context (variable name).

**Choose Appropriate Severity**: Assign severity based on the potential impact of credential exposure. Critical severity should be reserved for credentials that could cause immediate and severe damage.

**Set Realistic Confidence Levels**: High confidence should only be assigned to patterns with distinctive formats or strong contextual clues. Medium confidence is appropriate for patterns that might have some false positives.

**Include References**: Link to internal documentation about the credential type, security policies, and rotation procedures.

### Reference Custom Patterns in Configuration

In your `.hardcoded-detector.json`:

```json
{
  "patterns": {
    "customPatterns": "./custom-patterns.json"
  }
}
```

The tool will merge your custom patterns with the built-in patterns during scanning.

## Supported Services and Patterns

The tool includes 245 detection patterns across 15 categories:

### AI and Machine Learning Platforms (17 patterns)

OpenAI GPT/DALL-E/Whisper API keys, Anthropic Claude API keys, Google AI Gemini API keys, Hugging Face model tokens, Cohere language model keys, Replicate ML deployment tokens, Stability AI image generation keys, ElevenLabs voice synthesis keys, AssemblyAI speech-to-text keys, Deepgram speech recognition keys, Pinecone vector database keys, Weaviate vector search keys, LangSmith monitoring tokens, Mistral AI API keys, Together AI keys, and more specialized AI service credentials.

### Cloud Service Providers (25 patterns)

Amazon Web Services access keys and secret keys, Google Cloud Platform API keys and service account credentials, Microsoft Azure subscription keys and storage account keys, DigitalOcean personal access tokens and Spaces keys, Vercel deployment tokens, Render API tokens, Heroku API keys, Netlify build tokens, Railway cloud platform tokens, Fly.io edge computing credentials, Cloudflare API tokens, Fastly CDN tokens, Linode cloud hosting keys, Vultr server provider keys, Oracle Cloud infrastructure tokens, and other cloud platform credentials.

### Database Services (29 patterns)

MongoDB connection URIs with embedded credentials, PostgreSQL connection strings, MySQL connection URIs, Redis connection strings with passwords, Elasticsearch cluster credentials, Supabase PostgreSQL credentials, PlanetScale MySQL database keys, Firebase Realtime Database URIs, Airtable API tokens, Notion database integration tokens, FaunaDB serverless database keys, InfluxDB time-series database tokens, ClickHouse analytical database credentials, and other database service authentication.

### Payment Processing (13 patterns)

Stripe live and test API secret keys, PayPal access tokens and client secrets, Square OAuth tokens and access tokens, Braintree payment gateway credentials, and other payment service provider authentication tokens.

### Communication Services (13 patterns)

Twilio API keys and auth tokens, SendGrid email API keys, Postmark server tokens, Mailchimp marketing API keys, Mailjet email service keys, Slack bot tokens and user tokens, Discord bot tokens and webhooks, Telegram bot API tokens, and other messaging platform credentials.

### Development Tools (15 patterns)

GitHub personal access tokens, GitLab personal access tokens and deploy tokens, Bitbucket app passwords, NPM package registry tokens, Docker Hub registry credentials, CircleCI API tokens, Travis CI tokens, Jenkins authentication tokens, and other CI/CD platform credentials.

### Monitoring and Analytics (25 patterns)

Datadog API keys and application keys, New Relic license keys, Sentry error tracking tokens, LogRocket session replay tokens, Amplitude analytics keys, Mixpanel tracking tokens, Segment write keys, Bugsnag error monitoring keys, Rollbar access tokens, and other observability platform credentials.

### Authentication Services (12 patterns)

Auth0 client secrets, Okta API tokens, Firebase authentication keys, Clerk secret keys, JWT tokens with context, OAuth bearer tokens, and other identity management platform credentials.

### Storage and CDN (9 patterns)

AWS S3 access keys, Azure Blob Storage credentials, Cloudinary media management keys, Imgix image processing tokens, BunnyCDN API keys, KeyCDN acceleration keys, and other content delivery network credentials.

### Security and Certificates (13 patterns)

Private keys in PEM format (RSA, DSA, ECDSA, Ed25519), SSH private keys, PGP private key blocks, SSL/TLS certificates, and other cryptographic credentials.

### E-commerce Platforms (8 patterns)

Shopify API keys and access tokens, WooCommerce consumer keys, BigCommerce API tokens, Magento access tokens, Etsy API keys, and other online store platform credentials.

### Content Management Systems (8 patterns)

WordPress.com API keys, Drupal API tokens, Ghost admin API keys, Contentful content management tokens, Sanity studio tokens, Strapi CMS keys, and other content platform credentials.

### CRM and Marketing (12 patterns)

Salesforce access tokens, HubSpot API keys, Zendesk authentication tokens, Intercom API tokens, Mailchimp marketing keys, ConvertKit API secrets, ActiveCampaign keys, and other customer relationship management credentials.

### Infrastructure as Code (8 patterns)

Terraform Cloud tokens, HashiCorp Vault tokens, Consul cluster tokens, Nomad orchestration tokens, Pulumi access tokens, and other infrastructure management credentials.

### Generic Patterns (8 patterns)

Generic API key patterns with context, generic secret key patterns, JWT tokens, bearer tokens, password patterns in URLs, connection strings, and other common credential formats.

To see all available patterns with details:

```bash
hardcoded-detector patterns

# Filter by category
hardcoded-detector patterns --category ai

# Filter by service
hardcoded-detector patterns --service github
```

## Command Line Interface

### scan command

Scan directories for hardcoded credentials:

```bash
hardcoded-detector scan [directory] [options]
```

**Arguments:**
- `directory`: Path to scan (default: current directory)

**Options:**
- `-c, --config <path>`: Path to configuration file (default: `.hardcoded-detector.json`)
- `-o, --output <format>`: Output format - `console`, `json`, `html`, `csv`, or `junit` (default: `console`)
- `-f, --file <path>`: Output file path (writes to stdout if not specified)
- `-s, --severity <level>`: Minimum severity level - `low`, `medium`, `high`, or `critical` (default: `medium`)
- `--staged`: Scan only staged files in git (useful for pre-commit hooks)
- `--exclude <patterns...>`: Additional glob patterns to exclude (adds to config exclusions)
- `--baseline`: Use baseline file to filter known findings
- `--baseline-path <path>`: Path to baseline file (default: `.hardcoded-detector-baseline.json`)
- `--generate-baseline`: Generate baseline file from current scan results
- `--entropy-filter`: Enable entropy-based filtering to reduce false positives
- `--no-colors`: Disable colored output (useful for CI/CD logs)
- `--verbose`: Enable verbose logging with detailed scan progress

**Examples:**

```bash
# Scan current directory with default settings
hardcoded-detector scan

# Scan specific directory with high severity threshold
hardcoded-detector scan ./src --severity high

# Generate HTML report
hardcoded-detector scan --output html --file security-audit.html

# Scan only staged files (pre-commit scenario)
hardcoded-detector scan --staged --severity high

# Exclude additional patterns
hardcoded-detector scan --exclude "**/*.test.js" "fixtures/**"

# Verbose JSON output to file
hardcoded-detector scan --output json --file report.json --verbose

# Generate baseline from current scan
hardcoded-detector scan --generate-baseline

# Scan with baseline filtering
hardcoded-detector scan --baseline

# Scan with entropy filtering enabled
hardcoded-detector scan --entropy-filter

# Combine baseline and entropy filtering
hardcoded-detector scan --baseline --entropy-filter --severity high
```

### init command

Initialize configuration file with sensible defaults:

```bash
hardcoded-detector init [options]
```

**Options:**
- `-f, --force`: Overwrite existing configuration file

This command creates a `.hardcoded-detector.json` file in your current directory with recommended settings. Review and customize the file for your project's specific needs.

**Example:**

```bash
# Create configuration file
hardcoded-detector init

# Force overwrite existing configuration
hardcoded-detector init --force
```

### install-hooks command

Install git pre-commit hooks for automatic scanning:

```bash
hardcoded-detector install-hooks
```

This command creates or updates `.git/hooks/pre-commit` to automatically scan staged files before each commit. If high or critical severity credentials are detected, the commit is blocked and findings are displayed.

The hook script:
- Scans only staged files for performance
- Uses the severity level from your configuration
- Provides clear feedback about detected issues
- Can be bypassed with `git commit --no-verify` in emergencies (not recommended)

**Example:**

```bash
# Install hooks
hardcoded-detector install-hooks

# Verify installation
cat .git/hooks/pre-commit
```

### patterns command

List available detection patterns:

```bash
hardcoded-detector patterns [options]
```

**Options:**
- `-c, --category <category>`: Filter by category (e.g., `ai`, `cloud`, `database`)
- `-s, --service <service>`: Filter by service name (e.g., `github`, `aws`, `stripe`)
- `--json`: Output in JSON format

**Examples:**

```bash
# List all patterns
hardcoded-detector patterns

# Show only AI platform patterns
hardcoded-detector patterns --category ai

# Show GitHub-specific patterns
hardcoded-detector patterns --service github

# Export patterns to JSON
hardcoded-detector patterns --json > patterns-list.json
```

## Programmatic API Usage

### Basic Usage

```javascript
const HardcodedApiDetector = require('hardcoded-api-key-detector');

// Create detector instance with options
const detector = new HardcodedApiDetector({
  severity: 'high',
  exclude: ['test/**', '*.test.js'],
  customPatternsPath: './custom-patterns.json'
});

// Scan a directory
async function scanProject() {
  try {
    const results = await detector.scan('./src');

    console.log(`Scanned ${results.totalFiles} files`);
    console.log(`Found issues in ${results.filesWithIssues} files`);

    // Process findings
    results.findings.forEach(fileResult => {
      console.log(`\nFile: ${fileResult.file}`);
      fileResult.findings.forEach(finding => {
        console.log(`  - ${finding.name} (${finding.severity})`);
        console.log(`    Line ${finding.line}: ${finding.lineContent}`);
      });
    });

    // Exit with error if critical issues found
    const criticalCount = results.findings
      .reduce((sum, f) => sum + f.findings.filter(x => x.severity === 'critical').length, 0);

    if (criticalCount > 0) {
      console.error(`Found ${criticalCount} critical issues!`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Scan failed:', error.message);
    process.exit(1);
  }
}

scanProject();
```

### Advanced Usage with Content Analyzer

```javascript
const ContentAnalyzer = require('hardcoded-api-key-detector/src/scanner/analyzer');
const fs = require('fs').promises;

async function analyzeSpecificFiles() {
  // Create analyzer with custom patterns
  const analyzer = new ContentAnalyzer('./custom-patterns.json');

  // Analyze individual files
  const filesToScan = ['src/config.js', 'src/auth.js', 'src/api.js'];

  for (const file of filesToScan) {
    const findings = await analyzer.analyzeContent(file, {
      minSeverity: 'high',
      disabledPatterns: ['generic_api_key'],
      excludeCategories: ['cryptocurrency']
    });

    if (findings.length > 0) {
      console.log(`\nIssues in ${file}:`);
      findings.forEach(finding => {
        console.log(`  ${finding.name} at line ${finding.line}`);
        console.log(`  Severity: ${finding.severity}, Confidence: ${finding.confidence}`);
        console.log(`  Service: ${finding.service}, Category: ${finding.type}`);
      });
    }
  }
}

analyzeSpecificFiles().catch(console.error);
```

### Custom Reporter

```javascript
const HardcodedApiDetector = require('hardcoded-api-key-detector');

class CustomReporter {
  constructor() {
    this.detector = new HardcodedApiDetector({
      severity: 'medium'
    });
  }

  async generateReport(directory) {
    const results = await this.detector.scan(directory);

    // Create custom report format
    const report = {
      timestamp: new Date().toISOString(),
      directory: directory,
      summary: {
        totalFiles: results.totalFiles,
        filesWithIssues: results.filesWithIssues,
        totalFindings: results.findings.reduce((sum, f) => sum + f.findings.length, 0)
      },
      severityBreakdown: this.calculateSeverityBreakdown(results),
      highRiskFiles: this.identifyHighRiskFiles(results),
      recommendations: this.generateRecommendations(results)
    };

    return report;
  }

  calculateSeverityBreakdown(results) {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };

    results.findings.forEach(fileResult => {
      fileResult.findings.forEach(finding => {
        breakdown[finding.severity]++;
      });
    });

    return breakdown;
  }

  identifyHighRiskFiles(results) {
    return results.findings
      .filter(f => f.findings.some(finding => finding.severity === 'critical' || finding.severity === 'high'))
      .map(f => ({
        file: f.file,
        criticalCount: f.findings.filter(x => x.severity === 'critical').length,
        highCount: f.findings.filter(x => x.severity === 'high').length
      }));
  }

  generateRecommendations(results) {
    const recommendations = [];

    if (this.calculateSeverityBreakdown(results).critical > 0) {
      recommendations.push('Immediately rotate all critical credentials found');
    }

    if (results.filesWithIssues > 0) {
      recommendations.push('Move credentials to environment variables or secure vault');
      recommendations.push('Add .env files to .gitignore');
      recommendations.push('Install pre-commit hooks to prevent future occurrences');
    }

    return recommendations;
  }
}

// Usage
const reporter = new CustomReporter();
reporter.generateReport('./src')
  .then(report => console.log(JSON.stringify(report, null, 2)))
  .catch(console.error);
```

## Output Formats

### Console Output

Human-readable format with color-coded severity levels:

```
Scanning for hardcoded API keys...
Using single-threaded scanning for 42 files

[RESULTS] Scan Results:
Files scanned: 42
Files with issues: 3

[CRITICAL] Critical: 1
[HIGH] High: 2
[MEDIUM] Medium: 1

[FILE] src/config/database.js
  [FOUND] MongoDB Connection URI (critical)
    Line 15: const mongoUri = "mongodb://admin:password123@localhost:27017/myapp";
    Service: MongoDB | Category: database
    MongoDB connection string with embedded credentials

[FILE] src/auth/github.js
  [FOUND] GitHub Personal Access Token (high)
    Line 8: const githubToken = "YOUR_GITHUB_TOKEN_HERE";
    Service: GitHub | Category: development
    GitHub Personal Access Token

[FILE] src/services/stripe.js
  [FOUND] Stripe API Key (high)
    Line 22: const stripeKey = "YOUR_STRIPE_KEY_HERE";
    Service: Stripe | Category: payment
    Stripe API Secret Key
```

### JSON Output

Structured format suitable for programmatic processing:

```json
{
  "metadata": {
    "scanTime": "2024-12-14T15:30:00.000Z",
    "tool": "hardcoded-api-detector",
    "version": "1.0.0",
    "scanDuration": 1.234
  },
  "summary": {
    "totalFiles": 42,
    "filesWithIssues": 3,
    "totalFindings": 4,
    "severityBreakdown": {
      "critical": 1,
      "high": 2,
      "medium": 1,
      "low": 0
    }
  },
  "findings": [
    {
      "file": "src/config/database.js",
      "findings": [
        {
          "id": "mongodb_uri",
          "name": "MongoDB Connection URI",
          "severity": "critical",
          "type": "database",
          "service": "MongoDB",
          "description": "MongoDB connection string with embedded credentials",
          "confidence": "high",
          "match": "mongodb://admin:password123@localhost:27017/myapp",
          "line": 15,
          "column": 20,
          "lineContent": "const mongoUri = \"mongodb://admin:password123@localhost:27017/myapp\";"
        }
      ]
    }
  ]
}
```

### HTML Output

Comprehensive report with syntax highlighting and interactive filtering:

The HTML report includes:
- Executive summary with charts and statistics
- Filterable findings by severity, service, and category
- Syntax-highlighted code snippets
- Exportable data tables
- Recommendations and remediation guidance

Generate HTML report:
```bash
# Generate HTML report from your codebase
hardcoded-detector scan --output html --file security-report.html

# Example: scan the examples directory
hardcoded-detector scan examples/ --severity high --output html --file examples/example-report.html
```

A real example report is available at **[examples/example-report.html](examples/example-report.html)** (5.4 MB) generated from scanning the test files in this repository. Open it in your browser to see the full interactive report with:
- Executive summary with 2,921 findings (144 critical, 2,777 high)
- Color-coded severity indicators
- Organized by file with code context
- Clean relative paths (e.g., `./examples/database-config.js`)

### CSV Output

Spreadsheet-compatible format for analysis:

```csv
File,Line,Severity,Service,Category,Name,Description,Match
src/config/database.js,15,critical,MongoDB,database,MongoDB Connection URI,MongoDB connection string with embedded credentials,"mongodb://admin:password123@localhost:27017/myapp"
src/auth/github.js,8,high,GitHub,development,GitHub Personal Access Token,GitHub Personal Access Token,YOUR_GITHUB_TOKEN_HERE
```

Generate CSV report:
```bash
hardcoded-detector scan --output csv --file findings.csv
```

### Text (TXT) Output

Simple text format showing file path, line number, and detected token:

```
================================================================================
  HARDCODED API DETECTOR - TEXT REPORT
================================================================================

Scan Time: 14/12/2024, 15:30:00
Tool: hardcoded-api-detector
Repository: https://github.com/686f6c61/hardcoded-api-detector

--------------------------------------------------------------------------------
SUMMARY
--------------------------------------------------------------------------------
Files Scanned:      42
Files with Issues:  3
Total Findings:     4

Severity Breakdown:
  Critical:         1
  High:             2
  Medium:           1
  Low:              0

--------------------------------------------------------------------------------
FINDINGS
--------------------------------------------------------------------------------

Format: FILE:LINE - TOKEN (CREDENTIAL_NAME) [SEVERITY]

src/config/database.js:15                                    - mongodb://admin:password123@localhost:27017/myapp
                                                               (MongoDB Connection URI) [CRITICAL]
                                                               Service: MongoDB

src/auth/github.js:8                                         - YOUR_GITHUB_TOKEN_HERE
                                                               (GitHub Personal Access Token) [HIGH]
                                                               Service: GitHub

src/services/stripe.js:22                                    - YOUR_STRIPE_KEY_HERE
                                                               (Stripe API Key) [HIGH]
                                                               Service: Stripe

--------------------------------------------------------------------------------
End of Report - 4 findings detected
--------------------------------------------------------------------------------
```

Generate TXT report:
```bash
# Generate text report from your codebase
hardcoded-detector scan --output txt --file findings.txt

# Example: scan the examples directory
hardcoded-detector scan examples/ --severity high --output txt --file examples/example-report.txt
```

This format is ideal for:
- Quick review and sharing via email or chat
- Parsing with simple text processing tools (grep, awk, sed)
- Archiving scan results in a human-readable format
- Integration with legacy systems that require plain text
- Processing with shell scripts for automation

A real example report is available at **[examples/example-report.txt](examples/example-report.txt)** (729 KB) generated from scanning the test files in this repository. The report shows 2,921 findings with clean relative paths:

```
./examples/database-config.js:5                              - mongodb://admin:SuperSecret123@
                                                               (MongoDB Connection URI) [HIGH]
                                                               Service: MongoDB

./examples/aws-config.js:9                                   - aws_secret_access_key: "wJal..."
                                                               (AWS Secret Access Key) [CRITICAL]
                                                               Service: Amazon Web Services
```

### JUnit XML Output

Compatible with CI/CD platforms like Jenkins:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Hardcoded API Detector" tests="42" failures="3" errors="0" time="1.234">
    <testcase name="src/config/database.js" classname="credential-scan">
      <failure message="MongoDB Connection URI (critical)" type="credential">
        Line 15: const mongoUri = "mongodb://admin:password123@localhost:27017/myapp";
        Service: MongoDB | Category: database
      </failure>
    </testcase>
  </testsuite>
</testsuites>
```

## Contributing

We welcome contributions from the community. Whether you want to add detection patterns for new services, fix bugs, improve documentation, or suggest enhancements, your input is valuable.

### Ways to Contribute

**Add New Detection Patterns**: If you use a service that is not currently supported, add a detection pattern to `src/detectors/services.json`. Follow the pattern format and include tests.

**Report False Positives**: If a pattern incorrectly identifies something as a credential, create an issue with the pattern ID and example code. We will refine the pattern to improve accuracy.

**Improve Documentation**: Help make the documentation clearer, more comprehensive, or better organized. Fix typos, add examples, or clarify confusing sections.

**Fix Bugs**: Review open issues and submit pull requests with fixes. Include tests that verify the fix.

**Suggest Features**: Have an idea for a new feature or improvement? Create an issue to discuss it with the community.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/hardcoded-api-key-detector.git
cd hardcoded-api-key-detector

# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Run tests with coverage
npm run test:coverage
```

### Adding a New Pattern

1. Edit `src/detectors/services.json`
2. Add your pattern following this structure:

```json
{
  "your_service_key": {
    "name": "Your Service API Key",
    "pattern": "(?i)(?:yourservice|alias)_?(?:api)_?(?:key)\\s*[=:]\\s*['\"]?([A-Z0-9]{32})['\"]?",
    "severity": "high",
    "category": "cloud",
    "service": "Your Service",
    "description": "Your Service API Key with context",
    "confidence": "high",
    "references": [
      "https://docs.yourservice.com/authentication"
    ]
  }
}
```

3. Add tests in `tests/analyzer.test.js`
4. Run tests to verify
5. Submit a pull request

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Changelog

### Version 1.0.0 (2024-12-14)

Initial release of Hardcoded API Key Detector with comprehensive security scanning capabilities.

**Core Features:**
- 245 detection patterns covering AI platforms, cloud providers, databases, payment services, development tools, and more
- Context-aware pattern matching to reduce false positives
- Multiple output formats: console, JSON, HTML, CSV, TXT, JUnit XML
- Parallel processing with worker threads for large codebases
- Stream-based analysis for memory-efficient scanning
- Git integration with pre-commit hooks
- Customizable configuration and custom pattern support

**Advanced Features:**
- Baseline/Ignore File: Generate and maintain baselines of known findings with SHA-256 hashing for accurate tracking across code changes
- Inline Ignore Comments: ESLint-style comments for suppressing specific findings (disable-line, disable-next-line, disable/enable blocks)
- Entropy Detection: Shannon entropy analysis to identify high-randomness strings and filter out low-entropy false positives
- Entropy filtering flag to enable smart detection on generic patterns

**CLI Commands:**
- `scan` - Scan directories for hardcoded credentials with filtering options
- `init` - Initialize configuration file with recommended settings
- `install-hooks` - Install git pre-commit hooks for automatic scanning
- `patterns` - List available detection patterns with filtering

**New Scan Options:**
- `--baseline` - Use baseline file to filter known findings
- `--baseline-path` - Specify custom baseline file location
- `--generate-baseline` - Create baseline from scan results
- `--entropy-filter` - Enable entropy-based false positive reduction

**Supported Services:**
- AI/ML: OpenAI, Anthropic Claude, Google AI, Hugging Face, Cohere, and 12 more
- Cloud: AWS, GCP, Azure, DigitalOcean, Vercel, Heroku, and 19 more
- Databases: MongoDB, PostgreSQL, Redis, Elasticsearch, and 25 more
- Payment: Stripe, PayPal, Square, Braintree, and 9 more
- Communication: Twilio, SendGrid, Mailchimp, Slack, Discord, and 8 more
- Development: GitHub, GitLab, NPM, Docker, CircleCI, and 10 more
- And 190+ additional patterns across monitoring, authentication, storage, CMS, CRM, and infrastructure services

**Performance:**
- Scan medium-sized projects (1000 files) in under 10 seconds
- Memory-efficient stream processing for large files
- Parallel worker threads for multi-core utilization
- ReDoS protection with safe regex execution and timeouts

**Integration:**
- GitHub Actions workflows included
- GitLab CI/CD compatible
- Jenkins integration via JUnit XML output
- Slack notification examples
- Programmatic API for custom integrations

**Documentation:**
- Comprehensive README with real-world use cases
- API documentation for programmatic usage
- Contributing guidelines for pattern additions
- Example reports (HTML, TXT, JSON) included

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete details.

## Support and Community

**GitHub Issues**: Report bugs, request features, or ask questions at https://github.com/686f6c61/hardcoded-api-key-detector/issues

**Pull Requests**: Contributions are welcome. Please read the contributing guidelines before submitting.

**Security Issues**: If you discover a security vulnerability, please email the maintainer directly rather than creating a public issue.

## Author

Created and maintained by 686f6c61.

## Acknowledgments

This project is built with contributions from the open-source community. Special thanks to all contributors who have added patterns, reported issues, and improved the tool.

The detection patterns are based on publicly available documentation from service providers and security research on credential formats.
