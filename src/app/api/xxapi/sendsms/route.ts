import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

/**
 * Standard SMS sending route using MeraOTP with Monexo Branding.
 * Fixed to use the correct API key and 4-digit OTP.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobileNo } = body;

    if (!mobileNo) return errorResponse("mobileNo required", 400);

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const apiKey = "951f7f09d99653a52a387d9afb";
    
    const payload = {
      apiKey: apiKey,
      mobileNo,
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
    
    return jsonResponse({
      status: isSuccess ? "ok" : "failed",
      success: isSuccess,
      message: result.message || (isSuccess ? "SMS Request Dispatched (Monexo)" : "Gateway Error"),
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
    });
  } catch (e: any) {
    console.error('[SMS SEND CRITICAL ERROR]:', e);
    return errorResponse("Internal SMS Error", 500, e.message);
  }
}

export async function OPTIONS() {
  return handleOptions();
}
