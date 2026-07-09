'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);
  const uniqueImages = useMemo(
    () => images.filter((image, index) => images.findIndex((item) => item.src === image.src) === index),
    [images],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 灯箱打开时锁定页面，并提供 Escape / 左右方向键退出与切换。
  useEffect(() => {
    if (lightboxIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft' && uniqueImages.length > 1) showPrevious();
      if (event.key === 'ArrowRight' && uniqueImages.length > 1) showNext();
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
  }, [closeLightbox, lightboxIndex, showNext, showPrevious, uniqueImages.length]);

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

  return (
    <>
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
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#aaa]">
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
                      className={`group relative flex w-full items-center justify-center overflow-hidden rounded-[8px] border border-[#ded8d0] bg-[#f6f3ee] ${getFrameClass(image, isGridGroup)}`}
                      onClick={() => setLightboxIndex(image.index)}
                      aria-label={`全屏查看：${image.title}`}
                    >
                      <img
                        src={image.src}
                        alt={image.title}
                        loading={image.index < 2 ? 'eager' : 'lazy'}
                        className="h-full w-full object-contain p-1 transition-transform duration-700 group-hover:scale-[1.012] md:p-3"
                        draggable={false}
                      />
                      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-white/88 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-[#4e4740] opacity-0 shadow-sm backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                        点击全屏
                      </span>
                    </button>
                    <figcaption className="mt-4 border-t border-[#ded8d0] pt-3 text-left">
                      <span className="block text-[11px] uppercase tracking-[0.18em] text-[#aaa]">
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

      {/* Lightbox — 通过 Portal 渲染到 body，完全独立于页面布局 */}
      {mounted && lightboxIndex !== null && createPortal(
        <div
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label="图片全屏预览"
          className="fixed inset-0 z-[99999] flex h-screen w-screen items-center justify-center bg-black"
          onClick={closeLightbox}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="absolute left-4 top-4 z-10 rounded-full bg-white/12 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
            图片 {lightboxIndex + 1} / {uniqueImages.length}
          </div>

          <div
            className="flex h-full w-full items-center justify-center px-4 py-20 md:px-10"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={uniqueImages[lightboxIndex].src}
              alt={uniqueImages[lightboxIndex].title}
              className="h-full max-h-full w-full max-w-full object-contain"
            />
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-3xl rounded-[8px] bg-white/10 p-4 text-white backdrop-blur-md">
            <p className="text-sm font-semibold">{uniqueImages[lightboxIndex].title}</p>
            <p className="mt-1 text-sm leading-6 text-white/72">{uniqueImages[lightboxIndex].description}</p>
          </div>

          {uniqueImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="上一张图片"
                className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-black shadow-lg transition-all hover:scale-105 hover:bg-white"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="下一张图片"
                className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-black shadow-lg transition-all hover:scale-105 hover:bg-white"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
              >
                ›
              </button>
            </>
          )}

          <button
            type="button"
            aria-label="关闭图片预览"
            className="absolute right-4 top-4 z-10 flex h-12 min-w-12 items-center justify-center rounded-full bg-white px-4 text-sm font-medium text-black shadow-lg transition-all hover:scale-105 hover:bg-white"
            onClick={(event) => {
              event.stopPropagation();
              closeLightbox();
            }}
          >
            关闭 ×
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
