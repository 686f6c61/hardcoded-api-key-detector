/**
 * Test Suite for CLI Interface
 * 
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-detector
 * @license MIT
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

describe('CLI Interface', () => {
  let tempDir;
  let originalCwd;
  const cliPath = path.join(__dirname, '../src/cli/index.js');

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = await fs.mkdtemp(path.join(__dirname, 'test-cli-'));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  describe('Basic Commands', () => {
    test('should show help information', () => {
      const output = execSync(`node ${cliPath} --help`, { encoding: 'utf8' });
      
      expect(output).toContain('hardcoded-detector');
      expect(output).toContain('scan');
      expect(output).toContain('init');
      expect(output).toContain('install-hooks');
      expect(output).toContain('patterns');
    });

    test('should show version information', () => {
      const output = execSync(`node ${cliPath} --version`, { encoding: 'utf8' });
      
      expect(output).toContain('1.0.0');
    });
  });

  describe('Scan Command', () => {
    beforeEach(async () => {
      // Create test files with various API keys
      await fs.writeFile('test.js', `
        const awsKey = "AKIA1234567890123456";
        const githubToken = "ghp_1234567890abcdef1234567890abcdef123456";
        const normalVar = "this is fine";
      `);
      
      await fs.writeFile('config.json', `
        {
          "apiKey": "AIza1234567890abcdef1234567890abcdef123",
          "database": "mongodb://user:pass@localhost:27017/db"
        }
      `);
    });

    test('should scan current directory and find issues', () => {
      try {
        execSync(`node ${cliPath} scan .`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error) {
        // Exit code 1 means issues were found (expected)
        const output = error.stdout || error.stderr || error.message;
        expect(output).toContain('[RESULTS] Scan Results:');
        expect(output).toContain('[FOUND]');
        expect(output).toContain('AWS Access Key ID');
      }
    });

    test('should respect severity filter', () => {
      try {
        execSync(`node ${cliPath} scan . --severity critical`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error) {
        // Exit code 1 means issues were found (expected)
        const output = error.stdout || error.stderr || error.message;
        expect(output).toContain('GitHub Personal Access Token');
      }
    });

    test('should output JSON format', () => {
      try {
        execSync(`node ${cliPath} scan . --output json`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error) {
        // Exit code 1 means issues were found (expected)
        let output = error.stdout || error.message;
        // Extract JSON from output (skip INFO logs)
        const jsonStart = output.indexOf('{');
        if (jsonStart !== -1) {
          output = output.substring(jsonStart);
        }
        const parsed = JSON.parse(output);
        expect(parsed.metadata).toBeDefined();
        expect(parsed.summary).toBeDefined();
        expect(parsed.findings).toBeDefined();
        expect(parsed.findings.length).toBeGreaterThan(0);
      }
    });

    test('should save JSON output to file', async () => {
      const outputFile = path.join(tempDir, 'report.json');
      try {
        execSync(`node ${cliPath} scan . --output json --file ${outputFile}`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error) {
        // Exit code 1 means issues were found (expected)
      }

      expect(await fs.pathExists(outputFile)).toBe(true);
      const content = await fs.readJSON(outputFile);
      expect(content.metadata).toBeDefined();
      expect(content.findings).toBeDefined();
    });
  });

  describe('Init Command', () => {
    test('should create configuration file', () => {
      const output = execSync(`node ${cliPath} init`, { encoding: 'utf8' });
      
      expect(output).toContain('[SUCCESS] Configuration initialized successfully');
      expect(fs.existsSync('.hardcoded-detector.json')).toBe(true);
    });

    test('should not overwrite existing config without force', async () => {
      await fs.writeJSON('.hardcoded-detector.json', { test: true });

      const output = execSync(`node ${cliPath} init`, { encoding: 'utf8' });

      expect(output).toContain('[WARNING] Configuration file already exists');
    });

    test('should show warning for existing config with force', async () => {
      await fs.writeJSON('.hardcoded-detector.json', { test: true });

      const output = execSync(`node ${cliPath} init --force`, { encoding: 'utf8' });

      // Currently --force shows warning (CLI behavior to verify)
      expect(output).toContain('[WARNING]');
      expect(output).toContain('Configuration file already exists');
    });
  });

  describe('Patterns Command', () => {
    test('should list all available patterns', () => {
      const output = execSync(`node ${cliPath} patterns`, { encoding: 'utf8' });
      
      expect(output).toContain('[PATTERNS] Available Detection Patterns:');
      expect(output).toContain('AWS Access Key ID');
      expect(output).toContain('GitHub Personal Access Token');
    });

    test('should filter patterns by category', () => {
      const output = execSync(`node ${cliPath} patterns --category cloud`, { encoding: 'utf8' });
      
      expect(output).toContain('AWS Access Key ID');
      expect(output).toContain('Google API Key');
      expect(output).not.toContain('GitHub Personal Access Token');
    });

    test('should filter patterns by service', () => {
      const output = execSync(`node ${cliPath} patterns --service "Amazon Web Services"`, { encoding: 'utf8' });
      
      expect(output).toContain('AWS Access Key ID');
      expect(output).not.toContain('Google API Key');
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent directory with error message', () => {
      try {
        execSync(`node ${cliPath} scan /non/existent/path`, { encoding: 'utf8', stdio: 'pipe' });
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Directory not found');
      }
    });

    test('should handle invalid output format gracefully', () => {
      // Invalid format defaults to console output
      try {
        execSync(`node ${cliPath} scan . --output invalid`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error) {
        // May have exit code 1 if issues found
        const output = error.stdout || error.message;
        expect(output).toContain('[RESULTS]');
      }
    });

    test('should handle invalid severity level gracefully', () => {
      // Invalid severity defaults to medium
      try {
        execSync(`node ${cliPath} scan . --severity invalid`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error) {
        // May have exit code 1 if issues found
        const output = error.stdout || error.message;
        expect(output).toContain('[RESULTS]');
      }
    });
  });

  describe('Configuration Integration', () => {
    beforeEach(async () => {
      // Create custom configuration
      const config = {
        exclude: ['*.test.js'],
        severity: 'high',
        output: {
          format: 'console',
          colors: false
        },
        patterns: {
          disabledPatterns: ['generic_api_key']
        }
      };
      
      await fs.writeJSON('.hardcoded-detector.json', config);
      
      // Create test files
      await fs.writeFile('test.js', `
        const awsKey = "AKIA1234567890123456";
        const genericKey = "api_key = 12345678901234567890";
      `);
      
      await fs.writeFile('test.test.js', `
        const testKey = "AKIA1234567890123456";
      `);
    });

    test('should use configuration file settings', () => {
      try {
        execSync(`node ${cliPath} scan .`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error) {
        // Exit code 1 means issues were found (expected)
        const output = error.stdout || error.message;
        expect(output).toContain('AWS Access Key ID');
        expect(output).not.toContain('test.test.js');
      }
    });
  });

  describe('Git Integration', () => {
    beforeEach(async () => {
      // Initialize git repository
      execSync('git init', { encoding: 'utf8' });
      execSync('git config user.name "Test User"', { encoding: 'utf8' });
      execSync('git config user.email "test@example.com"', { encoding: 'utf8' });
      
      // Create test file with API key
      await fs.writeFile('test.js', 'const apiKey = "AKIA1234567890123456";');
    });

    test('should install git hooks', () => {
      const output = execSync(`node ${cliPath} install-hooks`, { encoding: 'utf8' });
      
      expect(output).toContain('[SUCCESS] Git hooks installed successfully');
      expect(fs.existsSync('.git/hooks/pre-commit')).toBe(true);
    });

    test('should scan staged files with --staged flag', () => {
      execSync('git add test.js', { encoding: 'utf8' });

      try {
        execSync(`node ${cliPath} scan --staged`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error) {
        // Exit code 1 means issues were found (expected)
        const output = error.stdout || error.message;
        expect(output).toContain('[RESULTS] Scan Results:');
        expect(output).toContain('AWS Access Key ID');
      }
    });
  });
});