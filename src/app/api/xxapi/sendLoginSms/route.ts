import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

/**
 * Sends a Login OTP using local MeraOTP integration with Monexo Branding.
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

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    return jsonResponse({
      status: result.status === "success" || result.statusCode === 200 ? "ok" : "failed",
      success: result.status === "success" || result.statusCode === 200,
      message: result.message || "SMS Request Processed (Monexo)",
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
    });

  } catch (error: any) {
    return errorResponse("SMS Gateway Connection Failed", 500, error.message);
  }
}

export async function OPTIONS() {
  return handleOptions();
}
