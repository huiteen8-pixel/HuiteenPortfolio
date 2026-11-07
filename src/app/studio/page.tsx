import { notFound } from 'next/navigation';
import { projects } from '@/data/projects';
import saved from '@/data/studio/projects.json';
import Studio from '@/components/Studio';
import type { StudioDocument } from '@/lib/studio-schema';
export default function StudioPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <Studio projects={projects.map(({ id, title }) => ({ id, title }))} saved={saved as Record<string, StudioDocument>} />;
}
