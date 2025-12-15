import { FiFileText, FiCode } from 'react-icons/fi';

export default function Examples() {
  return (
    <section id="examples" className="section">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="section-title">Examples</h2>
          <p className="section-subtitle">
            View real scan reports and explore use cases
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <a
            href="/examples/example-report.html"
            target="_blank"
            className="block p-8 border-2 border-gray-200 hover:border-black transition-colors group"
          >
            <FiCode className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-mono font-bold mb-2">Interactive HTML Report</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive visual report with 2,921 findings, syntax highlighting, and interactive filtering
            </p>
            <p className="font-mono text-sm text-black">View Example →</p>
          </a>

          <a
            href="/examples/example-report.txt"
            target="_blank"
            className="block p-8 border-2 border-gray-200 hover:border-black transition-colors group"
          >
            <FiFileText className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-mono font-bold mb-2">Text Report</h3>
            <p className="text-gray-600 mb-4">
              Simple text-based format showing file paths, line numbers, and detected tokens
            </p>
            <p className="font-mono text-sm text-black">View Example →</p>
          </a>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-8">
          <h3 className="text-2xl font-mono font-bold mb-6">Real-World Use Cases</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-mono font-bold mb-2">Pre-Commit Security Check</h4>
              <p className="text-sm text-gray-600">
                Install git hooks to automatically scan staged files before each commit and block commits with high-severity issues
              </p>
            </div>
            <div>
              <h4 className="font-mono font-bold mb-2">CI/CD Pipeline Integration</h4>
              <p className="text-sm text-gray-600">
                Scan all code in pull requests before merging and fail builds if credentials are detected
              </p>
            </div>
            <div>
              <h4 className="font-mono font-bold mb-2">Scheduled Repository Audits</h4>
              <p className="text-sm text-gray-600">
                Set up weekly scans to catch any credentials that may have been committed before the tool was implemented
              </p>
            </div>
            <div>
              <h4 className="font-mono font-bold mb-2">Development Environment Setup</h4>
              <p className="text-sm text-gray-600">
                Automatically install hooks when developers run npm install to ensure consistent security practices
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
