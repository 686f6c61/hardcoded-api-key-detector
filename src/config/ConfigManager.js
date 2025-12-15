/**
 * Configuration Manager
 * Manages configuration files, validation, and settings
 *
 * @module config/ConfigManager
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-key-detector
 * @license MIT
 */

const fs = require('fs-extra');
const path = require('path');
const { Validator } = require('jsonschema');
const { configSchema } = require('./schema');
const { ConfigurationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Manages detector configuration
 *
 * @class ConfigManager
 * @example
 * const config = new ConfigManager('./custom-config.json');
 * const settings = await config.load();
 */
class ConfigManager {
  /**
   * Creates a new ConfigManager instance
   *
   * @param {string|null} configPath - Path to configuration file
   */
  constructor(configPath = null) {
    this.configPath = configPath || path.join(process.cwd(), '.hardcoded-detector.json');
    this.defaultConfig = this.getDefaultConfig();
    this.validator = new Validator();
  }

  /**
   * Gets the default configuration
   *
   * @returns {Object} Default configuration object
   */
  getDefaultConfig() {
    return {
      version: '1.0.0',
      exclude: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '.nyc_output/**',
        'test/**',
        'tests/**',
        'spec/**',
        'mocks/**',
        '*.test.js',
        '*.spec.js',
        '*.test.ts',
        '*.spec.ts'
      ],
      include: [
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
        '**/*.tfvars'
      ],
      severity: 'medium',
      output: {
        format: 'console',
        file: null,
        colors: true,
        verbose: false
      },
      hooks: {
        preCommit: true,
        prePush: false,
        exitOnError: true
      },
      patterns: {
        customPatterns: null,
        disabledPatterns: [],
        excludeCategories: [],
        confidence: 'medium'
      },
      reporting: {
        groupBy: 'file',
        showContext: true,
        contextLines: 2,
        maxFindingsPerFile: 50
      },
      ci: {
        failOnHigh: true,
        failOnCritical: true,
        outputFormat: 'json',
        createAnnotations: false
      }
    };
  }

  /**
   * Loads configuration from file
   *
   * @returns {Promise<Object>} Loaded and validated configuration
   * @throws {ConfigurationError} If configuration is invalid
   */
  async load() {
    try {
      if (await fs.pathExists(this.configPath)) {
        const config = await fs.readJSON(this.configPath);

        // Validate with JSON Schema
        const result = this.validator.validate(config, configSchema);

        if (!result.valid) {
          const errors = result.errors.map(e => e.stack).join('\n');
          throw new ConfigurationError(`Invalid configuration:\n${errors}`);
        }

        logger.debug(`Loaded configuration from ${this.configPath}`);
        return this.mergeConfigs(this.defaultConfig, config);
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }
      logger.warn(`Could not load config from ${this.configPath}`, { error: error.message });
    }

    logger.debug('Using default configuration');
    return this.defaultConfig;
  }

  /**
   * Saves configuration to file
   *
   * @param {Object} config - Configuration to save
   * @returns {Promise<boolean>} Success status
   */
  async save(config) {
    try {
      // Validate before saving
      const result = this.validator.validate(config, configSchema);
      if (!result.valid) {
        const errors = result.errors.map(e => e.stack).join('\n');
        throw new ConfigurationError(`Cannot save invalid configuration:\n${errors}`);
      }

      await fs.writeJSON(this.configPath, config, { spaces: 2 });
      logger.info(`Configuration saved to ${this.configPath}`);
      return true;
    } catch (error) {
      logger.error(`Could not save config to ${this.configPath}`, { error: error.message });
      return false;
    }
  }

  /**
   * Merges user configuration with defaults
   *
   * @param {Object} defaultConfig - Default configuration
   * @param {Object} userConfig - User configuration
   * @returns {Object} Merged configuration
   * @private
   */
  mergeConfigs(defaultConfig, userConfig) {
    const merged = { ...defaultConfig };

    // Deep merge objects
    for (const [key, value] of Object.entries(userConfig)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * Initializes a new configuration file
   *
   * @param {boolean} [force=false] - Overwrite existing file
   * @returns {Promise<boolean>} Success status
   */
  async init(force = false) {
    if (await fs.pathExists(this.configPath) && !force) {
      logger.warn(`Configuration file already exists: ${this.configPath}`);
      return false;
    }

    const success = await this.save(this.defaultConfig);
    if (success) {
      logger.info(`Configuration file created: ${this.configPath}`);
    }

    return success;
  }

  /**
   * Validates configuration without loading
   *
   * @returns {Promise<Object>} Validation result
   * @returns {boolean} return.valid - Whether config is valid
   * @returns {string[]} return.errors - Validation errors
   */
  async validate() {
    try {
      const config = await this.load();
      const result = this.validator.validate(config, configSchema);

      return {
        valid: result.valid,
        errors: result.errors.map(e => e.stack)
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to validate config: ${error.message}`]
      };
    }
  }

  /**
   * Adds a custom pattern to configuration
   *
   * @param {Object} pattern - Pattern to add
   * @param {string} [pattern.id] - Pattern ID
   * @param {string} pattern.name - Pattern name
   * @param {string} pattern.pattern - Regex pattern
   * @param {string} [pattern.severity='medium'] - Severity level
   * @param {string} [pattern.category='custom'] - Category
   * @param {string} [pattern.service='custom'] - Service name
   * @param {string} [pattern.description=''] - Description
   * @param {string} [pattern.confidence='medium'] - Confidence level
   * @returns {Promise<boolean>} Success status
   */
  async addCustomPattern(pattern) {
    const config = await this.load();

    if (!config.patterns.customPatterns) {
      config.patterns.customPatterns = {};
    }

    const patternId = pattern.id || this.generatePatternId(pattern.name);
    config.patterns.customPatterns[patternId] = {
      name: pattern.name,
      pattern: pattern.pattern,
      severity: pattern.severity || 'medium',
      category: pattern.category || 'custom',
      service: pattern.service || 'custom',
      description: pattern.description || '',
      confidence: pattern.confidence || 'medium'
    };

    return await this.save(config);
  }

  /**
   * Disables a detection pattern
   *
   * @param {string} patternId - Pattern ID to disable
   * @returns {Promise<boolean>} Success status
   */
  async disablePattern(patternId) {
    const config = await this.load();

    if (!config.patterns.disabledPatterns.includes(patternId)) {
      config.patterns.disabledPatterns.push(patternId);
    }

    return await this.save(config);
  }

  /**
   * Enables a previously disabled pattern
   *
   * @param {string} patternId - Pattern ID to enable
   * @returns {Promise<boolean>} Success status
   */
  async enablePattern(patternId) {
    const config = await this.load();

    const index = config.patterns.disabledPatterns.indexOf(patternId);
    if (index > -1) {
      config.patterns.disabledPatterns.splice(index, 1);
    }

    return await this.save(config);
  }

  /**
   * Generates a pattern ID from a name
   *
   * @param {string} name - Pattern name
   * @returns {string} Generated pattern ID
   * @private
   */
  generatePatternId(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Creates an example custom patterns file
   *
   * @returns {Promise<string>} Path to created file
   */
  async createExampleCustomPatterns() {
    const examplePath = path.join(path.dirname(this.configPath), 'custom-patterns.json');

    const examplePatterns = {
      metadata: {
        version: '1.0.0',
        description: 'Example custom patterns for hardcoded-api-detector',
        repository: 'https://github.com/686f6c61/hardcoded-api-detector'
      },
      patterns: {
        custom_internal_api: {
          name: 'Internal API Key',
          pattern: 'INTERNAL_API_KEY[_-]?[A-Z0-9]{16}',
          severity: 'high',
          category: 'custom',
          service: 'Internal Service',
          description: 'Internal API key pattern',
          confidence: 'high'
        },
        custom_database_token: {
          name: 'Database Access Token',
          pattern: 'DB_TOKEN_[a-zA-Z0-9]{32}',
          severity: 'critical',
          category: 'database',
          service: 'Database',
          description: 'Database access token',
          confidence: 'high'
        }
      }
    };

    await fs.writeJSON(examplePath, examplePatterns, { spaces: 2 });
    logger.info(`Example custom patterns created: ${examplePath}`);

    return examplePath;
  }
}

module.exports = ConfigManager;
