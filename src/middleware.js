import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'shipshaft_session';

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET || 'shipshaft_super_secure_jwt_secret_dev_key_2026';
  return new TextEncoder().encode(secret);
}

async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifyToken(sessionToken);
  const isAuthenticated = Boolean(session && session.userId);

  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // If already logged in and visiting login/register, redirect to authorized portal
  if (isAuthRoute) {
    if (isAuthenticated) {
      let target = '/dashboard';
      if (session.role === 'AGENT') target = '/agent/dashboard';
      if (session.role === 'ADMIN') target = '/admin';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // Protected route checking
  const isCustomerRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/shipments' ||
    pathname.startsWith('/shipments/') ||
    pathname.startsWith('/payments/') ||
    pathname.startsWith('/invoices/') ||
    pathname === '/notifications' ||
    pathname.startsWith('/notifications/') ||
    pathname === '/settings' ||
    pathname.startsWith('/settings/');

  const isAgentRoute = pathname === '/agent' || pathname.startsWith('/agent/');
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  const isProtectedRoute = isCustomerRoute || isAgentRoute || isAdminRoute;

  if (isProtectedRoute) {
    // Unauthenticated user -> redirect to login with return path
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based Access Control (RBAC) enforcement
    if (isAdminRoute && session.role !== 'ADMIN') {
      const fallback = session.role === 'AGENT' ? '/agent/dashboard' : '/dashboard';
      return NextResponse.redirect(new URL(fallback, request.url));
    }

    if (isAgentRoute && session.role !== 'AGENT' && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Prevent ADMIN from accessing customer dashboard or customer settings
    if (session.role === 'ADMIN') {
      if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      if (pathname === '/settings' || pathname.startsWith('/settings/')) {
        return NextResponse.redirect(new URL('/admin/settings', request.url));
      }
    }

    // Prevent AGENT from accessing customer routes
    if (session.role === 'AGENT') {
      if (pathname === '/settings' || pathname.startsWith('/settings/')) {
        return NextResponse.redirect(new URL('/agent/settings', request.url));
      }
      if (isCustomerRoute) {
        return NextResponse.redirect(new URL('/agent/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/shipments',
    '/shipments/:path*',
    '/payments/:path*',
    '/invoices/:path*',
    '/notifications',
    '/notifications/:path*',
    '/settings',
    '/settings/:path*',
    '/agent',
    '/agent/:path*',
    '/admin',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
