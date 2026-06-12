import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Secure admin API metrics endpoint
  if (pathname.startsWith('/api/admin/metrics')) {
    const cookie = request.cookies.get('gg_root_access')?.value;
    if (cookie !== process.env.ADMIN_COOKIE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  // 2. Secure superadmin portal pages
  if (pathname.startsWith('/superadmin') && !pathname.startsWith('/superadmin/auth')) {
    const cookie = request.cookies.get('gg_root_access')?.value;
    if (cookie !== process.env.ADMIN_COOKIE_SECRET) {
      const url = request.nextUrl.clone();
      url.pathname = '/superadmin/auth';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/superadmin/:path*', '/api/admin/metrics'],
};
