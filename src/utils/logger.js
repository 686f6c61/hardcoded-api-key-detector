/**
 * Simple Structured Logger
 *
 * @module utils/logger
 * @author 686f6c61
 * @license MIT
 */

const chalk = require('chalk');

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Simple structured logger for console output
 *
 * @class Logger
 */
class Logger {
  /**
   * Creates a new Logger instance
   *
   * @param {string} [level='INFO'] - Log level (ERROR, WARN, INFO, DEBUG)
   */
  constructor(level = 'INFO') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  }

  /**
   * Logs an error message
   *
   * @param {string} message - Error message
   * @param {Object} [meta={}] - Additional metadata
   */
  error(message, meta = {}) {
    if (this.level >= LOG_LEVELS.ERROR) {
      const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
      console.error(chalk.red('[ERROR]'), message, metaStr);
    }
  }

  /**
   * Logs a warning message
   *
   * @param {string} message - Warning message
   * @param {Object} [meta={}] - Additional metadata
   */
  warn(message, meta = {}) {
    if (this.level >= LOG_LEVELS.WARN) {
      const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
      console.warn(chalk.yellow('[WARN]'), message, metaStr);
    }
  }

  /**
   * Logs an info message
   *
   * @param {string} message - Info message
   * @param {Object} [meta={}] - Additional metadata
   */
  info(message, meta = {}) {
    if (this.level >= LOG_LEVELS.INFO) {
      const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
      console.log(chalk.blue('[INFO]'), message, metaStr);
    }
  }

  /**
   * Logs a debug message
   *
   * @param {string} message - Debug message
   * @param {Object} [meta={}] - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
      console.log(chalk.gray('[DEBUG]'), message, metaStr);
    }
  }

  /**
   * Sets the log level
   *
   * @param {string} level - New log level
   */
  setLevel(level) {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  }
}

// Export singleton instance
module.exports = new Logger(process.env.LOG_LEVEL || 'INFO');
