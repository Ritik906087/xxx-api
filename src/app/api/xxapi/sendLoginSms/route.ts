import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

/**
 * Sends a Login OTP using local MeraOTP integration.
 * No longer proxies to the old server to avoid 403/500 errors.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobileNo } = body;

    if (!mobileNo) {
      return errorResponse("mobileNo is required", 400);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const apiKey = "4ef8fe7a7412390737d7a6e591";
    const url = "https://meraotp.in/api/sendSMS";

    const payload = {
      apiKey: apiKey,
      mobileNo: mobileNo,
      messageType: "AUTH_OTP",
      brandName: "Vantage",
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
      message: result.message || "SMS Request Processed",
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
    });

  } catch (error: any) {
    return errorResponse("SMS Gateway Connection Failed", 500, error.message);
  }
}

export async function OPTIONS() {
  return handleOptions();
}
