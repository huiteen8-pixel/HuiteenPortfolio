import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { workCategories, categoryProjects } from '@/data/work-categories';
import AboutFloatingNav from '@/components/AboutFloatingNav';
import WorkPlaceholder from '@/components/WorkPlaceholder';
import WorkNextFooter from '@/components/WorkNextFooter';
import WorkEdgeNavigation from '@/components/WorkEdgeNavigation';
import IcuProjectCover from '@/components/IcuProjectCover';
import { visualPreviews } from '@/data/visual-projects';
import { interactionPreviews } from '@/data/interaction-case-studies';
import BioCampusProjectCover from '@/components/BioCampusProjectCover';

export function generateStaticParams() { return workCategories.map(category => ({ category: category.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = workCategories.find(item => item.slug === slug);
  return { title: category?.title ?? 'Work' };
}

export default async function WorkCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  if (['visuals-information', 'material-digital-making'].includes(slug)) redirect('/work/visuals-making');
  const category = workCategories.find(item => item.slug === slug);
  if (!category) notFound();
  const index = workCategories.findIndex(item => item.slug === slug);
  const nextCategory = workCategories[(index + 1) % workCategories.length];
  const nextHref = `/work/${nextCategory.slug}`;
  const nextLabel = `下一个专题：${nextCategory.title}`;
  return (
    <main className="work-category-page work-browsing-page">
      <AboutFloatingNav current="work" />
      <WorkEdgeNavigation />
      <header className="work-category-heading">
        <a href={`/#${category.slug}`} className="work-back">← ALL WORK</a>
        <p className="work-eyebrow">{category.index} / {category.chinese}</p>
        <h1>{category.title}</h1>
        <p className="work-category-description">{category.description}</p>
      </header>
      <nav className="work-category-tabs" aria-label="切换作品分类">
        {workCategories.map(item => <a key={item.slug} href={`/work/${item.slug}`} aria-current={item.slug === slug ? 'page' : undefined}>{item.index} {item.title}</a>)}
      </nav>
      <div className="work-project-list">
        {categoryProjects(category).map((project, index) => (
          <a key={project.id} href={`/projects/${project.id}`} className="work-project-row">
            <div className="work-project-cover">
              {project.id === 'icu-plus' ? <IcuProjectCover /> : project.id === 'symbiosphere' ? <BioCampusProjectCover /> : project.id === 'gafa-wayfinding' ? <Image src="/projects/gafa/hd/offline-online-guide.webp" alt="GAFA 路标改良系统实体标识与移动端导览总览" width={3200} height={1982} quality={90} sizes="(max-width: 767px) 90vw, 55vw" className="work-project-cover-image" /> : interactionPreviews[project.id] ? <Image src={interactionPreviews[project.id][0].src} alt={interactionPreviews[project.id][0].title} width={interactionPreviews[project.id][0].width} height={interactionPreviews[project.id][0].height} unoptimized sizes="(max-width: 767px) 90vw, 55vw" className="work-project-cover-image" /> : visualPreviews[project.id] ? <Image src={visualPreviews[project.id][0].src} alt={visualPreviews[project.id][0].title} width={visualPreviews[project.id][0].width} height={visualPreviews[project.id][0].height} unoptimized className="work-project-cover-image" /> : <WorkPlaceholder figure={`${category.index}.${index + 1}`} title={project.title} variant={index} />}
              <span className="work-project-badge">VIEW PROJECT</span>
              <span className="work-project-arrow" aria-hidden="true">↗</span>
            </div>
            <div className="work-project-copy">
              <div><h2>{project.title}</h2><p className="work-project-english">{project.english}</p></div>
              <p className="work-project-tags">{project.category}</p>
            </div>
          </a>
        ))}
      </div>
      <WorkNextFooter href={nextHref} label={nextLabel} />
    </main>
  );
}
