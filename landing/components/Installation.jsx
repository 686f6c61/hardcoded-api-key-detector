import CodeBlock from './CodeBlock';
import { FiDownload, FiTerminal, FiPackage } from 'react-icons/fi';

export default function Installation() {
  return (
    <section id="installation" className="section">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="section-title">Installation</h2>
          <p className="section-subtitle">
            Choose your preferred installation method
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Global Installation */}
          <div className="border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FiDownload className="w-6 h-6" />
              <h3 className="text-xl font-mono font-bold">Global</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Install globally to use across all projects
            </p>
            <CodeBlock code="npm install -g hardcoded-api-key-detector" />
            <p className="text-xs text-gray-500 mt-2">
              The hardcoded-detector command will be available system-wide
            </p>
          </div>

          {/* Local Installation */}
          <div className="border border-gray-200 p-6 border-black">
            <div className="flex items-center space-x-2 mb-4">
              <FiPackage className="w-6 h-6" />
              <h3 className="text-xl font-mono font-bold">Local (Recommended)</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Install as a development dependency
            </p>
            <CodeBlock code="npm install --save-dev hardcoded-api-key-detector" />
            <p className="text-xs text-gray-500 mt-2">
              Ensures consistent versions across your team
            </p>
          </div>

          {/* npx */}
          <div className="border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FiTerminal className="w-6 h-6" />
              <h3 className="text-xl font-mono font-bold">npx</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Run without installing
            </p>
            <CodeBlock code="npx hardcoded-api-key-detector scan" />
            <p className="text-xs text-gray-500 mt-2">
              Useful for one-time scans or trying the tool
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
