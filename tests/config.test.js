/**
 * Test Suite for Configuration Manager
 * 
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-detector
 * @license MIT
 */

const ConfigManager = require('../src/config/ConfigManager');
const fs = require('fs-extra');
const path = require('path');

describe('ConfigManager', () => {
  let configManager;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(__dirname, 'test-config-'));
    const configPath = path.join(tempDir, '.hardcoded-detector.json');
    configManager = new ConfigManager(configPath);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('Default Configuration', () => {
    test('should have valid default configuration', () => {
      const defaultConfig = configManager.defaultConfig;
      
      expect(defaultConfig.version).toBe('1.0.0');
      expect(defaultConfig.exclude).toBeInstanceOf(Array);
      expect(defaultConfig.include).toBeInstanceOf(Array);
      expect(defaultConfig.severity).toBe('medium');
      expect(defaultConfig.output).toBeDefined();
      expect(defaultConfig.hooks).toBeDefined();
      expect(defaultConfig.patterns).toBeDefined();
      expect(defaultConfig.reporting).toBeDefined();
      expect(defaultConfig.ci).toBeDefined();
    });

    test('should include common file patterns', () => {
      const defaultConfig = configManager.defaultConfig;
      
      expect(defaultConfig.include).toContain('**/*.js');
      expect(defaultConfig.include).toContain('**/*.ts');
      expect(defaultConfig.include).toContain('**/*.json');
      expect(defaultConfig.include).toContain('**/*.env*');
    });

    test('should exclude common directories', () => {
      const defaultConfig = configManager.defaultConfig;
      
      expect(defaultConfig.exclude).toContain('node_modules/**');
      expect(defaultConfig.exclude).toContain('.git/**');
      expect(defaultConfig.exclude).toContain('dist/**');
      expect(defaultConfig.exclude).toContain('coverage/**');
    });
  });

  describe('Configuration Loading', () => {
    test('should return default config when no file exists', async () => {
      const config = await configManager.load();
      
      expect(config).toEqual(configManager.defaultConfig);
    });

    test('should load existing configuration file', async () => {
      const customConfig = {
        version: '1.0.0',
        severity: 'high',
        exclude: ['custom/**'],
        output: { format: 'json' }
      };

      await fs.writeJSON(configManager.configPath, customConfig);
      const config = await configManager.load();

      expect(config.severity).toBe('high');
      expect(config.exclude).toContain('custom/**');
      expect(config.output.format).toBe('json');
    });

    test('should merge user config with defaults', async () => {
      const userConfig = {
        version: '1.0.0',
        severity: 'critical',
        output: { format: 'html' }
      };

      await fs.writeJSON(configManager.configPath, userConfig);
      const config = await configManager.load();
      
      expect(config.severity).toBe('critical');
      expect(config.output.format).toBe('html');
      expect(config.include).toBeDefined(); // Should keep default include
      expect(config.exclude).toBeDefined(); // Should keep default exclude
    });

    test('should handle corrupted config file gracefully', async () => {
      await fs.writeFile(configManager.configPath, 'invalid json content');
      
      const config = await configManager.load();
      
      expect(config).toEqual(configManager.defaultConfig);
    });
  });

  describe('Configuration Saving', () => {
    test('should save configuration to file', async () => {
      const config = {
        version: '1.0.0',
        severity: 'high',
        test: true
      };

      const success = await configManager.save(config);

      expect(success).toBe(true);
      expect(await fs.pathExists(configManager.configPath)).toBe(true);

      const savedConfig = await fs.readJSON(configManager.configPath);
      expect(savedConfig.severity).toBe('high');
      expect(savedConfig.test).toBe(true);
    });

    test('should handle save errors gracefully', async () => {
      const invalidPath = path.join('/invalid/path/config.json');
      const invalidConfigManager = new ConfigManager(invalidPath);
      
      const success = await invalidConfigManager.save({ test: true });
      
      expect(success).toBe(false);
    });
  });

  describe('Configuration Initialization', () => {
    test('should create configuration file', async () => {
      const success = await configManager.init();
      
      expect(success).toBe(true);
      expect(await fs.pathExists(configManager.configPath)).toBe(true);
      
      const config = await fs.readJSON(configManager.configPath);
      expect(config.version).toBe('1.0.0');
    });

    test('should not overwrite existing config without force', async () => {
      await fs.writeJSON(configManager.configPath, { existing: true });
      
      const success = await configManager.init();
      
      expect(success).toBe(false);
    });

    test('should overwrite existing config with force', async () => {
      await fs.writeJSON(configManager.configPath, { existing: true });
      
      const success = await configManager.init(true);
      
      expect(success).toBe(true);
      const config = await fs.readJSON(configManager.configPath);
      expect(config.existing).toBeUndefined();
    });
  });

  describe('Configuration Validation', () => {
    test('should validate correct configuration', async () => {
      await configManager.init();
      
      const validation = await configManager.validate();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    test('should detect invalid severity', async () => {
      const config = {
        version: '1.0.0',
        severity: 'invalid'
      };
      const success = await configManager.save(config);

      // Save should fail for invalid config
      expect(success).toBe(false);
    });

    test('should detect invalid output format', async () => {
      const config = {
        version: '1.0.0',
        output: { format: 'invalid' }
      };
      const success = await configManager.save(config);

      // Save should fail for invalid config
      expect(success).toBe(false);
    });

    test('should validate custom patterns path when string', async () => {
      // Schema allows string, null, or object for customPatterns
      // String should be valid even if file doesn't exist (validation happens at runtime)
      const config = {
        version: '1.0.0',
        patterns: { customPatterns: '/path/to/file.json' }
      };
      const success = await configManager.save(config);

      // Save should succeed - schema allows string paths
      expect(success).toBe(true);
    });
  });

  describe('Pattern Management', () => {
    beforeEach(async () => {
      await configManager.init();
    });

    test('should add custom pattern', async () => {
      const pattern = {
        name: 'Test Pattern',
        pattern: 'TEST_[A-Z0-9]{16}',
        severity: 'high',
        category: 'test',
        service: 'Test Service',
        description: 'Test pattern for unit testing'
      };
      
      const success = await configManager.addCustomPattern(pattern);
      
      expect(success).toBe(true);
      
      const config = await configManager.load();
      expect(config.patterns.customPatterns).toBeDefined();
      expect(config.patterns.customPatterns.test_pattern).toBeDefined();
      expect(config.patterns.customPatterns.test_pattern.name).toBe('Test Pattern');
    });

    test('should generate pattern ID from name', () => {
      const pattern = { name: 'My Test Pattern' };
      const id = configManager.generatePatternId(pattern.name);
      
      expect(id).toBe('my_test_pattern');
    });

    test('should disable pattern', async () => {
      const success = await configManager.disablePattern('aws_access_key');
      
      expect(success).toBe(true);
      
      const config = await configManager.load();
      expect(config.patterns.disabledPatterns).toContain('aws_access_key');
    });

    test('should enable pattern', async () => {
      await configManager.disablePattern('aws_access_key');
      const success = await configManager.enablePattern('aws_access_key');
      
      expect(success).toBe(true);
      
      const config = await configManager.load();
      expect(config.patterns.disabledPatterns).not.toContain('aws_access_key');
    });

    test('should handle disabling non-existent pattern', async () => {
      const success = await configManager.disablePattern('non_existent_pattern');
      
      expect(success).toBe(true);
      
      const config = await configManager.load();
      expect(config.patterns.disabledPatterns).toContain('non_existent_pattern');
    });
  });

  describe('Example Patterns', () => {
    test('should create example custom patterns file', async () => {
      const examplePath = await configManager.createExampleCustomPatterns();
      
      expect(await fs.pathExists(examplePath)).toBe(true);
      
      const patterns = await fs.readJSON(examplePath);
      expect(patterns.metadata).toBeDefined();
      expect(patterns.patterns).toBeDefined();
      expect(patterns.patterns.custom_internal_api).toBeDefined();
      expect(patterns.patterns.custom_database_token).toBeDefined();
    });
  });

  describe('Configuration Merging', () => {
    test('should merge nested objects correctly', () => {
      const defaultConfig = {
        output: {
          format: 'console',
          colors: true,
          verbose: false
        },
        patterns: {
          disabledPatterns: [],
          excludeCategories: []
        }
      };
      
      const userConfig = {
        output: {
          format: 'json'
        },
        patterns: {
          disabledPatterns: ['test_pattern']
        }
      };
      
      const merged = configManager.mergeConfigs(defaultConfig, userConfig);
      
      expect(merged.output.format).toBe('json');
      expect(merged.output.colors).toBe(true); // Should keep default
      expect(merged.output.verbose).toBe(false); // Should keep default
      expect(merged.patterns.disabledPatterns).toEqual(['test_pattern']);
      expect(merged.patterns.excludeCategories).toEqual([]); // Should keep default
    });

    test('should handle array overrides correctly', () => {
      const defaultConfig = {
        exclude: ['node_modules/**', '.git/**'],
        include: ['**/*.js', '**/*.ts']
      };

      const userConfig = {
        exclude: ['custom/**'],
        include: ['**/*.py']
      };

      const merged = configManager.mergeConfigs(defaultConfig, userConfig);

      expect(merged.exclude).toEqual(['custom/**']);
      expect(merged.include).toEqual(['**/*.py']);
    });
  });

  describe('FileScanner Functions', () => {
    const { initConfig, installHooks } = require('../src/scanner/fileScanner');
    let originalCwd;

    beforeEach(() => {
      originalCwd = process.cwd();
      process.chdir(tempDir);
    });

    afterEach(() => {
      process.chdir(originalCwd);
    });

    describe('initConfig', () => {
      test('should create configuration file', async () => {
        const result = await initConfig();

        expect(result).toBe(true);
        const configPath = path.join(tempDir, '.hardcoded-detector.json');
        expect(await fs.pathExists(configPath)).toBe(true);

        const config = await fs.readJSON(configPath);
        expect(config.version).toBe('1.0.0');
        expect(config.severity).toBe('medium');
        expect(config.exclude).toBeDefined();
      });

      test('should not overwrite existing config', async () => {
        // Create existing config
        const configPath = path.join(tempDir, '.hardcoded-detector.json');
        await fs.writeJSON(configPath, { test: true });

        const result = await initConfig();

        expect(result).toBe(false);
        const config = await fs.readJSON(configPath);
        expect(config.test).toBe(true); // Original config preserved
      });
    });

    describe('installHooks', () => {
      test('should install git pre-commit hook', async () => {
        // Initialize git repo
        const gitDir = path.join(tempDir, '.git');
        await fs.ensureDir(gitDir);

        const result = await installHooks();

        expect(result).toBe(true);
        const hookPath = path.join(gitDir, 'hooks', 'pre-commit');
        expect(await fs.pathExists(hookPath)).toBe(true);

        const hookContent = await fs.readFile(hookPath, 'utf8');
        expect(hookContent).toContain('hardcoded-api-detector');
        expect(hookContent).toContain('--staged');
      });

      test('should fail if not a git repository', async () => {
        const result = await installHooks();

        expect(result).toBe(false);
      });
    });
  });

  describe('Configuration Validation Errors', () => {
    test('should throw error for invalid configuration schema', async () => {
      const invalidConfigPath = path.join(tempDir, 'invalid-config.json');
      const invalidConfig = {
        version: '1.0.0',
        severity: 'invalid_severity_level', // Invalid value
        exclude: 'not_an_array' // Should be array
      };

      await fs.writeJSON(invalidConfigPath, invalidConfig);

      const manager = new ConfigManager(invalidConfigPath);

      expect(() => {
        manager.loadConfig();
      }).toThrow();
    });

    test('should handle bad configuration file', async () => {
      const badConfigPath = path.join(tempDir, 'bad-schema.json');
      const badConfig = {
        severity: 123, // Wrong type
        output: 'should_be_object'
      };

      await fs.writeJSON(badConfigPath, badConfig);

      const manager = new ConfigManager(badConfigPath);

      expect(() => {
        manager.loadConfig();
      }).toThrow();
    });
  });
});