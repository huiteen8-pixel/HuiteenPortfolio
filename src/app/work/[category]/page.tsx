import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { workCategories, categoryProjects } from '@/data/work-categories';
import AboutFloatingNav from '@/components/AboutFloatingNav';
import WorkPlaceholder from '@/components/WorkPlaceholder';
import AboutContactFooter from '@/components/AboutContactFooter';

export function generateStaticParams() { return workCategories.map(category => ({ category: category.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = workCategories.find(item => item.slug === slug);
  return { title: category?.title ?? 'Work' };
}

export default async function WorkCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = workCategories.find(item => item.slug === slug);
  if (!category) notFound();
  return (
    <main className="work-category-page">
      <AboutFloatingNav current="work" />
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
              <WorkPlaceholder figure={`${category.index}.${index + 1}`} title={project.title} variant={index} />
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
      <div className="work-contact-footer"><AboutContactFooter /></div>
    </main>
  );
}
