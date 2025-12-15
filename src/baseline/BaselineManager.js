/**
 * Baseline Manager
 * Manages baseline file for ignoring known/reviewed findings
 *
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-key-detector
 * @license MIT
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * BaselineManager class
 * Handles baseline file operations for ignoring reviewed findings
 */
class BaselineManager {
  /**
   * Creates a new BaselineManager instance
   *
   * @param {string} baselinePath - Path to baseline file
   */
  constructor(baselinePath = '.hardcoded-detector-baseline.json') {
    this.baselinePath = path.resolve(baselinePath);
    this.baseline = null;
  }

  /**
   * Generates a unique hash for a finding
   *
   * @param {Object} finding - Finding object
   * @param {string} filePath - File path where finding was detected
   * @returns {string} SHA256 hash
   */
  generateFindingHash(finding, filePath) {
    const data = JSON.stringify({
      file: filePath,
      line: finding.line,
      id: finding.id,
      match: finding.match
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Loads baseline from file
   *
   * @returns {Promise<Object>} Baseline object
   */
  async loadBaseline() {
    try {
      if (await fs.pathExists(this.baselinePath)) {
        this.baseline = await fs.readJSON(this.baselinePath);
        logger.info(`Loaded baseline from ${this.baselinePath}`);
        return this.baseline;
      }
    } catch (error) {
      logger.warn(`Failed to load baseline: ${error.message}`);
    }

    this.baseline = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      files: {}
    };
    return this.baseline;
  }

  /**
   * Saves baseline to file
   *
   * @param {Object} baseline - Baseline object to save
   * @returns {Promise<void>}
   */
  async saveBaseline(baseline) {
    try {
      await fs.writeJSON(this.baselinePath, baseline, { spaces: 2 });
      logger.info(`Saved baseline to ${this.baselinePath}`);
    } catch (error) {
      logger.error(`Failed to save baseline: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generates baseline from scan results
   *
   * @param {Object} scanResults - Scan results object
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated baseline
   */
  async generateBaseline(scanResults, options = {}) {
    const baseline = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      generatedBy: options.generatedBy || 'hardcoded-api-detector',
      totalFindings: 0,
      files: {}
    };

    // Process all findings
    for (const fileResult of scanResults.findings || []) {
      const filePath = fileResult.file;

      for (const finding of fileResult.findings || []) {
        const hash = this.generateFindingHash(finding, filePath);
        const key = `${filePath}:${finding.line}`;

        baseline.files[key] = {
          type: finding.id,
          name: finding.name,
          severity: finding.severity,
          hash: hash,
          reviewed: false,
          reviewedBy: null,
          reviewDate: null,
          reason: options.autoReason || 'Baselined during initial scan',
          line: finding.line,
          match: finding.match.substring(0, 50) // First 50 chars only
        };

        baseline.totalFindings++;
      }
    }

    await this.saveBaseline(baseline);
    return baseline;
  }

  /**
   * Checks if a finding is in baseline
   *
   * @param {Object} finding - Finding object
   * @param {string} filePath - File path
   * @returns {boolean} True if finding is baselined
   */
  isBaselined(finding, filePath) {
    if (!this.baseline || !this.baseline.files) {
      return false;
    }

    const key = `${filePath}:${finding.line}`;
    const baselineEntry = this.baseline.files[key];

    if (!baselineEntry) {
      return false;
    }

    // Verify hash matches
    const currentHash = this.generateFindingHash(finding, filePath);
    return baselineEntry.hash === currentHash;
  }

  /**
   * Filters findings against baseline
   *
   * @param {Array} findings - Array of file findings
   * @returns {Array} Filtered findings (non-baselined only)
   */
  filterFindings(findings) {
    if (!this.baseline) {
      return findings;
    }

    const filtered = [];
    let baselinedCount = 0;

    for (const fileResult of findings) {
      const filteredFileFindings = fileResult.findings.filter(finding => {
        const isBaselined = this.isBaselined(finding, fileResult.file);
        if (isBaselined) {
          baselinedCount++;
        }
        return !isBaselined;
      });

      if (filteredFileFindings.length > 0) {
        filtered.push({
          file: fileResult.file,
          findings: filteredFileFindings
        });
      }
    }

    if (baselinedCount > 0) {
      logger.info(`Filtered ${baselinedCount} baselined findings`);
    }

    return filtered;
  }

  /**
   * Updates baseline entry with review information
   *
   * @param {string} fileKey - File key (path:line)
   * @param {Object} reviewInfo - Review information
   * @returns {Promise<void>}
   */
  async updateReview(fileKey, reviewInfo) {
    if (!this.baseline || !this.baseline.files[fileKey]) {
      throw new Error(`Finding not found in baseline: ${fileKey}`);
    }

    this.baseline.files[fileKey] = {
      ...this.baseline.files[fileKey],
      reviewed: true,
      reviewedBy: reviewInfo.reviewedBy,
      reviewDate: new Date().toISOString(),
      reason: reviewInfo.reason
    };

    await this.saveBaseline(this.baseline);
  }

  /**
   * Gets baseline statistics
   *
   * @returns {Object} Baseline statistics
   */
  getStats() {
    if (!this.baseline || !this.baseline.files) {
      return {
        total: 0,
        reviewed: 0,
        unreviewed: 0
      };
    }

    const entries = Object.values(this.baseline.files);
    return {
      total: entries.length,
      reviewed: entries.filter(e => e.reviewed).length,
      unreviewed: entries.filter(e => !e.reviewed).length,
      bySeverity: entries.reduce((acc, entry) => {
        acc[entry.severity] = (acc[entry.severity] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = BaselineManager;
