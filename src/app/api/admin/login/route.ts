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
      const token = await createAdminToken({ username, role: 'super_admin' });
      
      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      });

      return jsonResponse({ success: true, msg: 'Login successful' });
    }

    return errorResponse('Invalid credentials', 401);
  } catch (e: any) {
    return errorResponse('Server Error', 500);
  }
}
