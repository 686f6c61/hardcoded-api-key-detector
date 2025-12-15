import CodeBlock from './CodeBlock';

export default function QuickStart() {
  const examples = [
    {
      title: 'Basic Scan',
      description: 'Scan current directory for hardcoded credentials',
      code: 'hardcoded-detector scan'
    },
    {
      title: 'Scan Specific Directory',
      description: 'Target a specific directory for scanning',
      code: 'hardcoded-detector scan ./src'
    },
    {
      title: 'Filter by Severity',
      description: 'Only report high and critical severity findings',
      code: 'hardcoded-detector scan --severity high'
    },
    {
      title: 'Generate HTML Report',
      description: 'Output results as an interactive HTML report',
      code: 'hardcoded-detector scan --output html --file security-report.html'
    },
    {
      title: 'Scan Staged Files',
      description: 'Check only staged files before committing',
      code: 'hardcoded-detector scan --staged'
    },
    {
      title: 'With Baseline Filtering',
      description: 'Show only new findings not in baseline',
      code: 'hardcoded-detector scan --baseline --entropy-filter'
    }
  ];

  return (
    <section id="quickstart" className="section bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="section-title">Quick Start</h2>
          <p className="section-subtitle">
            Common commands to get you started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {examples.map((example, index) => (
            <div key={index} className="bg-white border border-gray-200 p-6">
              <h3 className="text-lg font-mono font-bold mb-2">{example.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{example.description}</p>
              <CodeBlock code={example.code} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
