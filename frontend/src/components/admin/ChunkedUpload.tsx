import React, { useState, useRef } from 'react';
import { getApiUrl } from '../../config/env';
import { 
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ChunkedUploadProps {
  token: string;
  uploadType: 'video' | 'thumbnail' | 'channel-image';
  onUploadComplete: (filename: string, response?: any) => void;
  onUploadError: (error: string) => void;
  maxFileSize: number;
  acceptedTypes: string;
  chunkSize?: number;
}

interface UploadProgress {
  uploadId: string;
  totalChunks: number;
  uploadedChunks: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
}

const ChunkedUpload: React.FC<ChunkedUploadProps> = ({
  token,
  uploadType,
  onUploadComplete,
  onUploadError,
  maxFileSize,
  acceptedTypes,
  chunkSize = 1024 * 1024 // 1MB default chunk size
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateUploadId = () => {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > maxFileSize) {
      onUploadError(`Dosya boyutu ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB'dan büyük olamaz`);
      return;
    }

    setFile(selectedFile);
    setProgress(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const uploadChunk = async (
    chunk: Blob, 
    chunkIndex: number, 
    totalChunks: number, 
    uploadId: string,
    filename: string,
    totalSize: number
  ) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    
    const metadata = {
      chunk_number: chunkIndex + 1,
      total_chunks: totalChunks,
      chunk_size: chunk.size,
      total_size: totalSize,
      file_name: filename,
      upload_id: uploadId
    };
    
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(getApiUrl(`/admin/upload/${uploadType}/chunk`), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
      signal: abortControllerRef.current?.signal
    });

    if (!response.ok) {
      throw new Error(`Chunk ${chunkIndex} upload failed`);
    }

    return await response.json();
  };

  const startUpload = async () => {
    if (!file) return;

    const uploadId = generateUploadId();
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    abortControllerRef.current = new AbortController();
    
    setProgress({
      uploadId,
      totalChunks,
      uploadedChunks: 0,
      progress: 0,
      status: 'uploading'
    });

    try {
      for (let i = 0; i < totalChunks; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const result = await uploadChunk(
          chunk, 
          i, 
          totalChunks, 
          uploadId, 
          file.name, 
          file.size
        );

        const uploadedChunks = i + 1;
        const progressPercent = Math.round((uploadedChunks / totalChunks) * 100);

        setProgress(prev => prev ? {
          ...prev,
          uploadedChunks,
          progress: progressPercent
        } : null);

        if (result.success && result.data?.completed) {
          setProgress(prev => prev ? {
            ...prev,
            status: 'completed'
          } : null);
          // Backend returns file_path like "channels/uuid.jpg", we need just the filename
          const filename = result.data.file_path ? result.data.file_path.split('/').pop() : '';
          onUploadComplete(filename, result.data);
          return;
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Upload cancelled') {
        setProgress(prev => prev ? {
          ...prev,
          status: 'cancelled'
        } : null);
        
        // Cancel upload on server
        try {
          await fetch(getApiUrl('/admin/upload/cancel'), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ upload_id: uploadId })
          });
        } catch (cancelError) {
          console.error('Error cancelling upload:', cancelError);
        }
      } else {
        setProgress(prev => prev ? {
          ...prev,
          status: 'error'
        } : null);
        onUploadError(error.message || 'Upload failed');
      }
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {!file && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900">
              Dosya yüklemek için sürükleyin veya tıklayın
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Maksimum dosya boyutu: {formatFileSize(maxFileSize)}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dosya Seç
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>
      )}

      {file && !progress && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CloudArrowUpIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={startUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Yükle
              </button>
              <button
                onClick={resetUpload}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {progress && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {progress.status === 'completed' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : progress.status === 'error' ? (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                ) : (
                  <CloudArrowUpIcon className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{file?.name}</p>
                <p className="text-sm text-gray-500">
                  {progress.uploadedChunks} / {progress.totalChunks} chunk
                </p>
              </div>
            </div>
            {progress.status === 'uploading' && (
              <button
                onClick={cancelUpload}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
              >
                İptal
              </button>
            )}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progress.status === 'completed' ? 'bg-green-600' :
                progress.status === 'error' ? 'bg-red-600' :
                progress.status === 'cancelled' ? 'bg-gray-400' :
                'bg-blue-600'
              }`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{progress.progress}%</span>
            <span>
              {progress.status === 'completed' && 'Tamamlandı'}
              {progress.status === 'error' && 'Hata oluştu'}
              {progress.status === 'cancelled' && 'İptal edildi'}
              {progress.status === 'uploading' && 'Yükleniyor...'}
            </span>
          </div>
          
          {(progress.status === 'completed' || progress.status === 'error' || progress.status === 'cancelled') && (
            <button
              onClick={resetUpload}
              className="mt-3 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Yeni Dosya Seç
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChunkedUpload;