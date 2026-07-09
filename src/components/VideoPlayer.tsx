'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleLightboxClose = useCallback(() => {
    setShowLightbox(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 灯箱打开时锁定页面，并支持 Escape 退出。
  useEffect(() => {
    if (!showLightbox) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleLightboxClose();
      }
    };

    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', preventScroll, { passive: false, capture: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', preventScroll, { capture: true });
    };
  }, [handleLightboxClose, showLightbox]);

  const handleThumbnailClick = () => {
    setShowLightbox(true);
  };

  return (
    <>
      {/* Video Thumbnail */}
      <div
        className="group relative mx-auto aspect-video w-full cursor-pointer overflow-hidden rounded-[8px] border border-[#d7d0c7] bg-[#f3f0eb] shadow-[0_16px_44px_rgba(24,20,16,0.10)]"
        onClick={handleThumbnailClick}
      >
        {poster ? (
          <img
            src={poster}
            alt="视频封面"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#f6f1e9] px-6 text-center">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#a28f7c]">System Flow Experience</p>
              <p
                className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#1f1c19] md:text-6xl"
                style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
              >
                系统流程体验
              </p>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#6f665d] md:text-base">
                展示家属接收提醒、查看患者状态、理解病情变化，并通过系统与医护建立更稳定的信息连接。
              </p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/22">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/92 shadow-lg transition-all group-hover:scale-110 group-hover:bg-white">
            <svg
              className="ml-1 h-9 w-9 text-[#1a1a1a]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 rounded-full bg-white/88 px-4 py-2 text-xs uppercase tracking-[0.16em] text-[#1f1c19] shadow-sm backdrop-blur-md">
          点击播放全屏视频
        </div>
      </div>

      {/* Lightbox — 通过 Portal 渲染到 body，完全独立于页面布局 */}
      {mounted && showLightbox && createPortal(
        <div
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label="视频全屏播放"
          className="fixed inset-0 z-[99999] flex h-screen w-screen items-center justify-center bg-black"
          onClick={handleLightboxClose}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className="flex h-full w-full items-center justify-center px-3 py-16 md:px-8"
            onClick={(event) => event.stopPropagation()}
          >
            <video
              ref={videoRef}
              src={src}
              className="h-full max-h-full w-full max-w-full object-contain"
              controls
              autoPlay
              playsInline
            />
          </div>

          <button
            type="button"
            aria-label="关闭视频预览"
            className="absolute right-4 top-4 z-10 flex h-12 min-w-12 items-center justify-center rounded-full bg-white px-4 text-sm font-medium text-black shadow-lg transition-all hover:scale-105 hover:bg-white"
            onClick={(event) => {
              event.stopPropagation();
              handleLightboxClose();
            }}
          >
            关闭 ×
          </button>
          <p className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/12 px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/70 backdrop-blur-md">
            点击黑色背景或按 Esc 退出
          </p>
        </div>,
        document.body
      )}
    </>
  );
}
