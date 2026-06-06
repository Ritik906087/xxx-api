
import { jsonResponse, handleOptions } from '@/lib/api-response';

/**
 * Handles GET requests for the application version.
 * Returns HTTP 200 and a valid JSON object.
 */
export async function GET() {
  return jsonResponse({
    version: "1.0.0",
    status: "ok"
  }, 200);
}

/**
 * Handles OPTIONS preflight requests for CORS.
 */
export async function OPTIONS() {
  return handleOptions();
}
