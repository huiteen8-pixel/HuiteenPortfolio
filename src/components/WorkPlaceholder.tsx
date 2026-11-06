import type { CSSProperties } from 'react';

/** Deliberately neutral covers, ready to be replaced with the final artwork. */
export default function WorkPlaceholder({ figure, title, variant = 0 }: { figure: string; title: string; variant?: number }) {
  return (
    <div className={`work-placeholder work-placeholder-${variant % 3}`} style={{ '--placeholder-tone': ['#dddeda', '#cfd2d3', '#e7e5df'][variant % 3] } as CSSProperties}>
      <span className="work-placeholder-figure">FIG. {figure}</span>
      <span className="work-placeholder-cross" aria-hidden="true" />
      <span className="work-placeholder-title">{title}</span>
      <span className="work-placeholder-caption">IMAGE TO COME</span>
    </div>
  );
}
