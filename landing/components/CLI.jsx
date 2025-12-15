import CodeBlock from './CodeBlock';

export default function CLI() {
  const commands = [
    {
      name: 'scan',
      description: 'Scan directory for hardcoded API keys',
      usage: 'hardcoded-detector scan [directory] [options]',
      options: [
        { flag: '-s, --severity <level>', desc: 'Minimum severity: low, medium, high, critical' },
        { flag: '-o, --output <format>', desc: 'Output format: console, json, html, csv, txt, junit' },
        { flag: '-f, --file <path>', desc: 'Output file path' },
        { flag: '--staged', desc: 'Scan only staged files in git' },
        { flag: '--baseline', desc: 'Use baseline file to filter known findings' },
        { flag: '--generate-baseline', desc: 'Generate baseline file from current scan' },
        { flag: '--entropy-filter', desc: 'Enable entropy-based filtering' },
        { flag: '--verbose', desc: 'Enable verbose logging' },
      ],
      example: 'hardcoded-detector scan ./src --severity high --output json'
    },
    {
      name: 'init',
      description: 'Initialize configuration file',
      usage: 'hardcoded-detector init [options]',
      options: [
        { flag: '-f, --force', desc: 'Overwrite existing configuration' },
      ],
      example: 'hardcoded-detector init'
    },
    {
      name: 'install-hooks',
      description: 'Install git pre-commit hooks',
      usage: 'hardcoded-detector install-hooks',
      options: [],
      example: 'hardcoded-detector install-hooks'
    },
    {
      name: 'patterns',
      description: 'List available detection patterns',
      usage: 'hardcoded-detector patterns [options]',
      options: [
        { flag: '-c, --category <category>', desc: 'Filter by category' },
        { flag: '-s, --service <service>', desc: 'Filter by service name' },
        { flag: '--json', desc: 'Output in JSON format' },
      ],
      example: 'hardcoded-detector patterns --category ai'
    },
  ];

  return (
    <section id="cli" className="section">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="section-title">CLI Reference</h2>
          <p className="section-subtitle">
            Complete command-line interface documentation
          </p>
        </div>

        <div className="space-y-12">
          {commands.map((cmd, index) => (
            <div key={index} className="border border-gray-200 p-8">
              <h3 className="text-2xl font-mono font-bold mb-2">{cmd.name}</h3>
              <p className="text-gray-600 mb-4">{cmd.description}</p>
              
              <div className="mb-4">
                <p className="text-sm font-mono text-gray-500 mb-2">Usage:</p>
                <CodeBlock code={cmd.usage} />
              </div>

              {cmd.options.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-mono text-gray-500 mb-2">Options:</p>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    {cmd.options.map((opt, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <code className="text-sm font-mono text-black">{opt.flag}</code>
                        <p className="text-sm text-gray-600 ml-4">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-mono text-gray-500 mb-2">Example:</p>
                <CodeBlock code={cmd.example} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
