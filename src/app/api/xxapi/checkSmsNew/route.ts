
import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Handles both GET and POST for checking SMS status.
 * Prevents 405 Method Not Allowed during registration.
 */
export async function GET() {
  return jsonResponse({
    status: "ok",
    success: true,
    message: "SMS system active",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  const body = await getSafeBody(request);
  console.log('[CHECKSMSNEW POST DATA]:', body);
  
  return jsonResponse({
    status: "ok",
    success: true,
    message: "Verification context received",
    timestamp: new Date().toISOString()
  });
}
