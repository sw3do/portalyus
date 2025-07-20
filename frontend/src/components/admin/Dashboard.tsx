import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../config/env';
import { 
  VideoCameraIcon,
  TvIcon,
  TagIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface DashboardProps {
  getAuthHeaders: () => Record<string, string>;
}

interface DashboardStats {
  totalVideos: number;
  totalChannels: number;
  totalCategories: number;
  totalViews: number;
}

const Dashboard: React.FC<DashboardProps> = ({ getAuthHeaders }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalChannels: 0,
    totalCategories: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [videosRes, channelsRes, categoriesRes] = await Promise.all([
        fetch(getApiUrl('/videos'), { headers: getAuthHeaders() }),
        fetch(getApiUrl('/channels'), { headers: getAuthHeaders() }),
        fetch(getApiUrl('/categories'), { headers: getAuthHeaders() })
      ]);

      const videosData = await videosRes.json();
      const channelsData = await channelsRes.json();
      const categoriesData = await categoriesRes.json();

      const totalViews = videosData.data?.reduce((sum: number, video: any) => 
        sum + (video.view_count || 0), 0) || 0;

      setStats({
        totalVideos: videosData.data?.length || 0,
        totalChannels: channelsData.data?.length || 0,
        totalCategories: categoriesData.data?.length || 0,
        totalViews
      });
    } catch (error) {
      console.error('Dashboard verisi yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Toplam Video',
      value: stats.totalVideos,
      icon: VideoCameraIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Toplam Kanal',
      value: stats.totalChannels,
      icon: TvIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Toplam Kategori',
      value: stats.totalCategories,
      icon: TagIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Toplam Görüntüleme',
      value: stats.totalViews.toLocaleString(),
      icon: EyeIcon,
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Portalyus admin paneline hoş geldiniz</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Sistem başarıyla çalışıyor
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Chunk upload sistemi aktif
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              Otomatik temizlik çalışıyor
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistem Durumu</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Upload Sistemi</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Aktif
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Veritabanı</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Bağlı
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Chunk Upload</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Hazır
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;