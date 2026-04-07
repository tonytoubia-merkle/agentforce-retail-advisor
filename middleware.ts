/**
 * Vercel Edge Middleware — subdomain-based routing for multi-tenant demos.
 *
 * Routing logic:
 *   admin.demo-combobulator.com   → rewrite to /admin/* routes
 *   {slug}.demo-combobulator.com  → rewrite with x-demo-slug header (consumed by DemoContext)
 *   demo-combobulator.com (bare)  → default golden template (no rewrite)
 *   localhost               → uses ?demo= query param (handled client-side)
 */
import { NextRequest, NextResponse } from 'next/server';

// The base domain — configure via env or hardcode for now
const BASE_DOMAIN = process.env.DEMO_BASE_DOMAIN || 'demo-combobulator.com';

export const config = {
  matcher: ['/((?!_next|api|assets|favicon).*)'],
};

export default function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const hostname = host.split(':')[0]; // strip port for local dev

  // Skip non-custom-domain requests (Vercel preview URLs, localhost)
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.vercel.app') ||
    !hostname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract subdomain
  const parts = hostname.replace(`.${BASE_DOMAIN}`, '').split('.');
  const subdomain = parts.length > 0 && hostname !== BASE_DOMAIN ? parts[0] : null;

  if (!subdomain || subdomain === 'www') {
    // Bare domain → default demo
    return NextResponse.next();
  }

  if (subdomain === 'admin') {
    // Admin subdomain → rewrite to /admin if not already there
    const url = req.nextUrl.clone();
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Demo subdomain → inject slug header for DemoContext to read
  const res = NextResponse.next();
  res.headers.set('x-demo-slug', subdomain);
  // Also set a cookie so client-side JS can read it (headers aren't available in browser)
  res.cookies.set('demo-slug', subdomain, { path: '/', httpOnly: false });
  return res;
}
