'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ResumeViewerProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  downloadUrl: string;
  title: string;
}

function reportResumeAction(action: string, dwellMs?: number) {
  const visitId = sessionStorage.getItem('visit_id');
  if (!visitId) return;
  const body: Record<string, unknown> = { visit_id: visitId, action };
  if (dwellMs !== undefined) body.dwell_ms = dwellMs;
  fetch('/api/analytics/resume-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export default function ResumeViewer({ open, onClose, pdfUrl, downloadUrl, title }: ResumeViewerProps) {
  const openTimeRef = useRef<number>(0);
  const reportedRef = useRef(false);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  const handleDownload = useCallback(() => {
    reportResumeAction('download_resume');
  }, []);

  // Track resume view on open, dwell time on close
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
      openTimeRef.current = Date.now();
      reportedRef.current = false;
      reportResumeAction('view_resume');
    } else {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';

      if (openTimeRef.current && !reportedRef.current) {
        reportedRef.current = true;
        const dwellMs = Date.now() - openTimeRef.current;
        if (dwellMs > 0) {
          reportResumeAction('view_resume', dwellMs);
        }
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, handleKey]);

  // Report dwell on page unload while viewer is open
  useEffect(() => {
    const handleUnload = () => {
      if (open && openTimeRef.current && !reportedRef.current) {
        reportedRef.current = true;
        const dwellMs = Date.now() - openTimeRef.current;
        const visitId = sessionStorage.getItem('visit_id');
        if (visitId && dwellMs > 0) {
          const payload = JSON.stringify({ visit_id: visitId, action: 'view_resume', dwell_ms: dwellMs });
          navigator.sendBeacon('/api/analytics/resume-action', payload);
        }
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[9999] flex flex-col bg-white"
    >
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e0e0] flex-shrink-0">
        <h3
          className="text-lg font-semibold text-[#1a1a1a]"
          style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
        >
          {title}
        </h3>
        <div className="flex items-center gap-3">
          <a
            href={downloadUrl}
            download
            onClick={handleDownload}
            className="px-4 py-2 text-sm text-[#1a1a1a] bg-[#f5f5f5] hover:bg-[#e8e8e8] rounded-full transition-colors"
            style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
          >
            下载简历 ↓
          </a>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#999] hover:text-[#1a1a1a] transition-colors text-2xl"
          >
            ×
          </button>
        </div>
      </div>

      {/* PDF iframe 预览 */}
      <iframe
        data-native-cursor
        src={`${pdfUrl}#toolbar=0&navpanes=0`}
        className="flex-1 w-full border-0"
        title={title}
      />
    </div>,
    document.body
  );
}
