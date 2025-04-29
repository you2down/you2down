import React from 'react';
import { Download, Youtube } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Youtube className="h-8 w-8 text-red-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-900">
            YouTube <span className="text-red-600">Downloader</span>
          </h1>
        </div>
        
        <div className="flex items-center">
          <Download className="h-5 w-5 text-gray-600 mr-2" />
          <span className="text-sm font-medium text-gray-600">Fast & Easy Downloads</span>
        </div>
      </div>
    </header>
  );
};

export default Header;