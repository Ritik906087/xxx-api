import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Generates a temporary token for SMS requests.
 * Expected by APK to start the registration flow.
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const body = await getSafeBody(request);
  
  const phone = body.phone || body.mobileNo || body.extractedPhone || searchParams.get('phone');
  
  // Logic: If phone is provided, APK might expect a skip code
  if (phone && phone.length >= 10) {
    // Some APKs use 2085 to indicate OTP isn't needed or already verified
    // Returning this to see if it fixes the splash/login hang
    return jsonResponse({
      code: 2085,
      msg: "No Need Send Otp"
    });
  }

  const token = "vantage_tk_" + Math.random().toString(36).substr(2, 20).toUpperCase();
  
  // Standard success response for getsendtken
  return jsonResponse(token);
}

export async function GET() {
  return jsonResponse("Vantage Token System Active");
}
