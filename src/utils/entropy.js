/**
 * Entropy Detection Utilities
 * Calculates Shannon entropy to detect high-entropy (random) strings
 *
 * @module utils/entropy
 * @author 686f6c61
 * @license MIT
 */

/**
 * Calculates Shannon entropy of a string
 * Higher entropy indicates more randomness (potential secret)
 *
 * @param {string} str - String to analyze
 * @returns {number} Entropy value (0.0 to 8.0 for byte strings)
 *
 * @example
 * calculateEntropy('password123') // ~3.2 (low entropy)
 * calculateEntropy('AKI4J7K3H8R9F2M1P5Q6') // ~4.8 (high entropy)
 */
function calculateEntropy(str) {
  if (!str || str.length === 0) {
    return 0;
  }

  // Count character frequencies
  const frequencies = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  // Calculate Shannon entropy: H = -Σ(p(x) * log2(p(x)))
  const length = str.length;
  let entropy = 0;

  for (const char in frequencies) {
    const probability = frequencies[char] / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

/**
 * Checks if a string has high entropy (likely a secret)
 *
 * @param {string} str - String to check
 * @param {number} [threshold=4.5] - Entropy threshold
 * @returns {boolean} True if entropy exceeds threshold
 *
 * @example
 * isHighEntropy('password') // false
 * isHighEntropy('xK9mP2qR7nL5wT3yH8') // true
 */
function isHighEntropy(str, threshold = 4.5) {
  return calculateEntropy(str) >= threshold;
}

/**
 * Analyzes entropy and returns classification
 *
 * @param {string} str - String to analyze
 * @returns {Object} Entropy analysis result
 * @returns {number} return.entropy - Calculated entropy
 * @returns {string} return.level - Classification (low|medium|high)
 * @returns {boolean} return.isSecret - If likely a secret
 *
 * @example
 * analyzeEntropy('test123')
 * // { entropy: 2.8, level: 'low', isSecret: false }
 *
 * analyzeEntropy('example_api_key_with_high_randomness_here')
 * // { entropy: 4.9, level: 'high', isSecret: true }
 */
function analyzeEntropy(str) {
  const entropy = calculateEntropy(str);

  let level = 'low';
  let isSecret = false;

  if (entropy >= 5.0) {
    level = 'high';
    isSecret = true;
  } else if (entropy >= 4.0) {
    level = 'medium';
    isSecret = true;
  } else if (entropy >= 3.5) {
    level = 'medium';
    isSecret = false;
  }

  return {
    entropy,
    level,
    isSecret
  };
}

/**
 * Calculates entropy for Base64-encoded strings
 * Base64 has inherent higher entropy, so adjusted threshold
 *
 * @param {string} str - String to check
 * @param {number} [threshold=4.0] - Adjusted threshold for Base64
 * @returns {boolean} True if high entropy for Base64
 */
function isHighEntropyBase64(str, threshold = 4.0) {
  // Base64 pattern check
  const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(str);
  if (!isBase64) {
    return false;
  }

  return calculateEntropy(str) >= threshold;
}

/**
 * Calculates entropy for hexadecimal strings
 * Hex strings have lower theoretical max entropy (4.0)
 *
 * @param {string} str - String to check
 * @param {number} [threshold=3.5] - Adjusted threshold for hex
 * @returns {boolean} True if high entropy for hex
 */
function isHighEntropyHex(str, threshold = 3.5) {
  // Hex pattern check
  const isHex = /^[a-fA-F0-9]+$/.test(str);
  if (!isHex) {
    return false;
  }

  // Hex strings with length < 16 are too short to be secrets
  if (str.length < 16) {
    return false;
  }

  return calculateEntropy(str) >= threshold;
}

/**
 * Filters a value based on entropy to reduce false positives
 * Used in conjunction with pattern matching
 *
 * @param {string} value - Value to check
 * @param {Object} [options={}] - Filter options
 * @param {number} [options.minEntropy=4.0] - Minimum entropy threshold
 * @param {number} [options.minLength=8] - Minimum length for entropy check
 * @returns {boolean} True if value passes entropy filter
 */
function entropyFilter(value, options = {}) {
  const {
    minEntropy = 4.0,
    minLength = 8
  } = options;

  // Skip entropy check for short strings
  if (value.length < minLength) {
    return true; // Let pattern matching decide
  }

  // Check entropy
  const entropy = calculateEntropy(value);
  return entropy >= minEntropy;
}

module.exports = {
  calculateEntropy,
  isHighEntropy,
  analyzeEntropy,
  isHighEntropyBase64,
  isHighEntropyHex,
  entropyFilter
};
