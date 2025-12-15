/**
 * Hardcoded API Key Detector
 *
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-key-detector
 * @license MIT
 *
 * Detect hardcoded API keys and sensitive credentials in your codebase
 * Supports 245+ services with entropy analysis and baseline filtering
 */

const path = require('path');
const { scanFiles, initConfig, installHooks } = require('./scanner/fileScanner');
const ContentAnalyzer = require('./scanner/analyzer');
const WorkerPool = require('./scanner/workerPool');
const BaselineManager = require('./baseline/BaselineManager');
const logger = require('./utils/logger');
const { version } = require('../package.json');

/**
 * Main HardcodedApiDetector class
 *
 * @class HardcodedApiDetector
 * @example
 * const detector = new HardcodedApiDetector({
 *   severity: 'high',
 *   exclude: ['test/**'],
 *   useWorkers: true
 * });
 *
 * const results = await detector.scan('./src');
 */
class HardcodedApiDetector {
  /**
   * Creates a new HardcodedApiDetector instance
   *
   * @param {Object} options - Configuration options
   * @param {string} [options.customPatternsPath] - Path to custom patterns JSON file
   * @param {string[]} [options.exclude=[]] - Additional patterns to exclude
   * @param {string} [options.severity='medium'] - Minimum severity level
   * @param {string[]} [options.disabledPatterns=[]] - Pattern IDs to disable
   * @param {string[]} [options.excludeCategories=[]] - Categories to exclude
   * @param {boolean} [options.useWorkers=true] - Enable parallel processing with workers
   * @param {number} [options.workerCount] - Number of workers (defaults to CPU count)
   * @param {boolean} [options.useBaseline=false] - Use baseline file to filter findings
   * @param {string} [options.baselinePath] - Path to baseline file
   */
  constructor(options = {}) {
    this.options = {
      customPatternsPath: options.customPatternsPath || null,
      exclude: options.exclude || [],
      severity: options.severity || 'medium',
      disabledPatterns: options.disabledPatterns || [],
      useBaseline: options.useBaseline || false,
      baselinePath: options.baselinePath || '.hardcoded-detector-baseline.json',
      excludeCategories: options.excludeCategories || [],
      useWorkers: options.useWorkers !== false, // Enabled by default
      workerCount: options.workerCount || undefined,
      useEntropyFilter: options.useEntropyFilter || false,
      ...options
    };

    // Initialize analyzer with custom patterns if provided
    this.analyzer = new ContentAnalyzer(this.options.customPatternsPath);

    // Initialize baseline manager if enabled
    this.baselineManager = this.options.useBaseline
      ? new BaselineManager(this.options.baselinePath)
      : null;
  }

  /**
   * Scans a directory for hardcoded API keys and credentials
   *
   * @param {string} [directory='.'] - Directory to scan
   * @returns {Promise<Object>} Scan results
   * @returns {number} return.totalFiles - Total files scanned
   * @returns {number} return.filesWithIssues - Files with findings
   * @returns {Array} return.findings - Array of findings by file
   */
  async scan(directory = '.') {
    logger.info('Scanning for hardcoded API keys...');
    const files = await scanFiles(directory, this.options.exclude);

    // Decide whether to use workers based on file count and configuration
    const shouldUseWorkers = this.options.useWorkers && files.length >= 10;

    if (shouldUseWorkers) {
      logger.info(`Using parallel processing with worker threads for ${files.length} files`);
      return await this.scanParallel(files);
    } else {
      logger.info(`Using single-threaded scanning for ${files.length} files`);
      return await this.scanSingleThreaded(files);
    }
  }

  /**
   * Scans files using single-threaded approach
   *
   * @param {string[]} files - Files to scan
   * @returns {Promise<Object>} Scan results
   * @private
   */
  async scanSingleThreaded(files) {
    const results = [];

    for (const file of files) {
      const findings = await this.analyzer.analyzeContent(file, {
        minSeverity: this.options.severity,
        disabledPatterns: this.options.disabledPatterns,
        excludeCategories: this.options.excludeCategories,
        useEntropyFilter: this.options.useEntropyFilter
      });

      if (findings.length > 0) {
        results.push({
          file,
          findings
        });
      }
    }

    // Apply baseline filtering if enabled
    let filteredResults = results;
    if (this.baselineManager) {
      await this.baselineManager.loadBaseline();
      filteredResults = this.baselineManager.filterFindings(results);
    }

    return this.formatResults(files.length, filteredResults);
  }

  /**
   * Scans files using worker threads for parallel processing
   *
   * @param {string[]} files - Files to scan
   * @returns {Promise<Object>} Scan results
   * @private
   */
  async scanParallel(files) {
    const workerPath = path.join(__dirname, 'scanner', 'analyzerWorker.js');
    const pool = new WorkerPool(workerPath, this.options.workerCount);

    try {
      await pool.initialize();

      const tasks = files.map(file => ({
        filePath: file,
        options: {
          minSeverity: this.options.severity,
          disabledPatterns: this.options.disabledPatterns,
          excludeCategories: this.options.excludeCategories,
          useEntropyFilter: this.options.useEntropyFilter
        }
      }));

      // Execute all tasks in parallel
      const results = await Promise.all(
        tasks.map(task => pool.execute(task))
      );

      // Filter results and format
      const findings = results
        .filter(r => !r.error && r.findings && r.findings.length > 0)
        .map(r => ({
          file: r.filePath,
          findings: r.findings
        }));

      // Log any errors encountered
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        logger.warn(`${errors.length} files failed to analyze`, {
          files: errors.map(e => e.filePath)
        });
      }

      // Apply baseline filtering if enabled
      let filteredFindings = findings;
      if (this.baselineManager) {
        await this.baselineManager.loadBaseline();
        filteredFindings = this.baselineManager.filterFindings(findings);
      }

      return this.formatResults(files.length, filteredFindings);
    } finally {
      await pool.terminate();
    }
  }

  /**
   * Formats scan results with summary
   *
   * @param {number} totalFiles - Total files scanned
   * @param {Array} findings - Array of findings
   * @returns {Object} Formatted results
   * @private
   */
  formatResults(totalFiles, findings) {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const fileResult of findings) {
      for (const finding of fileResult.findings) {
        summary[finding.severity] = (summary[finding.severity] || 0) + 1;
      }
    }

    return {
      scanTime: new Date().toISOString(),
      totalFiles,
      filesWithIssues: findings.length,
      summary,
      findings
    };
  }

  /**
   * Generates baseline from current scan results
   *
   * @param {string} [directory='.'] - Directory to scan
   * @param {Object} [options={}] - Generation options
   * @returns {Promise<Object>} Generated baseline
   */
  async generateBaseline(directory = '.', options = {}) {
    logger.info('Generating baseline from current scan...');

    // Temporarily disable baseline filtering for this scan
    const originalUseBaseline = this.options.useBaseline;
    this.options.useBaseline = false;

    try {
      const results = await this.scan(directory);

      const baselineManager = new BaselineManager(this.options.baselinePath);
      const baseline = await baselineManager.generateBaseline(results, options);

      logger.info(`Baseline generated: ${baseline.totalFindings} findings baselined`);
      return baseline;
    } finally {
      this.options.useBaseline = originalUseBaseline;
    }
  }

  /**
   * Initializes configuration file
   *
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    return await initConfig();
  }

  /**
   * Installs git pre-commit hooks
   *
   * @returns {Promise<boolean>} Success status
   */
  async installGitHooks() {
    return await installHooks();
  }

  /**
   * Gets the detector version
   *
   * @returns {string} Version string
   */
  getVersion() {
    return version;
  }

  /**
   * Gets loaded patterns
   *
   * @returns {Object} Patterns object
   */
  getPatterns() {
    return this.analyzer.getPatterns();
  }

  /**
   * Gets patterns by category
   *
   * @param {string} category - Category name
   * @returns {Object} Filtered patterns
   */
  getPatternsByCategory(category) {
    return this.analyzer.getPatternsByCategory(category);
  }

  /**
   * Gets patterns by service
   *
   * @param {string} service - Service name
   * @returns {Object} Filtered patterns
   */
  getPatternsByService(service) {
    return this.analyzer.getPatternsByService(service);
  }
}

module.exports = HardcodedApiDetector;
