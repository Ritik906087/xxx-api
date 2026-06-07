import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Generates a temporary token for SMS requests.
 * Expected by APK to pass splash/init phase.
 */
export async function POST(request: Request) {
  const body = await getSafeBody(request);
  console.log('[GETSENDTKEN REQUEST]:', body);

  // Return specific code if phone is missing or other logic is needed
  // But for now, we follow the success pattern from the logs
  const token = "vantage_tk_" + Math.random().toString(36).substr(2, 16);
  
  return jsonResponse(token);
}

export async function GET() {
  return jsonResponse("Vantage Token System Active");
}
