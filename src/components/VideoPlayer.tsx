'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  const handleOpenChange = (open: boolean) => {
    setShowLightbox(open);
    if (!open) {
      videoRef.current?.pause();
    }
  };

  return (
    <Dialog open={showLightbox} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative mx-auto block min-h-11 aspect-video w-full cursor-pointer overflow-hidden rounded-[8px] border border-[#d7d0c7] bg-[#f3f0eb] text-left shadow-[0_16px_44px_rgba(24,20,16,0.10)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-[#bdb3a8] hover:shadow-[0_22px_58px_rgba(24,20,16,0.14)] active:translate-y-0 motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171412]"
          aria-label="全屏播放系统流程演示视频"
        >
          {poster ? (
            <Image
              src={poster}
              alt="视频封面"
              fill
              sizes="(min-width: 1024px) 62vw, 100vw"
              loading="lazy"
              decoding="async"
              className="object-contain"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-[#f6f1e9] px-6 text-center">
              <span>
                <span className="block text-sm uppercase tracking-[0.24em] text-[#75695d]">
                  System Flow Experience
                </span>
                <span
                  className="mt-4 block text-4xl font-semibold tracking-[-0.04em] text-[#1f1c19] md:text-6xl"
                  style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
                >
                  系统流程体验
                </span>
                <span className="mx-auto mt-5 block max-w-xl text-sm leading-7 text-[#6f665d] md:text-base">
                  展示家属接收提醒、查看患者状态、理解病情变化，并通过系统与医护建立更稳定的信息连接。
                </span>
              </span>
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors duration-300 group-hover:bg-black/22">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/92 shadow-lg transition-[transform,box-shadow] duration-300 group-hover:scale-110 group-hover:shadow-xl group-active:scale-100 motion-reduce:group-hover:scale-100">
              <svg
                className="ml-1 h-9 w-9 text-[#1a1a1a]"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
          <span className="absolute bottom-3 left-3 rounded-full bg-white/92 px-4 py-2 text-xs uppercase tracking-[0.12em] text-[#1f1c19] shadow-sm backdrop-blur-md md:bottom-4 md:left-4 md:tracking-[0.16em]">
            轻触全屏播放
          </span>
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="block h-[100dvh] w-screen max-w-none rounded-none border-0 bg-black p-0 text-white shadow-none duration-200 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 sm:max-w-none"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          closeButtonRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">系统流程演示视频</DialogTitle>
        <DialogDescription className="sr-only">
          展示 ICU+ 家属端的提醒、患者状态与医护沟通流程。
        </DialogDescription>

        <div className="flex h-full w-full items-center justify-center px-3 py-16 md:px-8">
          <video
            data-native-cursor
            ref={videoRef}
            src={src}
            poster={poster}
            className="h-full max-h-full w-full max-w-full object-contain"
            controls
            autoPlay={!shouldReduceMotion}
            playsInline
            preload="none"
            aria-label="ICU+ 系统流程演示"
          />
        </div>

        <DialogClose asChild>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="关闭视频预览"
            className="absolute right-4 top-4 z-10 flex h-12 min-w-12 items-center justify-center rounded-full bg-white px-4 text-sm font-medium text-black shadow-lg transition-colors hover:bg-[#eee9e2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            关闭 ×
          </button>
        </DialogClose>
        <p className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/12 px-4 py-2 text-center text-xs uppercase tracking-[0.12em] text-white/80 backdrop-blur-md md:tracking-[0.16em]">
          按 Esc 退出
        </p>
      </DialogContent>
    </Dialog>
  );
}
