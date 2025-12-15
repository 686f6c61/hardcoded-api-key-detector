/**
 * Test Suite for Safe Regex Utilities
 *
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-detector
 * @license MIT
 */

const {
  safeRegexExec,
  validatePattern,
  testPatternSafety,
  DEFAULT_TIMEOUT,
  MAX_MATCHES
} = require('../src/utils/safeRegex');

describe('safeRegex', () => {
  describe('safeRegexExec', () => {
    test('should execute regex normally and return matches', () => {
      const regex = /test/gi;
      const content = 'This is a test. Another test here.';

      const matches = safeRegexExec(regex, content);

      expect(matches.length).toBe(2);
      expect(matches[0][0]).toBe('test');
      expect(matches[1][0]).toBe('test');
    });

    test('should return empty array when no matches', () => {
      const regex = /xyz/g;
      const content = 'This is a test';

      const matches = safeRegexExec(regex, content);

      expect(matches).toEqual([]);
    });

    test('should throw error on timeout', (done) => {
      // Mock Date.now to simulate timeout
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = () => {
        callCount++;
        // After a few calls, simulate time passing beyond timeout
        if (callCount > 5) {
          return originalDateNow() + 3000; // Simulate 3 seconds passed
        }
        return originalDateNow();
      };

      const regex = /a/g;
      const content = 'a'.repeat(100);

      try {
        expect(() => {
          safeRegexExec(regex, content, 100);
        }).toThrow(/timeout/i);
        done();
      } finally {
        Date.now = originalDateNow;
      }
    });

    test('should throw error when too many matches', () => {
      // Create a regex that matches every character
      const regex = /./g;
      const content = 'a'.repeat(MAX_MATCHES + 100);

      expect(() => {
        safeRegexExec(regex, content);
      }).toThrow(/too many matches/i);
    });

    test('should handle zero-length matches', () => {
      const regex = /\b/g;
      const content = 'hello world';

      const matches = safeRegexExec(regex, content);

      // Should find word boundaries
      expect(matches.length).toBeGreaterThan(0);
    });

    test('should use custom timeout', (done) => {
      // Mock Date.now to simulate timeout
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = () => {
        callCount++;
        if (callCount > 3) {
          return originalDateNow() + 500; // Simulate time passing
        }
        return originalDateNow();
      };

      const regex = /a/g;
      const content = 'a'.repeat(50);

      try {
        expect(() => {
          safeRegexExec(regex, content, 20);
        }).toThrow(/timeout after 20ms/i);
        done();
      } finally {
        Date.now = originalDateNow;
      }
    });

    test('should re-throw other regex errors', () => {
      // Simulate a generic error by passing invalid regex
      const regex = /valid/g;
      const content = 'test';

      // Mock exec to throw a generic error
      const originalExec = regex.exec;
      regex.exec = () => {
        throw new Error('Some other error');
      };

      expect(() => {
        safeRegexExec(regex, content);
      }).toThrow(/regex execution error/i);

      // Restore
      regex.exec = originalExec;
    });

    test('should handle multiple matches correctly', () => {
      const regex = /\d+/g;
      const content = 'There are 123 numbers and 456 more';

      const matches = safeRegexExec(regex, content);

      expect(matches.length).toBe(2);
      expect(matches[0][0]).toBe('123');
      expect(matches[1][0]).toBe('456');
    });
  });

  describe('validatePattern', () => {
    test('should mark safe patterns as safe', () => {
      const pattern = 'AKIA[0-9A-Z]{16}';

      const result = validatePattern(pattern);

      expect(result.safe).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    test('should detect nested quantifiers', () => {
      const pattern = '(a+)*';

      const result = validatePattern(pattern);

      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Nested quantifiers detected - may cause ReDoS');
    });

    test('should detect multiple alternations with quantifiers', () => {
      const pattern = 'a+|b+|c+|d+';

      const result = validatePattern(pattern);

      // This should add a warning but keep safe=true (not critical)
      expect(result.warnings).toContain('Multiple alternations with quantifiers - may cause ReDoS');
    });

    test('should detect multiple .* in sequence', () => {
      const pattern = '.*.*';

      const result = validatePattern(pattern);

      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Multiple .* or .+ in sequence - may cause ReDoS');
    });

    test('should detect multiple .+ in sequence', () => {
      const pattern = '.+.+';

      const result = validatePattern(pattern);

      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Multiple .* or .+ in sequence - may cause ReDoS');
    });

    test('should validate patterns without throwing', () => {
      // Test that validation works even if some checks don't match
      const pattern = '(\\w+){2,}$';

      const result = validatePattern(pattern);

      // Should still return a valid result object
      expect(result).toHaveProperty('safe');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('should detect backreferences', () => {
      const pattern = '(a)\\1';

      const result = validatePattern(pattern);

      expect(result.warnings).toContain('Backreferences detected - may impact performance');
    });

    test('should detect very large character classes', () => {
      const pattern = '[' + 'a'.repeat(60) + ']';

      const result = validatePattern(pattern);

      expect(result.warnings).toContain('Very large character class - may impact performance');
    });

    test('should handle patterns with multiple issues', () => {
      const pattern = '(a+)*.*\\1';

      const result = validatePattern(pattern);

      expect(result.safe).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(1);
    });

    test('should handle empty pattern', () => {
      const pattern = '';

      const result = validatePattern(pattern);

      expect(result.safe).toBe(true);
      expect(result.warnings).toEqual([]);
    });
  });

  describe('testPatternSafety', () => {
    test('should return true for safe patterns', () => {
      const pattern = 'AKIA[0-9A-Z]{16}';

      const result = testPatternSafety(pattern);

      expect(result).toBe(true);
    });

    test('should return false for unsafe patterns', (done) => {
      // Mock Date.now to simulate a pattern that times out
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = () => {
        callCount++;
        if (callCount > 2) {
          return originalDateNow() + 2000; // Simulate timeout
        }
        return originalDateNow();
      };

      try {
        const pattern = /a/g;
        const result = testPatternSafety(pattern, 10);
        expect(result).toBe(false);
        done();
      } finally {
        Date.now = originalDateNow;
      }
    });

    test('should accept RegExp objects', () => {
      const pattern = /test/g;

      const result = testPatternSafety(pattern);

      expect(result).toBe(true);
    });

    test('should accept string patterns', () => {
      const pattern = 'test';

      const result = testPatternSafety(pattern);

      expect(result).toBe(true);
    });

    test('should use custom timeout', (done) => {
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = () => {
        callCount++;
        if (callCount > 2) {
          return originalDateNow() + 1000;
        }
        return originalDateNow();
      };

      try {
        const pattern = /a/g;
        const result = testPatternSafety(pattern, 10);
        expect(result).toBe(false);
        done();
      } finally {
        Date.now = originalDateNow;
      }
    });

    test('should handle patterns that match many times', () => {
      const pattern = '.';

      const result = testPatternSafety(pattern);

      expect(result).toBe(true);
    });
  });

  describe('Constants', () => {
    test('should export DEFAULT_TIMEOUT', () => {
      expect(DEFAULT_TIMEOUT).toBe(2000);
      expect(typeof DEFAULT_TIMEOUT).toBe('number');
    });

    test('should export MAX_MATCHES', () => {
      expect(MAX_MATCHES).toBe(10000);
      expect(typeof MAX_MATCHES).toBe('number');
    });
  });
});
