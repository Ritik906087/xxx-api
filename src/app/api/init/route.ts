import { jsonResponse, handleOptions } from '@/lib/api-response';

/**
 * Endpoint for APK initialization.
 * Returns a valid clientId to prevent null pointer issues in old frontend.
 */
export async function GET() {
  const mockClientId = "V1" + Math.random().toString(36).substr(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase();
  
  return jsonResponse({
    status: "ok",
    initialized: true,
    session_id: "init_" + Math.random().toString(36).substr(2, 9),
    clientId: mockClientId,
    message: "System Ready"
  }, 200);
}

export async function OPTIONS() {
  return handleOptions();
}
