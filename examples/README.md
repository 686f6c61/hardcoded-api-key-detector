# Examples Directory

This directory contains example files for testing the Hardcoded API Detector.

**WARNING**: All credentials in these files are fake examples for testing purposes only. Never use real credentials in test files.

## Files

### Files with Hardcoded Credentials (Should be Detected)

1. **aws-config.js** - AWS access keys and secret keys
   - Contains hardcoded AWS credentials in multiple formats
   - Expected detections: AWS Access Key ID, AWS Secret Access Key

2. **api-keys.js** - Various API keys from popular services
   - OpenAI, Anthropic, Google, Stripe, GitHub tokens
   - Expected detections: Multiple high-severity API keys

3. **database-config.js** - Database connection strings
   - MongoDB, PostgreSQL, MySQL, Redis URIs with embedded credentials
   - Expected detections: Connection strings with passwords

4. **communication-tokens.js** - Communication service tokens
   - Slack, Discord, Telegram, SendGrid, Twilio, Mailchimp
   - Expected detections: Bot tokens, API keys, auth tokens

5. **ai-services.js** - AI/ML platform credentials
   - OpenAI, Anthropic, Hugging Face, Cohere, Replicate, etc.
   - Expected detections: AI service API keys

6. **.env.example** - Environment file with hardcoded values
   - Multiple services in environment variable format
   - Expected detections: Many credentials across different services

### Clean Configuration (Should NOT be Detected)

7. **clean-config.js** - Proper configuration using environment variables
   - Uses process.env for all sensitive values
   - Contains MD5 and SHA256 hashes that might look like credentials
   - Expected detections: None (or only low-confidence generic patterns)

## Example Reports

This directory includes real example reports generated from scanning the test files:

- **example-report.txt** - Text format report showing file:line - token format
- **example-report.html** - HTML format report with interactive filtering and syntax highlighting

These reports were generated with:
```bash
# Text report
hardcoded-detector scan examples/ --severity high --output txt --file examples/example-report.txt

# HTML report
hardcoded-detector scan examples/ --severity high --output html --file examples/example-report.html
```

## Testing the Detector

### Scan all examples

```bash
# From the project root
node src/cli/index.js scan examples/

# Or with npx
npx hardcoded-detector scan examples/
```

### Scan with different severity levels

```bash
# Only critical and high severity
npx hardcoded-detector scan examples/ --severity high

# All findings including medium and low
npx hardcoded-detector scan examples/ --severity low
```

### Generate different output formats

```bash
# JSON output (for programmatic processing)
npx hardcoded-detector scan examples/ --output json --file examples-report.json

# HTML report (interactive visual report)
npx hardcoded-detector scan examples/ --severity high --output html --file examples/example-report.html

# TXT report (simple text format)
npx hardcoded-detector scan examples/ --severity high --output txt --file examples/example-report.txt

# CSV output (for spreadsheet analysis)
npx hardcoded-detector scan examples/ --output csv --file examples-report.csv

# JUnit XML (for CI/CD integration)
npx hardcoded-detector scan examples/ --output junit --file examples-report.xml
```

The `example-report.txt` and `example-report.html` files in this directory are real examples generated from scanning these test files.

### Test specific files

```bash
# Test AWS configuration
npx hardcoded-detector scan examples/aws-config.js

# Test database configurations
npx hardcoded-detector scan examples/database-config.js

# Test clean configuration (should have minimal or no detections)
npx hardcoded-detector scan examples/clean-config.js
```

## Expected Results

When scanning the examples directory, you should expect:

- **Total files**: 7
- **Files with issues**: 6 (all except clean-config.js)
- **Total findings**: 40+ credentials detected
- **Severity breakdown**:
  - Critical: 10+ (database passwords, AWS secret keys)
  - High: 25+ (API keys, tokens)
  - Medium: 5+ (some service tokens)
  - Low: 0-2 (generic patterns in clean-config.js if any)

## Testing Context-Aware Detection

The detector uses context-aware patterns to reduce false positives. You can verify this by:

1. **Scanning clean-config.js**: Should have zero or minimal detections because values are from environment variables
2. **Scanning files with variable names**: Credentials with proper variable names (e.g., `aws_secret_key = "value"`) are detected with high confidence
3. **Hash vs Credential**: MD5/SHA256 hashes in clean-config.js should NOT be flagged as credentials

## Validating Pattern Quality

Check the confidence levels in the results:

- Patterns with unique prefixes (AKIA, sk-proj-, ghp_) should have HIGH confidence
- Patterns with context (variable names) should have HIGH confidence  
- Generic patterns without context should have MEDIUM or LOW confidence

This demonstrates the effectiveness of the pattern improvements implemented in the project.
