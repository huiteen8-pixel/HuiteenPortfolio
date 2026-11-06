import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { projects } from '@/data/projects';
import { workCategories } from '@/data/work-categories';
import ProjectArticle from '@/components/ProjectArticle';
import AboutFloatingNav from '@/components/AboutFloatingNav';
import { TrackerProvider } from '@/components/TrackerProvider';

export function generateStaticParams() { return projects.map(project => ({ slug: project.id })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: projects.find(project => project.id === slug)?.title ?? 'Project' };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find(project => project.id === slug);
  if (!project) notFound();
  const category = workCategories.find(item => (item.projectIds as readonly string[]).includes(slug))!;
  return (
    <main className="work-detail-page">
      <TrackerProvider />
      <AboutFloatingNav current="work" />
      <a href={`/work/${category.slug}`} className="work-detail-back">← {category.title}</a>
      <ProjectArticle project={project} />
    </main>
  );
}
