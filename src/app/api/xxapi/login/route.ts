import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Robust Login handler for APK compatibility.
 * Returns exactly what the APK expects: code 0 and token string in data.
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

    console.log('[LOGIN ATTEMPT]:', { mobileNo });

    // Mock token matching the format d5e5f3b68f9b403a83e861ce31393de5
    const mockToken = "vantage_" + Math.random().toString(36).substr(2, 15);

    // Using jsonResponse which wraps it in { code: 0, msg: "success", data: mockToken }
    return jsonResponse(mockToken);

  } catch (e: any) {
    console.error('[LOGIN CRITICAL ERROR]:', e);
    return errorResponse("Internal Login Failure", 500, 500);
  }
}
