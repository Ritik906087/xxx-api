
import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Generates a temporary token for SMS requests.
 * Handles both JSON and application/x-www-form-urlencoded
 */
export async function POST(request: Request) {
  // We parse the body but don't strictly need it for token generation
  // This prevents the request from hanging/failing if body is sent
  const body = await getSafeBody(request);
  console.log('[GETSENDTKEN REQUEST BODY]:', body);

  const token = "vantage_tk_" + Math.random().toString(36).substr(2, 16);
  
  return jsonResponse({
    success: true,
    token: token,
    expires_in: 300,
    received_context: body.token ? 'verification_ok' : 'initial_request'
  });
}
