import type { CaseAsset } from './campus-case-studies';
export const visualProjects: Record<string, { intro: string; images: CaseAsset[] }> = {
  'data-visualization': {
    intro: '经济、情绪与音乐文化之间的关系，转化为图表与信息展板。',
    images: [
      { src: '/projects/data-viz/01-board.png', width: 1839, height: 2600, title: 'Music and Economics 完整信息展板', caption: '01 / 完整展板' },
      { src: '/projects/data-viz/02-concept.png', width: 1706, height: 2400, title: 'Music and Economics 概念框架与变量关系', caption: '02 / 信息结构与图表语言' },
      { src: '/projects/data-viz/02-chart.png', width: 770, height: 2600, title: 'Music and Economics 图表细节', caption: '03 / 图表细节' },
    ],
  },
  'heytea-character': {
    intro: '围绕喜茶阿喜，探索完整的角色姿态、比例与品牌气质。',
    images: [{ src: '/projects/heytea/01-character.jpg', width: 1506, height: 2200, title: '喜茶阿喜全身像', caption: '角色视觉 / 全身像设计' }],
  },
  'scene-modeling': {
    intro: '通过三维建模、材质与灯光，探索空间的结构和氛围。',
    images: [{ src: '/projects/other-skills/01-modeling.jpg', width: 2200, height: 2200, title: '三维场景建模作品', caption: '三维场景 / 空间、材质与灯光' }],
  },
};
export const visualPreviews: Record<string, [CaseAsset, CaseAsset]> = Object.fromEntries(
  Object.entries(visualProjects).map(([id, project]) => [id, [project.images[0], project.images[1] ?? project.images[0]]]),
);

// Homepage artwork selected separately from the complete detail gallery.
visualPreviews['data-visualization'][1] = { src: '/home/previews/music-economics-cover.png', width: 772, height: 386, title: 'Music and Economics 紫色音乐封面' };
