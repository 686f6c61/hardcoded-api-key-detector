# Contributing to Hardcoded API Detector

Thank you for your interest in contributing to Hardcoded API Detector. This document provides comprehensive guidelines and information for contributors who wish to improve the project through code contributions, pattern additions, bug reports, or documentation improvements.

## Table of Contents

- [Getting Started](#getting-started)
- [Adding New Detection Patterns](#adding-new-detection-patterns)
- [Pattern Quality Guidelines](#pattern-quality-guidelines)
- [Reporting Issues](#reporting-issues)
- [Code Contributions](#code-contributions)
- [Testing Guidelines](#testing-guidelines)
- [Development Guidelines](#development-guidelines)
- [Review Process](#review-process)
- [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

Before you begin contributing, ensure you have the following installed and configured on your development machine:

- **Node.js**: Version 14.0.0 or higher is required. The project uses modern JavaScript features and async/await patterns extensively.
- **Git**: Version control system for managing code changes and collaboration.
- **Basic Regular Expression Knowledge**: Understanding of regex patterns is essential for adding or modifying detection patterns.
- **Security Best Practices**: Familiarity with common security vulnerabilities and credential management best practices.

### Development Setup

Follow these steps to set up your local development environment:

```bash
# Fork the repository on GitHub first, then clone your fork
git clone https://github.com/your-username/hardcoded-api-detector.git
cd hardcoded-api-detector

# Install all project dependencies
npm install

# Run the test suite to ensure everything is working correctly
npm test

# Run ESLint to check code quality
npm run lint

# Optionally, install git hooks for automatic code quality checks
npm run prepare
```

After completing these steps, you should have a fully functional development environment ready for contributions.

## Adding New Detection Patterns

Detection patterns are the core of this project. Each pattern is a regular expression designed to identify hardcoded API keys, tokens, and other sensitive credentials in source code. The patterns are stored in the `src/detectors/services.json` file.

### Current State

The project currently maintains 245 detection patterns covering services across multiple categories including cloud providers, AI platforms, payment processors, databases, monitoring tools, and more. Our patterns achieve an 85.7% high-confidence detection rate with minimal false positives.

### Pattern Structure

Each pattern in `src/detectors/services.json` follows a specific JSON structure:

```json
{
  "pattern_id": {
    "name": "Human Readable Service Name",
    "pattern": "(?i)(?:service|alias)_?(?:api|access)_?(?:key|token)\\s*[=:]\\s*['\"]?([PATTERN])['\"]?",
    "severity": "high",
    "category": "cloud",
    "service": "Service Provider Name",
    "description": "Clear description of what this pattern detects with context",
    "confidence": "high",
    "references": [
      "https://docs.service.com/authentication",
      "https://service.com/security-best-practices"
    ]
  }
}
```

### Pattern Components Explained

**Pattern ID**: This is a unique identifier for the pattern. Use snake_case naming convention. The ID should be descriptive and clearly indicate which service or credential type it targets. For example: `stripe_api_key`, `aws_secret_key`, `github_token`.

**Name**: A human-readable name that will be displayed in detection reports. This should include the service name and credential type. Examples: "Stripe API Key", "AWS Secret Access Key", "GitHub Personal Access Token".

**Pattern**: The regular expression that identifies the credential. This is the most critical component and requires careful design. See the "Pattern Design Best Practices" section below for detailed guidance.

**Severity**: Indicates the security impact if this credential is compromised. Choose from:
- `critical`: Immediate security risk with potential for severe damage (e.g., production database credentials, root AWS keys)
- `high`: Significant security risk requiring immediate attention (e.g., API keys with broad permissions)
- `medium`: Moderate security risk that should be addressed (e.g., API keys with limited scope)
- `low`: Minor security concern (e.g., public API keys, non-sensitive tokens)

**Category**: Organizes patterns by service type. Use existing categories when possible:
- `cloud`: Cloud service providers (AWS, Azure, GCP)
- `ai`: AI and machine learning platforms
- `payment`: Payment processing services
- `database`: Database services and connection strings
- `authentication`: Authentication and authorization services
- `monitoring`: Monitoring and analytics platforms
- `communication`: SMS, email, and messaging services
- `storage`: Cloud storage services
- `development`: Development tools and CI/CD platforms
- `security`: Security certificates and keys

**Service**: The specific service provider name. This helps users understand which service the detected credential belongs to.

**Description**: A clear, concise explanation of what this pattern detects. For patterns with context, mention "with context" to indicate the enhanced specificity.

**Confidence**: Indicates how confident we are that a match is a true positive:
- `high`: Very likely to be an actual credential (>95% accuracy)
- `medium`: Likely to be a credential but may have some false positives (80-95% accuracy)
- `low`: Generic pattern that may have higher false positive rate (<80% accuracy)

**References**: Array of URLs pointing to official documentation. Include authentication documentation, security guides, and API key format specifications. These help users understand the credential format and security implications.

### Pattern Design Best Practices

The quality of detection patterns directly impacts the tool's effectiveness. Follow these best practices to create high-quality patterns:

#### Use Context-Aware Patterns

Context-aware patterns significantly reduce false positives by looking for variable names or assignment patterns in addition to the credential format itself. This is our recommended approach for most patterns.

**Standard Context Pattern Template**:
```regex
(?i)(?:service_name|alias)_?(?:api|access|secret)_?(?:key|token|password)\s*[=:]\s*['"]?([CREDENTIAL_PATTERN])['"]?
```

**Components Breakdown**:
- `(?i)`: Case-insensitive matching
- `(?:service_name|alias)`: Service name or common abbreviations
- `_?`: Optional underscore separator
- `(?:api|access|secret)`: Credential type indicators
- `_?(?:key|token|password)`: Credential kind
- `\s*[=:]\s*`: Assignment operators with optional whitespace
- `['"]?`: Optional quotes
- `([CREDENTIAL_PATTERN])`: The actual credential pattern in a capture group
- `['"]?`: Optional closing quotes

**Example - Stripe API Key with Context**:
```json
"stripe_api_key": {
  "name": "Stripe API Key",
  "pattern": "(?i)(?:stripe|sk)_?(?:api|secret)_?(?:key)\\s*[=:]\\s*['\"]?(sk_(live|test)_[a-zA-Z0-9]{24})['\"]?",
  "severity": "critical",
  "category": "payment",
  "service": "Stripe",
  "description": "Stripe API Secret Key with context",
  "confidence": "high"
}
```

#### When to Use Prefix-Based Patterns

Some services use unique, distinctive prefixes in their credentials that are unlikely to appear elsewhere. For these cases, a simpler prefix-based pattern is appropriate:

**Example - GitHub Personal Access Token**:
```json
"github_token": {
  "name": "GitHub Personal Access Token",
  "pattern": "ghp_[a-zA-Z0-9]{36}",
  "severity": "high",
  "category": "development",
  "service": "GitHub",
  "description": "GitHub Personal Access Token",
  "confidence": "high"
}
```

Use prefix-based patterns when:
- The service uses a highly distinctive prefix (e.g., `AKIA`, `ghp_`, `sk_live_`)
- The prefix is unlikely to appear in normal code or text
- The format is well-documented and stable
- The length and character set are specific

#### Avoid Overly Generic Patterns

Generic patterns without context or distinctive features lead to high false positive rates. Avoid patterns like:

**Bad Examples**:
```regex
[a-zA-Z0-9]{32}  # Too generic, matches many things
[a-f0-9]{40}     # Matches MD5 hashes, commit IDs, etc.
[0-9]{10}        # Matches timestamps, phone numbers, etc.
```

If you must use a generic pattern format, always add context:

**Good Example**:
```regex
(?i)(?:service)_?(?:api)_?(?:key)\s*[=:]\s*['"]?([a-zA-Z0-9]{32})['"]?
```

#### Handle Common Variations

Real-world code has many variations in how credentials are assigned. Your patterns should handle:

- Different quote styles: single quotes, double quotes, no quotes
- Various assignment operators: `=`, `:`, `=>`
- Whitespace variations: spaces, tabs, line breaks
- Naming conventions: camelCase, snake_case, UPPER_CASE, kebab-case

**Example Handling Variations**:
```regex
(?i)(?:datadog|dd)_?(?:api|access)_?(?:key|token)\s*[=:]\s*['"]?([a-f0-9]{32})['"]?
```

This pattern matches all of:
```javascript
datadog_api_key = "abc123..."
DATADOG_API_KEY: 'abc123...'
dd_api_token = abc123...
DatadogAccessKey: "abc123..."
```

#### Optimize for Performance

Regular expressions can cause performance issues if not carefully designed. Follow these guidelines:

**Avoid Catastrophic Backtracking**:
- Be cautious with nested quantifiers: `(a+)+`, `(a*)*`
- Use atomic groups or possessive quantifiers when appropriate
- Test patterns with long strings to ensure they don't hang

**Use Specific Character Classes**:
```regex
# Good: Specific character class
[a-zA-Z0-9]{32}

# Bad: Too broad, slower
.{32}
```

**Anchor When Possible**:
```regex
# Good: Anchored to word boundaries
\b(?:api_key)\b

# Less optimal: No anchoring
(?:api_key)
```

#### Test Pattern Accuracy

Before submitting a pattern, test it thoroughly:

1. **True Positives**: Ensure it detects actual credentials
2. **False Positives**: Verify it doesn't match unrelated strings
3. **Edge Cases**: Test with unusual but valid credential formats
4. **Performance**: Test with large files to ensure acceptable speed

### Pattern Categories

Choose the most appropriate category for your pattern. Here is a detailed breakdown of each category:

**cloud**: Cloud service providers and infrastructure platforms. Includes AWS, Azure, Google Cloud Platform, DigitalOcean, Linode, Vultr, and similar services.

**ai**: Artificial intelligence and machine learning platforms. Includes OpenAI, Anthropic, Cohere, Hugging Face, Replicate, and other AI service providers.

**payment**: Payment processing and financial services. Includes Stripe, PayPal, Square, Braintree, and other payment gateways.

**database**: Database services, connection strings, and database credentials. Includes MongoDB, PostgreSQL, MySQL, Redis, and both traditional and cloud-native databases.

**authentication**: Authentication and authorization services. Includes Auth0, Okta, Firebase Auth, Clerk, and identity management platforms.

**monitoring**: Application monitoring, logging, and analytics platforms. Includes Datadog, New Relic, Sentry, LogRocket, and observability tools.

**communication**: Communication services including email, SMS, and messaging. Includes Twilio, SendGrid, Mailgun, Telegram, and similar platforms.

**storage**: Cloud storage and content delivery services. Includes AWS S3, Azure Blob Storage, Cloudinary, and CDN providers.

**development**: Development tools, CI/CD platforms, and developer services. Includes GitHub, GitLab, CircleCI, Travis CI, and development workflow tools.

**security**: Security certificates, private keys, and cryptographic credentials. Includes SSL certificates, SSH keys, PGP keys, and other security-related secrets.

**ecommerce**: E-commerce platforms and shopping cart systems. Includes Shopify, WooCommerce, BigCommerce, and online store platforms.

**cms**: Content management systems. Includes WordPress, Drupal, Ghost, Contentful, and website management platforms.

**crm**: Customer relationship management platforms. Includes Salesforce, HubSpot, Zendesk, and customer service tools.

**marketing**: Marketing automation and analytics platforms. Includes Mailchimp, ConvertKit, Segment, and marketing tools.

**generic**: Generic patterns that don't fit other categories. Use sparingly and ensure these patterns have good context to avoid false positives.

### Adding Your Pattern

Follow these steps to add a new detection pattern:

1. **Research the Service**: Review the service's official documentation to understand the credential format, security implications, and any unique characteristics.

2. **Design the Pattern**: Create a regular expression following the best practices outlined above. Prefer context-aware patterns for generic formats.

3. **Add to services.json**: Insert your pattern in the appropriate alphabetical location within the file.

4. **Write Tests**: Add comprehensive tests to `tests/analyzer.test.js` (see Testing Guidelines section).

5. **Update Documentation**: If adding a new category or significant feature, update the README.md file.

6. **Test Thoroughly**: Run the full test suite and manually test with various code samples.

7. **Submit Pull Request**: Create a pull request with a clear description of the pattern and its purpose.

### Example Pattern Addition

Here is a complete example of adding a new pattern for a hypothetical service:

```json
{
  "acme_api_key": {
    "name": "Acme API Key",
    "pattern": "(?i)(?:acme)_?(?:api|access)_?(?:key|token)\\s*[=:]\\s*['\"]?(acme_[a-zA-Z0-9]{40})['\"]?",
    "severity": "high",
    "category": "cloud",
    "service": "Acme Cloud Services",
    "description": "Acme Cloud Services API Key with context",
    "confidence": "high",
    "references": [
      "https://docs.acme.com/api/authentication",
      "https://acme.com/security/api-keys"
    ]
  }
}
```

This pattern:
- Uses a context-aware approach to reduce false positives
- Includes the distinctive `acme_` prefix
- Specifies 40 alphanumeric characters after the prefix
- Has high confidence due to unique prefix and context
- Includes proper documentation references

## Pattern Quality Guidelines

### Confidence Level Assignment

Assign confidence levels based on pattern specificity and false positive rate:

**High Confidence**:
- Patterns with distinctive prefixes (e.g., `AKIA`, `sk_live_`, `ghp_`)
- Context-aware patterns with service-specific variable names
- Patterns that have been tested and show <5% false positive rate

**Medium Confidence**:
- Patterns with some context but common formats
- Service-specific patterns without unique prefixes
- Patterns with 5-20% expected false positive rate

**Low Confidence**:
- Generic catch-all patterns
- Patterns without context that match common formats
- Patterns with >20% expected false positive rate

### Severity Assignment

Assign severity based on the potential impact of credential exposure:

**Critical**:
- Production database credentials
- Payment processing API keys
- Root or administrative cloud credentials
- Any credential that could lead to direct financial loss or data breach

**High**:
- API keys with broad permissions
- Service account credentials
- Keys that grant access to sensitive user data
- Credentials for production services

**Medium**:
- API keys with limited scope
- Development or staging credentials
- Keys with read-only access
- Non-production service credentials

**Low**:
- Public API keys (when designed to be public)
- Client-side tokens without sensitive permissions
- Non-sensitive configuration values
- Development-only credentials with no production access

## Reporting Issues

### False Positives

If you encounter a false positive detection, please help us improve the pattern:

1. Create an issue with title: "False Positive: [Pattern Name]"
2. Include:
   - The pattern ID that triggered incorrectly
   - Code snippet that caused the false positive
   - Explanation of why it's not a real credential
   - Suggested pattern improvement if you have one
   - Context about your use case

Example:
```
Title: False Positive: stripe_api_key

The pattern is matching test data in our fixtures:
```javascript
const testData = { stripe_api_key: "sk_test_NOTAREALKEY12345" };
```

This is test fixture data clearly marked as not real.
Suggestion: Consider excluding lines with "test", "example", or "fixture" in variable names.
```

### Missing Services

Request detection patterns for new services:

1. Create an issue with title: "Pattern Request: [Service Name]"
2. Include:
   - Service name and website
   - Official documentation links for API authentication
   - Examples of API key format (use fake keys only)
   - Information about credential prefixes or patterns
   - Your assessment of severity and category
   - Any special considerations or edge cases

### Bugs and Issues

Report bugs with comprehensive information:

1. **Environment Details**: Operating system, Node.js version, package version
2. **Configuration**: Your configuration file or command-line options used
3. **Steps to Reproduce**: Clear, step-by-step instructions
4. **Expected Behavior**: What you expected to happen
5. **Actual Behavior**: What actually happened
6. **Error Messages**: Complete error messages and stack traces
7. **Sample Code**: Minimal code sample that reproduces the issue (without real credentials)

## Code Contributions

### Pull Request Process

Follow this process for code contributions:

1. **Fork and Clone**: Fork the repository and clone it to your local machine
2. **Create Branch**: Create a feature branch with a descriptive name
   ```bash
   git checkout -b feature/add-digitalocean-patterns
   git checkout -b fix/false-positive-jwt-detection
   git checkout -b docs/improve-contributing-guide
   ```
3. **Make Changes**: Implement your changes following the coding standards
4. **Add Tests**: Write comprehensive tests for new functionality
5. **Run Tests**: Ensure all tests pass with `npm test`
6. **Run Linter**: Check code quality with `npm run lint`
7. **Update Documentation**: Update relevant documentation files
8. **Commit Changes**: Write clear, descriptive commit messages
9. **Push to Fork**: Push your branch to your GitHub fork
10. **Create Pull Request**: Open a pull request with detailed description

### Commit Message Format

Use conventional commit format for clear change history:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(patterns): add DigitalOcean API token detection

Add detection pattern for DigitalOcean API tokens with context-aware
matching to reduce false positives.

Closes #123
```

```
fix(analyzer): prevent catastrophic backtracking in JWT pattern

Optimize JWT detection regex to prevent performance issues with
large files containing many dots.

Fixes #456
```

### Code Style Guidelines

Maintain consistency with the existing codebase:

**Naming Conventions**:
- Use camelCase for variables and functions
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants
- Use snake_case for pattern IDs in JSON

**Code Organization**:
- Keep functions small and focused on a single task
- Extract complex logic into well-named helper functions
- Group related functionality together
- Separate concerns appropriately

**Comments and Documentation**:
- Add JSDoc comments for all public methods and classes
- Explain "why" not "what" in inline comments
- Document complex algorithms or regex patterns
- Keep comments up-to-date with code changes

**Error Handling**:
- Use try-catch blocks for operations that may fail
- Provide helpful error messages
- Log errors appropriately using the logger utility
- Don't swallow errors silently

**Example Code Style**:
```javascript
/**
 * Analyzes file content for hardcoded credentials
 *
 * @param {string} filePath - Path to file to analyze
 * @param {Object} options - Analysis options
 * @param {string} options.minSeverity - Minimum severity level
 * @param {string[]} options.disabledPatterns - Patterns to skip
 * @returns {Promise<Array>} Array of findings
 */
async analyzeContent(filePath, options = {}) {
  const findings = [];

  try {
    const content = await fs.readFile(filePath, 'utf8');

    // Iterate through each detection pattern
    for (const [patternId, patternInfo] of Object.entries(this.patterns)) {
      if (this.shouldSkipPattern(patternId, patternInfo, options)) {
        continue;
      }

      const matches = this.findMatches(content, patternInfo);
      findings.push(...matches);
    }

    return findings;
  } catch (error) {
    logger.error(`Failed to analyze file ${filePath}`, { error: error.message });
    throw error;
  }
}
```

## Testing Guidelines

### Test Coverage Requirements

All code contributions must include appropriate tests. We maintain a minimum code coverage threshold of 80% for the project.

### Writing Tests

Add tests to the appropriate test file in the `tests/` directory:

**Pattern Detection Tests** (`tests/analyzer.test.js`):
```javascript
describe('New Service Pattern Detection', () => {
  test('should detect Acme API key with context', async () => {
    const content = `
      const acme_api_key = "acme_1234567890abcdefghijklmnopqrstuvwxyz12";
      const ACME_ACCESS_TOKEN = 'acme_abcd1234efgh5678ijkl9012mnop3456qrst78';
    `;
    const testFile = path.join(tempDir, 'test-acme.js');
    await fs.writeFile(testFile, content);

    const findings = await analyzer.analyzeContent(testFile);
    const acmeFinding = findings.find(f => f.id === 'acme_api_key');

    expect(acmeFinding).toBeDefined();
    expect(acmeFinding.name).toBe('Acme API Key');
    expect(acmeFinding.severity).toBe('high');
    expect(acmeFinding.confidence).toBe('high');
    expect(acmeFinding.match).toContain('acme_');
  });

  test('should not false positive on unrelated strings', async () => {
    const content = `
      const randomHash = "1234567890abcdefghijklmnopqrstuvwxyz12345";
      const description = "This is not an acme key";
    `;
    const testFile = path.join(tempDir, 'test-false-positive.js');
    await fs.writeFile(testFile, content);

    const findings = await analyzer.analyzeContent(testFile);
    const acmeFinding = findings.find(f => f.id === 'acme_api_key');

    expect(acmeFinding).toBeUndefined();
  });
});
```

### Testing Best Practices

**Test Different Scenarios**:
- Valid credentials in various formats
- Edge cases and boundary conditions
- False positive scenarios
- Different file types and languages
- Various coding styles and naming conventions

**Use Descriptive Test Names**:
```javascript
// Good
test('should detect AWS access key in environment variable assignment')

// Bad
test('aws test')
```

**Test Both Positive and Negative Cases**:
Always include tests that verify the pattern correctly identifies credentials and tests that verify it doesn't create false positives.

**Isolate Tests**:
Each test should be independent and not rely on the state from other tests.

## Development Guidelines

### Performance Considerations

When adding features or patterns, consider performance impact:

**Pattern Optimization**:
- Test patterns with large files (>10MB)
- Measure regex execution time
- Avoid patterns that cause excessive backtracking
- Use the safeRegex utility for timeout protection

**File Processing**:
- The tool supports worker threads for parallel processing
- Stream-based analysis is available for large files
- Consider memory usage with large codebases

**Benchmarking**:
Test performance with realistic scenarios:
```bash
# Test with a large codebase
time node src/cli/index.js scan /path/to/large/project

# Monitor memory usage
node --trace-gc src/cli/index.js scan /path/to/project
```

### Security Considerations

**Never Commit Real Credentials**:
- Use fake, example credentials in tests
- Use placeholders like "YOUR_API_KEY_HERE"
- Review commits before pushing to ensure no secrets

**Pattern Security**:
- Consider if a pattern might expose security vulnerabilities
- Ensure patterns don't inadvertently log or expose actual credentials
- Be cautious with overly broad patterns that might match passwords

**Testing with Sensitive Data**:
- Never use real production credentials in tests
- Use clearly marked test credentials
- Consider privacy implications of detection

### Documentation Standards

Keep documentation up-to-date with code changes:

**README.md Updates**:
- Update supported service count when adding patterns
- Add new features to the features list
- Update examples when CLI changes
- Keep installation instructions current

**Inline Documentation**:
- Use JSDoc for all public APIs
- Document complex algorithms
- Explain non-obvious design decisions
- Keep comments synchronized with code

**CHANGELOG.md**:
- Document all user-facing changes
- Group changes by type (Added, Changed, Fixed, etc.)
- Include issue or PR references
- Follow Keep a Changelog format

## Review Process

### What Reviewers Look For

When reviewing pull requests, maintainers evaluate:

**Correctness**:
- Does the code work as intended?
- Are edge cases handled?
- Are there any bugs or logic errors?

**Pattern Accuracy**:
- Does the pattern correctly identify credentials?
- Is the false positive rate acceptable?
- Is the pattern properly optimized?

**Test Coverage**:
- Are there tests for new functionality?
- Do tests cover edge cases?
- Is coverage maintained or improved?

**Code Quality**:
- Does code follow project style guidelines?
- Is the code readable and maintainable?
- Are functions appropriately sized and focused?

**Documentation**:
- Is new functionality documented?
- Are comments clear and helpful?
- Is the README updated if needed?

**Performance**:
- Does the change impact performance?
- Are there benchmarks for performance-critical changes?
- Is the implementation efficient?

**Security**:
- Are there any security implications?
- Are credentials handled safely?
- Are there potential vulnerabilities?

### Review Timeline

We aim to provide timely feedback on contributions:

- **Initial Review**: Within 7 days for most pull requests
- **Complex Changes**: May require additional time for thorough review
- **Follow-up Reviews**: Within 3-5 days after updates

If your pull request hasn't been reviewed within the expected timeline, feel free to comment on the PR to request attention.

### Addressing Review Feedback

When you receive review feedback:

1. Read all comments carefully before responding
2. Ask questions if feedback is unclear
3. Make requested changes in new commits (don't force push)
4. Respond to each comment when addressed
5. Request re-review when ready

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors must:

**Be Respectful**:
- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community

**Be Collaborative**:
- Help others learn and grow
- Share knowledge and expertise
- Provide constructive feedback
- Work together toward common goals

**Be Professional**:
- Maintain professional conduct in all interactions
- Avoid personal attacks or inflammatory language
- Keep discussions focused on technical merits
- Respect project maintainers' decisions

### Getting Help

If you need assistance:

**Documentation First**:
- Read the README.md thoroughly
- Check this CONTRIBUTING.md guide
- Review existing issues and discussions

**Search Before Asking**:
- Search existing issues for similar questions
- Check closed issues for resolved discussions
- Review pull requests for related work

**Ask Questions**:
- Create issues for questions not covered in documentation
- Be specific and provide context
- Include relevant code samples or examples
- Be patient while waiting for responses

**Join Discussions**:
- Participate in issue discussions
- Share your experiences and insights
- Help other community members
- Provide feedback on proposals

## Recognition and Attribution

Contributors are valued members of our community and receive recognition:

**GitHub Contributions**:
- All contributions are tracked in commit history
- Contributors appear in GitHub insights
- Pull requests are linked to user profiles

**README.md**:
- Significant contributors listed in contributors section
- Pattern authors credited when appropriate

**Release Notes**:
- Contributors mentioned in GitHub releases
- Major contributions highlighted in changelog

**Project Documentation**:
- Special thanks for significant contributions
- Recognition for long-term maintainers

## Release Process

### Versioning Strategy

We follow Semantic Versioning (semver):

**Major Version (X.0.0)**:
- Breaking changes to public API
- Removal of deprecated features
- Significant architectural changes

**Minor Version (0.X.0)**:
- New features (backward compatible)
- New detection patterns
- Non-breaking enhancements

**Patch Version (0.0.X)**:
- Bug fixes
- Pattern accuracy improvements
- Documentation updates

### Release Checklist

For maintainers preparing releases:

1. Update version in package.json
2. Update CHANGELOG.md with all changes
3. Run full test suite and ensure all pass
4. Create and push version tag
5. Create GitHub release with notes
6. Publish to npm registry
7. Announce release to community

## Final Notes

Thank you for taking the time to contribute to Hardcoded API Detector. Your contributions help make codebases more secure by preventing accidental exposure of sensitive credentials.

Whether you are adding a single detection pattern, fixing a bug, or improving documentation, every contribution is valuable and appreciated. We are excited to work with you and look forward to your contributions.

If you have any questions not covered in this guide, please do not hesitate to create an issue or reach out to the maintainers.

Happy contributing!
