import { NextRequest, NextResponse } from 'next/server';

const RESUME_URL =
  'https://web-resource-1372876299.cos.ap-guangzhou.myqcloud.com/RenRuiWebResume/%E4%BB%BB%E7%9D%BF-2027%E5%B1%8A-%E9%87%8D%E5%BA%86%E9%82%AE%E7%94%B5%E5%A4%A7%E5%AD%A6-%E7%AB%8B%E5%8D%B3%E5%88%B0%E5%B2%97-%E5%8F%AF%E5%AE%9E%E4%B9%A06%E6%9C%88_Agent%20PM.pdf';

const FILENAME = encodeURIComponent('任睿-2027届-重庆邮电大学-立即到岗-可实习6月-Agent PM.pdf');

export async function GET(req: NextRequest) {
  const disposition = req.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';
  const range = req.headers.get('range');

  const upstream = await fetch(RESUME_URL, {
    headers: range ? { Range: range } : undefined,
    cache: 'no-store',
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: 'Failed to load resume' }, { status: upstream.status });
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `${disposition}; filename*=UTF-8''${FILENAME}`);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=300');

  const contentLength = upstream.headers.get('content-length');
  const contentRange = upstream.headers.get('content-range');
  if (contentLength) headers.set('Content-Length', contentLength);
  if (contentRange) headers.set('Content-Range', contentRange);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
