import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Sends a Login OTP using local MeraOTP integration with Monexo Branding.
 */
export async function POST(request: Request) {
  const logContext = `[LOGIN_SMS_${Date.now()}]`;
  try {
    const { searchParams } = new URL(request.url);
    const body = await getSafeBody(request);
    
    console.log(`${logContext} Incoming Request:`, { body, params: Object.fromEntries(searchParams.entries()) });

    const mobileNo = body.mobileNo || body.phone || searchParams.get('mobileNo') || searchParams.get('phone');

    if (!mobileNo) {
      console.error(`${logContext} Error: mobileNo is missing`);
      return errorResponse("mobileNo is required", 400);
    }

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

    console.log(`${logContext} Gateway Payload:`, payload);

    const gatewayResponse = await fetch("https://meraotp.in/api/sendSMS", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await gatewayResponse.json();
    console.log(`${logContext} Gateway Response:`, { status: gatewayResponse.status, body: result });

    const isSuccess = 
      result.status === "success" || 
      result.status === "ok" || 
      result.statusCode === 200 || 
      result.code === 200 ||
      result.code === 0 ||
      (result.message && result.message.toLowerCase().includes('success'));

    if (isSuccess) {
      console.log(`${logContext} Status: SUCCESS`);
      return jsonResponse("Send Success");
    } else {
      console.warn(`${logContext} Status: FAILURE from Gateway`);
      return errorResponse(result.message || "Gateway rejection", 502);
    }
  } catch (error: any) {
    console.error(`${logContext} CRITICAL ERROR:`, error);
    return errorResponse("SMS Gateway Connection Failed", 500, error.message);
  }
}
