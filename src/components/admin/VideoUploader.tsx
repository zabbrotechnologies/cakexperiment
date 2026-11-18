import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, Trash2, Film, FileVideo, X } from 'lucide-react';

interface VideoUploaderProps {
  lessonId: string;
  courseId?: string;
  moduleId?: string;
  currentVideoReference?: string;
  onVideoUploaded: (streamUrl: string, filename: string, sizeBytes: number) => void;
  onVideoRemoved: () => void;
  disabled?: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  lessonId,
  courseId,
  moduleId,
  currentVideoReference,
  onVideoUploaded,
  onVideoRemoved,
  disabled
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [bytesUploaded, setBytesUploaded] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasExistingVideo = Boolean(
    currentVideoReference &&
    currentVideoReference.trim().length > 0 &&
    !currentVideoReference.includes('BigBuckBunny.mp4')
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    const validExtensions = ['mp4', 'webm', 'mov', 'mkv', 'ogg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      return 'Invalid video format. Supported formats: MP4, WebM, MOV, MKV.';
    }
    // Limit to 15 GB
    if (file.size > 15 * 1024 * 1024 * 1024) {
      return 'File size exceeds 15 GB maximum storage limit.';
    }
    return null;
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
    if (disabled || uploadStatus === 'uploading') return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setErrorMessage(null);
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setSelectedFile(file);
    startUpload(file);
  };

  const startUpload = async (file: File) => {
    setUploadStatus('uploading');
    setProgressPercent(0);
    setBytesUploaded(0);
    setErrorMessage(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 1. Initiate Resumable Upload Session with Backend
      const initRes = await fetch('/api/admin/videos/initiate-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: abortController.signal,
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type || 'video/mp4',
          lessonId,
          courseId,
          moduleId
        })
      });

      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => ({}));
        throw new Error(errData.error || `Initialization failed (${initRes.status})`);
      }

      const { uploadSessionId, chunkSizeRecommended } = await initRes.json();
      const chunkSize = chunkSizeRecommended || 2 * 1024 * 1024; // 2 MB
      const totalSize = file.size;
      let offset = 0;

      // 2. Upload Chunks Sequentially
      while (offset < totalSize) {
        if (abortController.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const end = Math.min(offset + chunkSize, totalSize);
        const chunk = file.slice(offset, end);

        let attempt = 0;
        let success = false;
        let lastErr: any = null;

        while (attempt < 3 && !success) {
          try {
            const chunkUrl = `/api/admin/videos/upload-chunk?sessionId=${encodeURIComponent(uploadSessionId)}&start=${offset}&end=${end - 1}&total=${totalSize}`;
            const chunkRes = await fetch(chunkUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/octet-stream' },
              credentials: 'include',
              signal: abortController.signal,
              body: chunk
            });

            if (!chunkRes.ok) {
              const errJson = await chunkRes.json().catch(() => ({}));
              throw new Error(errJson.error || `Chunk upload failed (${chunkRes.status})`);
            }

            const chunkData = await chunkRes.json();

            if (chunkData.status === 'complete') {
              setProgressPercent(100);
              setBytesUploaded(totalSize);
              setUploadStatus('success');
              onVideoUploaded(chunkData.videoReference, file.name, totalSize);
              return;
            }

            success = true;
            offset = end;
            setBytesUploaded(offset);
            setProgressPercent(Math.round((offset / totalSize) * 100));
          } catch (err: any) {
            attempt++;
            lastErr = err;
            if (attempt < 3) {
              // Wait 1 second before retry
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        }

        if (!success) {
          throw lastErr || new Error('Upload interrupted after 3 failed chunk attempts.');
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Video upload error:', err);
      setUploadStatus('error');
      setErrorMessage(err.message || 'An error occurred during video upload. Please retry.');
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploadStatus('idle');
    setSelectedFile(null);
    setProgressPercent(0);
    setBytesUploaded(0);
  };

  const handleDeleteExistingVideo = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/videos/${encodeURIComponent(lessonId)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to remove video');
      }
      onVideoRemoved();
      setShowConfirmDelete(false);
      setSelectedFile(null);
      setUploadStatus('idle');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not delete video reference.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      
      {/* Existing Video Indicator */}
      {hasExistingVideo && uploadStatus !== 'uploading' && (
        <div
          style={{
            backgroundColor: '#FCFAF9',
            border: '1.5px solid var(--border-subtle, #EFE8E2)',
            borderRadius: '10px',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '200px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 58, 74, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-berry, #8B3A4A)'
              }}
            >
              <FileVideo size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum, #3A2329)' }}>
                Google Drive Video Attached
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #7A6B68)', fontFamily: 'monospace' }}>
                {currentVideoReference}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', height: 'auto' }}
              disabled={disabled}
            >
              Replace Video
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              style={{
                background: 'none',
                border: '1px solid #FFCDD2',
                backgroundColor: '#FFF5F5',
                color: '#C62828',
                borderRadius: '6px',
                padding: '0.45rem 0.65rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                transition: 'all 0.2s ease'
              }}
              disabled={disabled}
            >
              <Trash2 size={14} />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Box (Hidden if already has video unless clicked Replace or no video configured) */}
      {(!hasExistingVideo || uploadStatus === 'uploading' || selectedFile) && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            if (uploadStatus !== 'uploading' && !disabled) {
              fileInputRef.current?.click();
            }
          }}
          style={{
            border: `2px dashed ${dragActive ? 'var(--color-berry, #8B3A4A)' : uploadStatus === 'error' ? '#EF5350' : '#D6C7C2'}`,
            borderRadius: '12px',
            padding: '1.75rem 1.5rem',
            textAlign: 'center',
            backgroundColor: dragActive ? 'rgba(139, 58, 74, 0.04)' : uploadStatus === 'error' ? '#FFEBEE' : '#FCFAF9',
            cursor: uploadStatus === 'uploading' || disabled ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={disabled || uploadStatus === 'uploading'}
          />

          {/* Idle State */}
          {uploadStatus === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(139, 58, 74, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-berry, #8B3A4A)'
                }}
              >
                <UploadCloud size={24} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-plum, #3A2329)' }}>
                Drag & drop lesson video here, or <span style={{ color: 'var(--color-berry, #8B3A4A)', textDecoration: 'underline' }}>browse</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #7A6B68)' }}>
                Supports MP4, WebM, MOV, MKV up to 15 GB • Uploads directly to private Google Drive storage
              </div>
            </div>
          )}

          {/* Uploading State with Live Progress Bar */}
          {uploadStatus === 'uploading' && selectedFile && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '420px', margin: '0 auto' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left', overflow: 'hidden' }}>
                  <Film size={18} color="var(--color-berry, #8B3A4A)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-plum)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Cancel upload"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Progress Bar Container */}
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E0D6D2', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-berry, #8B3A4A)',
                    transition: 'width 0.25s ease-out'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span>{progressPercent}% uploaded ({formatFileSize(bytesUploaded)} of {formatFileSize(selectedFile.size)})</span>
                <span>Streaming chunks to Google Drive...</span>
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadStatus === 'success' && selectedFile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={32} color="#2E7D32" />
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#2E7D32' }}>
                Upload Complete & Verified
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {selectedFile.name} ({formatFileSize(selectedFile.size)}) successfully saved in Google Drive.
              </div>
            </div>
          )}

          {/* Error State */}
          {uploadStatus === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }} onClick={e => e.stopPropagation()}>
              <AlertCircle size={32} color="#C62828" />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#C62828' }}>
                {errorMessage || 'Video upload failed'}
              </div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => startUpload(selectedFile)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <RefreshCw size={14} />
                  <span>Retry Upload</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1rem'
          }}
          onClick={() => setShowConfirmDelete(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: 'var(--color-plum)' }}>
              Remove Lesson Video?
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.25rem' }}>
              Are you sure you want to remove the Google Drive video reference for this lesson? The video file will be detached from student playback.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExistingVideo}
                className="btn btn-primary"
                style={{ backgroundColor: '#C62828', borderColor: '#C62828' }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
