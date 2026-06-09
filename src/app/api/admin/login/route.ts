import { jsonResponse, errorResponse } from '@/lib/api-response';
import { createAdminToken } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123'
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const token = await createAdminToken({ 
        username, 
        role: 'super_admin',
        ts: Date.now() 
      });
      
      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/', // Critical: Ensure cookie is available for all admin routes
        maxAge: 60 * 60 * 24 // 24 hours
      });

      return jsonResponse({ 
        success: true, 
        msg: 'Login successful',
        redirect: '/admin'
      });
    }

    return errorResponse('Access Denied: Invalid credentials.', 401);
  } catch (e: any) {
    console.error('[ADMIN LOGIN ERROR]:', e);
    return errorResponse('Identity Server Internal Error', 500);
  }
}