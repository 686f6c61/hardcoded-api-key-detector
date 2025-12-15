/**
 * Custom Error Classes for Hardcoded API Detector
 *
 * @module utils/errors
 * @author 686f6c61
 * @license MIT
 */

/**
 * Base error class for all detector errors
 *
 * @class DetectorError
 * @extends Error
 */
class DetectorError extends Error {
  /**
   * Creates a new DetectorError
   *
   * @param {string} message - Error message
   * @param {string} [code='DETECTOR_ERROR'] - Error code
   */
  constructor(message, code = 'DETECTOR_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration related errors
 *
 * @class ConfigurationError
 * @extends DetectorError
 */
class ConfigurationError extends DetectorError {
  constructor(message) {
    super(message, 'CONFIG_ERROR');
  }
}

/**
 * File system related errors
 *
 * @class FileSystemError
 * @extends DetectorError
 */
class FileSystemError extends DetectorError {
  /**
   * Creates a new FileSystemError
   *
   * @param {string} message - Error message
   * @param {string} filePath - Path to the problematic file
   */
  constructor(message, filePath) {
    super(message, 'FS_ERROR');
    this.filePath = filePath;
  }
}

/**
 * Pattern validation errors
 *
 * @class PatternError
 * @extends DetectorError
 */
class PatternError extends DetectorError {
  /**
   * Creates a new PatternError
   *
   * @param {string} message - Error message
   * @param {string} patternId - ID of the problematic pattern
   */
  constructor(message, patternId) {
    super(message, 'PATTERN_ERROR');
    this.patternId = patternId;
  }
}

/**
 * Scan operation errors
 *
 * @class ScanError
 * @extends DetectorError
 */
class ScanError extends DetectorError {
  constructor(message) {
    super(message, 'SCAN_ERROR');
  }
}

module.exports = {
  DetectorError,
  ConfigurationError,
  FileSystemError,
  PatternError,
  ScanError
};
