# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in hardcoded-api-detector, please report it to us privately before disclosing it publicly.

### How to Report

**Email**: security@hardcoded-api-detector.dev
**GitHub**: Create a private issue by mentioning any maintainer

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any proof-of-concept code or examples (if available)
- Environment details (OS, Node.js version, etc.)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Detailed Assessment**: Within 7 days
- **Patch Release**: Within 14 days (depending on severity)
- **Public Disclosure**: After patch is released

### Severity Levels

- **Critical**: Immediate risk of data exposure or system compromise
- **High**: Significant security impact with potential for exploitation
- **Medium**: Limited security impact requiring attention
- **Low**: Minor security issue with minimal impact

## Security Best Practices

### For Users

1. **Keep Updated**: Always use the latest version
2. **Review Findings**: Carefully review all detected secrets
3. **Rotate Keys**: Immediately rotate any exposed API keys
4. **Use Environment Variables**: Never hardcode secrets in code
5. **Git History**: Check git history for previously committed secrets

### For Contributors

1. **Pattern Testing**: Thoroughly test new detection patterns
2. **False Positives**: Minimize false positive rates
3. **Performance**: Ensure patterns don't cause performance issues
4. **Documentation**: Document pattern behavior and limitations

## Security Features

### Built-in Protections

- **Pattern Validation**: All patterns are validated before use
- **Safe Regex**: Prevents catastrophic backtracking
- **Memory Limits**: Limits memory usage during scanning
- **Error Handling**: Graceful handling of malformed inputs

### Data Privacy

- **Local Processing**: All scanning happens locally
- **No Data Transmission**: No data is sent to external servers
- **Temporary Files**: Secure handling of temporary files
- **Memory Cleanup**: Proper cleanup of sensitive data

## Vulnerability Disclosure Process

1. **Receipt**: We acknowledge receipt of your report within 48 hours
2. **Assessment**: We assess the vulnerability and determine severity
3. **Development**: We develop a patch for the vulnerability
4. **Testing**: We thoroughly test the patch
5. **Release**: We release a security update
6. **Disclosure**: We publicly disclose the vulnerability (with credit)

## Security Advisories

Past security advisories will be published here:

### [No advisories yet]

This section will be updated as security issues are discovered and resolved.

## Security-Related Configuration

### Recommended Settings

```json
{
  "severity": "medium",
  "hooks": {
    "preCommit": true,
    "exitOnError": true
  },
  "patterns": {
    "excludeCategories": []
  }
}
```

### CI/CD Integration

```yaml
# Always fail builds on critical findings
- name: Security Scan
  run: |
    npx hardcoded-api-detector scan --severity critical
    if [ $? -ne 0 ]; then
      echo "Critical security issues found!"
      exit 1
    fi
```

## Responsible Disclosure

We believe in responsible disclosure and will work with security researchers to:

- Provide timely responses to vulnerability reports
- Credit researchers for their findings
- Coordinate disclosure timelines
- Ensure patches are thoroughly tested

## Security Team

- **Lead Maintainer**: 686f6c61
- **Security Reviewers**: Community contributors
- **Contact**: security@hardcoded-api-detector.dev

## Acknowledgments

We thank all security researchers who help us keep hardcoded-api-detector secure. Your contributions are invaluable to the security of our users.

## Related Resources

- [npm Security Advisories](https://www.npmjs.com/advisories)
- [Node.js Security](https://nodejs.org/en/security/)
- [OWASP Secrets](https://owasp.org/www-project-secrets/)
- [GitHub Security Best Practices](https://docs.github.com/en/security)

---

Thank you for helping keep hardcoded-api-detector and its users safe!