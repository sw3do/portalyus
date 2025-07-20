import React, { useState, useEffect } from 'react';
import { Trash2, Plus, RefreshCw, HardDrive, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../../config/env';

interface DiskStorage {
  id: string;
  name: string;
  path: string;
  total_space: number;
  used_space: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SystemDiskInfo {
  name: string;
  path: string;
  total_space: number;
  used_space: number;
  available_space: number;
  mount_point: string;
}

interface CreateDiskStorage {
  name: string;
  path: string;
  total_space: string;
  is_active: boolean;
}

const DiskManagement: React.FC = () => {
  const [disks, setDisks] = useState<DiskStorage[]>([]);
  const [systemDisks, setSystemDisks] = useState<SystemDiskInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSystemDisks, setShowSystemDisks] = useState(false);
  const [formData, setFormData] = useState<CreateDiskStorage>({
    name: '',
    path: '',
    total_space: '0',
    is_active: true
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsagePercentage = (used: number, total: number) => {
    return total > 0 ? Math.round((used / total) * 100) : 0;
  };

  const fetchDisks = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(getApiUrl('/admin/disks'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setDisks(data.data);
      }
    } catch (error) {
      console.error('Diskler yüklenirken hata:', error);
    }
  };

  const scanSystemDisks = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(getApiUrl('/admin/disks/scan'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSystemDisks(data.data);
        setShowSystemDisks(true);
      }
    } catch (error) {
      console.error('Sistem diskleri taranırken hata:', error);
    }
  };

  const createDisk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(getApiUrl('/admin/disks'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setFormData({ name: '', path: '', total_space: '0', is_active: true });
        setShowAddForm(false);
        fetchDisks();
      }
    } catch (error) {
      console.error('Disk oluşturulurken hata:', error);
    }
  };

  const deleteDisk = async (id: string) => {
    if (!confirm('Bu diski silmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(getApiUrl(`/admin/disks/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchDisks();
      }
    } catch (error) {
      console.error('Disk silinirken hata:', error);
    }
  };

  const addSystemDisk = (systemDisk: SystemDiskInfo) => {
    setFormData({
      name: systemDisk.name || systemDisk.mount_point,
      path: systemDisk.path,
      total_space: systemDisk.total_space ? systemDisk.total_space.toString() : '0',
      is_active: true
    });
    setShowSystemDisks(false);
    setShowAddForm(true);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDisks();
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Disk Yönetimi</h1>
        <div className="flex space-x-3">
          <button
            onClick={scanSystemDisks}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sistem Disklerini Tara</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Disk Ekle</span>
          </button>
        </div>
      </div>

      {disks.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Henüz disk tanımlanmamış</h3>
          <p className="text-yellow-700 mb-4">
            Video yükleyebilmek için en az bir disk tanımlamanız gerekiyor.
          </p>
          <button
            onClick={scanSystemDisks}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
          >
            Sistem Disklerini Tara
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disks.map((disk) => {
          const usagePercentage = getUsagePercentage(disk.used_space, disk.total_space);
          const isNearFull = usagePercentage > 90;
          
          return (
            <div key={disk.id} className="bg-white rounded-lg shadow-md p-6 border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <HardDrive className={`w-8 h-8 ${disk.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{disk.name}</h3>
                    <p className="text-sm text-gray-500">{disk.path}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteDisk(disk.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Kullanılan:</span>
                  <span className="font-medium">{formatBytes(disk.used_space)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Toplam:</span>
                  <span className="font-medium">{formatBytes(disk.total_space)}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isNearFull ? 'bg-red-600' : usagePercentage > 70 ? 'bg-yellow-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${
                    isNearFull ? 'text-red-600' : usagePercentage > 70 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    %{usagePercentage} dolu
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    disk.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {disk.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Yeni Disk Ekle</h2>
            <form onSubmit={createDisk} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disk Adı
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disk Yolu
                </label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/path/to/storage"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toplam Kapasite (bytes)
                </label>
                <input
                  type="number"
                  value={formData.total_space}
                  onChange={(e) => setFormData({ ...formData, total_space: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Aktif
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSystemDisks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Sistem Diskleri</h2>
              <button
                onClick={() => setShowSystemDisks(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemDisks.map((disk, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{disk.name || disk.mount_point}</h3>
                      <p className="text-sm text-gray-500">{disk.path}</p>
                    </div>
                    <button
                      onClick={() => addSystemDisk(disk)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Toplam:</span>
                      <span>{formatBytes(disk.total_space)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kullanılan:</span>
                      <span>{formatBytes(disk.used_space)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Boş:</span>
                      <span>{formatBytes(disk.available_space)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiskManagement;