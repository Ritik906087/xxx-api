
import { jsonResponse, handleOptions } from '@/lib/api-response';

/**
 * Endpoint used by Android APK to fetch dynamic configuration.
 * Returning 200 OK prevents splash screen hang.
 */
export async function GET() {
  return jsonResponse({
    status: "ok",
    jsValue: "",
    message: "success",
    timestamp: new Date().toISOString()
  }, 200);
}

export async function OPTIONS() {
  return handleOptions();
}
