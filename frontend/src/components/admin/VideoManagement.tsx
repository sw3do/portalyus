import React, { useState, useEffect } from 'react';
import { getApiUrl, getUploadsUrl } from '../../config/env';
import ChunkedUpload from './ChunkedUpload';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface VideoManagementProps {
  getAuthHeaders: () => Record<string, string>;
  token: string;
}

interface Video {
  id: string;
  title: string;
  description?: string;
  slug: string;
  thumbnail?: string;
  duration?: number;
  views: number;
  created_at: string;
  channel_name: string;
  channel_id: string;
  category_name: string;
  category_id: string;
  is_featured: boolean;
}

interface Channel {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface VideoFormData {
  title: string;
  description: string;
  channel_id: string;
  category_id: string;
  is_featured: boolean;
  video_file?: string;
  thumbnail?: string;
  disk_id?: string;
}

const VideoManagement: React.FC<VideoManagementProps> = ({ getAuthHeaders, token }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    channel_id: '',
    category_id: '',
    is_featured: false
  });
  const [uploadedVideoFile, setUploadedVideoFile] = useState<string | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(null);
  const [uploadedDiskId, setUploadedDiskId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showModal && channels.length > 0 && categories.length > 0) {
      if (editingVideo) {
        setFormData(prev => ({
          ...prev,
          channel_id: editingVideo.channel_id,
          category_id: editingVideo.category_id
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          channel_id: prev.channel_id || channels[0].id,
          category_id: prev.category_id || categories[0].id
        }));
      }
    }
  }, [channels, categories, showModal, editingVideo]);

  const loadData = async () => {
    try {
      const [videosRes, channelsRes, categoriesRes] = await Promise.all([
        fetch(getApiUrl('/videos'), { headers: getAuthHeaders() }),
        fetch(getApiUrl('/channels'), { headers: getAuthHeaders() }),
        fetch(getApiUrl('/categories'), { headers: getAuthHeaders() })
      ]);

      const videosData = await videosRes.json();
      const channelsData = await channelsRes.json();
      const categoriesData = await categoriesRes.json();

      if (videosData.success) setVideos(videosData.data);
      if (channelsData.success) setChannels(channelsData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (video?: Video) => {
    setUploadedVideoFile(null);
    setUploadedThumbnail(null);
    setUploadedDiskId(null);
    setUploadError(null);
    
    if (video) {
      setEditingVideo(video);
      setFormData({
        title: video.title,
        description: video.description || '',
        channel_id: video.channel_id,
        category_id: video.category_id,
        is_featured: video.is_featured
      });
    } else {
      setEditingVideo(null);
      setFormData({
        title: '',
        description: '',
        channel_id: channels.length > 0 ? channels[0].id : '',
        category_id: categories.length > 0 ? categories[0].id : '',
        is_featured: false
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVideo(null);
    setUploadedVideoFile(null);
    setUploadedThumbnail(null);
    setUploadedDiskId(null);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.channel_id || !formData.category_id) {
      setUploadError('Lütfen tüm gerekli alanları doldurun!');
      return;
    }

    if (!editingVideo && !uploadedVideoFile) {
      setUploadError('Lütfen video dosyası yükleyin!');
      return;
    }

    try {
      const requestData = {
        ...formData,
        ...(uploadedVideoFile && { video_file: uploadedVideoFile }),
        ...(uploadedThumbnail && { thumbnail: uploadedThumbnail }),
        ...(uploadedDiskId && { disk_id: uploadedDiskId })
      };

      const url = editingVideo 
        ? getApiUrl(`/admin/videos/${editingVideo.id}`)
        : getApiUrl('/admin/videos');
      
      const method = editingVideo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (result.success) {
        await loadData();
        closeModal();
      } else {
        setUploadError(result.message || 'İşlem başarısız');
      }
    } catch (error) {
      setUploadError('Bir hata oluştu');
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Bu videoyu silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(getApiUrl(`/admin/videos/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Video silinirken hata:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatViewCount = (count: number | undefined) => {
    if (!count && count !== 0) return '0';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
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
        <h1 className="text-2xl font-bold text-gray-900">Video Yönetimi</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Yeni Video Ekle
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Henüz video eklenmemiş.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Video
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kanal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Görüntüleme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-24">
                          {video.thumbnail ? (
                            <img
                              className="h-16 w-24 object-cover rounded"
                              src={getUploadsUrl(`/thumbnails/${video.thumbnail}`)}
                              alt={video.title}
                            />
                          ) : (
                            <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {video.title}
                          </div>
                          {video.is_featured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Öne Çıkan
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {video.channel_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {video.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {formatViewCount(video.views)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(video.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal(video)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteVideo(video.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingVideo ? 'Video Düzenle' : 'Yeni Video Ekle'}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlık *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kanal *
                      </label>
                      <select
                        value={formData.channel_id}
                        onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Kanal Seçin</option>
                        {channels.map((channel) => (
                          <option key={channel.id} value={channel.id}>
                            {channel.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori *
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Kategori Seçin</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="featured" className="text-sm text-gray-700">
                      Öne Çıkan Video
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  {!editingVideo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Dosyası *
                      </label>
                      <ChunkedUpload
                        token={token}
                        uploadType="video"
                        onUploadComplete={(filename) => {
                          setUploadedVideoFile(filename);
                          setUploadError(null);
                        }}
                        onUploadError={(error) => setUploadError(error)}
                        maxFileSize={2 * 1024 * 1024 * 1024} // 2GB
                        acceptedTypes="video/*"
                        chunkSize={2 * 1024 * 1024} // 2MB chunks
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thumbnail
                    </label>
                    <ChunkedUpload
                      token={token}
                      uploadType="thumbnail"
                      onUploadComplete={(filename) => {
                        setUploadedThumbnail(filename);
                        setUploadError(null);
                      }}
                      onUploadError={(error) => setUploadError(error)}
                      maxFileSize={5 * 1024 * 1024} // 5MB
                      acceptedTypes="image/*"
                      chunkSize={1 * 1024 * 1024} // 1MB chunks
                    />
                  </div>
                </div>
              </div>

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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingVideo ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagement;