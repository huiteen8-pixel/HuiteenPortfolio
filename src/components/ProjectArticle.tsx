'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import ImageGallery from '@/components/ImageGallery';
import ScrollReveal from '@/components/ScrollReveal';
import VideoPlayer from '@/components/VideoPlayer';
import type { Project } from '@/data/projects';

export default function ProjectArticle({ project }: { project: Project }) {
  const leadImage = project.images[0];
  const isIcuProject = project.id === 'icu-plus';
  const isSymbiosphereProject = project.id === 'symbiosphere';
  const infoBlocks = project.infoBlocks ?? [
    { label: 'Design Question', body: project.question },
    { label: 'Outcome', body: project.outcome },
  ];
  const galleryImages = project.images
    .slice(1)
    .filter(
      (image, index, images) =>
        image.src !== leadImage.src && images.findIndex((item) => item.src === image.src) === index,
    );

  return (
    <article id={project.id} className="scroll-mt-28">
      <div className="grid gap-12 lg:grid-cols-[0.56fr_1.44fr] lg:items-start">
        <ScrollReveal y={16} duration={0.55} className="lg:self-stretch">
          <aside className="lg:sticky lg:top-28">
            <div className="max-w-md">
              <div className="mb-8 border-b border-[#ece7df] pb-5 text-left md:mb-10 md:pb-6">
                <p className="text-sm uppercase tracking-[0.16em] text-[#706a65] md:tracking-[0.28em]">
                  {project.index}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#746c65] md:tracking-[0.2em]">
                  {project.group}
                </p>
              </div>

              <p className="mb-4 text-left text-xs uppercase leading-6 tracking-[0.12em] text-[#746c65] md:mb-5 md:tracking-[0.26em]">
                {project.category}
              </p>
              <h3
                className="text-left text-4xl font-semibold leading-tight tracking-normal md:text-7xl md:tracking-[-0.045em]"
                style={{ fontFamily: 'Noto Serif SC, Georgia, serif' }}
              >
                {project.title}
              </h3>
              <p className="mt-5 text-left text-sm uppercase leading-7 tracking-[0.08em] text-[#6f6861] md:mt-6 md:tracking-[0.22em]">
                {project.english}
              </p>

              <dl className="mt-8 space-y-5 text-left text-sm leading-7 text-[#5d554e] md:mt-12">
                <div>
                  <dt className="mb-1 text-xs uppercase tracking-[0.2em] text-[#706a65]">Year</dt>
                  <dd>{project.year}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs uppercase tracking-[0.2em] text-[#706a65]">Role</dt>
                  <dd>{project.role}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </ScrollReveal>

        <div className="overflow-hidden rounded-[8px] border border-[#d7d0c7] bg-white shadow-[0_24px_70px_rgba(24,20,16,0.12)]">
          <motion.div
            className={`relative min-h-[280px] overflow-hidden bg-[#eee9e2] ${
              isIcuProject ? 'md:min-h-[620px]' : 'md:min-h-[460px]'
            }`}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.025 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={leadImage.src}
                alt={leadImage.title}
                fill
                sizes="(min-width: 1280px) 62vw, (min-width: 1024px) 66vw, 100vw"
                className="object-contain p-4 md:p-8"
                loading="lazy"
                decoding="async"
                unoptimized={leadImage.src.endsWith('.svg') || leadImage.src.endsWith('.gif')}
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-transparent" />
            {isSymbiosphereProject && project.logoImage && (
              <div className="absolute right-5 top-5 rounded-[8px] border border-white/70 bg-white/88 p-4 shadow-[0_16px_44px_rgba(24,20,16,0.14)] backdrop-blur-md">
                <motion.div
                  className="relative h-10 w-24 md:h-14 md:w-32"
                  initial={{ opacity: 0, y: -8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.16 }}
                >
                  <Image
                    src={project.logoImage}
                    alt={`${project.title} logo`}
                    fill
                    sizes="128px"
                    className="object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </motion.div>
              </div>
            )}
          </motion.div>

          <div className="p-4 text-left sm:p-6 md:p-10 lg:p-12">
              <p className="max-w-4xl text-xl leading-relaxed tracking-normal text-[#1f1c19] md:text-3xl md:tracking-[-0.02em]">
                {project.summary}
              </p>

              <div className="mt-10 grid gap-8 border-t border-[#ece7df] pt-8 md:mt-12 md:grid-cols-2 md:pt-10">
                {infoBlocks.map((block) => (
                  <InfoBlock key={block.label} label={block.label} body={block.body} />
                ))}
              </div>

              <div className="mt-10 border-t border-[#ece7df] pt-8 md:mt-12 md:pt-10">
                <p className="mb-6 text-sm uppercase tracking-[0.24em] text-[#706a65]">Contribution</p>
                <div className="grid gap-7 md:grid-cols-3">
                  {project.contributions.map((item, index) => (
                    <div key={item} className="text-left text-base leading-8 text-[#4d463f]">
                      <span className="mb-2 block text-sm text-[#706a65]">0{index + 1}</span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {galleryImages.length > 0 && (
                <div className="mt-10 border-t border-[#ece7df] pt-8 md:mt-12 md:pt-10">
                  <p className="mb-6 text-sm uppercase tracking-[0.24em] text-[#706a65]">Visual Evidence</p>
                  <ImageGallery images={galleryImages} />
                </div>
              )}

              {project.video && (
                <div className="mt-10 border-t border-[#ece7df] pt-8 md:mt-12 md:pt-10">
                  <p className="mb-6 text-sm uppercase tracking-[0.24em] text-[#706a65]">Motion Prototype</p>
                  <VideoPlayer src={project.video} poster={project.poster} />
                </div>
              )}

              {project.links && (
                <div className="mt-10 border-t border-[#ece7df] pt-8 md:mt-12 md:pt-10">
                  <p className="mb-3 text-sm uppercase tracking-[0.24em] text-[#706a65]">Online Access</p>
                  <p className="mb-6 text-sm leading-7 text-[#666]">
                    这个项目有可跳转的在线页面，可以直接打开查看网页原型或交互版本。
                  </p>
                  <div className="grid gap-3 sm:flex sm:flex-wrap">
                    {project.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        data-track-label={link.trackingLabel}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex min-h-12 flex-col items-start justify-center gap-1 rounded-[6px] border border-[#d8d1c8] bg-[#f8f5ef] px-4 py-3 text-left text-sm font-medium text-[#1f1c19] transition-[transform,border-color,background-color,color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-[#171412] hover:bg-[#171412] hover:text-white hover:shadow-[0_14px_34px_rgba(24,20,16,0.16)] motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5"
                      >
                        <span>{link.label}</span>
                        <span className="text-xs uppercase tracking-[0.16em] opacity-60 transition-opacity group-hover:opacity-80">
                          点击打开 -&gt;
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="mb-4 text-sm uppercase tracking-[0.24em] text-[#706a65]">{label}</p>
      <p className="text-base leading-8 text-[#555]">{body}</p>
    </div>
  );
}
