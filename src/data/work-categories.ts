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
    slug: 'visuals-information', index: '03', title: 'Visuals & Information', lines: ['Visuals', '& Information'],
    chinese: '视觉与信息设计', range: '07—09',
    description: '运用图表、角色、版式与视觉语言，让复杂信息更清晰、形象更鲜明。',
    disciplines: 'Data Visualization / Character Design / Editorial Design',
    projectIds: ['data-visualization', 'heytea-character', 'report-design'],
  },
  {
    slug: 'material-digital-making', index: '04', title: 'Material & Digital Making', lines: ['Material &', 'Digital Making'],
    chinese: '跨媒介创作', range: '10—12',
    description: '展示空间塑造、材料实验、实体制作与造型基础。',
    disciplines: '3D Modeling / Handmade Books / Drawing',
    projectIds: ['scene-modeling', 'handmade-book', 'hand-drawing'],
  },
] as const;

export type WorkCategory = typeof workCategories[number];
export function categoryProjects(category: WorkCategory) {
  return category.projectIds.map(id => projects.find(project => project.id === id)!);
}
