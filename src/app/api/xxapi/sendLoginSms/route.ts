import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Handles Login SMS requests with multiple parameter fallback logic.
 */
export async function POST(request: Request) {
  const logContext = `[LOGIN_SMS_${Date.now()}]`;
  try {
    const { searchParams } = new URL(request.url);
    const body = await getSafeBody(request);
    
    const mobileNo = 
      body.mobileNo || 
      body.phone || 
      body.mobile || 
      body.rawText ||
      searchParams.get('mobileNo') || 
      searchParams.get('phone');

    if (!mobileNo) {
      return errorResponse("mobileNo is required", 400, 400);
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

    console.log(`${logContext} Gateway Request:`, payload);

    const gatewayResponse = await fetch("https://meraotp.in/api/sendSMS", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await gatewayResponse.json();
    console.log(`${logContext} Gateway Response:`, result);

    const isSuccess = 
      result.status === "success" || 
      result.status === "ok" || 
      result.statusCode === 200 || 
      result.code === 200 ||
      result.code === 0;

    if (isSuccess) {
      return jsonResponse("Send Success");
    } else {
      return errorResponse(result.message || "Gateway rejection", 502, 502);
    }
  } catch (error: any) {
    console.error(`${logContext} ERROR:`, error);
    return errorResponse("Gateway Connection Failed", 500, 500);
  }
}
