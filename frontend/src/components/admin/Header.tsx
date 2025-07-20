import React from 'react';
import { 
  Bars3Icon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onToggleSidebar: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onLogout }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h2 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900">
            Portalyus Admin
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onLogout}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Çıkış Yap</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;