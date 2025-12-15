/**
 * Content Analyzer Module
 * Analyzes file content for hardcoded API keys and credentials
 *
 * @module scanner/analyzer
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-key-detector
 * @license MIT
 */

const fs = require('fs-extra');
const fsPromises = require('fs/promises');
const path = require('path');
const { PatternError, FileSystemError } = require('../utils/errors');
const logger = require('../utils/logger');
const { safeRegexExec, validatePattern } = require('../utils/safeRegex');
const { calculateEntropy, analyzeEntropy } = require('../utils/entropy');

/**
 * Maximum file size to analyze (10MB)
 * @const {number}
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum number of lines to analyze per file
 * @const {number}
 */
const MAX_LINES = 100000;

/**
 * @typedef {Object} Finding
 * @property {string} id - Unique pattern identifier
 * @property {string} type - Category type
 * @property {string} name - Human-readable name
 * @property {string} severity - Severity level (low|medium|high|critical)
 * @property {string} description - Description of the finding
 * @property {string} service - Service name
 * @property {string} match - The matched string
 * @property {number} line - Line number
 * @property {number} column - Column number
 * @property {string} lineContent - Content of the line
 * @property {Array<ContextLine>} context - Surrounding lines
 * @property {string} confidence - Confidence level
 */

/**
 * @typedef {Object} ContextLine
 * @property {number} lineNumber - Line number
 * @property {string} content - Line content
 * @property {boolean} isTarget - Whether this is the target line
 */

/**
 * @typedef {Object} AnalysisOptions
 * @property {string} [minSeverity='medium'] - Minimum severity level
 * @property {string[]} [disabledPatterns=[]] - Patterns to skip
 * @property {string[]} [excludeCategories=[]] - Categories to exclude
 */

/**
 * Analyzes code for hardcoded secrets using pattern matching
 *
 * @class ContentAnalyzer
 * @example
 * const analyzer = new ContentAnalyzer('./custom-patterns.json');
 * const findings = await analyzer.analyzeContent('./src/config.js', {
 *   minSeverity: 'high',
 *   excludeCategories: ['cryptocurrency']
 * });
 */
class ContentAnalyzer {
  /**
   * Creates a new ContentAnalyzer instance
   *
   * @param {string|null} customPatternsPath - Path to custom patterns JSON file
   * @throws {PatternError} If custom patterns file is malformed
   */
  constructor(customPatternsPath = null) {
    this.patterns = this.loadPatterns(customPatternsPath);
  }

  /**
   * Loads detection patterns from default and custom sources
   *
   * @param {string|null} customPatternsPath - Path to custom patterns
   * @returns {Object} Merged patterns object
   * @private
   */
  loadPatterns(customPatternsPath) {
    const defaultPatternsPath = path.join(__dirname, '../detectors/services.json');
    let patterns = {};

    // Load default patterns
    try {
      const servicesData = require(defaultPatternsPath);
      patterns = servicesData.patterns || {};
      logger.debug(`Loaded ${Object.keys(patterns).length} default patterns`);
    } catch (error) {
      logger.warn('Warning: Could not load default patterns', { error: error.message });
    }

    // Load custom patterns if provided
    if (customPatternsPath && fs.existsSync(customPatternsPath)) {
      try {
        const customPatterns = require(customPatternsPath);
        patterns = this.mergePatterns(patterns, customPatterns);
        logger.debug(`Merged custom patterns from ${customPatternsPath}`);
      } catch (error) {
        logger.warn(`Warning: Could not load custom patterns from ${customPatternsPath}`, {
          error: error.message
        });
      }
    }

    // Validate patterns for ReDoS vulnerabilities
    patterns = this.validateAndFilterPatterns(patterns);

    return patterns;
  }

  /**
   * Validates patterns and filters out potentially dangerous ones
   *
   * @param {Object} patterns - Patterns to validate
   * @returns {Object} Validated patterns
   * @private
   */
  validateAndFilterPatterns(patterns) {
    const validated = {};

    for (const [id, pattern] of Object.entries(patterns)) {
      const validation = validatePattern(pattern.pattern);

      if (!validation.safe) {
        logger.warn(`Pattern ${id} may be vulnerable to ReDoS, skipping`, {
          warnings: validation.warnings
        });
        continue;
      }

      if (validation.warnings.length > 0) {
        logger.debug(`Pattern ${id} has warnings`, { warnings: validation.warnings });
      }

      validated[id] = pattern;
    }

    logger.info(`Validated ${Object.keys(validated).length}/${Object.keys(patterns).length} patterns`);
    return validated;
  }

  /**
   * Merges default and custom patterns
   *
   * @param {Object} defaultPatterns - Default patterns
   * @param {Object} customPatterns - Custom patterns object
   * @returns {Object} Merged patterns
   * @private
   */
  mergePatterns(defaultPatterns, customPatterns) {
    const merged = { ...defaultPatterns };

    // Add or update custom patterns
    if (customPatterns.patterns) {
      Object.assign(merged, customPatterns.patterns);
    }

    // Remove disabled patterns
    if (customPatterns.disabled) {
      customPatterns.disabled.forEach(patternId => {
        delete merged[patternId];
      });
    }

    return merged;
  }

  /**
   * Analyzes a file for hardcoded secrets
   *
   * @param {string} filePath - Absolute path to the file to analyze
   * @param {AnalysisOptions} [options={}] - Analysis options
   * @returns {Promise<Finding[]>} Array of findings
   * @throws {FileSystemError} If file cannot be accessed
   *
   * @example
   * const findings = await analyzer.analyzeContent('./config.js', {
   *   minSeverity: 'high'
   * });
   */
  async analyzeContent(filePath, options = {}) {
    try {
      // Check file size before reading
      const stats = await fs.stat(filePath);

      if (stats.size > MAX_FILE_SIZE) {
        logger.warn(
          `Skipping ${filePath}: file too large (${(stats.size / 1024 / 1024).toFixed(2)}MB > ${MAX_FILE_SIZE / 1024 / 1024}MB)`
        );
        return [];
      }

      // Check if file is binary
      if (await this.isBinaryFile(filePath)) {
        logger.debug(`Skipping ${filePath}: binary file`);
        return [];
      }

      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');

      // Check line count
      if (lines.length > MAX_LINES) {
        logger.warn(
          `Skipping ${filePath}: too many lines (${lines.length} > ${MAX_LINES})`
        );
        return [];
      }

      // Parse inline ignore comments
      const ignoredLines = this.parseInlineIgnoreComments(lines);

      const findings = [];

      for (const [patternId, patternInfo] of Object.entries(this.patterns)) {
        if (this.shouldSkipPattern(patternId, patternInfo, options)) {
          continue;
        }

        const matches = this.findMatches(content, patternInfo);

        for (const match of matches) {
          const lineNumber = content.substring(0, match.index).split('\n').length;

          // Skip if line is ignored by inline comment
          if (ignoredLines.has(lineNumber)) {
            continue;
          }

          const lineContent = lines[lineNumber - 1] || '';

          // Analyze entropy of the matched value
          const entropyAnalysis = analyzeEntropy(match[0]);

          // Apply entropy filtering for generic patterns if enabled
          if (options.useEntropyFilter && patternInfo.useEntropyFilter) {
            // Skip low-entropy matches for patterns that require high entropy
            if (!entropyAnalysis.isSecret) {
              continue;
            }
          }

          findings.push({
            id: patternId,
            type: patternInfo.category || 'unknown',
            category: patternInfo.category || 'unknown',
            name: patternInfo.name,
            severity: patternInfo.severity || 'medium',
            description: patternInfo.description,
            service: patternInfo.service || 'unknown',
            match: match[0],
            line: lineNumber,
            column: match.index - content.lastIndexOf('\n', match.index - 1),
            lineContent: lineContent.trim(),
            context: this.getContext(lines, lineNumber - 1),
            confidence: patternInfo.confidence || 'medium',
            entropy: {
              value: entropyAnalysis.entropy,
              level: entropyAnalysis.level
            }
          });
        }
      }

      return findings;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`File not found: ${filePath}`);
        return [];
      }
      if (error.code === 'EACCES') {
        logger.warn(`Permission denied: ${filePath}`);
        return [];
      }
      logger.warn(`Could not read file ${filePath}`, { error: error.message });
      return [];
    }
  }

  /**
   * Checks if a pattern should be skipped based on options
   *
   * @param {string} patternId - Pattern identifier
   * @param {Object} patternInfo - Pattern information
   * @param {AnalysisOptions} options - Analysis options
   * @returns {boolean} True if pattern should be skipped
   * @private
   */
  shouldSkipPattern(patternId, patternInfo, options) {
    // Skip if pattern is disabled
    if (options.disabledPatterns && options.disabledPatterns.includes(patternId)) {
      return true;
    }

    // Skip if severity is below threshold
    if (options.minSeverity) {
      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
      const patternLevel = severityLevels[patternInfo.severity] || 2;
      const minLevel = severityLevels[options.minSeverity] || 2;

      if (patternLevel < minLevel) {
        return true;
      }
    }

    // Skip if category is excluded
    if (options.excludeCategories && options.excludeCategories.includes(patternInfo.category)) {
      return true;
    }

    return false;
  }

  /**
   * Parses inline ignore comments from lines
   *
   * @param {string[]} lines - Array of file lines
   * @returns {Set<number>} Set of line numbers to ignore (1-indexed)
   * @private
   */
  parseInlineIgnoreComments(lines) {
    const ignoredLines = new Set();
    let blockDisabled = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for block disable/enable
      if (line.includes('hardcoded-detector:disable')) {
        blockDisabled = true;
        ignoredLines.add(lineNumber);
        continue;
      }

      if (line.includes('hardcoded-detector:enable')) {
        blockDisabled = false;
        continue;
      }

      // If in disabled block, ignore this line
      if (blockDisabled) {
        ignoredLines.add(lineNumber);
        continue;
      }

      // Check for disable-next-line
      if (line.includes('hardcoded-detector:disable-next-line')) {
        if (i + 1 < lines.length) {
          ignoredLines.add(lineNumber + 1);
        }
        continue;
      }

      // Check for disable-line (same line)
      if (line.includes('hardcoded-detector:disable-line')) {
        ignoredLines.add(lineNumber);
        continue;
      }
    }

    return ignoredLines;
  }

  /**
   * Finds all matches for a pattern in content using safe regex execution
   *
   * @param {string} content - Content to search
   * @param {Object} patternInfo - Pattern information
   * @returns {Array<RegExpExecArray>} Array of matches
   * @private
   */
  findMatches(content, patternInfo) {
    try {
      const regex = new RegExp(patternInfo.pattern, patternInfo.flags || 'gi');
      return safeRegexExec(regex, content, 2000);
    } catch (error) {
      logger.warn(`Regex execution failed for pattern ${patternInfo.name}`, {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Gets context lines around a target line
   *
   * @param {string[]} lines - All lines in the file
   * @param {number} centerLine - Target line index (0-based)
   * @param {number} [contextLines=2] - Number of lines before/after to include
   * @returns {ContextLine[]} Array of context lines
   * @private
   */
  getContext(lines, centerLine, contextLines = 2) {
    const start = Math.max(0, centerLine - contextLines);
    const end = Math.min(lines.length - 1, centerLine + contextLines);

    return lines.slice(start, end + 1).map((line, index) => ({
      lineNumber: start + index + 1,
      content: line,
      isTarget: start + index === centerLine
    }));
  }

  /**
   * Checks if a file is binary
   *
   * @param {string} filePath - Path to file
   * @returns {Promise<boolean>} True if binary
   * @private
   */
  async isBinaryFile(filePath) {
    const buffer = Buffer.alloc(512);
    let fd;

    try {
      fd = await fsPromises.open(filePath, 'r');
      const { bytesRead } = await fd.read(buffer, 0, 512, 0);

      // Check for null bytes (common in binary files)
      // Only check the bytes that were actually read from the file
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.debug(`Could not check if file is binary: ${filePath}`, {
        error: error.message
      });
      return false;
    } finally {
      if (fd) {
        await fd.close();
      }
    }
  }

  /**
   * Gets all loaded patterns
   *
   * @returns {Object} Patterns object
   */
  getPatterns() {
    return this.patterns;
  }

  /**
   * Gets patterns filtered by category
   *
   * @param {string} category - Category to filter by
   * @returns {Object} Filtered patterns
   */
  getPatternsByCategory(category) {
    return Object.entries(this.patterns)
      .filter(([_, pattern]) => pattern.category === category)
      .reduce((acc, [id, pattern]) => {
        acc[id] = pattern;
        return acc;
      }, {});
  }

  /**
   * Gets patterns filtered by service
   *
   * @param {string} service - Service to filter by
   * @returns {Object} Filtered patterns
   */
  getPatternsByService(service) {
    return Object.entries(this.patterns)
      .filter(([_, pattern]) => pattern.service === service)
      .reduce((acc, [id, pattern]) => {
        acc[id] = pattern;
        return acc;
      }, {});
  }
}

module.exports = ContentAnalyzer;
