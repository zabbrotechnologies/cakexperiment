import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, Trash2, Film, X, Play, ChevronDown, Check } from 'lucide-react';

interface LessonVideoUploadButtonProps {
  lessonId: string;
  lessonTitle: string;
  currentVideoReference?: string;
  driveFileId?: string;
  videoFilename?: string;
  videoSize?: number;
  courseId?: string;
  moduleId?: string;
  onVideoUploaded: (streamUrl: string, driveFileId: string, filename: string, sizeBytes: number) => void;
  onVideoRemoved: () => void;
  disabled?: boolean;
}

export const LessonVideoUploadButton: React.FC<LessonVideoUploadButtonProps> = ({
  lessonId,
  lessonTitle,
  currentVideoReference,
  driveFileId,
  videoFilename,
  videoSize,
  courseId,
  moduleId,
  onVideoUploaded,
  onVideoRemoved,
  disabled
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const [currentChunk, setCurrentChunk] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Consider video attached if a reference or driveFileId exists (and is not empty / sample fallback)
  const hasExistingVideo = Boolean(
    (currentVideoReference && currentVideoReference.trim().length > 0 && !currentVideoReference.includes('BigBuckBunny.mp4')) ||
    (driveFileId && driveFileId.trim().length > 0)
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    const validExtensions = ['mp4', 'webm', 'mov', 'mkv', 'ogg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      return 'Invalid video format. Allowed formats: MP4, WebM, MOV, MKV.';
    }
    // Limit to 15 GB
    if (file.size > 15 * 1024 * 1024 * 1024) {
      return 'Video size exceeds 15 GB maximum limit.';
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Reset input so same file can be re-selected if needed
      e.target.value = '';
      startUploadFlow(file);
    }
  };

  const startUploadFlow = async (file: File) => {
    setErrorMessage(null);
    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setSelectedFile(file);
    setUploadModalOpen(true);
    setUploadStatus('uploading');
    setProgressPercent(0);
    setUploadedBytes(0);

    const chunkSize = 2 * 1024 * 1024; // 2 MB chunks (safe for Vercel 4.5 MB payload limit)
    const chunks = Math.ceil(file.size / chunkSize);
    setTotalChunks(chunks);
    setCurrentChunk(0);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const token = localStorage.getItem('cakexperiment_auth_token');
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      // Step 1: Initiate resumable upload session
      const initRes = await fetch('/api/admin/videos/initiate-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type || 'video/mp4',
          lessonId,
          courseId: courseId || 'temp',
          moduleId: moduleId || 'temp'
        }),
        signal: abortController.signal
      });

      if (!initRes.ok) {
        const errorData = await initRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload session initiation failed (${initRes.status})`);
      }

      const { uploadSessionId } = await initRes.json();
      if (!uploadSessionId) {
        throw new Error('Server did not return an upload session token.');
      }

      // Step 2: Upload in 2 MB slices
      let uploaded = 0;
      let finalStreamUrl = '';
      let finalDriveFileId = '';

      for (let i = 0; i < chunks; i++) {
        if (abortController.signal.aborted) {
          throw new Error('Upload cancelled by user.');
        }

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        setCurrentChunk(i + 1);

        const chunkRes = await fetch(
          `/api/admin/videos/upload-chunk?sessionId=${encodeURIComponent(uploadSessionId)}&start=${start}&end=${end}&total=${file.size}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              ...authHeaders
            },
            body: chunkBlob,
            signal: abortController.signal
          }
        );

        if (!chunkRes.ok) {
          const chunkErr = await chunkRes.json().catch(() => ({}));
          throw new Error(chunkErr.error || `Chunk ${i + 1}/${chunks} upload failed.`);
        }

        uploaded = end;
        setUploadedBytes(uploaded);
        setProgressPercent(Math.round((uploaded / file.size) * 100));

        const chunkResult = await chunkRes.json();
        if (chunkResult.success && chunkResult.streamUrl) {
          finalStreamUrl = chunkResult.streamUrl;
          finalDriveFileId = chunkResult.driveFileId || '';
        }
      }

      const streamUrl = finalStreamUrl || `/api/videos/stream/${lessonId}`;
      setUploadStatus('success');
      setProgressPercent(100);

      // Associate with lesson state
      onVideoUploaded(streamUrl, finalDriveFileId, file.name, file.size);

      // Automatically close modal after brief checkmark
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadStatus('idle');
        setSelectedFile(null);
      }, 1500);

    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
        setUploadStatus('idle');
        setUploadModalOpen(false);
      } else {
        console.error('Video upload error:', err);
        setUploadStatus('error');
        setErrorMessage(err.message || 'Video upload failed. Please ensure Google Drive is authorized.');
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploadModalOpen(false);
    setUploadStatus('idle');
    setSelectedFile(null);
  };

  const handleTriggerUpload = () => {
    setShowMenu(false);
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setShowMenu(false);
    if (confirm(`Remove the attached video from "${lessonTitle}"?`)) {
      onVideoRemoved();
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} ref={menuRef}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled || uploadStatus === 'uploading'}
      />

      {/* Upload Video Button */}
      {hasExistingVideo ? (
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          disabled={disabled}
          title={videoFilename ? `Video: ${videoFilename}` : 'Google Drive Video attached'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.28rem 0.6rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            backgroundColor: '#E8F5E9',
            color: '#2E7D32',
            border: '1px solid #C8E6C9',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <CheckCircle2 size={13} color="#2E7D32" />
          <span>Video Ready</span>
          <ChevronDown size={11} color="#2E7D32" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleTriggerUpload}
          disabled={disabled}
          title="Upload video from PC to Google Drive"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.28rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            color: 'var(--color-berry)',
            border: '1px solid rgba(139, 58, 74, 0.3)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <UploadCloud size={13} />
          <span>Upload Video</span>
        </button>
      )}

      {/* Dropdown Menu for Attached Video */}
      {showMenu && hasExistingVideo && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 100,
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid var(--border-subtle)',
            minWidth: '220px',
            padding: '0.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem'
          }}
        >
          <div style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #F0EAE8', marginBottom: '0.2rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Lesson Video
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-plum)', wordBreak: 'break-all' }}>
              {videoFilename || `Lesson ${lessonTitle}`}
            </div>
            {videoSize ? (
              <div style={{ fontSize: '0.72rem', color: '#2E7D32' }}>
                {formatFileSize(videoSize)} • Google Drive
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              setShowPreviewModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.6rem',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              fontSize: '0.8rem',
              color: 'var(--color-plum)',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            <Play size={13} color="var(--color-berry)" />
            <span>Preview Video</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerUpload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.6rem',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              fontSize: '0.8rem',
              color: 'var(--color-plum)',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            <RefreshCw size={13} color="var(--color-berry)" />
            <span>Replace Video</span>
          </button>

          <button
            type="button"
            onClick={handleRemove}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.6rem',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              fontSize: '0.8rem',
              color: '#D32F2F',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            <Trash2 size={13} />
            <span>Remove Video</span>
          </button>
        </div>
      )}

      {/* Video Streaming Preview Modal */}
      {showPreviewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            style={{
              backgroundColor: '#000',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#1A1A1A', color: '#FFF' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Video Preview: {lessonTitle}
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: '#000' }}>
              <video
                controls
                autoPlay
                playsInline
                style={{ width: '100%', maxHeight: '480px', display: 'block', borderRadius: '4px' }}
                src={currentVideoReference || `/api/videos/stream/${lessonId}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Progress / Uploading Modal */}
      {uploadModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-plum)', fontWeight: 600 }}>
                  {uploadStatus === 'success'
                    ? 'Upload Complete'
                    : uploadStatus === 'error'
                    ? 'Upload Failed'
                    : 'Uploading Video to Google Drive'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Lesson: {lessonTitle}
                </div>
              </div>
              {uploadStatus !== 'uploading' && (
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {selectedFile && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-cream)',
                  borderRadius: '8px',
                  marginBottom: '1.25rem'
                }}
              >
                <Film size={24} color="var(--color-berry)" style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-plum)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatFileSize(selectedFile.size)} • Resumable Google Drive Storage
                  </div>
                </div>
              </div>
            )}

            {/* Uploading progress view */}
            {uploadStatus === 'uploading' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#E0D6D2', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      backgroundColor: 'var(--color-berry)',
                      transition: 'width 0.25s ease-out'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>{progressPercent}% completed</span>
                  <span>{formatFileSize(uploadedBytes)} / {selectedFile ? formatFileSize(selectedFile.size) : ''}</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-plum)', opacity: 0.8, textAlign: 'center' }}>
                  Chunk {currentChunk} of {totalChunks} • Direct private backend stream
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Cancel Upload
                  </button>
                </div>
              </div>
            )}

            {/* Success view */}
            {uploadStatus === 'success' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: '#E8F5E9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto'
                  }}
                >
                  <Check size={28} color="#2E7D32" />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2E7D32', marginBottom: '0.3rem' }}>
                  Video Ready on Google Drive
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Associated with {lessonTitle}. Click "Save Masterclass" when done to publish your course changes.
                </div>
              </div>
            )}

            {/* Error view */}
            {uploadStatus === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    padding: '0.75rem',
                    backgroundColor: '#FFEBEE',
                    borderRadius: '8px',
                    color: '#C62828',
                    fontSize: '0.82rem'
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{errorMessage}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Dismiss
                  </button>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => startUploadFlow(selectedFile)}
                      className="btn btn-primary btn-sm"
                    >
                      Retry Upload
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
