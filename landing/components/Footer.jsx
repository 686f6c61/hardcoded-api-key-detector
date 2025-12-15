import { FiGithub, FiPackage, FiAlertCircle, FiBook } from 'react-icons/fi';

export default function Footer() {
  const links = [
    {
      title: 'Resources',
      items: [
        { name: 'Documentation', href: '#', icon: FiBook },
        { name: 'GitHub Repository', href: 'https://github.com/686f6c61/hardcoded-api-key-detector', icon: FiGithub },
        { name: 'npm Package', href: 'https://www.npmjs.com/package/hardcoded-api-key-detector', icon: FiPackage },
        { name: 'Report Issues', href: 'https://github.com/686f6c61/hardcoded-api-key-detector/issues', icon: FiAlertCircle },
      ]
    }
  ];

  return (
    <footer className="bg-black text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 mb-8">
          <div>
            <h3 className="text-2xl font-mono font-bold mb-4">hardcoded-api-key-detector</h3>
            <p className="text-gray-400 mb-4">
              Comprehensive security tool to detect hardcoded API keys, tokens, and sensitive credentials in your codebase
            </p>
            <div className="flex space-x-4">
              <a href="https://github.com/686f6c61/hardcoded-api-key-detector" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FiGithub className="w-6 h-6" />
              </a>
              <a href="https://www.npmjs.com/package/hardcoded-api-key-detector" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FiPackage className="w-6 h-6" />
              </a>
            </div>
          </div>

          {links.map((group, index) => (
            <div key={index}>
              <h4 className="font-mono font-bold mb-4">{group.title}</h4>
              <ul className="space-y-2">
                {group.items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <li key={i}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>MIT License | Version 1.0.0</p>
          <p className="mt-2 md:mt-0">Created by 686f6c61</p>
        </div>
      </div>
    </footer>
  );
}
