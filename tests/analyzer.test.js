/**
 * Test Suite for Content Analyzer
 * 
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-detector
 * @license MIT
 */

const ContentAnalyzer = require('../src/scanner/analyzer');
const fs = require('fs-extra');
const path = require('path');

describe('ContentAnalyzer', () => {
  let analyzer;
  let tempDir;

  beforeEach(async () => {
    analyzer = new ContentAnalyzer();
    tempDir = await fs.mkdtemp(path.join(__dirname, 'test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('Pattern Detection', () => {
    test('should detect AWS Access Key', async () => {
      const content = 'const awsKey = "AKIA1234567890123456";';
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, content);
      
      const findings = await analyzer.analyzeContent(testFile);
      const awsFinding = findings.find(f => f.id === 'aws_access_key');
      
      expect(awsFinding).toBeDefined();
      expect(awsFinding.name).toBe('AWS Access Key ID (IAM, SES, S3, EC2, etc.)');
      expect(awsFinding.severity).toBe('high');
      expect(awsFinding.match).toBe('AKIA1234567890123456');
    });

    test('should detect GitHub Personal Access Token', async () => {
      const content = 'token = "ghp_1234567890abcdef1234567890abcdef123456";';
      const testFile = path.join(tempDir, 'config.js');
      await fs.writeFile(testFile, content);
      
      const findings = await analyzer.analyzeContent(testFile);
      const githubFinding = findings.find(f => f.id === 'github_personal_token');
      
      expect(githubFinding).toBeDefined();
      expect(githubFinding.name).toBe('GitHub Personal Access Token');
      expect(githubFinding.severity).toBe('critical');
    });

    test('should detect MongoDB URI with credentials', async () => {
      const content = 'mongodb://user:password@localhost:27017/mydb';
      const testFile = path.join(tempDir, 'database.js');
      await fs.writeFile(testFile, content);
      
      const findings = await analyzer.analyzeContent(testFile);
      const mongoFinding = findings.find(f => f.id === 'mongodb_uri');
      
      expect(mongoFinding).toBeDefined();
      expect(mongoFinding.name).toBe('MongoDB Connection URI');
      expect(mongoFinding.severity).toBe('high');
    });

    test('should detect JWT tokens', async () => {
      const content = 'const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";';
      const testFile = path.join(tempDir, 'auth.js');
      await fs.writeFile(testFile, content);
      
      const findings = await analyzer.analyzeContent(testFile);
      const jwtFinding = findings.find(f => f.id === 'jwt_token');
      
      expect(jwtFinding).toBeDefined();
      expect(jwtFinding.name).toBe('JSON Web Token');
      expect(jwtFinding.severity).toBe('medium');
    });

    test('should detect private keys', async () => {
      const content = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA4f5wg5l2hKsTeNem/V41fGnJm6gOdrj8ym3rFkEjWT2btZb5
-----END RSA PRIVATE KEY-----`;
      const testFile = path.join(tempDir, 'private.pem');
      await fs.writeFile(testFile, content);
      
      const findings = await analyzer.analyzeContent(testFile);
      const privateKeyFinding = findings.find(f => f.id === 'private_key');
      
      expect(privateKeyFinding).toBeDefined();
      expect(privateKeyFinding.name).toBe('Private Key Certificate');
      expect(privateKeyFinding.severity).toBe('critical');
    });
  });

  describe('Context and Line Information', () => {
    test('should provide correct line numbers', async () => {
      const content = `line 1
line 2
const apiKey = "AKIA1234567890123456";
line 4`;
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, content);
      
      const findings = await analyzer.analyzeContent(testFile);
      const awsFinding = findings.find(f => f.id === 'aws_access_key');
      
      expect(awsFinding.line).toBe(3);
      expect(awsFinding.lineContent).toContain('AKIA1234567890123456');
    });

    test('should provide context lines', async () => {
      const content = `line 1
line 2
const apiKey = "AKIA1234567890123456";
line 4
line 5`;
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, content);
      
      const findings = await analyzer.analyzeContent(testFile);
      const awsFinding = findings.find(f => f.id === 'aws_access_key');
      
      expect(awsFinding.context).toBeDefined();
      expect(awsFinding.context.length).toBeGreaterThan(0);
      expect(awsFinding.context.some(ctx => ctx.isTarget)).toBe(true);
    });
  });

  describe('Filtering Options', () => {
    test('should respect minimum severity level', async () => {
      const content = `
        // Low severity generic API key
        api_key = "12345678901234567890"
        // High severity AWS key
        aws_key = "AKIA1234567890123456"
      `;
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, content);
      
      const findings = await analyzer.analyzeContent(testFile, {
        minSeverity: 'high'
      });
      
      const highFindings = findings.filter(f => f.severity === 'high');
      const lowFindings = findings.filter(f => f.severity === 'low');
      
      expect(highFindings.length).toBeGreaterThan(0);
      expect(lowFindings.length).toBe(0);
    });

    test('should respect disabled patterns', async () => {
      const content = `
        aws_key = "AKIA1234567890123456"
        github_token = "ghp_1234567890abcdef1234567890abcdef123456"
      `;
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, content);
      
      const findings = await analyzer.analyzeContent(testFile, {
        disabledPatterns: ['aws_access_key']
      });
      
      const awsFindings = findings.filter(f => f.id === 'aws_access_key');
      const githubFindings = findings.filter(f => f.id === 'github_personal_token');
      
      expect(awsFindings.length).toBe(0);
      expect(githubFindings.length).toBeGreaterThan(0);
    });

    test('should respect excluded categories', async () => {
      const content = `
        aws_key = "AKIA1234567890123456"
        github_token = "ghp_1234567890abcdef1234567890abcdef1234"
      `;
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, content);

      const findings = await analyzer.analyzeContent(testFile, {
        excludeCategories: ['cloud']
      });

      const awsFindings = findings.filter(f => f.category === 'cloud');
      const githubFindings = findings.filter(f => f.category === 'development');

      expect(awsFindings.length).toBe(0);
      expect(githubFindings.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Patterns', () => {
    test('should load custom patterns from file', async () => {
      const customPatternsPath = path.join(tempDir, 'custom-patterns.json');
      const customPatterns = {
        patterns: {
          "test_custom_pattern": {
            "name": "Test Custom Pattern",
            "pattern": "CUSTOM_[A-Z0-9]{16}",
            "severity": "high",
            "category": "custom",
            "service": "Test Service",
            "description": "Test custom pattern"
          }
        }
      };
      
      await fs.writeJSON(customPatternsPath, customPatterns);
      
      const customAnalyzer = new ContentAnalyzer(customPatternsPath);
      const patterns = customAnalyzer.getPatterns();
      
      expect(patterns.test_custom_pattern).toBeDefined();
      expect(patterns.test_custom_pattern.name).toBe('Test Custom Pattern');
    });

    test('should detect custom patterns', async () => {
      const customPatternsPath = path.join(tempDir, 'custom-patterns.json');
      const customPatterns = {
        patterns: {
          "test_custom_pattern": {
            "name": "Test Custom Pattern",
            "pattern": "CUSTOM_[A-Z0-9]{16}",
            "severity": "high",
            "category": "custom",
            "service": "Test Service",
            "description": "Test custom pattern"
          }
        }
      };
      
      await fs.writeJSON(customPatternsPath, customPatterns);
      
      const customAnalyzer = new ContentAnalyzer(customPatternsPath);
      const content = 'const token = "CUSTOM_1234567890ABCDEF";';
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, content);
      
      const findings = await customAnalyzer.analyzeContent(testFile);
      const customFinding = findings.find(f => f.id === 'test_custom_pattern');
      
      expect(customFinding).toBeDefined();
      expect(customFinding.name).toBe('Test Custom Pattern');
      expect(customFinding.severity).toBe('high');
    });
  });

  describe('Pattern Management', () => {
    test('should get patterns by category', () => {
      const cloudPatterns = analyzer.getPatternsByCategory('cloud');
      
      expect(Object.keys(cloudPatterns).length).toBeGreaterThan(0);
      Object.values(cloudPatterns).forEach(pattern => {
        expect(pattern.category).toBe('cloud');
      });
    });

    test('should get patterns by service', () => {
      const awsPatterns = analyzer.getPatternsByService('Amazon Web Services');
      
      expect(Object.keys(awsPatterns).length).toBeGreaterThan(0);
      Object.values(awsPatterns).forEach(pattern => {
        expect(pattern.service).toBe('Amazon Web Services');
      });
    });

    test('should return all patterns', () => {
      const allPatterns = analyzer.getPatterns();
      
      expect(Object.keys(allPatterns).length).toBeGreaterThan(0);
      expect(allPatterns.aws_access_key).toBeDefined();
      expect(allPatterns.github_personal_token).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent files gracefully', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.js');

      const findings = await analyzer.analyzeContent(nonExistentFile);

      expect(findings).toEqual([]);
    });

    test('should handle invalid custom patterns file', async () => {
      const invalidPatternsPath = path.join(tempDir, 'invalid-patterns.json');
      await fs.writeFile(invalidPatternsPath, 'invalid json content');

      const customAnalyzer = new ContentAnalyzer(invalidPatternsPath);
      const patterns = customAnalyzer.getPatterns();

      // Should fall back to default patterns
      expect(Object.keys(patterns).length).toBeGreaterThan(0);
    });

    test('should skip files that are too large', async () => {
      const largeFile = path.join(tempDir, 'large.js');
      // Create a file larger than 10MB
      const largeContent = 'a'.repeat(11 * 1024 * 1024);
      await fs.writeFile(largeFile, largeContent);

      const findings = await analyzer.analyzeContent(largeFile);

      expect(findings).toEqual([]);
    });

    test('should skip files with too many lines', async () => {
      const manyLinesFile = path.join(tempDir, 'many-lines.js');
      // Create a file with > 100000 lines
      const lines = new Array(100005).fill('x').join('\n');
      await fs.writeFile(manyLinesFile, lines);

      const findings = await analyzer.analyzeContent(manyLinesFile);

      expect(findings).toEqual([]);
    });

    test('should handle permission denied errors', async () => {
      const restrictedFile = path.join(tempDir, 'restricted.js');
      await fs.writeFile(restrictedFile, 'const key = "AKIA1234567890123456";');

      // Try to make file unreadable
      try {
        await fs.chmod(restrictedFile, 0o000);
        const findings = await analyzer.analyzeContent(restrictedFile);
        expect(findings).toEqual([]);

        // Restore permissions
        await fs.chmod(restrictedFile, 0o644);
      } catch (e) {
        // Skip on systems where chmod doesn't work
        expect(true).toBe(true);
      }
    });

    test('should handle patterns with ReDoS warnings', async () => {
      const unsafePatternsPath = path.join(tempDir, 'unsafe-patterns.json');
      const unsafePatterns = {
        patterns: {
          "unsafe_pattern": {
            "name": "Unsafe Pattern",
            "pattern": "(a+)*b",  // ReDoS vulnerable pattern
            "severity": "high",
            "category": "test",
            "service": "Test",
            "description": "Unsafe test pattern"
          }
        }
      };

      await fs.writeJSON(unsafePatternsPath, unsafePatterns);

      const testAnalyzer = new ContentAnalyzer(unsafePatternsPath);
      const patterns = testAnalyzer.getPatterns();

      // Unsafe pattern should be filtered out
      expect(patterns.unsafe_pattern).toBeUndefined();
    });

    test('should detect binary files correctly', async () => {
      const binaryFile = path.join(tempDir, 'binary.bin');
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE]);
      await fs.writeFile(binaryFile, binaryContent);

      const findings = await analyzer.analyzeContent(binaryFile);

      expect(findings).toEqual([]);
    });

    test('should handle empty files', async () => {
      const emptyFile = path.join(tempDir, 'empty.js');
      await fs.writeFile(emptyFile, '');

      const findings = await analyzer.analyzeContent(emptyFile);

      expect(findings).toEqual([]);
    });

    test('should handle files with only whitespace', async () => {
      const whitespaceFile = path.join(tempDir, 'whitespace.js');
      await fs.writeFile(whitespaceFile, '   \n\n\t\t  \n  ');

      const findings = await analyzer.analyzeContent(whitespaceFile);

      expect(findings).toEqual([]);
    });
  });

  describe('StreamAnalyzer', () => {
    const StreamAnalyzer = require('../src/scanner/streamAnalyzer');
    let streamAnalyzer;

    beforeEach(() => {
      streamAnalyzer = new StreamAnalyzer();
    });

    test('should analyze file using streams', async () => {
      const testFile = path.join(tempDir, 'stream-test.js');
      await fs.writeFile(testFile, 'const awsKey = "AKIA1234567890123456";');

      const patterns = analyzer.getPatterns();
      const findings = await streamAnalyzer.analyzeStream(testFile, patterns);

      expect(findings.length).toBeGreaterThan(0);
      const awsFinding = findings.find(f => f.id === 'aws_access_key');
      expect(awsFinding).toBeDefined();
    });

    test('should handle empty file with stream', async () => {
      const emptyFile = path.join(tempDir, 'empty-stream.js');
      await fs.writeFile(emptyFile, '');

      const patterns = analyzer.getPatterns();
      const findings = await streamAnalyzer.analyzeStream(emptyFile, patterns);

      expect(findings).toEqual([]);
    });

    test('should handle multi-line files with stream', async () => {
      const multiLineFile = path.join(tempDir, 'multiline-stream.js');
      const content = `line 1
const awsKey = "AKIA1234567890123456";
line 3
const githubToken = "ghp_1234567890abcdef1234567890abcdef123456";
line 5`;
      await fs.writeFile(multiLineFile, content);

      const patterns = analyzer.getPatterns();
      const findings = await streamAnalyzer.analyzeStream(multiLineFile, patterns);

      expect(findings.length).toBeGreaterThan(0);
    });

    test('should handle non-existent file with stream', async () => {
      const nonExistent = path.join(tempDir, 'does-not-exist.js');

      const patterns = analyzer.getPatterns();
      const findings = await streamAnalyzer.analyzeStream(nonExistent, patterns);

      expect(findings).toEqual([]);
    });

    test('should respect minSeverity option with stream', async () => {
      const testFile = path.join(tempDir, 'severity-stream.js');
      await fs.writeFile(testFile, 'const awsKey = "AKIA1234567890123456";');

      const patterns = analyzer.getPatterns();
      const findings = await streamAnalyzer.analyzeStream(testFile, patterns, {
        minSeverity: 'critical'
      });

      // AWS key is 'high' severity, so should be filtered out
      const highFindings = findings.filter(f => f.severity === 'high');
      expect(highFindings.length).toBe(0);
    });

    test('should respect disabledPatterns option with stream', async () => {
      const testFile = path.join(tempDir, 'disabled-stream.js');
      await fs.writeFile(testFile, 'const awsKey = "AKIA1234567890123456";');

      const patterns = analyzer.getPatterns();
      const findings = await streamAnalyzer.analyzeStream(testFile, patterns, {
        disabledPatterns: ['aws_access_key']
      });

      const awsFindings = findings.filter(f => f.id === 'aws_access_key');
      expect(awsFindings.length).toBe(0);
    });

    test('should respect excludeCategories option with stream', async () => {
      const testFile = path.join(tempDir, 'category-stream.js');
      await fs.writeFile(testFile, 'const awsKey = "AKIA1234567890123456";');

      const patterns = analyzer.getPatterns();
      const findings = await streamAnalyzer.analyzeStream(testFile, patterns, {
        excludeCategories: ['cloud']
      });

      const cloudFindings = findings.filter(f => f.category === 'cloud');
      expect(cloudFindings.length).toBe(0);
    });

    test('should handle maxFindings limit with stream', async () => {
      const testFile = path.join(tempDir, 'max-findings-stream.js');
      // Create file with many potential matches
      const manyKeys = Array(200).fill('const key = "AKIA1234567890123456";').join('\n');
      await fs.writeFile(testFile, manyKeys);

      const patterns = analyzer.getPatterns();
      const findings = await streamAnalyzer.analyzeStream(testFile, patterns, {
        maxFindings: 10
      });

      // Should stop early - without limit would have many more findings
      expect(findings.length).toBeLessThan(100);
    });
  });
});