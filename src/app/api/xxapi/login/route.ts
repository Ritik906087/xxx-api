import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Hybrid Login handler that supports both phone and mobileNo.
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await getSafeBody(request);
    
    const mobileNo = body.mobileNo || body.phone || searchParams.get('mobileNo') || searchParams.get('phone');
    const otp = body.otp || searchParams.get('otp');
    
    console.log('[LOGIN ATTEMPT]:', { mobileNo, otp });

    // Mock success token for the APK to proceed
    const mockToken = "vantage_" + Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);

    return jsonResponse(mockToken);

  } catch (e: any) {
    console.error('[LOGIN CRITICAL ERROR]:', e);
    return errorResponse("Internal Login Failure", 500);
  }
}
