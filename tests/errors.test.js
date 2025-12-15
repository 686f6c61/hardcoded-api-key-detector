/**
 * Test Suite for Custom Error Classes
 *
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-detector
 * @license MIT
 */

const {
  DetectorError,
  ConfigurationError,
  FileSystemError,
  PatternError,
  ScanError
} = require('../src/utils/errors');

describe('Custom Errors', () => {
  describe('DetectorError', () => {
    test('should create error with default code', () => {
      const error = new DetectorError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DetectorError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('DETECTOR_ERROR');
      expect(error.name).toBe('DetectorError');
      expect(error.stack).toBeDefined();
    });

    test('should create error with custom code', () => {
      const error = new DetectorError('Custom error', 'CUSTOM_CODE');

      expect(error.message).toBe('Custom error');
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.name).toBe('DetectorError');
    });

    test('should have stack trace', () => {
      const error = new DetectorError('Stack test');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('DetectorError');
    });

    test('should be throwable', () => {
      expect(() => {
        throw new DetectorError('Throwable error');
      }).toThrow('Throwable error');

      expect(() => {
        throw new DetectorError('Throwable error');
      }).toThrow(DetectorError);
    });
  });

  describe('ConfigurationError', () => {
    test('should create configuration error', () => {
      const error = new ConfigurationError('Config is invalid');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DetectorError);
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.message).toBe('Config is invalid');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.name).toBe('ConfigurationError');
    });

    test('should be throwable', () => {
      expect(() => {
        throw new ConfigurationError('Bad config');
      }).toThrow('Bad config');

      expect(() => {
        throw new ConfigurationError('Bad config');
      }).toThrow(ConfigurationError);
    });

    test('should have proper inheritance chain', () => {
      const error = new ConfigurationError('Test');

      expect(error instanceof ConfigurationError).toBe(true);
      expect(error instanceof DetectorError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('FileSystemError', () => {
    test('should create filesystem error with filePath', () => {
      const error = new FileSystemError('File not found', '/path/to/file.js');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DetectorError);
      expect(error).toBeInstanceOf(FileSystemError);
      expect(error.message).toBe('File not found');
      expect(error.code).toBe('FS_ERROR');
      expect(error.name).toBe('FileSystemError');
      expect(error.filePath).toBe('/path/to/file.js');
    });

    test('should be throwable', () => {
      expect(() => {
        throw new FileSystemError('Access denied', '/etc/passwd');
      }).toThrow('Access denied');

      expect(() => {
        throw new FileSystemError('Access denied', '/etc/passwd');
      }).toThrow(FileSystemError);
    });

    test('should preserve filePath property', () => {
      const filePath = '/home/user/project/config.json';
      const error = new FileSystemError('Cannot read file', filePath);

      expect(error.filePath).toBe(filePath);
    });

    test('should have proper inheritance chain', () => {
      const error = new FileSystemError('Test', '/path');

      expect(error instanceof FileSystemError).toBe(true);
      expect(error instanceof DetectorError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('PatternError', () => {
    test('should create pattern error with patternId', () => {
      const error = new PatternError('Invalid pattern', 'aws_access_key');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DetectorError);
      expect(error).toBeInstanceOf(PatternError);
      expect(error.message).toBe('Invalid pattern');
      expect(error.code).toBe('PATTERN_ERROR');
      expect(error.name).toBe('PatternError');
      expect(error.patternId).toBe('aws_access_key');
    });

    test('should be throwable', () => {
      expect(() => {
        throw new PatternError('Regex error', 'github_token');
      }).toThrow('Regex error');

      expect(() => {
        throw new PatternError('Regex error', 'github_token');
      }).toThrow(PatternError);
    });

    test('should preserve patternId property', () => {
      const patternId = 'custom_api_key';
      const error = new PatternError('ReDoS vulnerability', patternId);

      expect(error.patternId).toBe(patternId);
    });

    test('should have proper inheritance chain', () => {
      const error = new PatternError('Test', 'pattern_id');

      expect(error instanceof PatternError).toBe(true);
      expect(error instanceof DetectorError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('ScanError', () => {
    test('should create scan error', () => {
      const error = new ScanError('Scan failed');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DetectorError);
      expect(error).toBeInstanceOf(ScanError);
      expect(error.message).toBe('Scan failed');
      expect(error.code).toBe('SCAN_ERROR');
      expect(error.name).toBe('ScanError');
    });

    test('should be throwable', () => {
      expect(() => {
        throw new ScanError('Worker pool error');
      }).toThrow('Worker pool error');

      expect(() => {
        throw new ScanError('Worker pool error');
      }).toThrow(ScanError);
    });

    test('should have proper inheritance chain', () => {
      const error = new ScanError('Test');

      expect(error instanceof ScanError).toBe(true);
      expect(error instanceof DetectorError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('Error Differentiation', () => {
    test('should be able to catch specific error types', () => {
      try {
        throw new ConfigurationError('Config error');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        expect(error).not.toBeInstanceOf(FileSystemError);
        expect(error).not.toBeInstanceOf(PatternError);
        expect(error).not.toBeInstanceOf(ScanError);
      }
    });

    test('should be able to catch base DetectorError', () => {
      try {
        throw new FileSystemError('FS error', '/path');
      } catch (error) {
        expect(error).toBeInstanceOf(DetectorError);
      }
    });

    test('all custom errors should be instances of Error', () => {
      const errors = [
        new DetectorError('test'),
        new ConfigurationError('test'),
        new FileSystemError('test', '/path'),
        new PatternError('test', 'pattern'),
        new ScanError('test')
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(Error);
      });
    });
  });
});
