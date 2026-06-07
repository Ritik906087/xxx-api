import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

/**
 * Sends a Login OTP using local MeraOTP integration with Monexo Branding.
 * Fixed to use the correct API key and payload structure.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobileNo } = body;

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

    console.log('[SMS GATEWAY REQUEST]:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('[SMS GATEWAY RESPONSE]:', result);

    const isSuccess = result.status === "success" || result.statusCode === 200 || result.status === "ok";

    return jsonResponse({
      status: isSuccess ? "ok" : "failed",
      success: isSuccess,
      message: result.message || (isSuccess ? "SMS Request Processed (Monexo)" : "SMS Gateway rejected request"),
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
    });

  } catch (error: any) {
    console.error('[SMS GATEWAY CRITICAL ERROR]:', error);
    return errorResponse("SMS Gateway Connection Failed", 500, error.message);
  }
}

export async function OPTIONS() {
  return handleOptions();
}
