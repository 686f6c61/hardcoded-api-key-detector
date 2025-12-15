import CodeBlock from './CodeBlock';
import { FiDatabase, FiMessageSquare, FiActivity } from 'react-icons/fi';

export default function AdvancedFeatures() {
  return (
    <section className="section bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="section-title">Advanced Features</h2>
          <p className="section-subtitle">
            Powerful capabilities to reduce false positives and manage findings
          </p>
        </div>

        <div className="space-y-12">
          {/* Baseline */}
          <div className="bg-white border border-gray-200 p-8">
            <div className="flex items-center space-x-3 mb-4">
              <FiDatabase className="w-8 h-8" />
              <h3 className="text-2xl font-mono font-bold">Baseline / Ignore File</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Generate a baseline of known findings and filter them from future scans. Essential for managing existing codebases with legacy credentials or accepted risks.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-mono text-sm mb-2">Generate Baseline</p>
                <CodeBlock code="hardcoded-detector scan --generate-baseline" />
                <p className="text-xs text-gray-500 mt-2">Creates .hardcoded-detector-baseline.json</p>
              </div>
              <div>
                <p className="font-mono text-sm mb-2">Use Baseline</p>
                <CodeBlock code="hardcoded-detector scan --baseline" />
                <p className="text-xs text-gray-500 mt-2">Only shows new findings</p>
              </div>
            </div>
          </div>

          {/* Inline Ignores */}
          <div className="bg-white border border-gray-200 p-8">
            <div className="flex items-center space-x-3 mb-4">
              <FiMessageSquare className="w-8 h-8" />
              <h3 className="text-2xl font-mono font-bold">Inline Ignore Comments</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Suppress specific findings directly in your source code using ESLint-style comments.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="font-mono text-sm mb-2">Disable Line</p>
                <CodeBlock code={`const key = "abc123"; // hardcoded-detector:disable-line`} />
              </div>
              <div>
                <p className="font-mono text-sm mb-2">Disable Next Line</p>
                <CodeBlock code={`// hardcoded-detector:disable-next-line\nconst key = "abc123";`} />
              </div>
              <div>
                <p className="font-mono text-sm mb-2">Disable Block</p>
                <CodeBlock code={`/* hardcoded-detector:disable */\nconst key = "abc123";\n/* hardcoded-detector:enable */`} />
              </div>
            </div>
          </div>

          {/* Entropy */}
          <div className="bg-white border border-gray-200 p-8">
            <div className="flex items-center space-x-3 mb-4">
              <FiActivity className="w-8 h-8" />
              <h3 className="text-2xl font-mono font-bold">Entropy Detection</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Shannon entropy analysis identifies high-randomness strings that are more likely to be genuine secrets.
            </p>
            
            <div className="mb-4">
              <CodeBlock code="hardcoded-detector scan --entropy-filter" />
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-4 border border-gray-200">
                <p className="font-mono font-bold mb-1">Low (0-3.5)</p>
                <p className="text-gray-600">Common words, patterns</p>
                <code className="text-xs text-gray-500">password123</code>
              </div>
              <div className="bg-gray-50 p-4 border border-gray-200">
                <p className="font-mono font-bold mb-1">Medium (3.5-4.5)</p>
                <p className="text-gray-600">Mixed alphanumeric</p>
                <code className="text-xs text-gray-500">MyApiKey2024</code>
              </div>
              <div className="bg-gray-50 p-4 border border-black">
                <p className="font-mono font-bold mb-1">High (4.5+)</p>
                <p className="text-gray-600">Random strings, true secrets</p>
                <code className="text-xs text-gray-500">xK9mP2qR7nL5wT3y</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
