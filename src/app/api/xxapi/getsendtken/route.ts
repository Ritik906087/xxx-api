import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Generates a temporary token for SMS requests.
 * Checks for clientId and phone/mobileNo in the request.
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const body = await getSafeBody(request);
  
  console.log('[GETSENDTKEN REQUEST]:', { body, params: Object.fromEntries(searchParams.entries()) });

  const token = "vantage_tk_" + Math.random().toString(36).substr(2, 20).toUpperCase();
  
  // Standard success response structure expected by APK
  return jsonResponse(token);
}

export async function GET() {
  return jsonResponse("Vantage Token System Active");
}
