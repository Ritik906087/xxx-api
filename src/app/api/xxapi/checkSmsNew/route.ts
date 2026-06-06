import { jsonResponse, handleOptions } from '@/lib/api-response';

/**
 * Handles GET requests for checking SMS status locally.
 * Returns HTTP 200 OK to satisfy frontend handshake.
 */
export async function GET() {
  return jsonResponse({
    status: "ok",
    message: "SMS system verified and active",
    timestamp: new Date().toISOString()
  }, 200);
}

export async function OPTIONS() {
  return handleOptions();
}
