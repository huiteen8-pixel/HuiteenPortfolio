'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import type { StudioDocument, StudioLayer } from '@/lib/studio-schema';

export default function ProjectEditable({ children, initial }: { children: ReactNode; initial: StudioDocument }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = root.current!;
    const enabled = process.env.NODE_ENV === 'development' && new URLSearchParams(location.search).get('studio') === '1' && window.parent !== window;
    const elements = new Map<string, HTMLElement>();
    const occurrences = new Map<number, number>();
    host.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,dt,dd,figcaption,img').forEach(element => {
      const identity = `${element.tagName}:${element.tagName === 'IMG' ? element.getAttribute('alt') : element.textContent}`;
      let hash = 2166136261;
      for (let index = 0; index < identity.length; index++) hash = Math.imul(hash ^ identity.charCodeAt(index), 16777619) >>> 0;
      const occurrence = occurrences.get(hash) ?? 0; occurrences.set(hash, occurrence + 1);
      const key = `e${hash}-${occurrence}`; element.dataset.studioKey = key; elements.set(key, element);
    });
    let document: StudioDocument = initial;
    let selected: HTMLElement | null = null;
    const originals = new Map([...elements].map(([key, element]) => [key, { text: element.innerHTML, src: element.getAttribute('src'), style: element.getAttribute('style'), srcset: element.getAttribute('srcset') }]));
    function send(type: string, payload: object) { if (enabled) window.parent.postMessage({ source: 'huiteen-preview', type, ...payload }, location.origin); }
    function describe(element: HTMLElement) {
      const key = element.dataset.studioKey!;
      return { key, text: element.tagName === 'IMG' ? undefined : element.innerText, src: element.tagName === 'IMG' ? element.getAttribute('src') : undefined,
        fontSize: parseFloat(getComputedStyle(element).fontSize), width: element.getBoundingClientRect().width, ...document[key] };
    }
    function choose(element: HTMLElement) {
      selected?.removeAttribute('data-studio-selected'); selected = element; element.dataset.studioSelected = 'true';
      send('select', { layer: describe(element) });
    }
    function apply(next: StudioDocument) {
      document = next;
      elements.forEach((element, key) => {
        if (key.startsWith('new-')) { element.remove(); elements.delete(key); return; }
        const original = originals.get(key)!;
        if (original.style === null) element.removeAttribute('style'); else element.setAttribute('style', original.style);
        if (element.tagName !== 'IMG' && element.innerHTML !== original.text) element.innerHTML = original.text;
        if (element.tagName === 'IMG') { if (original.src) element.setAttribute('src', original.src); if (original.srcset) element.setAttribute('srcset', original.srcset); }
      });
      Object.entries(next).forEach(([key, layer]) => {
        let element = elements.get(key);
        if (!element && key.startsWith('new-')) {
          element = window.document.createElement(layer.kind === 'image' ? 'img' : 'p');
          element.dataset.studioKey = key;
          const anchor = elements.get(layer.after ?? '');
          const block = anchor?.closest('figure') ?? anchor?.closest('p,h1,h2,h3,h4,dl,header') ?? anchor;
          if (block) block.after(element); else host.append(element);
          elements.set(key, element);
          element.style.maxWidth = '100%'; element.style.margin = '24px 0';
        }
        if (!element) return;
        if (layer.text !== undefined && element.tagName !== 'IMG') element.textContent = layer.text;
        if (layer.src && element.tagName === 'IMG') { element.setAttribute('src', layer.src); element.removeAttribute('srcset'); }
        if (layer.x !== undefined || layer.y !== undefined) { element.style.translate = `${layer.x ?? 0}px ${layer.y ?? 0}px`; element.style.position = 'relative'; }
        if (layer.rotation !== undefined) element.style.rotate = `${layer.rotation}deg`;
        if (layer.width !== undefined) { element.style.width = `${layer.width}px`; element.style.maxWidth = '100%'; if (element.tagName === 'IMG') element.style.height = 'auto'; }
        if (layer.fontSize !== undefined) element.style.fontSize = `${layer.fontSize}px`;
        element.style.whiteSpace = element.tagName === 'IMG' ? '' : 'pre-wrap';
        if (layer.hidden) element.style.display = 'none';
      });
      if (selected) { const key = selected.dataset.studioKey!; selected = elements.get(key) ?? null; selected?.setAttribute('data-studio-selected', 'true'); }
    }
    function restore() {
      elements.forEach((element, key) => {
        if (key.startsWith('new-')) { element.remove(); return; }
        const original = originals.get(key)!;
        element.removeAttribute('data-studio-selected');
        if (original.style === null) element.removeAttribute('style'); else element.setAttribute('style', original.style);
        if (element.tagName !== 'IMG') element.innerHTML = original.text;
        else { if (original.src) element.setAttribute('src', original.src); if (original.srcset) element.setAttribute('srcset', original.srcset); else element.removeAttribute('srcset'); }
      });
    }
    apply(initial);
    if (!enabled) return restore;
    const style = window.document.createElement('style');
    style.textContent = '[data-studio-key]{cursor:grab!important;touch-action:none}[data-studio-key]:hover{outline:1px dashed #0289fb;outline-offset:4px}[data-studio-selected]{outline:2px solid #0289fb!important;outline-offset:5px}[contenteditable=true]{cursor:text!important;user-select:text!important}';
    host.append(style);
    let drag: { element: HTMLElement; x: number; y: number; layer: StudioLayer; moved: boolean } | null = null;
    function down(event: PointerEvent) {
      const element = (event.target as HTMLElement).closest<HTMLElement>('[data-studio-key]');
      if (!element || element.isContentEditable || event.button !== 0) return;
      event.preventDefault(); event.stopPropagation(); choose(element);
      drag = { element, x: event.clientX, y: event.clientY, layer: { ...document[element.dataset.studioKey!] }, moved: false };
      element.setPointerCapture(event.pointerId);
    }
    function move(event: PointerEvent) {
      if (!drag) return;
      const x = Math.max(-3000, Math.min(3000, (drag.layer.x ?? 0) + event.clientX - drag.x));
      const y = Math.max(-3000, Math.min(3000, (drag.layer.y ?? 0) + event.clientY - drag.y));
      drag.moved ||= Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) > 3;
      drag.element.style.translate = `${x}px ${y}px`; drag.element.style.position = 'relative';
      document = { ...document, [drag.element.dataset.studioKey!]: { ...drag.layer, x, y } };
    }
    function up() { if (drag?.moved) send('change', { document }); drag = null; }
    function click(event: MouseEvent) { event.preventDefault(); event.stopPropagation(); }
    function edit(event: MouseEvent) {
      const element = (event.target as HTMLElement).closest<HTMLElement>('[data-studio-key]');
      if (!element || element.tagName === 'IMG') return;
      element.contentEditable = 'plaintext-only'; element.focus();
    }
    function input(event: Event) {
      const element = event.target as HTMLElement;
      if (!element.isContentEditable) return;
      document = { ...document, [element.dataset.studioKey!]: { ...document[element.dataset.studioKey!], text: element.innerText } };
      send('change', { document }); send('select', { layer: describe(element) });
    }
    function blur(event: FocusEvent) {
      const element = event.target as HTMLElement;
      if (!element.isContentEditable) return;
      element.contentEditable = 'false'; document = { ...document, [element.dataset.studioKey!]: { ...document[element.dataset.studioKey!], text: element.innerText } };
      send('change', { document }); send('select', { layer: describe(element) });
    }
    function message(event: MessageEvent) {
      if (event.origin !== location.origin || event.source !== window.parent || event.data?.source !== 'huiteen-studio') return;
      if (event.data.type === 'hello') send('ready', { layers: [...elements.values()].filter(element => !element.dataset.studioKey?.startsWith('new-')).map(describe) });
      if (event.data.type === 'document') apply(event.data.document);
      if (event.data.type === 'select') { const element = elements.get(event.data.key); if (element) { choose(element); element.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    }
    host.addEventListener('pointerdown', down, true); host.addEventListener('pointermove', move, true); host.addEventListener('pointerup', up, true); host.addEventListener('pointercancel', up, true);
    host.addEventListener('click', click, true); host.addEventListener('dblclick', edit, true); host.addEventListener('focusout', blur, true); host.addEventListener('input', input, true); window.addEventListener('message', message);
    send('ready', { layers: [...elements.values()].filter(element => !element.dataset.studioKey?.startsWith('new-')).map(describe) });
    return () => { restore(); style.remove(); host.removeEventListener('pointerdown', down, true); host.removeEventListener('pointermove', move, true); host.removeEventListener('pointerup', up, true); host.removeEventListener('pointercancel', up, true); host.removeEventListener('click', click, true); host.removeEventListener('dblclick', edit, true); host.removeEventListener('focusout', blur, true); host.removeEventListener('input', input, true); window.removeEventListener('message', message); };
  }, [initial]);
  return <div ref={root}>{children}</div>;
}
