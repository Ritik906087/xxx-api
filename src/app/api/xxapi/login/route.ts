import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Robust Login handler for APK compatibility.
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await getSafeBody(request);
    
    const mobileNo = 
      body.mobileNo || 
      body.phone || 
      body.mobile || 
      body.user || 
      body.username ||
      searchParams.get('mobileNo') || 
      searchParams.get('phone');

    const otp = body.otp || searchParams.get('otp');
    
    console.log('[LOGIN ATTEMPT]:', { mobileNo, otp });

    // Mock success token format for the APK
    const mockToken = "vantage_" + Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);

    // Return exactly what the APK expects: code 0 and token string in data
    return jsonResponse(mockToken);

  } catch (e: any) {
    console.error('[LOGIN CRITICAL ERROR]:', e);
    return errorResponse("Internal Login Failure", 500, 500);
  }
}
