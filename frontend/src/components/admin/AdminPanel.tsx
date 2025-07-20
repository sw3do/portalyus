import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import VideoManagement from './VideoManagement';
import ChannelManagement from './ChannelManagement';
import CategoryManagement from './CategoryManagement';
import DiskManagement from './DiskManagement';
import Sidebar from './Sidebar';
import Header from './Header';

interface AdminPanelProps {}

const AdminPanel: React.FC<AdminPanelProps> = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const expiry = localStorage.getItem('token_expiry');
    
    if (!storedToken || !expiry || Date.now() > parseInt(expiry)) {
      window.location.href = '/admin/login';
      return;
    }
    
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('token_expiry');
    window.location.href = '/admin/login';
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard getAuthHeaders={getAuthHeaders} />;
      case 'videos':
        return <VideoManagement getAuthHeaders={getAuthHeaders} token={token!} />;
      case 'channels':
        return <ChannelManagement getAuthHeaders={getAuthHeaders} token={token!} />;
      case 'categories':
        return <CategoryManagement getAuthHeaders={getAuthHeaders} />;
      case 'disks':
        return <DiskManagement />;
      default:
        return <Dashboard getAuthHeaders={getAuthHeaders} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={logout}
      />
      
      <div className="lg:ml-64">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={logout}
        />
        
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;