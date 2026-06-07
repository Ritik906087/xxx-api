import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Enhanced Send SMS handler that checks both body and query params for phone/mobileNo.
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await getSafeBody(request);
    
    // Check all possible sources for the phone number
    const mobileNo = body.mobileNo || body.phone || searchParams.get('mobileNo') || searchParams.get('phone');

    if (!mobileNo) {
      return errorResponse("mobileNo is required", 400);
    }

    // Generate 4-digit OTP as requested
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const apiKey = "951f7f09d99653a52a387d9afb";
    
    const payload = {
      apiKey: apiKey,
      mobileNo: mobileNo,
      messageType: "AUTH_OTP",
      brandName: "Monexo",
      otp: otp,
      senderId: "MRAOTP"
    };

    console.log('[SMS SEND REQUEST]:', payload);

    const response = await fetch("https://meraotp.in/api/sendSMS", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('[SMS SEND RESPONSE]:', result);

    const isSuccess = result.status === "success" || result.statusCode === 200 || result.status === "ok";
    
    if (isSuccess) {
      return jsonResponse("Send Success");
    } else {
      return errorResponse(result.message || "Gateway Error", 502);
    }
  } catch (e: any) {
    console.error('[SMS SEND CRITICAL ERROR]:', e);
    return errorResponse("Internal SMS Error", 500);
  }
}
