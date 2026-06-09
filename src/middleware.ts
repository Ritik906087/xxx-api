import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'vantage_admin_ultra_secret_key_2024');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin UI Protection
  if (pathname.startsWith('/admin')) {
    // Allow access to login page without token
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch (err) {
      console.error('[MIDDLEWARE AUTH ERROR]:', err);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // 2. Admin API Protection
  if (pathname.startsWith('/api/admin')) {
    // Allow login endpoint
    if (pathname === '/api/admin/login') {
      return NextResponse.next();
    }

    const token = request.cookies.get('admin_token')?.value || request.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ success: false, msg: 'Security Bypass Detected: Unauthorized' }, { status: 401 });
    }

    try {
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.json({ success: false, msg: 'Invalid Admin Session' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};