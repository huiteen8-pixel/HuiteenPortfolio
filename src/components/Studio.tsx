'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { StudioDocument, StudioLayer } from '@/lib/studio-schema';
import './Studio.css';
type Layer = StudioLayer & { key: string };
export default function Studio({ projects, saved }: { projects: { id: string; title: string }[]; saved: Record<string, StudioDocument> }) {
  const [slug, setSlug] = useState('icu-plus');
  const [document, setDocument] = useState<StudioDocument>(saved['icu-plus'] ?? {});
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState<Layer | null>(null);
  const [zoom, setZoom] = useState(70);
  const [viewport, setViewport] = useState(1440);
  const [status, setStatus] = useState('选择页面里的文字或图片开始编辑');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState({ past: 0, future: 0 });
  const frame = useRef<HTMLIFrameElement>(null);
  const history = useRef<{ past: StudioDocument[]; future: StudioDocument[] }>({ past: [], future: [] });
  function countHistory() { setCounts({ past: history.current.past.length, future: history.current.future.length }); }
  const current = useRef(document);
  const file = useRef<HTMLInputElement>(null);
  const uploadMode = useRef<'add' | 'replace'>('add');
  function post(type: string, data: object) { frame.current?.contentWindow?.postMessage({ source: 'huiteen-studio', type, ...data }, location.origin); }
  function change(next: StudioDocument, push = true) {
    if (push) { history.current.past.push(current.current); history.current.future = []; }
    countHistory(); current.current = next; setDocument(next); setDirty(true); post('document', { document: next }); setStatus('尚未保存');
  }
  useEffect(() => {
    const handshake = window.setInterval(() => post('hello', {}), 500);
    function receive(event: MessageEvent) {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || event.data?.source !== 'huiteen-preview') return;
      if (event.data.type === 'ready') { window.clearInterval(handshake); setLayers(event.data.layers); post('document', { document: current.current }); }
      if (event.data.type === 'select') setSelected(event.data.layer);
      if (event.data.type === 'change') { history.current.past.push(current.current); history.current.future = []; countHistory(); current.current = event.data.document; setDocument(event.data.document); setDirty(true); setStatus('尚未保存'); }
    }
    function leaving(event: BeforeUnloadEvent) { if (current.current !== saved[slug] && history.current.past.length) event.preventDefault(); }
    window.addEventListener('message', receive); window.addEventListener('beforeunload', leaving);
    return () => { window.clearInterval(handshake); window.removeEventListener('message', receive); window.removeEventListener('beforeunload', leaving); };
  }, [saved, slug]);
  function update(patch: StudioLayer) { if (selected) { change({ ...current.current, [selected.key]: { ...current.current[selected.key], ...patch } }); setSelected({ ...selected, ...patch }); } }
  function undo(redo = false) {
    const from = redo ? history.current.future : history.current.past;
    const to = redo ? history.current.past : history.current.future;
    const next = from.pop(); if (!next) return;
    to.push(current.current); change(next, false); setSelected(null);
  }
  async function save() {
    setBusy(true);
    try { const response = await fetch('/api/studio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, document: current.current }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setDirty(false); history.current.past.length = 0; history.current.future.length = 0; countHistory(); setStatus('已保存到项目 · 网页已同步'); }
    catch (error) { setStatus(error instanceof Error ? error.message : '保存失败'); }
    finally { setBusy(false); }
  }
  function add(layer: StudioLayer) {
    const key = `new-${crypto.randomUUID()}`;
    const value = { ...layer, after: selected?.key ?? layers.at(-1)?.key };
    change({ ...current.current, [key]: value }); setSelected({ key, ...value }); post('select', { key });
  }
  async function upload(image: File) {
    setBusy(true); setStatus('正在上传图片…');
    try { const form = new FormData(); form.append('file', image); const response = await fetch('/api/studio', { method: 'POST', body: form }); const result = await response.json(); if (!response.ok) throw new Error(result.error); if (uploadMode.current === 'replace' && selected) update({ src: result.src }); else add({ kind: 'image', src: result.src, width: 800 }); }
    catch (error) { setStatus(error instanceof Error ? error.message : '上传失败'); }
    finally { setBusy(false); if (file.current) file.current.value = ''; }
  }
  const allLayers = [...layers, ...Object.entries(document).filter(([key]) => key.startsWith('new-')).map(([key, value]) => ({ key, ...value }))];
  const value = selected ? { ...selected, ...document[selected.key] } : null;
  return <main className="studio-shell">
    <header className="studio-toolbar"><Link href="/" className="studio-brand">H<span>✳</span> <small>STUDIO</small></Link>
      <select aria-label="选择作品" value={slug} onChange={event => { if (dirty && !confirm('还有未保存的修改，确定切换作品？')) return; const next = event.target.value; setSlug(next); const data = saved[next] ?? {}; current.current = data; setDocument(data); setLayers([]); setSelected(null); history.current.past.length = 0; history.current.future.length = 0; countHistory(); setDirty(false); }}>
        {projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
      </select>
      <Button variant="ghost" onClick={() => undo()} disabled={!counts.past}>↶ 撤销</Button><Button variant="ghost" onClick={() => undo(true)} disabled={!counts.future}>↷ 重做</Button>
      <span className="studio-toolbar-spacer" />
      <a href={`/projects/${slug}`} target="_blank" rel="noreferrer">打开网页 ↗</a>
      <Button onClick={save} disabled={busy || !dirty}>{busy ? '处理中…' : '保存并同步'}</Button>
    </header>
    <aside className="studio-layers"><h2>作品内容 <small>{allLayers.length}</small></h2><p>点击选择 · 双击文字编辑</p><div className="studio-add"><Button variant="outline" onClick={() => add({ kind: 'text', text: '输入你的文字', fontSize: 28 })}>＋ 文字</Button><Button variant="outline" disabled={busy} onClick={() => { uploadMode.current = 'add'; file.current?.click(); }}>＋ 图片</Button></div>
      <div className="studio-layer-list">{allLayers.map(layer => <button key={layer.key} className={selected?.key === layer.key ? 'active' : ''} onClick={() => { setSelected(layer); post('select', { key: layer.key }); }}><span>{layer.src ? '▧' : 'T'}</span>{document[layer.key]?.text ?? layer.text ?? '图片'}{document[layer.key]?.hidden ? '（隐藏）' : ''}</button>)}</div>
    </aside>
    <section className="studio-workspace"><div className="studio-canvas-tools"><span>实时画布</span><select aria-label="预览设备" value={viewport} onChange={event => setViewport(Number(event.target.value))}><option value={1440}>桌面 · 1440</option><option value={390}>手机 · 390</option></select><select aria-label="画布缩放" value={zoom} onChange={event => setZoom(Number(event.target.value))}>{[40,50,60,70,85,100].map(size => <option key={size} value={size}>{size}%</option>)}</select></div>
      <div className="studio-canvas-scroll"><div className="studio-frame-wrap" style={{ width: viewport * zoom / 100, height: 1000 * zoom / 100 }}><iframe key={slug} ref={frame} title="作品实时编辑画布" src={`/projects/${slug}?studio=1`} style={{ width: viewport, height: 1000, transform: `scale(${zoom / 100})` }} /></div></div>
      <footer className="studio-status" role="status"><i className={dirty ? 'dirty' : ''} />{status}<span>拖动调整位置 · 页面内滚动浏览</span></footer>
    </section>
    <aside className="studio-properties"><h2>设计</h2>{value ? <><p className="studio-selection-name">{value.src ? '图片图层' : '文字图层'}</p>{!value.src && <label>文字内容<textarea aria-label="文字内容" value={value.text ?? ''} onChange={event => update({ text: event.target.value })} rows={6} /></label>}
      <div className="studio-fields">{(['x','y','width','rotation',...(!value.src ? ['fontSize'] : [])] as const).map(field => <label key={field}>{{ x:'X 位置', y:'Y 位置', width:'宽度', rotation:'旋转 °', fontSize:'字号' }[field]}<Input type="number" aria-label={field} value={Math.round(Number(value[field as keyof StudioLayer] ?? 0))} onChange={event => { const n = Number(event.target.value); if (!Number.isFinite(n)) return; update({ [field]: field === 'width' ? Math.max(20,Math.min(3000,n)) : field === 'fontSize' ? Math.max(8,Math.min(240,n)) : field === 'rotation' ? Math.max(-180,Math.min(180,n)) : Math.max(-3000,Math.min(3000,n)) }); }} /></label>)}</div>
      {value.src && <Button variant="outline" onClick={() => { uploadMode.current = 'replace'; file.current?.click(); }}>替换图片</Button>}
      <Button variant="outline" onClick={() => update({ hidden: !value.hidden })}>{value.hidden ? '显示图层' : '隐藏图层'}</Button>
      <Button variant="ghost" onClick={() => { const next = { ...current.current }; delete next[value.key]; change(next); setSelected(null); }}>恢复此图层</Button>
      </> : <div className="studio-empty"><span>↖</span><h3>从画布开始</h3><p>选择一段文字或一张图片，<br />在这里调整它的细节。</p><p>新增内容会放在所选内容之后。</p></div>}
      <div className="studio-note">本机工作台<br />保存后刷新作品页即可查看。<br />GitHub 上传仍按你的指令操作。</div>
    </aside><input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={event => { if (event.target.files?.[0]) void upload(event.target.files[0]); }} />
  </main>;
}
