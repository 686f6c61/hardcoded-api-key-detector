/**
 * Safe Regex Execution with ReDoS Protection
 *
 * @module utils/safeRegex
 * @author 686f6c61
 * @license MIT
 */

/**
 * Default timeout for regex execution (ms)
 * @const {number}
 */
const DEFAULT_TIMEOUT = 2000;

/**
 * Maximum number of matches to prevent infinite loops
 * @const {number}
 */
const MAX_MATCHES = 10000;

/**
 * Executes regex with timeout protection
 *
 * @param {RegExp} regex - Regular expression to execute
 * @param {string} content - Content to search
 * @param {number} [timeout=2000] - Timeout in milliseconds
 * @returns {Array<RegExpExecArray>} Array of matches
 * @throws {Error} If regex execution times out or exceeds match limit
 */
function safeRegexExec(regex, content, timeout = DEFAULT_TIMEOUT) {
  const matches = [];
  const startTime = Date.now();
  let match;
  let matchCount = 0;

  try {
    while ((match = regex.exec(content)) !== null) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Regex execution timeout after ${timeout}ms. Pattern may be vulnerable to ReDoS.`
        );
      }

      // Check match count to prevent infinite loops
      if (matchCount++ > MAX_MATCHES) {
        throw new Error(
          `Too many matches (>${MAX_MATCHES}). Pattern may be too broad or vulnerable to ReDoS.`
        );
      }

      // Avoid infinite loops with zero-length matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      matches.push(match);
    }

    return matches;
  } catch (error) {
    if (error.message.includes('timeout') || error.message.includes('Too many matches')) {
      throw error;
    }
    // Re-throw other errors
    throw new Error(`Regex execution error: ${error.message}`);
  }
}

/**
 * Validates regex pattern for potential ReDoS vulnerabilities
 * Checks for common dangerous patterns
 *
 * @param {string} pattern - Regex pattern string
 * @returns {Object} Validation result with safe flag and warnings
 * @returns {boolean} return.safe - Whether the pattern is safe
 * @returns {string[]} return.warnings - Array of warning messages
 */
function validatePattern(pattern) {
  const warnings = [];
  let safe = true;

  // Check for nested quantifiers (e.g., (a+)*, (a*)+, (a+)+)
  if (/\([^)]*[+*]\)[+*]/.test(pattern)) {
    warnings.push('Nested quantifiers detected - may cause ReDoS');
    safe = false;
  }

  // Check for alternation with overlapping patterns
  if (/\|.*\|.*\|/.test(pattern) && /[+*]/.test(pattern)) {
    warnings.push('Multiple alternations with quantifiers - may cause ReDoS');
  }

  // Check for multiple .* or .+ in sequence
  if (/(\.\*){2,}|(\.\+){2,}/.test(pattern)) {
    warnings.push('Multiple .* or .+ in sequence - may cause ReDoS');
    safe = false;
  }

  // Check for grouping with quantifiers at end
  if (/\(\w\+\){2,}\$/.test(pattern)) {
    warnings.push('Repeated word boundaries at end - may cause ReDoS');
  }

  // Check for backreferences (often problematic)
  if (/\\[1-9]/.test(pattern)) {
    warnings.push('Backreferences detected - may impact performance');
  }

  // Check for very broad character classes
  if (/\[[^\]]{50,}\]/.test(pattern)) {
    warnings.push('Very large character class - may impact performance');
  }

  return {
    safe,
    warnings
  };
}

/**
 * Tests if a regex pattern is safe to use
 * Quick check with sample input
 *
 * @param {string|RegExp} pattern - Pattern to test
 * @param {number} [timeout=1000] - Timeout in milliseconds
 * @returns {boolean} True if pattern executes safely
 */
function testPatternSafety(pattern, timeout = 1000) {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : pattern;
  const testString = 'a'.repeat(1000); // Test with repetitive input

  try {
    safeRegexExec(regex, testString, timeout);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  safeRegexExec,
  validatePattern,
  testPatternSafety,
  DEFAULT_TIMEOUT,
  MAX_MATCHES
};
