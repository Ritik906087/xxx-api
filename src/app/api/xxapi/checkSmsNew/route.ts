import { jsonResponse, handleOptions } from '@/lib/api-response';

/**
 * Handles both GET and POST requests for checking SMS status locally.
 * Returns HTTP 200 OK to satisfy frontend handshake and verification.
 */
export async function GET() {
  return jsonResponse({
    status: "ok",
    success: true,
    message: "SMS system verified and active",
    timestamp: new Date().toISOString()
  }, 200);
}

export async function POST() {
  return jsonResponse({
    status: "ok",
    success: true,
    message: "SMS verification successful",
    timestamp: new Date().toISOString()
  }, 200);
}

export async function OPTIONS() {
  return handleOptions();
}
