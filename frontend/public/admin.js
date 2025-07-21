// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.apiBase = window.ADMIN_CONFIG?.apiBase || 'http://localhost:3001/api';
        this.uploadsUrl = window.ADMIN_CONFIG?.uploadsUrl || 'http://localhost:3001/uploads';
        this.token = localStorage.getItem('admin_token');
        this.init();
    }

    async init() {
        // Check authentication
        if (!this.token || this.isTokenExpired()) {
            window.location.href = '/admin/login';
            return;
        }

        // Initialize UI
        this.setupEventListeners();
        await this.loadDashboardData();
        this.hideLoading();
    }

    isTokenExpired() {
        const expiry = localStorage.getItem('token_expiry');
        if (!expiry) return true;
        return Date.now() > parseInt(expiry);
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    hideLoading() {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('-translate-x-full');
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Add buttons
        document.getElementById('addVideoBtn')?.addEventListener('click', () => {
            this.showVideoForm();
        });
        
        document.getElementById('addChannelBtn')?.addEventListener('click', () => {
            this.showChannelForm();
        });
        
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            this.showCategoryForm();
        });
        
        document.getElementById('addDiskBtn')?.addEventListener('click', () => {
            this.showDiskForm();
        });
        
        document.getElementById('scanDisksBtn')?.addEventListener('click', () => {
            this.scanSystemDisks();
        });
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => {
            s.classList.add('hidden');
        });

        // Show selected section
        document.getElementById(`${section}-section`).classList.remove('hidden');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-gray-700', 'text-white');
            link.classList.add('text-gray-300');
        });
        
        document.querySelector(`[data-section="${section}"]`).classList.add('bg-gray-700', 'text-white');
        document.querySelector(`[data-section="${section}"]`).classList.remove('text-gray-300');

        // Load section data
        switch(section) {
            case 'videos':
                this.loadVideos();
                break;
            case 'channels':
                this.loadChannels();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'disks':
                this.loadDisks();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const [videos, channels, categories] = await Promise.all([
                fetch(`${this.apiBase}/videos`, { headers: this.getAuthHeaders() }),
                fetch(`${this.apiBase}/channels`, { headers: this.getAuthHeaders() }),
                fetch(`${this.apiBase}/categories`, { headers: this.getAuthHeaders() })
            ]);

            const videosData = await videos.json();
            const channelsData = await channels.json();
            const categoriesData = await categories.json();

            document.getElementById('totalVideos').textContent = videosData.data?.length || 0;
            document.getElementById('totalChannels').textContent = channelsData.data?.length || 0;
            document.getElementById('totalCategories').textContent = categoriesData.data?.length || 0;
            
            // Calculate total views
            const totalViews = videosData.data?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;
            document.getElementById('totalViews').textContent = totalViews.toLocaleString();
        } catch (error) {
            console.error('Dashboard verisi yüklenirken hata:', error);
        }
    }

    async loadVideos() {
        const content = document.getElementById('videosContent');
        content.innerHTML = 'Yükleniyor...';

        try {
            const response = await fetch(`${this.apiBase}/videos`, {
                headers: this.getAuthHeaders()
            });
            const result = await response.json();

            if (result.success) {
                content.innerHTML = this.renderVideosTable(result.data);
                this.setupVideoActions();
            } else {
                content.innerHTML = '<p class="text-red-500">Videolar yüklenirken hata oluştu.</p>';
            }
        } catch (error) {
            content.innerHTML = '<p class="text-red-500">Videolar yüklenirken hata oluştu.</p>';
        }
    }

    renderVideosTable(videos) {
        if (!videos || videos.length === 0) {
            return '<p class="text-gray-500">Henüz video eklenmemiş.</p>';
        }

        return `
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kanal</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Görüntüleme</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${videos.map(video => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <img class="h-10 w-16 object-cover rounded" src="${this.uploadsUrl}/thumbnails/${video.thumbnail.startsWith('thumbnails/') ? video.thumbnail.replace('thumbnails/', '') : video.thumbnail}" alt="${video.title}">
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">${video.title}</div>
                                            <div class="text-sm text-gray-500">${video.duration || 'N/A'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${video.channel_name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${video.category_name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${video.views || 0}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(video.created_at).toLocaleDateString('tr-TR')}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="adminPanel.editVideo('${video.id}')" class="text-blue-600 hover:text-blue-900 mr-3">Düzenle</button>
                                    <button onclick="adminPanel.deleteVideo('${video.id}')" class="text-red-600 hover:text-red-900">Sil</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async loadChannels() {
        const content = document.getElementById('channelsContent');
        content.innerHTML = 'Yükleniyor...';

        try {
            const response = await fetch(`${this.apiBase}/channels`, {
                headers: this.getAuthHeaders()
            });
            const result = await response.json();

            if (result.success) {
                content.innerHTML = this.renderChannelsGrid(result.data);
                this.setupChannelActions();
            } else {
                content.innerHTML = '<p class="text-red-500">Kanallar yüklenirken hata oluştu.</p>';
            }
        } catch (error) {
            content.innerHTML = '<p class="text-red-500">Kanallar yüklenirken hata oluştu.</p>';
        }
    }

    renderChannelsGrid(channels) {
        if (!channels || channels.length === 0) {
            return '<p class="text-gray-500">Henüz kanal eklenmemiş.</p>';
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${channels.map(channel => `
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center space-x-4">
                            <img class="h-16 w-16 rounded-full object-cover" src="${this.uploadsUrl}/channels/${channel.image}" alt="${channel.name}">
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-gray-900">${channel.name}</h3>
                                <p class="text-sm text-gray-500">${new Date(channel.created_at).toLocaleDateString('tr-TR')} tarihinde oluşturuldu</p>
                            </div>
                        </div>
                        <div class="mt-4 flex space-x-2">
                            <button onclick="adminPanel.editChannel('${channel.id}')" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                Düzenle
                            </button>
                            <button onclick="adminPanel.deleteChannel('${channel.id}')" class="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                Sil
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async loadCategories() {
        const content = document.getElementById('categoriesContent');
        content.innerHTML = 'Yükleniyor...';

        try {
            const response = await fetch(`${this.apiBase}/categories`, {
                headers: this.getAuthHeaders()
            });
            const result = await response.json();

            if (result.success) {
                content.innerHTML = this.renderCategoriesGrid(result.data);
                this.setupCategoryActions();
            } else {
                content.innerHTML = '<p class="text-red-500">Kategoriler yüklenirken hata oluştu.</p>';
            }
        } catch (error) {
            content.innerHTML = '<p class="text-red-500">Kategoriler yüklenirken hata oluştu.</p>';
        }
    }

    renderCategoriesGrid(categories) {
        if (!categories || categories.length === 0) {
            return '<p class="text-gray-500">Henüz kategori eklenmemiş.</p>';
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${categories.map(category => `
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">${category.name}</h3>
                                <p class="text-sm text-gray-500">${new Date(category.created_at).toLocaleDateString('tr-TR')} tarihinde oluşturuldu</p>
                            </div>
                            <div class="p-2 bg-purple-100 rounded-lg">
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="mt-4 flex space-x-2">
                            <button onclick="adminPanel.editCategory('${category.id}')" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                Düzenle
                            </button>
                            <button onclick="adminPanel.deleteCategory('${category.id}')" class="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                Sil
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupVideoActions() {
        // Video actions will be handled by onclick attributes
    }

    setupChannelActions() {
        // Channel actions will be handled by onclick attributes
    }

    setupCategoryActions() {
        // Category actions will be handled by onclick attributes
    }

    async showVideoForm(videoId = null) {
        const isEdit = videoId !== null;
        let videoData = null;
        
        if (isEdit) {
            try {
                const response = await fetch(`${this.apiBase}/videos`, {
                    headers: this.getAuthHeaders()
                });
                const result = await response.json();
                videoData = result.data?.find(v => v.id === videoId);
            } catch (error) {
                alert('Video bilgileri yüklenirken hata oluştu!');
                return;
            }
        }

        const [channelsRes, categoriesRes] = await Promise.all([
            fetch(`${this.apiBase}/channels`, { headers: this.getAuthHeaders() }),
            fetch(`${this.apiBase}/categories`, { headers: this.getAuthHeaders() })
        ]);
        
        const channels = await channelsRes.json();
        const categories = await categoriesRes.json();

        this.showModal(`
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 class="text-lg font-semibold mb-4">${isEdit ? 'Video Düzenle' : 'Yeni Video Ekle'}</h3>
                <form id="videoForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                        <input type="text" id="videoTitle" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value="${videoData?.title || ''}" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea id="videoDescription" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">${videoData?.description || ''}</textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kanal</label>
                            <select id="videoChannel" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Kanal Seçin</option>
                                ${channels.data?.map(channel => `
                                    <option value="${channel.id}" ${videoData?.channel_id === channel.id ? 'selected' : ''}>${channel.name}</option>
                                `).join('') || ''}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                            <select id="videoCategory" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Kategori Seçin</option>
                                ${categories.data?.map(category => `
                                    <option value="${category.id}" ${videoData?.category_id === category.id ? 'selected' : ''}>${category.name}</option>
                                `).join('') || ''}
                            </select>
                        </div>
                    </div>
                    
                    ${!isEdit ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Video Dosyası</label>
                        <input type="file" id="videoFile" accept="video/*" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                        <input type="file" id="videoThumbnail" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    ` : ''}
                    
                    <div class="flex items-center">
                        <input type="checkbox" id="videoFeatured" class="mr-2" ${videoData?.is_featured ? 'checked' : ''}>
                        <label for="videoFeatured" class="text-sm text-gray-700">Öne Çıkan Video</label>
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
                            ${isEdit ? 'Güncelle' : 'Ekle'}
                        </button>
                        <button type="button" onclick="adminPanel.closeModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                            İptal
                        </button>
                    </div>
                </form>
            </div>
        `);
        
        document.getElementById('videoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveVideo(videoId);
        });
    }

    async showChannelForm(channelId = null) {
        const isEdit = channelId !== null;
        let channelData = null;
        
        if (isEdit) {
            try {
                const response = await fetch(`${this.apiBase}/channels`, {
                    headers: this.getAuthHeaders()
                });
                const result = await response.json();
                channelData = result.data?.find(c => c.id === channelId);
            } catch (error) {
                alert('Kanal bilgileri yüklenirken hata oluştu!');
                return;
            }
        }

        this.showModal(`
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-semibold mb-4">${isEdit ? 'Kanal Düzenle' : 'Yeni Kanal Ekle'}</h3>
                <form id="channelForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kanal Adı</label>
                        <input type="text" id="channelName" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value="${channelData?.name || ''}" required>
                    </div>
                    
                    ${!isEdit ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kanal Resmi</label>
                        <input type="file" id="channelImage" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    ` : ''}
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors">
                            ${isEdit ? 'Güncelle' : 'Ekle'}
                        </button>
                        <button type="button" onclick="adminPanel.closeModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                            İptal
                        </button>
                    </div>
                </form>
            </div>
        `);
        
        document.getElementById('channelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveChannel(channelId);
        });
    }

    async showCategoryForm(categoryId = null) {
        const isEdit = categoryId !== null;
        let categoryData = null;
        
        if (isEdit) {
            try {
                const response = await fetch(`${this.apiBase}/categories`, {
                    headers: this.getAuthHeaders()
                });
                const result = await response.json();
                categoryData = result.data?.find(c => c.id === categoryId);
            } catch (error) {
                alert('Kategori bilgileri yüklenirken hata oluştu!');
                return;
            }
        }

        this.showModal(`
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-semibold mb-4">${isEdit ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</h3>
                <form id="categoryForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kategori Adı</label>
                        <input type="text" id="categoryName" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value="${categoryData?.name || ''}" required>
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors">
                            ${isEdit ? 'Güncelle' : 'Ekle'}
                        </button>
                        <button type="button" onclick="adminPanel.closeModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                            İptal
                        </button>
                    </div>
                </form>
            </div>
        `);
        
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory(categoryId);
        });
    }

    async editVideo(videoId) {
        this.showVideoForm(videoId);
    }

    async deleteVideo(videoId) {
        if (!confirm('Bu videoyu silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/admin/videos/${videoId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            const result = await response.json();
            if (result.success) {
                alert('Video başarıyla silindi!');
                this.loadVideos();
                this.loadDashboardData();
            } else {
                alert('Video silinirken hata oluştu: ' + result.message);
            }
        } catch (error) {
            alert('Video silinirken hata oluştu!');
        }
    }

    async editChannel(channelId) {
        this.showChannelForm(channelId);
    }

    async deleteChannel(channelId) {
        if (!confirm('Bu kanalı silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/admin/channels/${channelId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            const result = await response.json();
            if (result.success) {
                alert('Kanal başarıyla silindi!');
                this.loadChannels();
                this.loadDashboardData();
            } else {
                alert('Kanal silinirken hata oluştu: ' + result.message);
            }
        } catch (error) {
            alert('Kanal silinirken hata oluştu!');
        }
    }

    async editCategory(categoryId) {
        this.showCategoryForm(categoryId);
    }

    async deleteCategory(categoryId) {
        if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/admin/categories/${categoryId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            const result = await response.json();
            if (result.success) {
                alert('Kategori başarıyla silindi!');
                this.loadCategories();
                this.loadDashboardData();
            } else {
                alert('Kategori silinirken hata oluştu: ' + result.message);
            }
        } catch (error) {
            alert('Kategori silinirken hata oluştu!');
        }
    }

    showModal(content) {
        const modal = document.createElement('div');
        modal.id = 'adminModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = content;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        document.body.appendChild(modal);
    }

    closeModal() {
        const modal = document.getElementById('adminModal');
        if (modal) {
            modal.remove();
        }
    }

    async saveVideo(videoId = null) {
        const isEdit = videoId !== null;
        const title = document.getElementById('videoTitle').value;
        const description = document.getElementById('videoDescription').value;
        const channelId = document.getElementById('videoChannel').value;
        const categoryId = document.getElementById('videoCategory').value;
        const isFeatured = document.getElementById('videoFeatured').checked;
        
        if (!title || !channelId || !categoryId) {
            alert('Lütfen tüm gerekli alanları doldurun!');
            return;
        }

        try {
            if (isEdit) {
                const response = await fetch(`${this.apiBase}/admin/videos/${videoId}`, {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        title,
                        description,
                        channel_id: channelId,
                        category_id: categoryId,
                        is_featured: isFeatured
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Video başarıyla güncellendi!');
                    this.closeModal();
                    this.loadVideos();
                    this.loadDashboardData();
                } else {
                    alert('Video güncellenirken hata oluştu: ' + result.message);
                }
            } else {
                const videoFile = document.getElementById('videoFile').files[0];
                const thumbnailFile = document.getElementById('videoThumbnail').files[0];
                
                if (!videoFile) {
                    alert('Lütfen video dosyası seçin!');
                    return;
                }

                let videoFileName = null;
                let thumbnailFileName = null;

                const uploadFormData = new FormData();
                uploadFormData.append('video', videoFile);
                
                const videoUploadResponse = await fetch(`${this.apiBase}/admin/upload/video`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: uploadFormData
                });
                
                const videoUploadResult = await videoUploadResponse.json();
                if (!videoUploadResult.success) {
                    alert('Video yüklenirken hata oluştu: ' + videoUploadResult.message);
                    return;
                }
                
                // Backend returns file_path like "videos/uuid.mp4", we need just the filename
                videoFileName = videoUploadResult.data.file_path ? videoUploadResult.data.file_path.split('/').pop() : '';

                if (thumbnailFile) {
                    const thumbnailFormData = new FormData();
                    thumbnailFormData.append('thumbnail', thumbnailFile);
                    
                    const thumbnailUploadResponse = await fetch(`${this.apiBase}/admin/upload/thumbnail`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.token}`
                        },
                        body: thumbnailFormData
                    });
                    
                    const thumbnailUploadResult = await thumbnailUploadResponse.json();
                    if (thumbnailUploadResult.success) {
                        // Backend returns file_path like "thumbnails/uuid.jpg", we need just the filename
                        thumbnailFileName = thumbnailUploadResult.data.file_path ? thumbnailUploadResult.data.file_path.split('/').pop() : '';
                    }
                }

                const createResponse = await fetch(`${this.apiBase}/admin/videos`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        title,
                        description,
                        channel_id: channelId,
                        category_id: categoryId,
                        is_featured: isFeatured,
                        video_file: videoFileName,
                        thumbnail: thumbnailFileName
                    })
                });
                
                const result = await createResponse.json();
                if (result.success) {
                    alert('Video başarıyla eklendi!');
                    this.closeModal();
                    this.loadVideos();
                    this.loadDashboardData();
                } else {
                    alert('Video eklenirken hata oluştu: ' + result.message);
                }
            }
        } catch (error) {
            console.error('Video kaydetme hatası:', error);
            alert('Video kaydedilirken hata oluştu!');
        }
    }

    async saveChannel(channelId = null) {
        const isEdit = channelId !== null;
        const name = document.getElementById('channelName').value;
        
        if (!name) {
            alert('Lütfen kanal adını girin!');
            return;
        }

        try {
            if (isEdit) {
                const response = await fetch(`${this.apiBase}/admin/channels/${channelId}`, {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({ name })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Kanal başarıyla güncellendi!');
                    this.closeModal();
                    this.loadChannels();
                    this.loadDashboardData();
                } else {
                    alert('Kanal güncellenirken hata oluştu: ' + result.message);
                }
            } else {
                const imageFile = document.getElementById('channelImage').files[0];
                let imageFileName = null;

                if (imageFile) {
                    const formData = new FormData();
                    formData.append('image', imageFile);
                    
                    const uploadResponse = await fetch(`${this.apiBase}/admin/upload/channel-image`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.token}`
                        },
                        body: formData
                    });
                    
                    const uploadResult = await uploadResponse.json();
                    if (uploadResult.success) {
                        // Backend returns file_path like "channels/uuid.jpg", we need just the filename
                        imageFileName = uploadResult.data.file_path ? uploadResult.data.file_path.split('/').pop() : '';
                    } else {
                        alert('Resim yüklenirken hata oluştu: ' + uploadResult.message);
                        return;
                    }
                }

                const response = await fetch(`${this.apiBase}/admin/channels`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        name,
                        image: imageFileName
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Kanal başarıyla eklendi!');
                    this.closeModal();
                    this.loadChannels();
                    this.loadDashboardData();
                } else {
                    alert('Kanal eklenirken hata oluştu: ' + result.message);
                }
            }
        } catch (error) {
            console.error('Kanal kaydetme hatası:', error);
            alert('Kanal kaydedilirken hata oluştu!');
        }
    }

    async saveCategory(categoryId = null) {
        const isEdit = categoryId !== null;
        const name = document.getElementById('categoryName').value;
        
        if (!name) {
            alert('Lütfen kategori adını girin!');
            return;
        }

        try {
            if (isEdit) {
                const response = await fetch(`${this.apiBase}/admin/categories/${categoryId}`, {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({ name })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Kategori başarıyla güncellendi!');
                    this.closeModal();
                    this.loadCategories();
                    this.loadDashboardData();
                } else {
                    alert('Kategori güncellenirken hata oluştu: ' + result.message);
                }
            } else {
                const response = await fetch(`${this.apiBase}/admin/categories`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({ name })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Kategori başarıyla eklendi!');
                    this.closeModal();
                    this.loadCategories();
                    this.loadDashboardData();
                } else {
                    alert('Kategori eklenirken hata oluştu: ' + result.message);
                }
            }
        } catch (error) {
            console.error('Kategori kaydetme hatası:', error);
            alert('Kategori kaydedilirken hata oluştu!');
        }
    }

    async loadDisks() {
        const content = document.getElementById('disksContent');
        content.innerHTML = 'Yükleniyor...';

        try {
            const response = await fetch(`${this.apiBase}/admin/disks`, {
                headers: this.getAuthHeaders()
            });
            const result = await response.json();

            if (result.success) {
                content.innerHTML = this.renderDisksTable(result.data);
                this.setupDiskActions();
            } else {
                content.innerHTML = '<p class="text-red-500">Diskler yüklenirken hata oluştu.</p>';
            }
        } catch (error) {
            content.innerHTML = '<p class="text-red-500">Diskler yüklenirken hata oluştu.</p>';
        }
    }

    renderDisksTable(disks) {
        if (!disks || disks.length === 0) {
            return '<p class="text-gray-500">Henüz disk eklenmemiş.</p>';
        }

        return `
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disk Adı</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yol</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Alan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanılan Alan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${disks.map(disk => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${disk.name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${disk.path}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatBytes(disk.total_space)}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatBytes(disk.used_space)}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        disk.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }">
                                        ${disk.is_active ? 'Aktif' : 'Pasif'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="adminPanel.editDisk('${disk.id}')" class="text-blue-600 hover:text-blue-900 mr-3">Düzenle</button>
                                    <button onclick="adminPanel.deleteDisk('${disk.id}')" class="text-red-600 hover:text-red-900">Sil</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setupDiskActions() {
        // Disk actions are handled by onclick events in the table
    }

    async scanSystemDisks() {
        try {
            const response = await fetch(`${this.apiBase}/admin/disks/scan`, {
                headers: this.getAuthHeaders()
            });
            const result = await response.json();

            if (result.success) {
                this.showSystemDisksModal(result.data);
            } else {
                alert('Sistem diskleri taranırken hata oluştu: ' + result.message);
            }
        } catch (error) {
            console.error('Sistem disk tarama hatası:', error);
            alert('Sistem diskleri taranırken hata oluştu!');
        }
    }

    showSystemDisksModal(systemDisks) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');

        modalTitle.textContent = 'Sistem Diskleri';
        modalContent.innerHTML = `
            <div class="space-y-4">
                <p class="text-gray-600">Sistemde bulunan diskler:</p>
                <div class="space-y-2">
                    ${systemDisks.map(disk => `
                        <div class="border rounded-lg p-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <h4 class="font-medium">${disk.name}</h4>
                                    <p class="text-sm text-gray-600">${disk.mount_point}</p>
                                    <p class="text-sm text-gray-600">Toplam: ${this.formatBytes(disk.total_space)} | Kullanılabilir: ${this.formatBytes(disk.available_space)}</p>
                                </div>
                                <button onclick="adminPanel.addSystemDisk('${disk.name}', '${disk.mount_point}', ${disk.total_space})" 
                                        class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                                    Ekle
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="flex justify-end space-x-2 pt-4">
                    <button onclick="adminPanel.closeModal()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                        Kapat
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    async addSystemDisk(name, path, totalSpace) {
        try {
            const response = await fetch(`${this.apiBase}/admin/disks`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    name,
                    path,
                    total_space: totalSpace,
                    is_active: true
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Disk başarıyla eklendi!');
                this.closeModal();
                this.loadDisks();
            } else {
                alert('Disk eklenirken hata oluştu: ' + result.message);
            }
        } catch (error) {
            console.error('Disk ekleme hatası:', error);
            alert('Disk eklenirken hata oluştu!');
        }
    }

    showDiskForm(diskId = null) {
        const isEdit = diskId !== null;
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');

        modalTitle.textContent = isEdit ? 'Disk Düzenle' : 'Yeni Disk Ekle';
        modalContent.innerHTML = `
            <form onsubmit="event.preventDefault(); adminPanel.saveDisk(${diskId ? `'${diskId}'` : 'null'});">
                <div class="space-y-4">
                    <div>
                        <label for="diskName" class="block text-sm font-medium text-gray-700">Disk Adı</label>
                        <input type="text" id="diskName" name="diskName" required 
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label for="diskPath" class="block text-sm font-medium text-gray-700">Disk Yolu</label>
                        <input type="text" id="diskPath" name="diskPath" required 
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label for="diskTotalSpace" class="block text-sm font-medium text-gray-700">Toplam Alan (bytes)</label>
                        <input type="number" id="diskTotalSpace" name="diskTotalSpace" required 
                               class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label class="flex items-center">
                            <input type="checkbox" id="diskIsActive" name="diskIsActive" checked 
                                   class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                            <span class="ml-2 text-sm text-gray-700">Aktif</span>
                        </label>
                    </div>
                </div>
                <div class="flex justify-end space-x-2 pt-6">
                    <button type="button" onclick="adminPanel.closeModal()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                        İptal
                    </button>
                    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        ${isEdit ? 'Güncelle' : 'Ekle'}
                    </button>
                </div>
            </form>
        `;

        modal.classList.remove('hidden');

        if (isEdit) {
            this.loadDiskForEdit(diskId);
        }
    }

    async loadDiskForEdit(diskId) {
        try {
            const response = await fetch(`${this.apiBase}/admin/disks`, {
                headers: this.getAuthHeaders()
            });
            const result = await response.json();

            if (result.success) {
                const disk = result.data.find(d => d.id === diskId);
                if (disk) {
                    document.getElementById('diskName').value = disk.name;
                    document.getElementById('diskPath').value = disk.path;
                    document.getElementById('diskTotalSpace').value = disk.total_space;
                    document.getElementById('diskIsActive').checked = disk.is_active;
                }
            }
        } catch (error) {
            console.error('Disk bilgileri yüklenirken hata:', error);
        }
    }

    async saveDisk(diskId = null) {
        const isEdit = diskId !== null;
        const name = document.getElementById('diskName').value;
        const path = document.getElementById('diskPath').value;
        const totalSpace = parseInt(document.getElementById('diskTotalSpace').value);
        const isActive = document.getElementById('diskIsActive').checked;

        if (!name || !path || !totalSpace) {
            alert('Lütfen tüm alanları doldurun!');
            return;
        }

        try {
            const url = isEdit ? `${this.apiBase}/admin/disks/${diskId}` : `${this.apiBase}/admin/disks`;
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    name,
                    path,
                    total_space: totalSpace,
                    is_active: isActive
                })
            });

            const result = await response.json();
            if (result.success) {
                alert(`Disk başarıyla ${isEdit ? 'güncellendi' : 'eklendi'}!`);
                this.closeModal();
                this.loadDisks();
            } else {
                alert(`Disk ${isEdit ? 'güncellenirken' : 'eklenirken'} hata oluştu: ` + result.message);
            }
        } catch (error) {
            console.error('Disk kaydetme hatası:', error);
            alert('Disk kaydedilirken hata oluştu!');
        }
    }

    async editDisk(diskId) {
        this.showDiskForm(diskId);
    }

    async deleteDisk(diskId) {
        if (!confirm('Bu diski silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/admin/disks/${diskId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            const result = await response.json();
            if (result.success) {
                alert('Disk başarıyla silindi!');
                this.loadDisks();
            } else {
                alert('Disk silinirken hata oluştu: ' + result.message);
            }
        } catch (error) {
            console.error('Disk silme hatası:', error);
            alert('Disk silinirken hata oluştu!');
        }
    }

    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('token_expiry');
        window.location.href = '/admin/login';
    }
}

// Initialize admin panel when DOM is loaded
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});