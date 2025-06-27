import {
  AlertCircle,
  Download,
  Eye,
  File,
  FileAudio,
  FileText,
  FileVideo,
  Image,
  Trash2,
  Upload,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  uploadedFiles?: UploadedFile[];
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  bucket?: string;
  folder?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  uploadedFiles = [],
  maxFiles = 10,
  maxFileSize = 10, // 10MB default
  allowedTypes = [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  bucket = 'investment-documents',
  folder = 'supporting-docs',
  disabled = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5" />;
    if (type.includes('word')) return <FileText className="w-5 h-5" />;
    if (type.startsWith('video/')) return <FileVideo className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <FileAudio className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const isValidType = allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File type ${file.type} is not allowed`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      id: data.path,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
      status: 'success',
    };
  };

  const handleFiles = async (files: FileList) => {
    if (uploadedFiles.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);

      if (validationError) {
        newFiles.push({
          id: `error-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: '',
          uploadedAt: new Date().toISOString(),
          status: 'error',
          error: validationError,
        });
        continue;
      }

      // Add uploading file
      const uploadingFile: UploadedFile = {
        id: `uploading-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: '',
        uploadedAt: new Date().toISOString(),
        status: 'uploading',
      };

      newFiles.push(uploadingFile);
      onFilesChange([...uploadedFiles, ...newFiles]);

      try {
        const uploadedFile = await uploadFile(file);
        // Replace uploading file with uploaded file
        const updatedFiles = [...uploadedFiles, ...newFiles];
        const fileIndex = updatedFiles.findIndex(
          (f) => f.id === uploadingFile.id,
        );
        if (fileIndex !== -1) {
          updatedFiles[fileIndex] = uploadedFile;
          onFilesChange(updatedFiles);
        }
      } catch (error) {
        // Update file with error
        const updatedFiles = [...uploadedFiles, ...newFiles];
        const fileIndex = updatedFiles.findIndex(
          (f) => f.id === uploadingFile.id,
        );
        if (fileIndex !== -1) {
          updatedFiles[fileIndex] = {
            ...uploadingFile,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          };
          onFilesChange(updatedFiles);
        }
      }
    }

    setUploading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      // Remove from storage if it's a real file
      if (!fileId.startsWith('error-') && !fileId.startsWith('uploading-')) {
        await supabase.storage.from(bucket).remove([fileId]);
      }

      const updatedFiles = uploadedFiles.filter((f) => f.id !== fileId);
      onFilesChange(updatedFiles);
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const openFile = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept={allowedTypes.join(',')}
          disabled={disabled}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
              <Upload className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop files here' : 'Upload supporting documents'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop files here, or click to browse
            </p>
          </div>

          <div className="text-xs text-gray-400">
            <p>
              Maximum {maxFiles} files, {maxFileSize}MB each
            </p>
            <p>Supported: PDF, Word, Images, Text files</p>
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Uploading files...</p>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </h4>

          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border">
                    {file.status === 'uploading' ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    ) : file.status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    {file.error && (
                      <p className="text-xs text-red-600">{file.error}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {file.status === 'success' && file.url && (
                    <>
                      <button
                        onClick={() => openFile(file.url)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View file"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={file.url}
                        download={file.name}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </>
                  )}

                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove file"
                    disabled={file.status === 'uploading'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
