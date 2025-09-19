import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileUploaded?: (url: string, fileName: string, fileSize: number) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  bucket?: string;
  folder?: string;
}

export function FileUpload({ 
  onFileUploaded, 
  accept = { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] },
  maxSize = 10 * 1024 * 1024, // 10MB
  bucket = 'contracts',
  folder = 'documents'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    url: string;
  } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const uploadedFileData = {
        name: file.name,
        size: file.size,
        url: data.publicUrl
      };

      setUploadedFile(uploadedFileData);
      onFileUploaded?.(data.publicUrl, file.name, file.size);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  }, [onFileUploaded, bucket, folder]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false
  });

  const removeFile = () => {
    setUploadedFile(null);
    onFileUploaded?.('', '', 0);
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
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          
          {uploading ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Uploading...</div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse w-1/2"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {isDragActive 
                  ? 'Drop the file here...' 
                  : 'Drag & drop a file here, or click to select'
                }
              </div>
              <div className="text-xs text-muted-foreground">
                PDF, DOC, DOCX up to {formatFileSize(maxSize)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-medium">{uploadedFile.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(uploadedFile.size)}
              </div>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="p-1 hover:bg-background rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-destructive">
                  {file.name} - {formatFileSize(file.size)}
                </div>
                <ul className="mt-1 text-xs text-muted-foreground">
                  {errors.map(error => (
                    <li key={error.code}>
                      {error.code === 'file-too-large' 
                        ? `File is too large. Max size is ${formatFileSize(maxSize)}`
                        : error.message
                      }
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}