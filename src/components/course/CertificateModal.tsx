import React, { useState, useEffect, useRef } from 'react';
import { Award, Download, X, CheckCircle2, Sparkles, UserCheck } from 'lucide-react';
import {
  drawCertificateToCanvas,
  downloadCertificatePDF,
  generateCertificateId
} from '../../services/certificateService';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  defaultName?: string;
  progress?: number;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  courseTitle,
  defaultName = '',
  progress = 100
}) => {
  const [studentName, setStudentName] = useState(defaultName);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [certId, setCertId] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync default name and generate a certificate ID when opened
  useEffect(() => {
    if (isOpen) {
      if (defaultName && !studentName) {
        setStudentName(defaultName);
      }
      setCertId(generateCertificateId(courseTitle));
      setDownloadSuccess(false);
    }
  }, [isOpen, defaultName, courseTitle]);

  // Redraw certificate live on canvas whenever student name or title changes
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawCertificateToCanvas(canvasRef.current, {
        studentName: studentName.trim() || 'Your Full Name',
        courseTitle,
        certificateId: certId
      });
    }
  }, [isOpen, studentName, courseTitle, certId]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    const finalName = studentName.trim() || 'Student';
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      await downloadCertificatePDF({
        studentName: finalName,
        courseTitle,
        certificateId: certId
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Error generating certificate PDF:', err);
      alert('Unable to generate certificate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(26, 12, 16, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.2rem',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl, 16px)',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(61, 28, 36, 0.35)',
          overflow: 'hidden',
          border: '1px solid rgba(197, 155, 39, 0.3)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.6rem',
            background: 'linear-gradient(135deg, #5C1A29 0%, #84253B 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(226, 186, 85, 0.5)'
              }}
            >
              <Award size={22} color="#F5DE88" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Unlock Official Certificate
                <Sparkles size={16} color="#F5DE88" />
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.15rem' }}>
                {courseTitle}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.85)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Requirement & Status Banner */}
          <div
            style={{
              backgroundColor: '#FAF5EE',
              border: '1px solid #E2BA55',
              borderRadius: 'var(--radius-md, 10px)',
              padding: '0.9rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckCircle2 size={18} color="#C59B27" />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#5C1A29' }}>
                  Certificate Unlocked
                </div>
                <div style={{ fontSize: '0.78rem', color: '#7A6B68' }}>
                  Eligible for students with 90%+ course progress • Unlocked for instant download
                </div>
              </div>
            </div>
            <div
              style={{
                backgroundColor: '#E8F5E9',
                color: '#2E7D32',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              Active Progress: {progress}% (Unlocked)
            </div>
          </div>

          {/* Student Name Input Field */}
          <div>
            <label
              htmlFor="student-cert-name"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-plum, #3D1C24)',
                marginBottom: '0.4rem'
              }}
            >
              <UserCheck size={16} color="var(--color-berry, #84253B)" />
              Enter Your Full Name for the Certificate
            </label>
            <input
              id="student-cert-name"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Priya Ramanathan"
              className="input-field"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '1.5px solid #E0D3D5',
                borderRadius: 'var(--radius-md, 8px)',
                color: 'var(--color-plum, #3D1C24)',
                fontWeight: 500,
                backgroundColor: '#FFF'
              }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #7A6B68)', marginTop: '0.35rem' }}>
              Type your name exactly as you would like it to appear on your verified masterclass diploma.
            </div>
          </div>

          {/* Live Certificate Preview Frame */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted, #7A6B68)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Diploma Preview
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-berry, #84253B)' }}>
                Resolution: A4 High-Definition Vector Print
              </span>
            </div>

            <div
              style={{
                borderRadius: 'var(--radius-md, 10px)',
                overflow: 'hidden',
                border: '2px solid #E8DDD2',
                boxShadow: '0 8px 24px -4px rgba(61, 28, 36, 0.12)',
                backgroundColor: '#FAF5EE',
                position: 'relative'
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  aspectRatio: '2000 / 1414'
                }}
              />
            </div>
          </div>

          {/* Download Success Banner */}
          {downloadSuccess && (
            <div
              style={{
                backgroundColor: '#E8F5E9',
                border: '1px solid #A5D6A7',
                color: '#1B5E20',
                padding: '0.8rem 1.2rem',
                borderRadius: 'var(--radius-md, 8px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.88rem',
                fontWeight: 500
              }}
            >
              <CheckCircle2 size={18} color="#2E7D32" />
              Certificate downloaded successfully to your device!
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1.1rem 1.6rem',
            backgroundColor: '#FAF0F2',
            borderTop: '1px solid var(--border-subtle, #F0E2E5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ minWidth: '100px' }}
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.7rem 1.6rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-berry, #84253B)',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(132, 37, 59, 0.3)'
            }}
          >
            <Download size={17} />
            {isDownloading ? 'Generating PDF...' : 'Download Certificate (PDF)'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CertificateModal;
