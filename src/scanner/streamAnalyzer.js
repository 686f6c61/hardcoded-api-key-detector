/**
 * Stream-based Analyzer for Large Files
 * Analyzes files line-by-line using streams for memory efficiency
 *
 * @module scanner/streamAnalyzer
 * @author 686f6c61
 * @license MIT
 */

const fs = require('fs');
const readline = require('readline');
const logger = require('../utils/logger');
const { safeRegexExec } = require('../utils/safeRegex');
const { analyzeEntropy } = require('../utils/entropy');

/**
 * Stream-based analyzer for large files
 *
 * @class StreamAnalyzer
 * @example
 * const streamAnalyzer = new StreamAnalyzer();
 * const findings = await streamAnalyzer.analyzeStream('./large-file.js', patterns);
 */
class StreamAnalyzer {
  /**
   * Analyzes a file using streaming (line-by-line)
   *
   * @param {string} filePath - Path to file
   * @param {Object} patterns - Detection patterns
   * @param {Object} [options={}] - Analysis options
   * @returns {Promise<Array>} Array of findings
   */
  async analyzeStream(filePath, patterns, options = {}) {
    const findings = [];
    let lineNumber = 0;
    let blockDisabled = false;
    let skipNextLine = false;

    try {
      const fileStream = fs.createReadStream(filePath, {
        encoding: 'utf8',
        highWaterMark: 64 * 1024 // 64KB chunks
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        lineNumber++;

        // Check for inline ignore comments
        const shouldIgnoreLine = this.checkInlineIgnore(line, lineNumber, {
          blockDisabled,
          skipNextLine
        });

        // Update block disabled state
        if (line.includes('hardcoded-detector:disable')) {
          blockDisabled = true;
        }
        if (line.includes('hardcoded-detector:enable')) {
          blockDisabled = false;
        }

        // Update skip next line flag
        const currentSkipNextLine = skipNextLine;
        skipNextLine = line.includes('hardcoded-detector:disable-next-line');

        // Skip if this line should be ignored
        if (shouldIgnoreLine || currentSkipNextLine) {
          continue;
        }

        // Analyze this line against all patterns
        for (const [patternId, patternInfo] of Object.entries(patterns)) {
          if (this.shouldSkipPattern(patternId, patternInfo, options)) {
            continue;
          }

          try {
            const regex = new RegExp(patternInfo.pattern, patternInfo.flags || 'gi');
            const matches = safeRegexExec(regex, line, 500); // Shorter timeout for streaming

            for (const match of matches) {
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
                name: patternInfo.name,
                severity: patternInfo.severity || 'medium',
                description: patternInfo.description,
                service: patternInfo.service || 'unknown',
                match: match[0],
                line: lineNumber,
                column: match.index,
                lineContent: line.trim(),
                confidence: patternInfo.confidence || 'medium',
                entropy: {
                  value: entropyAnalysis.entropy,
                  level: entropyAnalysis.level
                }
              });
            }
          } catch (error) {
            logger.warn(`Regex execution failed for pattern ${patternInfo.name} on line ${lineNumber}`, {
              error: error.message
            });
          }
        }

        // Limit findings per file to prevent memory issues
        if (findings.length >= (options.maxFindings || 1000)) {
          logger.warn(`Maximum findings reached for ${filePath}, stopping analysis`);
          break;
        }
      }

      return findings;
    } catch (error) {
      logger.error(`Stream analysis failed for ${filePath}`, { error: error.message });
      return [];
    }
  }

  /**
   * Checks if a line should be ignored based on inline comments
   *
   * @param {string} line - Line content
   * @param {number} lineNumber - Line number
   * @param {Object} state - Current ignore state
   * @param {boolean} state.blockDisabled - If in disabled block
   * @param {boolean} state.skipNextLine - If next line should be skipped
   * @returns {boolean} True if line should be ignored
   * @private
   */
  checkInlineIgnore(line, lineNumber, state) {
    // Check if line contains disable-line comment
    if (line.includes('hardcoded-detector:disable-line')) {
      return true;
    }

    // Check if in disabled block
    if (state.blockDisabled) {
      return true;
    }

    return false;
  }

  /**
   * Checks if a pattern should be skipped
   *
   * @param {string} patternId - Pattern ID
   * @param {Object} patternInfo - Pattern information
   * @param {Object} options - Analysis options
   * @returns {boolean} True if should skip
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
}

module.exports = StreamAnalyzer;
