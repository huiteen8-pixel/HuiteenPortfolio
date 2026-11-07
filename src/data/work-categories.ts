import { projects } from './projects';

export const workCategories = [
  {
    slug: 'systems-services', index: '01', title: 'Systems & Services', lines: ['Systems', '& Services'],
    chinese: '系统与服务设计', range: '01—03',
    description: '从需求研究出发，组织多角色、多触点及线上线下的完整服务。',
    disciplines: 'Service Design / Systems Thinking / Digital Products',
    projectIds: ['icu-plus', 'symbiosphere', 'gafa-wayfinding'],
  },
  {
    slug: 'interaction-concepts', index: '02', title: 'Interaction & Concepts', lines: ['Interaction', '& Concepts'],
    chinese: '交互与概念探索', range: '04—06',
    description: '探索人的情绪、行为与技术之间的关系，通过界面或交互叙事呈现概念。',
    disciplines: 'Interactive Experiences / Emotional Design / Concept Exploration',
    projectIds: ['moodlens', 'emotional-lens', 'digital-table'],
  },
  {
    slug: 'visuals-making', index: '03', title: 'Visuals & Making', lines: ['Visuals', '& Making'],
    chinese: '视觉与造型创作', range: '07—09',
    description: '图表、角色与三维场景，以作品图像呈现视觉表达与造型探索。',
    disciplines: 'Data Visualization / Character Design / 3D Modeling',
    projectIds: ['data-visualization', 'heytea-character', 'scene-modeling'],
  },
] as const;

export type WorkCategory = typeof workCategories[number];
export function categoryProjects(category: WorkCategory) {
  return category.projectIds.map(id => projects.find(project => project.id === id)!);
}

// Reading order matches the category pages, including category boundaries.
export const orderedProjects = workCategories.flatMap(category => categoryProjects(category));
