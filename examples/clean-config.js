/**
 * Example: Clean configuration without hardcoded secrets
 * This is how configuration SHOULD be done
 */

const config = {
  // ✓ Load from environment variables
  apiKey: process.env.API_KEY,
  secretKey: process.env.SECRET_KEY,

  // ✓ Use configuration files (not committed to git)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME
  },

  // ✓ Public configuration is fine
  appSettings: {
    timeout: 30000,
    retries: 3,
    logLevel: 'info'
  }
};

module.exports = config;
