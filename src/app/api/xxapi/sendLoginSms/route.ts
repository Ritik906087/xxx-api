import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Sends a Login OTP using local MeraOTP integration with Monexo Branding.
 * Checks both body and search params for flexibility.
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await getSafeBody(request);
    
    const mobileNo = body.mobileNo || body.phone || searchParams.get('mobileNo') || searchParams.get('phone');

    if (!mobileNo) {
      return errorResponse("mobileNo is required", 400);
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const apiKey = "951f7f09d99653a52a387d9afb";
    const url = "https://meraotp.in/api/sendSMS";

    const payload = {
      apiKey: apiKey,
      mobileNo: mobileNo,
      messageType: "AUTH_OTP",
      brandName: "Monexo",
      otp: otp,
      senderId: "MRAOTP"
    };

    console.log('[LOGIN SMS REQUEST]:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('[LOGIN SMS RESPONSE]:', result);

    const isSuccess = result.status === "success" || result.statusCode === 200 || result.status === "ok";

    if (isSuccess) {
      return jsonResponse("Send Success");
    } else {
      return errorResponse(result.message || "Gateway rejection", 502);
    }

  } catch (error: any) {
    console.error('[LOGIN SMS CRITICAL ERROR]:', error);
    return errorResponse("SMS Gateway Connection Failed", 500);
  }
}
