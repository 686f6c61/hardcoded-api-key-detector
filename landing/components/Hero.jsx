import { FiGithub, FiPackage, FiArrowDown } from 'react-icons/fi';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-mono font-bold text-black mb-6">
            Hardcoded API Key Detector
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
            Comprehensive security tool to detect hardcoded API keys, tokens, and sensitive credentials in your codebase before they reach production
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12 text-sm font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Patterns:</span>
              <span className="font-bold">245+</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Node:</span>
              <span className="font-bold">14+</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">License:</span>
              <span className="font-bold">MIT</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Version:</span>
              <span className="font-bold">1.0.0</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href="#installation" className="btn-primary inline-flex items-center justify-center space-x-2">
              <FiArrowDown className="w-4 h-4" />
              <span>Get Started</span>
            </a>
            <a
              href="https://github.com/686f6c61/hardcoded-api-key-detector"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center justify-center space-x-2"
            >
              <FiGithub className="w-4 h-4" />
              <span>View on GitHub</span>
            </a>
            <a
              href="https://www.npmjs.com/package/hardcoded-api-key-detector"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center justify-center space-x-2"
            >
              <FiPackage className="w-4 h-4" />
              <span>npm Package</span>
            </a>
          </div>

          {/* Code Example */}
          <div className="max-w-3xl mx-auto">
            <div className="code-block text-left">
              <pre className="text-sm">
{`$ npx hardcoded-api-key-detector scan

[INFO] Validated 245/245 patterns
[SCANNING] Scanning ./src...
[RESULTS] Scan Results:
Files scanned: 42
Files with issues: 3

[CRITICAL] Critical: 1
[HIGH] High: 2

[FILE] src/config.js
  [FOUND] Stripe Live API Key (critical)
    Line 15: const apiKey = "sk_live_..."
    Service: Stripe | Category: payment`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
