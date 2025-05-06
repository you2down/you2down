import React from 'react';
import { Download, Youtube, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Youtube className="h-8 w-8 text-red-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            YouTube <span className="text-red-600">Downloader</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Download className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fast & Easy Downloads</span>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;