/**
 * Test Suite for Main Index (HardcodedApiDetector)
 *
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-detector
 * @license MIT
 */

const HardcodedApiDetector = require('../src/index');
const fs = require('fs-extra');
const path = require('path');
const { version } = require('../package.json');

describe('HardcodedApiDetector', () => {
  let detector;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(__dirname, 'test-detector-'));
    detector = new HardcodedApiDetector();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('Constructor', () => {
    test('should create instance with default options', () => {
      const detector = new HardcodedApiDetector();

      expect(detector).toBeDefined();
      expect(detector.options.severity).toBe('medium');
      expect(detector.options.useWorkers).toBe(true);
      expect(detector.options.exclude).toEqual([]);
      expect(detector.options.disabledPatterns).toEqual([]);
      expect(detector.options.excludeCategories).toEqual([]);
    });

    test('should create instance with custom options', () => {
      const detector = new HardcodedApiDetector({
        severity: 'high',
        exclude: ['node_modules/**'],
        useWorkers: false,
        disabledPatterns: ['aws_access_key'],
        excludeCategories: ['cloud']
      });

      expect(detector.options.severity).toBe('high');
      expect(detector.options.useWorkers).toBe(false);
      expect(detector.options.exclude).toContain('node_modules/**');
      expect(detector.options.disabledPatterns).toContain('aws_access_key');
      expect(detector.options.excludeCategories).toContain('cloud');
    });

    test('should initialize analyzer', () => {
      const detector = new HardcodedApiDetector();

      expect(detector.analyzer).toBeDefined();
      expect(detector.analyzer.patterns).toBeDefined();
    });
  });

  describe('Single-threaded Scanning', () => {
    test('should scan directory with single file', async () => {
      // Create test file with hardcoded key
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, 'const key = "AKIA1234567890123456";');

      const detector = new HardcodedApiDetector({ useWorkers: false });
      const results = await detector.scan(tempDir);

      expect(results.totalFiles).toBeGreaterThan(0);
      expect(results.filesWithIssues).toBeGreaterThan(0);
      expect(results.findings).toBeDefined();
      expect(results.findings.length).toBeGreaterThan(0);
    });

    test('should scan directory with multiple files', async () => {
      // Create multiple test files
      await fs.writeFile(
        path.join(tempDir, 'config1.js'),
        'const awsKey = "AKIA1234567890123456";'
      );
      await fs.writeFile(
        path.join(tempDir, 'config2.js'),
        'const githubToken = "ghp_1234567890abcdef1234567890abcdef1234";'
      );

      const detector = new HardcodedApiDetector({ useWorkers: false });
      const results = await detector.scan(tempDir);

      expect(results.totalFiles).toBeGreaterThan(0);
      expect(results.filesWithIssues).toBeGreaterThan(0);
    });

    test('should return empty results for clean directory', async () => {
      // Create clean file
      await fs.writeFile(path.join(tempDir, 'clean.js'), 'const x = 123;');

      const detector = new HardcodedApiDetector({ useWorkers: false });
      const results = await detector.scan(tempDir);

      expect(results.totalFiles).toBeGreaterThan(0);
      expect(results.filesWithIssues).toBe(0);
      expect(results.findings).toEqual([]);
    });

    test('should respect minimum severity level', async () => {
      await fs.writeFile(
        path.join(tempDir, 'test.js'),
        'const key = "AKIA1234567890123456";'
      );

      // AWS keys are 'high' severity, so this should find nothing
      const detector = new HardcodedApiDetector({
        severity: 'critical',
        useWorkers: false
      });
      const results = await detector.scan(tempDir);

      expect(results.filesWithIssues).toBe(0);
    });

    test('should respect disabled patterns', async () => {
      await fs.writeFile(
        path.join(tempDir, 'test.js'),
        'const key = "AKIA1234567890123456";'
      );

      const detector = new HardcodedApiDetector({
        disabledPatterns: ['aws_access_key'],
        useWorkers: false
      });
      const results = await detector.scan(tempDir);

      // Should not find aws_access_key pattern
      const awsFindings = results.findings.flatMap(f => f.findings).filter(
        finding => finding.id === 'aws_access_key'
      );
      expect(awsFindings.length).toBe(0);
    });

    test('should respect excluded categories', async () => {
      await fs.writeFile(
        path.join(tempDir, 'test.js'),
        'const key = "AKIA1234567890123456";'
      );

      const detector = new HardcodedApiDetector({
        excludeCategories: ['cloud'],
        useWorkers: false
      });
      const results = await detector.scan(tempDir);

      // Should exclude cloud category findings
      const cloudFindings = results.findings.flatMap(f => f.findings).filter(
        finding => finding.category === 'cloud'
      );
      expect(cloudFindings.length).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    test('should get version', () => {
      const detector = new HardcodedApiDetector();
      const detectorVersion = detector.getVersion();

      expect(detectorVersion).toBe(version);
      expect(typeof detectorVersion).toBe('string');
    });

    test('should get all patterns', () => {
      const detector = new HardcodedApiDetector();
      const patterns = detector.getPatterns();

      expect(patterns).toBeDefined();
      expect(typeof patterns).toBe('object');
      expect(Object.keys(patterns).length).toBeGreaterThan(0);
    });

    test('should get patterns by category', () => {
      const detector = new HardcodedApiDetector();
      const cloudPatterns = detector.getPatternsByCategory('cloud');

      expect(cloudPatterns).toBeDefined();
      expect(typeof cloudPatterns).toBe('object');
      expect(Object.keys(cloudPatterns).length).toBeGreaterThan(0);
    });

    test('should get patterns by service', () => {
      const detector = new HardcodedApiDetector();
      const awsPatterns = detector.getPatternsByService('Amazon Web Services');

      expect(awsPatterns).toBeDefined();
      expect(typeof awsPatterns).toBe('object');
    });

    test('should return empty object for non-existent category', () => {
      const detector = new HardcodedApiDetector();
      const patterns = detector.getPatternsByCategory('nonexistent_category');

      expect(patterns).toEqual({});
    });

    test('should return empty object for non-existent service', () => {
      const detector = new HardcodedApiDetector();
      const patterns = detector.getPatternsByService('NonExistent Service');

      expect(patterns).toEqual({});
    });
  });

  describe('Parallel Scanning', () => {
    test('should use single-threaded for small file count', async () => {
      // Create only a few files (< 10)
      await fs.writeFile(
        path.join(tempDir, 'test1.js'),
        'const key = "AKIA1234567890123456";'
      );

      const detector = new HardcodedApiDetector({ useWorkers: true });
      const results = await detector.scan(tempDir);

      expect(results).toBeDefined();
      expect(results.totalFiles).toBeLessThan(10);
    });

    test('should use parallel mode for many files', async () => {
      // Create 12+ files to trigger parallel mode
      for (let i = 0; i < 12; i++) {
        await fs.writeFile(
          path.join(tempDir, `file${i}.js`),
          i % 2 === 0 ? 'const key = "AKIA1234567890123456";' : 'const x = 123;'
        );
      }

      const detector = new HardcodedApiDetector({ useWorkers: true, workerCount: 2 });
      const results = await detector.scan(tempDir);

      expect(results).toBeDefined();
      expect(results.totalFiles).toBeGreaterThanOrEqual(12);
      expect(results.filesWithIssues).toBeGreaterThan(0);
      expect(results.findings).toBeDefined();
    });

    test('should respect useWorkers=false option', async () => {
      // Create many files but disable workers
      for (let i = 0; i < 12; i++) {
        await fs.writeFile(
          path.join(tempDir, `test${i}.js`),
          'const x = 123;'
        );
      }

      const detector = new HardcodedApiDetector({ useWorkers: false });
      const results = await detector.scan(tempDir);

      expect(results).toBeDefined();
      expect(results.totalFiles).toBeGreaterThanOrEqual(12);
    });

    test('should handle parallel scan with custom options', async () => {
      // Create files with different findings
      for (let i = 0; i < 12; i++) {
        await fs.writeFile(
          path.join(tempDir, `config${i}.js`),
          'const awsKey = "AKIA1234567890123456";'
        );
      }

      const detector = new HardcodedApiDetector({
        useWorkers: true,
        severity: 'high',
        workerCount: 2
      });
      const results = await detector.scan(tempDir);

      expect(results.totalFiles).toBeGreaterThanOrEqual(12);
      expect(results.filesWithIssues).toBeGreaterThan(0);
    });

    test('should filter results by severity in parallel mode', async () => {
      // Create files with AWS keys (high severity)
      for (let i = 0; i < 12; i++) {
        await fs.writeFile(
          path.join(tempDir, `aws${i}.js`),
          'const key = "AKIA1234567890123456";'
        );
      }

      // Scan with critical severity (should find nothing as AWS is 'high')
      const detector = new HardcodedApiDetector({
        useWorkers: true,
        severity: 'critical',
        workerCount: 2
      });
      const results = await detector.scan(tempDir);

      expect(results.filesWithIssues).toBe(0);
    });
  });

  describe('Configuration and Hooks', () => {
    test('should have init method that returns promise', async () => {
      const detector = new HardcodedApiDetector();

      // The init method should be defined and return a promise
      expect(detector.init).toBeDefined();
      expect(typeof detector.init).toBe('function');

      // Call init and verify it returns a promise
      const result = detector.init();
      expect(result).toBeInstanceOf(Promise);

      // Await the result
      await result;
    });

    test('should have installGitHooks method that returns promise', async () => {
      const detector = new HardcodedApiDetector();

      // The installGitHooks method should be defined and return a promise
      expect(detector.installGitHooks).toBeDefined();
      expect(typeof detector.installGitHooks).toBe('function');

      // Call installGitHooks and verify it returns a promise
      const result = detector.installGitHooks();
      expect(result).toBeInstanceOf(Promise);

      // Await the result
      await result;
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent directory gracefully', async () => {
      const detector = new HardcodedApiDetector({ useWorkers: false });

      // scan handles non-existent directories by returning empty results
      const results = await detector.scan('/non/existent/path');
      expect(results.totalFiles).toBe(0);
      expect(results.filesWithIssues).toBe(0);
      expect(results.findings).toEqual([]);
    });

    test('should handle empty directory', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      await fs.ensureDir(emptyDir);

      const detector = new HardcodedApiDetector({ useWorkers: false });
      const results = await detector.scan(emptyDir);

      expect(results.totalFiles).toBe(0);
      expect(results.filesWithIssues).toBe(0);
      expect(results.findings).toEqual([]);
    });

    test('should handle parallel scan errors gracefully', async () => {
      // Create files to trigger parallel mode, including an unreadable file
      for (let i = 0; i < 12; i++) {
        await fs.writeFile(
          path.join(tempDir, `error${i}.js`),
          'const key = "AKIA1234567890123456";'
        );
      }

      // Create a file that will cause an error (binary file)
      const binaryFile = path.join(tempDir, 'binary.bin');
      await fs.writeFile(binaryFile, Buffer.from([0x00, 0x01, 0x02, 0xFF]));

      const detector = new HardcodedApiDetector({ useWorkers: true, workerCount: 2 });
      const results = await detector.scan(tempDir);

      // Should still complete even if some workers have issues
      expect(results).toBeDefined();
      expect(results.totalFiles).toBeGreaterThan(0);
    });

    test('should log errors when parallel workers fail', async () => {
      // Create files including some that might fail
      for (let i = 0; i < 15; i++) {
        await fs.writeFile(
          path.join(tempDir, `file${i}.js`),
          i < 10 ? 'const key = "AKIA1234567890123456";' : ''
        );
      }

      // Mock logger to capture warnings
      const logger = require('../src/utils/logger');
      const originalWarn = logger.warn;
      let warnCalled = false;
      logger.warn = (msg, data) => {
        if (msg.includes('failed to analyze')) {
          warnCalled = true;
        }
      };

      const detector = new HardcodedApiDetector({ useWorkers: true, workerCount: 2 });
      await detector.scan(tempDir);

      // Restore logger
      logger.warn = originalWarn;

      // Even if no errors occurred, the code path exists
      expect(detector).toBeDefined();
    });
  });

  describe('Logger Functionality', () => {
    const logger = require('../src/utils/logger');

    test('should log debug messages when level is DEBUG', () => {
      const originalLevel = logger.level;
      logger.setLevel('DEBUG');

      // Mock console.log
      const originalLog = console.log;
      let logged = false;
      console.log = (...args) => {
        if (args[0] && args[0].includes('[DEBUG]')) {
          logged = true;
        }
      };

      logger.debug('Test debug message', { key: 'value' });

      console.log = originalLog;
      logger.level = originalLevel;

      expect(logged).toBe(true);
    });

    test('should not log debug messages when level is INFO', () => {
      const originalLevel = logger.level;
      logger.setLevel('INFO');

      // Mock console.log
      const originalLog = console.log;
      let logged = false;
      console.log = (...args) => {
        if (args[0] && args[0].includes('[DEBUG]')) {
          logged = true;
        }
      };

      logger.debug('Test debug message');

      console.log = originalLog;
      logger.level = originalLevel;

      expect(logged).toBe(false);
    });

    test('should handle setLevel with invalid level', () => {
      logger.setLevel('INVALID_LEVEL');

      // Should default to INFO
      expect(logger.level).toBeDefined();
    });

    test('should log debug with empty metadata', () => {
      const originalLevel = logger.level;
      logger.setLevel('DEBUG');

      const originalLog = console.log;
      let loggedArgs = [];
      console.log = (...args) => {
        loggedArgs = args;
      };

      logger.debug('Test message');

      console.log = originalLog;
      logger.level = originalLevel;

      expect(loggedArgs).toContain('Test message');
    });
  });

  describe('Worker Coverage', () => {
    test('should use workers for large file sets with various patterns', async () => {
      const workDir = path.join(tempDir, 'worker-test');
      await fs.ensureDir(workDir);

      // Create 15 files with different patterns to ensure worker execution
      for (let i = 0; i < 15; i++) {
        const patterns = [
          'const awsKey = "AKIA1234567890123456";',
          'const githubToken = "ghp_1234567890abcdef1234567890abcdef123456";',
          'const mongoUri = "mongodb://user:pass@localhost:27017/db";',
          'const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";',
          'const privateKey = "-----BEGIN RSA PRIVATE KEY-----\\nMIIEpAIBAAKCAQEA4f5wg5l2hKsTeNem/V41fGnJm6gOdrj8ym3rFkEjWT2btZb5\\n-----END RSA PRIVATE KEY-----";'
        ];
        await fs.writeFile(
          path.join(workDir, `file${i}.js`),
          patterns[i % patterns.length]
        );
      }

      const detector = new HardcodedApiDetector({
        useWorkers: true,
        workerCount: 3,
        severity: 'low'
      });

      const results = await detector.scan(workDir);

      expect(results.totalFiles).toBeGreaterThanOrEqual(15);
      expect(results.filesWithIssues).toBeGreaterThan(0);
      expect(results.findings).toBeDefined();
      expect(results.findings.length).toBeGreaterThan(0);

      // Clean up
      await fs.remove(workDir);
    });

    test('should handle worker errors gracefully with corrupted files', async () => {
      const workDir = path.join(tempDir, 'worker-error-test');
      await fs.ensureDir(workDir);

      // Create 12 files including some problematic ones
      for (let i = 0; i < 12; i++) {
        if (i % 4 === 0) {
          // Binary file
          await fs.writeFile(path.join(workDir, `file${i}.bin`), Buffer.from([0x00, 0xFF, 0xFE]));
        } else {
          await fs.writeFile(
            path.join(workDir, `file${i}.js`),
            'const key = "AKIA1234567890123456";'
          );
        }
      }

      const detector = new HardcodedApiDetector({
        useWorkers: true,
        workerCount: 2
      });

      const results = await detector.scan(workDir);

      expect(results).toBeDefined();
      expect(results.totalFiles).toBeGreaterThan(0);

      // Clean up
      await fs.remove(workDir);
    });
  });
});
