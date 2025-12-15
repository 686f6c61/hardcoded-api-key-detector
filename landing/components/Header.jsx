import { useState } from 'react';
import { FiMenu, FiX, FiGithub } from 'react-icons/fi';
import { SiNpm } from 'react-icons/si';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Installation', href: '#installation' },
    { name: 'Quick Start', href: '#quickstart' },
    { name: 'CLI Reference', href: '#cli' },
    { name: 'Examples', href: '#examples' },
    { name: 'API', href: '#api' },
  ];

  return (
    <header className="fixed top-0 w-full bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="#" className="text-xl font-mono font-bold text-black">
              hardcoded-api-key-detector
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-black font-mono text-sm transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <a
              href="https://github.com/686f6c61/hardcoded-api-key-detector"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-black transition-colors"
              title="GitHub Repository"
            >
              <FiGithub className="w-6 h-6" />
            </a>
            <a
              href="https://www.npmjs.com/package/hardcoded-api-key-detector"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-black transition-colors"
              title="npm Package"
            >
              <SiNpm className="w-6 h-6" />
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 hover:text-black"
          >
            {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200">
          <nav className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block py-2 text-gray-700 hover:text-black font-mono text-sm"
              >
                {item.name}
              </a>
            ))}
            <div className="flex space-x-4 pt-4 border-t border-gray-200">
              <a
                href="https://github.com/686f6c61/hardcoded-api-key-detector"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-black"
              >
                <FiGithub className="w-6 h-6" />
              </a>
              <a
                href="https://www.npmjs.com/package/hardcoded-api-key-detector"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-black"
              >
                <SiNpm className="w-6 h-6" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
