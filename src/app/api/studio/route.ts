import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { projects } from '@/data/projects';
import { documentSchema } from '@/lib/studio-schema';
export const runtime = 'nodejs';
function allowed(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  let localOrigin: URL | null = null;
  try { localOrigin = origin ? new URL(origin) : null; } catch { return false; }
  return process.env.NODE_ENV === 'development' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    && localOrigin !== null && ['127.0.0.1', 'localhost', '[::1]'].includes(localOrigin.hostname)
    && localOrigin.host === host;
}
export async function POST(request: Request) {
  if (!allowed(request)) return Response.json({ error: '仅限本机工作台使用' }, { status: 403 });
  try {
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File) || file.size > 20 * 1024 * 1024) throw new Error('请选择 20MB 以内的 PNG、JPG、WebP 或 GIF');
      const bytes = Buffer.from(await file.arrayBuffer());
      const extension = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png'
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg'
        : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'webp'
        : /^GIF8[79]a/.test(bytes.toString('ascii', 0, 6)) ? 'gif' : null;
      if (!extension) throw new Error('不支持的图片格式');
      const name = `${randomUUID()}.${extension}`;
      await mkdir(path.join(process.cwd(), 'public/studio'), { recursive: true });
      await writeFile(path.join(process.cwd(), 'public/studio', name), bytes);
      return Response.json({ src: `/studio/${name}` });
    }
    const { slug, document } = await request.json();
    if (!projects.some(project => project.id === slug)) throw new Error('作品不存在');
    const parsed = documentSchema.parse(document);
    if (Object.keys(parsed).length > 1000) throw new Error('图层数量过多');
    const file = path.join(process.cwd(), 'src/data/studio/projects.json');
    const data = JSON.parse(await readFile(file, 'utf8'));
    data[slug] = parsed;
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`);
    await rename(temp, file);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : '保存失败' }, { status: 400 });
  }
}
