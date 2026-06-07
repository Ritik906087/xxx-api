import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  try {
    const body = await getSafeBody(request);
    const mobileNo = body.mobileNo || body.phone;

    if (!mobileNo) return errorResponse("mobileNo is required", 400);

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
