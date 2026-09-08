'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface ImageGalleryProps {
  images: ProjectImage[];
}

type ProjectImage = {
  src: string;
  title: string;
  description: string;
  layout?: 'wide' | 'standard' | 'tall' | 'square';
  category?: string;
  size?: 'full' | 'large' | 'medium' | 'compact';
  display?: 'scroll' | 'grid';
};

export default function ImageGallery({ images }: ImageGalleryProps) {
  const defaultCategory = '__default__';
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const uniqueImages = useMemo(
    () => images.filter((image, index) => images.findIndex((item) => item.src === image.src) === index),
    [images],
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrevious = useCallback(() => {
    setLightboxIndex((index) => {
      if (index === null) return index;
      return index === 0 ? uniqueImages.length - 1 : index - 1;
    });
  }, [uniqueImages.length]);
  const showNext = useCallback(() => {
    setLightboxIndex((index) => {
      if (index === null) return index;
      return index === uniqueImages.length - 1 ? 0 : index + 1;
    });
  }, [uniqueImages.length]);

  const getImageCategory = (image: ProjectImage) => {
    if (image.category) return image.category;
    const text = `${image.title} ${image.description}`;

    if (/用户|触点|旅程|故事|问题|趋势|变量|生态|服务/.test(text)) {
      return '研究与服务逻辑';
    }
    if (/系统|框架|机制|闭环|地图|流程|结构/.test(text)) {
      return '系统结构';
    }
    if (/界面|工作台|移动端|网页|原型|交互|首页|页面/.test(text)) {
      return '界面与交互';
    }
    if (/场景|硬件|餐桌|角色|建模|手工|手绘|视觉资产/.test(text)) {
      return '场景与制作';
    }
    if (/证书|获奖|论坛|展览|证明/.test(text)) {
      return '展示与证明';
    }
    return defaultCategory;
  };

  const groupedImages = uniqueImages.reduce<Array<{ category: string; items: Array<ProjectImage & { index: number }> }>>(
    (groups, image, index) => {
      const category = getImageCategory(image);
      const existingGroup = groups.find((group) => group.category === category);
      const item = { ...image, index };

      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.push({ category, items: [item] });
      }

      return groups;
    },
    [],
  );

  const getFrameClass = (image: ProjectImage, isGridGroup = false) => {
    if (isGridGroup && image.layout === 'tall') return 'aspect-[526/1138]';
    if (isGridGroup) return 'aspect-[4/3]';
    if (image.layout === 'tall') return 'h-[520px] md:h-[680px]';
    if (image.layout === 'square') return 'aspect-square';
    if (image.layout === 'wide') return 'aspect-[16/9]';
    return 'aspect-[4/3]';
  };

  const getCardClass = (image: ProjectImage, count: number) => {
    if (image.size === 'full') return 'min-w-full';
    if (image.size === 'large') return 'w-full max-w-[980px] shrink-0 sm:w-[92%]';
    if (image.size === 'medium') return 'w-full max-w-[740px] shrink-0 sm:w-[78%]';
    if (image.size === 'compact') return 'w-full max-w-[420px] shrink-0 sm:w-[72%]';
    if (count === 1) return 'min-w-full';
    if (image.layout === 'wide') return 'min-w-full sm:min-w-[560px] lg:min-w-[720px]';
    if (image.layout === 'tall') return 'min-w-full sm:min-w-[360px] lg:min-w-[420px]';
    return 'min-w-full sm:min-w-[360px] lg:min-w-[460px]';
  };

  const getImageSizes = (image: ProjectImage, isGridGroup: boolean) => {
    if (isGridGroup) return '(min-width: 1024px) 16vw, 44vw';
    if (image.size === 'compact') return '(min-width: 1024px) 24vw, 72vw';
    if (image.size === 'medium') return '(min-width: 1024px) 42vw, 78vw';
    if (image.size === 'large') return '(min-width: 1024px) 56vw, 92vw';
    return '(min-width: 1024px) 62vw, 100vw';
  };

  const currentImage = uniqueImages[lightboxIndex ?? 0];

  return (
    <Dialog
      open={lightboxIndex !== null}
      onOpenChange={(open) => {
        if (!open) closeLightbox();
      }}
    >
      <div className="space-y-14">
        {groupedImages.map((group) => {
          const isGridGroup = group.items.some((item) => item.display === 'grid');
          const shouldShowGroupHeader = group.category !== defaultCategory || group.items.length > 1;

          return (
            <section key={group.category}>
              {shouldShowGroupHeader && (
                <div className="mb-5 border-b border-[#ece7df] pb-4 text-left">
                  {group.category !== defaultCategory && (
                    <p className="text-sm font-semibold text-[#1f1c19]">
                      {group.category}
                    </p>
                  )}
                  {group.items.length > 1 && !isGridGroup && (
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#706a65]">
                      横向滑动查看
                    </p>
                  )}
                </div>
              )}

              <div
                className={
                  isGridGroup
                    ? 'grid grid-cols-2 gap-4 pb-3 lg:grid-cols-4'
                    : 'hide-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 sm:-mx-2 sm:px-2'
                }
                aria-label={`${group.category === defaultCategory ? '项目' : group.category} 图片组`}
              >
                {group.items.map((image) => (
                  <figure
                    key={image.src}
                    className={`${isGridGroup ? 'min-w-0' : `snap-start ${getCardClass(image, group.items.length)}`} text-left`}
                  >
                    <button
                      type="button"
                      className={`gallery-trigger group relative flex min-h-11 w-full items-center justify-center overflow-hidden rounded-[8px] border border-[#ded8d0] bg-[#f6f3ee] transition-[transform,border-color,box-shadow] duration-300 active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171412] ${getFrameClass(image, isGridGroup)}`}
                      onClick={(event) => {
                        lastTriggerRef.current = event.currentTarget;
                        setLightboxIndex(image.index);
                      }}
                      aria-label={`全屏查看：${image.title}`}
                    >
                      {image.src.toLowerCase().endsWith('.gif') ? (
                        <span className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#fff_0%,#eee8df_100%)] px-6 text-center">
                          <span>
                            <span
                              aria-hidden="true"
                              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#cec5ba] bg-white/90 text-xl text-[#312b26] shadow-sm transition-transform duration-300 group-hover:scale-105"
                            >
                              ▶
                            </span>
                            <span className="mt-4 block text-sm font-semibold text-[#312b26]">
                              动态演示 · 点击后加载
                            </span>
                            <span className="mt-2 block text-xs leading-5 text-[#756d65]">
                              {shouldReduceMotion
                                ? '已尊重系统的减少动态效果设置'
                                : '浏览页面时不会下载 GIF 原文件'}
                            </span>
                          </span>
                        </span>
                      ) : (
                        <Image
                          src={image.src}
                          alt={image.title}
                          fill
                          sizes={getImageSizes(image, isGridGroup)}
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          className="gallery-image object-contain p-1 md:p-3"
                          draggable={false}
                          unoptimized={image.src.toLowerCase().endsWith('.svg')}
                        />
                      )}
                      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/92 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[#4e4740] opacity-100 shadow-sm backdrop-blur-md transition-opacity duration-300 md:right-4 md:top-4 md:opacity-0 md:group-hover:opacity-100">
                        轻触全屏
                      </span>
                    </button>
                    <figcaption className="mt-4 border-t border-[#ded8d0] pt-3 text-left">
                      <span className="block text-[11px] uppercase tracking-[0.18em] text-[#706a65]">
                        {String(image.index + 1).padStart(2, '0')}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-[#1f1c19]">
                        {image.title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[#6b625a]">{image.description}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <DialogContent
        showCloseButton={false}
        className="block h-[100dvh] w-screen max-w-none rounded-none border-0 bg-black p-0 text-white shadow-none duration-200 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 sm:max-w-none"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          closeButtonRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          lastTriggerRef.current?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' && uniqueImages.length > 1) {
            event.preventDefault();
            showPrevious();
          }
          if (event.key === 'ArrowRight' && uniqueImages.length > 1) {
            event.preventDefault();
            showNext();
          }
        }}
      >
        <DialogTitle className="sr-only">图片全屏预览</DialogTitle>

        <div className="absolute left-4 top-4 z-10 rounded-full bg-white/12 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
          图片 {(lightboxIndex ?? 0) + 1} / {uniqueImages.length}
        </div>

        <div className="flex h-full w-full items-center justify-center px-4 pb-40 pt-20 md:px-20 md:pb-32">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={currentImage.src}
              src={currentImage.src}
              alt={currentImage.title}
              loading="eager"
              decoding="async"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.16,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="h-full max-h-full w-full max-w-full object-contain"
            />
          </AnimatePresence>
        </div>

        <DialogDescription className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-h-32 max-w-3xl overflow-y-auto rounded-[8px] bg-white/12 p-4 text-white backdrop-blur-md">
          <span className="block text-sm font-semibold">{currentImage.title}</span>
          <span className="mt-1 block text-sm leading-6 text-white/80">{currentImage.description}</span>
        </DialogDescription>

        {uniqueImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="上一张图片"
              className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-2xl text-black shadow-lg transition-[transform,background-color] hover:scale-105 hover:bg-white active:scale-95 motion-reduce:hover:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:left-5"
              onClick={showPrevious}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="下一张图片"
              className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-2xl text-black shadow-lg transition-[transform,background-color] hover:scale-105 hover:bg-white active:scale-95 motion-reduce:hover:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:right-5"
              onClick={showNext}
            >
              ›
            </button>
          </>
        )}

        <DialogClose asChild>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="关闭图片预览"
            className="absolute right-4 top-4 z-10 flex h-12 min-w-12 items-center justify-center rounded-full bg-white px-4 text-sm font-medium text-black shadow-lg transition-colors hover:bg-[#eee9e2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            关闭 ×
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
