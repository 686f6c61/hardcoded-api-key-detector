/**
 * JSON Schema Definitions for Configuration Validation
 *
 * @module config/schema
 * @author 686f6c61
 * @license MIT
 */

/**
 * JSON Schema for main configuration file
 * @const {Object}
 */
const configSchema = {
  $id: 'hardcoded-detector-config',
  type: 'object',
  required: ['version'],
  properties: {
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
      description: 'Configuration version (semver)'
    },
    exclude: {
      type: 'array',
      items: { type: 'string' },
      default: [],
      description: 'Glob patterns to exclude from scanning'
    },
    include: {
      type: 'array',
      items: { type: 'string' },
      description: 'Glob patterns to include in scanning'
    },
    severity: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      description: 'Minimum severity level to report'
    },
    output: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['console', 'json', 'html', 'csv', 'txt', 'junit'],
          default: 'console',
          description: 'Output format'
        },
        file: {
          type: ['string', 'null'],
          default: null,
          description: 'Output file path'
        },
        colors: {
          type: 'boolean',
          default: true,
          description: 'Enable colored output'
        },
        verbose: {
          type: 'boolean',
          default: false,
          description: 'Enable verbose output'
        }
      }
    },
    hooks: {
      type: 'object',
      properties: {
        preCommit: {
          type: 'boolean',
          default: true,
          description: 'Enable pre-commit hook'
        },
        prePush: {
          type: 'boolean',
          default: false,
          description: 'Enable pre-push hook'
        },
        exitOnError: {
          type: 'boolean',
          default: true,
          description: 'Exit with error code when secrets found'
        }
      }
    },
    patterns: {
      type: 'object',
      properties: {
        customPatterns: {
          oneOf: [
            { type: 'string' },
            { type: 'null' },
            { type: 'object' }
          ],
          default: null,
          description: 'Path to custom patterns file or inline custom patterns object'
        },
        disabledPatterns: {
          type: 'array',
          items: { type: 'string' },
          default: [],
          description: 'Pattern IDs to disable'
        },
        excludeCategories: {
          type: 'array',
          items: { type: 'string' },
          default: [],
          description: 'Categories to exclude from scanning'
        },
        confidence: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          default: 'medium',
          description: 'Minimum confidence level'
        }
      }
    },
    reporting: {
      type: 'object',
      properties: {
        groupBy: {
          type: 'string',
          enum: ['file', 'severity', 'category'],
          default: 'file',
          description: 'How to group findings in reports'
        },
        showContext: {
          type: 'boolean',
          default: true,
          description: 'Show context lines around findings'
        },
        contextLines: {
          type: 'number',
          minimum: 0,
          maximum: 10,
          default: 2,
          description: 'Number of context lines to show'
        },
        maxFindingsPerFile: {
          type: 'number',
          minimum: 1,
          maximum: 1000,
          default: 50,
          description: 'Maximum findings to report per file'
        }
      }
    },
    ci: {
      type: 'object',
      properties: {
        failOnHigh: {
          type: 'boolean',
          default: true,
          description: 'Fail build on high severity findings'
        },
        failOnCritical: {
          type: 'boolean',
          default: true,
          description: 'Fail build on critical findings'
        },
        outputFormat: {
          type: 'string',
          enum: ['console', 'json', 'junit'],
          default: 'json',
          description: 'CI output format'
        },
        createAnnotations: {
          type: 'boolean',
          default: false,
          description: 'Create GitHub/GitLab annotations'
        }
      }
    }
  }
};

/**
 * JSON Schema for detection patterns
 * @const {Object}
 */
const patternSchema = {
  $id: 'detection-pattern',
  type: 'object',
  required: ['name', 'pattern', 'severity', 'category'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      description: 'Human-readable pattern name'
    },
    pattern: {
      type: 'string',
      minLength: 1,
      description: 'Regular expression pattern'
    },
    severity: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical'],
      description: 'Severity level'
    },
    category: {
      type: 'string',
      description: 'Pattern category'
    },
    service: {
      type: 'string',
      description: 'Service name'
    },
    description: {
      type: 'string',
      description: 'Pattern description'
    },
    confidence: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      description: 'Detection confidence level'
    },
    flags: {
      type: 'string',
      description: 'Regex flags'
    },
    references: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri'
      },
      description: 'Reference documentation URLs'
    }
  }
};

/**
 * JSON Schema for custom patterns file
 * @const {Object}
 */
const customPatternsSchema = {
  $id: 'custom-patterns',
  type: 'object',
  properties: {
    metadata: {
      type: 'object',
      properties: {
        version: { type: 'string' },
        description: { type: 'string' },
        author: { type: 'string' }
      }
    },
    patterns: {
      type: 'object',
      patternProperties: {
        '^[a-z_][a-z0-9_]*$': {
          $ref: '#/definitions/pattern'
        }
      }
    },
    disabled: {
      type: 'array',
      items: { type: 'string' },
      description: 'Pattern IDs to disable from defaults'
    }
  },
  definitions: {
    pattern: patternSchema
  }
};

module.exports = {
  configSchema,
  patternSchema,
  customPatternsSchema
};
