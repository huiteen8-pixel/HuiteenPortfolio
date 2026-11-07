import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { projects } from '@/data/projects';
import { workCategories, orderedProjects } from '@/data/work-categories';
import VisualProjectGallery from '@/components/VisualProjectGallery';
import AboutFloatingNav from '@/components/AboutFloatingNav';
import { TrackerProvider } from '@/components/TrackerProvider';
import WorkNextFooter from '@/components/WorkNextFooter';
import WorkEdgeNavigation from '@/components/WorkEdgeNavigation';
import IcuCaseStudy from '@/components/IcuCaseStudy';
import CampusCaseStudy from '@/components/CampusCaseStudy';
import ProjectEditable from '@/components/ProjectEditable';
import studioProjects from '@/data/studio/projects.json';
import type { StudioDocument } from '@/lib/studio-schema';

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
  const index = orderedProjects.findIndex(item => item.id === slug);
  const nextProject = orderedProjects[(index + 1) % orderedProjects.length];
  const nextHref = `/projects/${nextProject.id}`;
  const nextLabel = `下一个作品：${nextProject.title}`;
  return (
    <main className="work-detail-page work-browsing-page">
      <TrackerProvider />
      <AboutFloatingNav current="work" />
      <WorkEdgeNavigation />
      <div className="work-detail-content work-detail-content--case-study">
      <a href={`/work/${category.slug}`} className="work-detail-back">← {category.title}</a>
      <ProjectEditable initial={(studioProjects as Record<string, StudioDocument>)[slug] ?? {}}>
        {slug === 'icu-plus' ? <IcuCaseStudy project={project} /> : ['symbiosphere', 'gafa-wayfinding', 'moodlens', 'emotional-lens', 'digital-table'].includes(slug) ? <CampusCaseStudy project={project} /> : <VisualProjectGallery project={project} />}
      </ProjectEditable>
      </div>
      <WorkNextFooter href={nextHref} label={nextLabel} />
    </main>
  );
}
