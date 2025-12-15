#!/usr/bin/env node

/**
 * CLI Interface
 *
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-key-detector
 * @license MIT
 *
 * Command-line interface for Hardcoded API Key Detector
 */

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const HardcodedApiDetector = require('../index');
const ContentAnalyzer = require('../scanner/analyzer');
const ReportGenerator = require('../reporting/ReportGenerator');
const { FileSystemError, ScanError } = require('../utils/errors');
const logger = require('../utils/logger');
const { version } = require('../../package.json');

const program = new Command();

/**
 * Validates and resolves directory path
 *
 * @param {string} directory - Directory path to validate
 * @returns {Promise<string>} Resolved absolute path
 * @throws {FileSystemError} If directory is invalid
 */
async function validateDirectory(directory) {
  // Resolve to absolute path to prevent path traversal
  const resolvedDir = path.resolve(directory);

  // Check if path exists
  if (!(await fs.pathExists(resolvedDir))) {
    throw new FileSystemError(`Directory not found: ${directory}`, resolvedDir);
  }

  // Check if it's actually a directory
  const stats = await fs.stat(resolvedDir);
  if (!stats.isDirectory()) {
    throw new FileSystemError(`Path is not a directory: ${directory}`, resolvedDir);
  }

  // Check read permissions
  try {
    await fs.access(resolvedDir, fs.constants.R_OK);
  } catch (error) {
    throw new FileSystemError(`Directory is not readable: ${directory}`, resolvedDir);
  }

  return resolvedDir;
}

/**
 * Loads configuration from file or returns defaults
 *
 * @param {string} configPath - Path to configuration file
 * @returns {Promise<Object>} Configuration object
 */
async function loadConfig(configPath) {
  const defaultConfigPath = path.join(process.cwd(), '.hardcoded-detector.json');
  const configFilePath = configPath || defaultConfigPath;

  if (await fs.pathExists(configFilePath)) {
    try {
      return await fs.readJSON(configFilePath);
    } catch (error) {
      logger.warn(`Failed to load config from ${configFilePath}, using defaults`, { error: error.message });
    }
  }

  return {
    exclude: [],
    disabledPatterns: [],
    excludeCategories: [],
    customPatterns: null
  };
}

/**
 * Gets list of files to scan
 *
 * @param {string} directory - Directory to scan
 * @param {string[]} exclude - Exclude patterns from config
 * @param {string[]} additionalExclude - Additional exclude patterns
 * @returns {Promise<string[]>} Array of file paths
 */
async function getFilesToScan(directory, exclude = [], additionalExclude = []) {
  const { glob } = require('glob');

  const excludePatterns = [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '*.min.js',
    '*.min.css',
    'package-lock.json',
    'yarn.lock',
    ...exclude,
    ...additionalExclude
  ];

  const includePatterns = [
    '**/*.js',
    '**/*.ts',
    '**/*.jsx',
    '**/*.tsx',
    '**/*.json',
    '**/*.yml',
    '**/*.yaml',
    '**/*.env*',
    '**/*.config.js',
    '**/*.config.ts',
    '**/*.py',
    '**/*.php',
    '**/*.rb',
    '**/*.go',
    '**/*.java',
    '**/*.cpp',
    '**/*.c',
    '**/*.h',
    '**/*.sh',
    '**/*.bash',
    '**/*.zsh',
    '**/*.ps1',
    '**/*.dockerfile',
    '**/Dockerfile*',
    '**/*.tf',
    '**/*.tfvars',
    '**/*.pem',
    '**/*.key',
    '**/*.p12',
    '**/*.pfx'
  ];

  const files = [];
  for (const pattern of includePatterns) {
    const matches = await glob(pattern, {
      cwd: directory,
      ignore: excludePatterns,
      absolute: true,
      nodir: true
    });
    files.push(...matches);
  }

  return [...new Set(files)];
}

/**
 * Gets list of staged files in git
 *
 * @returns {Promise<string[]>} Array of staged file paths
 */
async function getStagedFiles() {
  const { execSync } = require('child_process');

  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const files = output.trim().split('\n').filter(file => file.length > 0);

    // Resolve to absolute paths
    return files.map(file => path.resolve(file));
  } catch (error) {
    logger.warn('Could not get staged files from git', { error: error.message });
    return [];
  }
}

/**
 * Outputs scan results in specified format
 *
 * @param {Object} results - Scan results
 * @param {string} format - Output format
 * @param {string} filePath - Output file path
 */
async function outputResults(results, format, filePath) {
  const reportGenerator = new ReportGenerator();

  if (format === 'console' || !format) {
    // Console output
    const output = reportGenerator.generateConsoleReport(results);
    console.log(output);
  } else {
    // All other formats (json, html, csv, txt, junit)
    const result = await reportGenerator.generateReport(results, format, filePath);

    if (filePath) {
      console.log(chalk.green(result));
    } else {
      console.log(result);
    }
  }
}

/**
 * Outputs results to console with color coding
 *
 * @param {Object} results - Scan results
 */
function outputConsole(results) {
  console.log();
  console.log(chalk.blue('[RESULTS] Scan Results:'));
  console.log(chalk.gray(`Files scanned: ${results.totalFiles}`));
  console.log(chalk.gray(`Files with issues: ${results.filesWithIssues}`));
  console.log();

  if (results.summary.critical > 0) {
    console.log(chalk.red(`[CRITICAL] Critical: ${results.summary.critical}`));
  }
  if (results.summary.high > 0) {
    console.log(chalk.red(`[HIGH] High: ${results.summary.high}`));
  }
  if (results.summary.medium > 0) {
    console.log(chalk.yellow(`[MEDIUM] Medium: ${results.summary.medium}`));
  }
  if (results.summary.low > 0) {
    console.log(chalk.gray(`[LOW] Low: ${results.summary.low}`));
  }

  console.log();

  if (results.findings.length > 0) {
    results.findings.forEach(fileResult => {
      console.log(chalk.white(`[FILE] ${fileResult.file}`));

      fileResult.findings.forEach(finding => {
        const severityColor = {
          critical: chalk.red,
          high: chalk.red,
          medium: chalk.yellow,
          low: chalk.gray
        }[finding.severity] || chalk.gray;

        console.log(`  ${severityColor('[FOUND]')} ${finding.name} (${finding.severity})`);
        console.log(`    Line ${finding.line}: ${finding.lineContent.substring(0, 100)}${finding.lineContent.length > 100 ? '...' : ''}`);
        console.log(`    Service: ${finding.service} | Category: ${finding.type}`);
        console.log(`    ${finding.description}`);
        console.log();
      });
    });
  } else {
    console.log(chalk.green('[SUCCESS] No hardcoded API keys detected!'));
  }
}

// ============================================================================
// CLI COMMANDS
// ============================================================================

program
  .name('hardcoded-detector')
  .description('Detect hardcoded API keys and sensitive credentials in your codebase')
  .version(version);

program
  .command('scan')
  .description('Scan directory for hardcoded API keys')
  .argument('[directory]', 'Directory to scan', '.')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-o, --output <format>', 'Output format (console, json, html, csv, txt, junit)', 'console')
  .option('-f, --file <path>', 'Output file path')
  .option('-s, --severity <level>', 'Minimum severity level (low, medium, high, critical)', 'medium')
  .option('--staged', 'Scan only staged files in git')
  .option('--exclude <patterns...>', 'Exclude patterns')
  .option('--baseline', 'Use baseline file to filter known findings')
  .option('--baseline-path <path>', 'Path to baseline file', '.hardcoded-detector-baseline.json')
  .option('--generate-baseline', 'Generate baseline file from current scan')
  .option('--entropy-filter', 'Enable entropy-based filtering to reduce false positives')
  .action(async (directory, options) => {
    try {
      // Validate directory
      const validatedDir = await validateDirectory(directory);

      const config = await loadConfig(options.config);

      // Handle baseline generation
      if (options.generateBaseline) {
        console.log(chalk.blue('[BASELINE] Generating baseline...'));
        const detector = new HardcodedApiDetector({
          severity: options.severity,
          exclude: [...(config.exclude || []), ...(options.exclude || [])],
          baselinePath: options.baselinePath
        });

        const baseline = await detector.generateBaseline(validatedDir);
        console.log(chalk.green(`[SUCCESS] Baseline generated: ${baseline.totalFindings} findings`));
        console.log(chalk.gray(`Saved to: ${options.baselinePath}`));
        return;
      }

      // Use HardcodedApiDetector if baseline is enabled
      if (options.baseline) {
        console.log(chalk.blue(`[SCANNING] Scanning ${validatedDir} with baseline filtering...`));
        const detector = new HardcodedApiDetector({
          severity: options.severity,
          exclude: [...(config.exclude || []), ...(options.exclude || [])],
          disabledPatterns: config.disabledPatterns,
          excludeCategories: config.excludeCategories,
          useBaseline: true,
          baselinePath: options.baselinePath,
          useEntropyFilter: options.entropyFilter || false
        });

        const results = await detector.scan(validatedDir);
        await outputResults(results, options.output, options.file);

        // Exit with error code if critical or high severity issues found
        if (results.summary.critical > 0 || results.summary.high > 0) {
          process.exit(1);
        }
        return;
      }

      // Standard scan (original flow)
      const analyzer = new ContentAnalyzer(config.customPatterns);

      console.log(chalk.blue(`[SCANNING] Scanning ${validatedDir}...`));

      let filesToScan;
      if (options.staged) {
        filesToScan = await getStagedFiles();
      } else {
        filesToScan = await getFilesToScan(validatedDir, config.exclude, options.exclude);
      }

      if (filesToScan.length === 0) {
        console.log(chalk.yellow('[WARNING] No files to scan'));
        return;
      }

      console.log(chalk.gray(`Scanning ${filesToScan.length} files...`));

      const results = {
        scanTime: new Date().toISOString(),
        totalFiles: filesToScan.length,
        filesWithIssues: 0,
        findings: [],
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      };

      for (const file of filesToScan) {
        const findings = await analyzer.analyzeContent(file, {
          minSeverity: options.severity,
          disabledPatterns: config.disabledPatterns,
          excludeCategories: config.excludeCategories,
          useEntropyFilter: options.entropyFilter || false
        });

        if (findings.length > 0) {
          results.filesWithIssues++;
          results.findings.push({
            file,
            findings
          });

          findings.forEach(finding => {
            results.summary[finding.severity]++;
          });
        }
      }

      await outputResults(results, options.output, options.file);

      // Exit with error code if critical or high severity issues found
      if (results.summary.critical > 0 || results.summary.high > 0) {
        process.exit(1);
      }

    } catch (error) {
      logger.error('Scan failed', { error: error.message, stack: error.stack });
      console.error(chalk.red('[ERROR]'), error.message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize configuration file')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options) => {
    try {
      const detector = new HardcodedApiDetector();
      const success = await detector.init();

      if (success) {
        console.log(chalk.green('[SUCCESS] Configuration initialized successfully'));
        console.log(chalk.gray('Edit .hardcoded-detector.json to customize settings'));
      } else if (!options.force) {
        console.log(chalk.yellow('[WARNING] Configuration already exists. Use --force to overwrite.'));
      }
    } catch (error) {
      logger.error('Initialization failed', { error: error.message });
      console.error(chalk.red('[ERROR]'), error.message);
      process.exit(1);
    }
  });

program
  .command('install-hooks')
  .description('Install git hooks for automatic detection')
  .action(async () => {
    try {
      const detector = new HardcodedApiDetector();
      const success = await detector.installGitHooks();

      if (success) {
        console.log(chalk.green('[SUCCESS] Git hooks installed successfully'));
      } else {
        console.log(chalk.red('[ERROR] Failed to install git hooks'));
        process.exit(1);
      }
    } catch (error) {
      logger.error('Hook installation failed', { error: error.message });
      console.error(chalk.red('[ERROR]'), error.message);
      process.exit(1);
    }
  });

program
  .command('patterns')
  .description('List available detection patterns')
  .option('-c, --category <category>', 'Filter by category')
  .option('-s, --service <service>', 'Filter by service')
  .action(async (options) => {
    try {
      const analyzer = new ContentAnalyzer();
      let patterns = analyzer.getPatterns();

      if (options.category) {
        patterns = analyzer.getPatternsByCategory(options.category);
      } else if (options.service) {
        patterns = analyzer.getPatternsByService(options.service);
      }

      console.log(chalk.blue('[PATTERNS] Available Detection Patterns:'));
      console.log();

      Object.entries(patterns).forEach(([id, pattern]) => {
        console.log(chalk.white(`${pattern.name} (${id})`));
        console.log(chalk.gray(`  Service: ${pattern.service}`));
        console.log(chalk.gray(`  Category: ${pattern.category}`));
        console.log(chalk.gray(`  Severity: ${pattern.severity}`));
        console.log(chalk.gray(`  Pattern: ${pattern.pattern}`));
        console.log();
      });

    } catch (error) {
      logger.error('Pattern listing failed', { error: error.message });
      console.error(chalk.red('[ERROR]'), error.message);
      process.exit(1);
    }
  });

program.parse();
