import { FiShield, FiZap, FiLayers, FiSettings, FiGitBranch, FiFilter } from 'react-icons/fi';

export default function Features() {
  const features = [
    {
      icon: FiShield,
      title: 'Extensive Detection',
      description: '245 patterns across 15 categories covering AI platforms, cloud providers, databases, payment services, and development tools'
    },
    {
      icon: FiLayers,
      title: 'Context-Aware Matching',
      description: 'Variable names and assignment patterns reduce false positives to less than 10%'
    },
    {
      icon: FiZap,
      title: 'Performance Optimized',
      description: 'Worker threads and stream processing scan 1000 files in under 10 seconds'
    },
    {
      icon: FiGitBranch,
      title: 'Git Integration',
      description: 'Pre-commit hooks automatically scan staged files and block commits with high-severity issues'
    },
    {
      icon: FiSettings,
      title: 'Highly Customizable',
      description: 'Custom patterns, configuration files, severity thresholds, and exclude patterns'
    },
    {
      icon: FiFilter,
      title: 'False Positive Reduction',
      description: 'Baseline filtering, inline ignore comments, and Shannon entropy analysis'
    }
  ];

  return (
    <section className="section bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="section-title">Why Use This Tool</h2>
          <p className="section-subtitle max-w-3xl mx-auto">
            Hardcoded credentials are one of the most common security vulnerabilities. This tool provides automated, fast, and accurate detection before they become a problem.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-6 bg-white border border-gray-200 hover:border-black transition-colors"
              >
                <Icon className="w-8 h-8 text-black mb-4" />
                <h3 className="text-xl font-mono font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
