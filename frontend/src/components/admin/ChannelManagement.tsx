import React, { useState, useEffect } from 'react';
import { getApiUrl, getUploadsUrl } from '../../config/env';
import ChunkedUpload from './ChunkedUpload';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ChannelManagementProps {
  getAuthHeaders: () => Record<string, string>;
  token: string;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  image?: string;
  created_at: string;
  video_count?: number;
}

interface ChannelFormData {
  name: string;
  image?: string;
}

const ChannelManagement: React.FC<ChannelManagementProps> = ({ getAuthHeaders, token }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState<ChannelFormData>({
    name: ''
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const response = await fetch(getApiUrl('/channels'), {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      
      if (result.success) {
        setChannels(result.data);
      }
    } catch (error) {
      console.error('Kanallar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (channel?: Channel) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({
        name: channel.name
      });
    } else {
      setEditingChannel(null);
      setFormData({
        name: ''
      });
    }
    setUploadedImage(null);
    setUploadError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingChannel(null);
    setUploadedImage(null);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setUploadError('Kanal adı gereklidir!');
      return;
    }

    try {
      const requestData = {
        ...formData,
        ...(uploadedImage && { image: uploadedImage })
      };

      const url = editingChannel 
        ? getApiUrl(`/admin/channels/${editingChannel.id}`)
        : getApiUrl('/admin/channels');
      
      const method = editingChannel ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (result.success) {
        await loadChannels();
        closeModal();
      } else {
        setUploadError(result.message || 'İşlem başarısız');
      }
    } catch (error) {
      setUploadError('Bir hata oluştu');
    }
  };

  const deleteChannel = async (id: string) => {
    if (!confirm('Bu kanalı silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(getApiUrl(`/admin/channels/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const result = await response.json();
      if (result.success) {
        await loadChannels();
      }
    } catch (error) {
      console.error('Kanal silinirken hata:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kanal Yönetimi</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Yeni Kanal Ekle
        </button>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Henüz kanal eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <div key={channel.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {channel.image ? (
                  <img
                    src={getUploadsUrl(`/channels/${channel.image}`)}
                    alt={channel.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-600">
                      {channel.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {channel.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Oluşturulma: {formatDate(channel.created_at)}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {channel.video_count || 0} video
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openModal(channel)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteChannel(channel.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingChannel ? 'Kanal Düzenle' : 'Yeni Kanal Ekle'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{uploadError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kanal Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {!editingChannel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kanal Resmi
                  </label>
                  <ChunkedUpload
                    token={token}
                    uploadType="channel-image"
                    onUploadComplete={(filename) => {
                      setUploadedImage(filename);
                      setUploadError(null);
                    }}
                    onUploadError={(error) => setUploadError(error)}
                    maxFileSize={2 * 1024 * 1024} // 2MB
                    acceptedTypes="image/*"
                    chunkSize={512 * 1024} // 512KB chunks
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingChannel ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelManagement;