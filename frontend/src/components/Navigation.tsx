import React, { useState, useEffect, useCallback, memo } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { getApiUrl, getUploadsUrl } from '../config/env';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Channel {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

const Navigation: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl('/categories'));
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl('/channels'));
      const data = await response.json();
      if (data.success) {
        setChannels(data.data);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCategories(), fetchChannels()]);
      setIsLoading(false);
    };
    fetchData();
  }, [fetchCategories, fetchChannels]);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-red-900/30 to-orange-900/40 shadow-2xl border-b border-red-500/30 backdrop-blur-sm relative z-[9998]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="flex-shrink-0 group">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-300 to-yellow-400 group-hover:from-red-300 group-hover:via-orange-200 group-hover:to-yellow-300 transition-all duration-300 drop-shadow-lg">
                Portalyus
              </h1>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 backdrop-blur-sm">
              Ana Sayfa
            </a>
            
            <a href="/videolar" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 backdrop-blur-sm">
              Tüm Videolar
            </a>
            
            <a href="/iletisim" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 backdrop-blur-sm">
              İletişim
            </a>
            
            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="flex items-center text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 backdrop-blur-sm">
                <span>Kategoriler</span>
                <svg className="ml-1 w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[9999] border border-red-500/30">
                <div className="py-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    categories.map((category) => (
                      <a
                        key={category.id}
                        href={`/kategori/${category.slug}`}
                        className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 hover:text-white transition-all duration-200 group/item"
                      >
                        <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-3 group-hover/item:scale-125 transition-transform duration-200"></div>
                        {category.name}
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Channels Dropdown */}
            <div className="relative group">
              <button className="flex items-center text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 backdrop-blur-sm">
                <span>Kanallar</span>
                <svg className="ml-1 w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[9999] border border-red-500/30">
                <div className="py-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    channels.map((channel) => (
                      <a
                        key={channel.id}
                        href={`/kanal/${channel.slug}`}
                        className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 hover:text-white transition-all duration-200 group/item"
                      >
                        {channel.image ? (
                          <img
                            src={getUploadsUrl(`/channels/${channel.image}`)}
                            alt={channel.name}
                            className="w-6 h-6 rounded-full object-cover mr-3 ring-2 ring-gray-600 group-hover/item:ring-red-400 transition-all duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mr-3 ring-2 ring-gray-600 group-hover/item:ring-red-400 transition-all duration-200">
                            <span className="text-xs text-white font-bold">{channel.name.charAt(0)}</span>
                          </div>
                        )}
                        {channel.name}
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white p-2 rounded-full hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 transition-all duration-300"
              aria-label={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-4 pb-6 space-y-3 bg-gradient-to-b from-gray-800/90 via-red-900/20 to-orange-900/30 border-t border-red-500/30">
            <a href="/" className="text-gray-300 hover:text-white block px-4 py-3 rounded-xl text-base font-medium hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 transition-all duration-300">
              Ana Sayfa
            </a>
            
            <a href="/videolar" className="text-gray-300 hover:text-white block px-4 py-3 rounded-xl text-base font-medium hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 transition-all duration-300">
              Tüm Videolar
            </a>
            
            <a href="/iletisim" className="text-gray-300 hover:text-white block px-4 py-3 rounded-xl text-base font-medium hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 transition-all duration-300">
              İletişim
            </a>
            
            {!isLoading && (
              <>
                <div className="space-y-2">
                  <div className="text-gray-400 px-4 py-2 text-sm font-semibold flex items-center">
                    <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-2"></div>
                    Kategoriler
                  </div>
                  {categories.map((category) => (
                    <a
                      key={category.id}
                      href={`/kategori/${category.slug}`}
                      className="text-gray-300 hover:text-white block px-6 py-2 rounded-lg text-sm hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 transition-all duration-200"
                    >
                      {category.name}
                    </a>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="text-gray-400 px-4 py-2 text-sm font-semibold flex items-center">
                    <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-2"></div>
                    Kanallar
                  </div>
                  {channels.map((channel) => (
                    <a
                      key={channel.id}
                      href={`/kanal/${channel.slug}`}
                      className="flex items-center text-gray-300 hover:text-white px-6 py-2 rounded-lg text-sm hover:bg-gradient-to-r hover:from-red-600/20 hover:to-orange-600/20 transition-all duration-200"
                    >
                      {channel.image ? (
                        <img
                          src={getUploadsUrl(`/channels/${channel.image}`)}
                          alt={channel.name}
                          className="w-6 h-6 rounded-full object-cover mr-3 ring-1 ring-gray-600"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs text-white font-bold">{channel.name.charAt(0)}</span>
                        </div>
                      )}
                      {channel.name}
                    </a>
                  ))}
                </div>
              </>
            )}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;