import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Generates a temporary token for SMS requests.
 * Logic: If phone is provided, return 2085 code as seen in logs.
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const body = await getSafeBody(request);
  
  const phone = body.phone || body.mobileNo || body.extractedPhone || searchParams.get('phone');
  
  // Logic from logs: If phone is provided, APK expects code 2085 "No Need Send Otp"
  if (phone && phone.length >= 10) {
    return jsonResponse({
      code: 2085,
      msg: "No Need Send Otp"
    });
  }

  const token = "v_tk_" + Math.random().toString(36).substr(2, 20).toUpperCase();
  
  // Standard success response for getsendtken
  return jsonResponse(token);
}

export async function GET() {
  return jsonResponse("Vantage Token System Active");
}
