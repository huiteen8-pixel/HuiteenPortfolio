import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateUUID } from '@/lib/db';

// POST /api/analytics/links — create a new share link
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const slug = generateSlug();
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO share_links (id, name, slug, click_count, is_active, created_at)
      VALUES (?, ?, ?, 0, 1, ?)
      RETURNING id, name, slug, click_count, is_active, created_at
    `).get(generateUUID(), name.trim(), slug, new Date().toISOString());

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/analytics/links — list all share links
export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, name, slug, click_count, is_active, created_at
      FROM share_links
      ORDER BY created_at DESC
    `).all();

    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/analytics/links?id=xxx — delete a share link
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM share_links WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
