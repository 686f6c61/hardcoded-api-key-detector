const ReportGenerator = require('../src/reporting/ReportGenerator');
const fs = require('fs-extra');
const path = require('path');

describe('ReportGenerator', () => {
  let reportGenerator;
  let tempDir;
  let mockResults;

  beforeEach(async () => {
    reportGenerator = new ReportGenerator();
    tempDir = path.join(__dirname, 'temp');
    await fs.ensureDir(tempDir);

    mockResults = {
      scanTime: new Date().toISOString(),
      totalFiles: 5,
      filesWithIssues: 2,
      summary: {
        critical: 3,
        high: 5,
        medium: 2,
        low: 1
      },
      findings: [
        {
          file: '/home/user/project/src/config.js',
          findings: [
            {
              id: 'aws_access_key',
              name: 'AWS Access Key',
              severity: 'critical',
              type: 'cloud',
              service: 'AWS',
              category: 'cloud',
              description: 'AWS Access Key detected',
              match: 'AKIAIOSFODNN7EXAMPLE',
              line: 10,
              column: 5,
              lineContent: 'const key = "AKIAIOSFODNN7EXAMPLE";',
              confidence: 'high',
              context: [
                { lineNumber: 9, content: '// Configuration', isTarget: false },
                { lineNumber: 10, content: 'const key = "AKIAIOSFODNN7EXAMPLE";', isTarget: true },
                { lineNumber: 11, content: '', isTarget: false }
              ]
            }
          ]
        },
        {
          file: '/Users/john/app/database.js',
          findings: [
            {
              id: 'mongodb_uri',
              name: 'MongoDB URI',
              severity: 'high',
              type: 'database',
              service: 'MongoDB',
              category: 'database',
              description: 'MongoDB connection string',
              match: 'mongodb://admin:pass@localhost',
              line: 5,
              column: 15,
              lineContent: 'const uri = "mongodb://admin:pass@localhost";',
              confidence: 'high'
            }
          ]
        }
      ]
    };
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('sanitizeFilePath', () => {
    test('should sanitize Linux home paths', () => {
      const input = '/home/username/project/src/file.js';
      const output = reportGenerator.sanitizeFilePath(input);
      expect(output).toBe('./project/src/file.js');
    });

    test('should sanitize macOS paths', () => {
      const input = '/Users/username/project/src/file.js';
      const output = reportGenerator.sanitizeFilePath(input);
      expect(output).toBe('./project/src/file.js');
    });

    test('should handle relative paths from cwd', () => {
      const cwd = process.cwd();
      const input = path.join(cwd, 'src/file.js');
      const output = reportGenerator.sanitizeFilePath(input);
      expect(output).toBe('./src/file.js');
    });
  });

  describe('Console Report', () => {
    test('should generate console report with findings', () => {
      const output = reportGenerator.generateConsoleReport(mockResults);
      
      expect(output).toContain('[RESULTS] Scan Results:');
      expect(output).toContain('Files scanned: 5');
      expect(output).toContain('Files with issues: 2');
      expect(output).toContain('[CRITICAL] Critical: 3');
      expect(output).toContain('[HIGH] High: 5');
      expect(output).toContain('AWS Access Key');
    });

    test('should show success message when no findings', () => {
      const noFindings = {
        ...mockResults,
        filesWithIssues: 0,
        findings: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0 }
      };
      
      const output = reportGenerator.generateConsoleReport(noFindings);
      expect(output).toContain('[SUCCESS] No hardcoded API keys detected!');
    });

    test('should sanitize paths in console output', () => {
      const output = reportGenerator.generateConsoleReport(mockResults);
      expect(output).not.toContain('/home/user/');
      expect(output).not.toContain('/Users/john/');
      expect(output).toContain('./');
    });
  });

  describe('TXT Report', () => {
    test('should generate TXT report with header and summary', async () => {
      const outputPath = path.join(tempDir, 'report.txt');
      const result = await reportGenerator.generateReport(mockResults, 'txt', outputPath);
      
      expect(result).toContain('[SUCCESS]');
      expect(await fs.pathExists(outputPath)).toBe(true);
      
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content).toContain('HARDCODED API DETECTOR - TEXT REPORT');
      expect(content).toContain('Files Scanned:      5');
      expect(content).toContain('Total Findings:     11');
      expect(content).toContain('Critical:         3');
    });

    test('should sanitize paths in TXT report', async () => {
      const outputPath = path.join(tempDir, 'report.txt');
      await reportGenerator.generateReport(mockResults, 'txt', outputPath);
      
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content).not.toContain('/home/user/');
      expect(content).not.toContain('/Users/john/');
      expect(content).toContain('./');
    });

    test('should include findings in TXT format', async () => {
      const outputPath = path.join(tempDir, 'report.txt');
      await reportGenerator.generateReport(mockResults, 'txt', outputPath);
      
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content).toContain('AWS Access Key');
      expect(content).toContain('[CRITICAL]');
      expect(content).toContain('Service: AWS');
    });
  });

  describe('HTML Report', () => {
    test('should generate HTML report with structure', async () => {
      const outputPath = path.join(tempDir, 'report.html');
      const result = await reportGenerator.generateReport(mockResults, 'html', outputPath);
      
      expect(result).toContain('[SUCCESS]');
      expect(await fs.pathExists(outputPath)).toBe(true);
      
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('Hardcoded API Detector Report');
      expect(content).toContain('Files Scanned');
    });

    test('should sanitize paths in HTML report', async () => {
      const outputPath = path.join(tempDir, 'report.html');
      await reportGenerator.generateReport(mockResults, 'html', outputPath);
      
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content).not.toContain('/home/user/');
      expect(content).not.toContain('/Users/john/');
    });
  });

  describe('JSON Report', () => {
    test('should generate JSON report with metadata', async () => {
      const outputPath = path.join(tempDir, 'report.json');
      const result = await reportGenerator.generateReport(mockResults, 'json', outputPath);
      
      expect(result).toContain('[SUCCESS]');
      expect(await fs.pathExists(outputPath)).toBe(true);
      
      const content = await fs.readJSON(outputPath);
      expect(content.metadata).toBeDefined();
      expect(content.metadata.tool).toBe('hardcoded-api-detector');
      expect(content.summary).toBeDefined();
      expect(content.findings).toBeDefined();
    });
  });

  describe('CSV Report', () => {
    test('should generate CSV report with headers', async () => {
      const outputPath = path.join(tempDir, 'report.csv');
      const result = await reportGenerator.generateReport(mockResults, 'csv', outputPath);
      
      expect(result).toContain('[SUCCESS]');
      expect(await fs.pathExists(outputPath)).toBe(true);
      
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content).toContain('File,Line,Name,Severity');
      expect(content).toContain('AWS Access Key');
    });
  });

  describe('JUnit Report', () => {
    test('should generate JUnit XML report', async () => {
      const outputPath = path.join(tempDir, 'report.xml');
      const result = await reportGenerator.generateReport(mockResults, 'junit', outputPath);
      
      expect(result).toContain('[SUCCESS]');
      expect(await fs.pathExists(outputPath)).toBe(true);
      
      const content = await fs.readFile(outputPath, 'utf8');
      expect(content).toContain('<?xml version="1.0"');
      expect(content).toContain('<testsuites');
      expect(content).toContain('</testsuites>');
    });
  });

  describe('Group Findings', () => {
    test('should group findings by file', () => {
      const grouped = reportGenerator.groupFindings(mockResults.findings);
      const keys = Object.keys(grouped);

      expect(keys.length).toBeGreaterThan(0);
      // The path gets sanitized, so we need to check for the sanitized version
      expect(keys).toContain('./project/src/config.js');
    });

    test('should group findings by severity', () => {
      const reportGen = new ReportGenerator({ groupBy: 'severity' });
      const grouped = reportGen.groupFindings(mockResults.findings);

      expect(grouped).toHaveProperty('critical');
      expect(grouped).toHaveProperty('high');
      expect(grouped.critical.length).toBeGreaterThan(0);
      expect(grouped.high.length).toBeGreaterThan(0);
    });

    test('should group findings by category', () => {
      const reportGen = new ReportGenerator({ groupBy: 'category' });
      const grouped = reportGen.groupFindings(mockResults.findings);

      expect(grouped).toHaveProperty('cloud');
      expect(grouped).toHaveProperty('database');
      expect(grouped.cloud.length).toBeGreaterThan(0);
      expect(grouped.database.length).toBeGreaterThan(0);
    });
  });

  describe('Console Report with Different Groupings', () => {
    test('should generate console report grouped by severity', () => {
      const reportGen = new ReportGenerator({ groupBy: 'severity' });
      const output = reportGen.generateConsoleReport(mockResults);

      expect(output).toContain('[RESULTS]');
      expect(output).toContain('[SEVERITY]');
    });

    test('should generate console report grouped by category', () => {
      const reportGen = new ReportGenerator({ groupBy: 'category' });
      const output = reportGen.generateConsoleReport(mockResults);

      expect(output).toContain('[RESULTS]');
      expect(output).toContain('[CATEGORY]');
    });

    test('should handle console report with no findings', () => {
      const emptyResults = {
        scanTime: new Date().toISOString(),
        totalFiles: 5,
        filesWithIssues: 0,
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        findings: []
      };

      const output = reportGenerator.generateConsoleReport(emptyResults);

      expect(output).toContain('[SUCCESS]');
    });
  });

  describe('Console Report Options', () => {
    test('should show context when showContext option is enabled', () => {
      const reportGen = new ReportGenerator({ showContext: true });
      const output = reportGen.generateConsoleReport(mockResults);

      expect(output).toContain('Context:');
      expect(output).toContain('>>>'); // Target line marker
    });

    test('should not show context when showContext is false', () => {
      const reportGen = new ReportGenerator({ showContext: false });
      const output = reportGen.generateConsoleReport(mockResults);

      expect(output).not.toContain('Context:');
    });

    test('should respect colors option', () => {
      const reportGen = new ReportGenerator({ colors: false });
      const output = reportGen.generateConsoleReport(mockResults);

      expect(output).toContain('[RESULTS]');
      // Output should not contain ANSI color codes
    });

    test('should respect verbose option', () => {
      const reportGen = new ReportGenerator({ verbose: true });
      const output = reportGen.generateConsoleReport(mockResults);

      expect(output).toContain('[RESULTS]');
    });
  });

  describe('Report File Formats', () => {
    test('should generate TXT report without errors', async () => {
      const outputPath = path.join(tempDir, 'test-report.txt');
      const result = await reportGenerator.generateReport(mockResults, 'txt', outputPath);

      expect(result).toContain('[SUCCESS]');
      expect(await fs.pathExists(outputPath)).toBe(true);
    });

    test('should generate HTML report without errors', async () => {
      const outputPath = path.join(tempDir, 'test-report.html');
      const result = await reportGenerator.generateReport(mockResults, 'html', outputPath);

      expect(result).toContain('[SUCCESS]');
      expect(await fs.pathExists(outputPath)).toBe(true);
    });

    test('should generate CSV report without errors', async () => {
      const outputPath = path.join(tempDir, 'test-report.csv');
      const result = await reportGenerator.generateReport(mockResults, 'csv', outputPath);

      expect(result).toContain('[SUCCESS]');
      expect(await fs.pathExists(outputPath)).toBe(true);
    });

    test('should handle unsupported format', async () => {
      const outputPath = path.join(tempDir, 'test-report.xyz');
      const result = await reportGenerator.generateReport(mockResults, 'unsupported', outputPath);

      // Should default to console output
      expect(result).toContain('[RESULTS]');
    });
  });
});
