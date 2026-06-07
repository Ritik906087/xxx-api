import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Enhanced Send SMS handler that captures phone from any possible source.
 */
export async function POST(request: Request) {
  const logContext = `[SMS_SEND_${Date.now()}]`;
  try {
    const { searchParams } = new URL(request.url);
    const body = await getSafeBody(request);
    
    // Comprehensive check for mobile number
    const mobileNo = 
      body.mobileNo || 
      body.phone || 
      body.mobile || 
      body.user || 
      body.username ||
      body.extractedPhone ||
      body.rawText ||
      searchParams.get('mobileNo') || 
      searchParams.get('phone') ||
      request.headers.get('phone');

    if (!mobileNo || String(mobileNo).length < 10) {
      console.error(`${logContext} Error: mobileNo is missing or invalid. Body:`, body);
      return errorResponse("mobileNo is required", 400, 400);
    }

    // Clean number to 10 digits
    const cleanPhone = String(mobileNo).replace(/\D/g, '').slice(-10);

    // Generate 4-digit OTP for Monexo
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const apiKey = "951f7f09d99653a52a387d9afb";
    
    const gatewayPayload = {
      apiKey: apiKey,
      mobileNo: cleanPhone,
      messageType: "AUTH_OTP",
      brandName: "Monexo",
      otp: otp,
      senderId: "MRAOTP"
    };

    console.log(`${logContext} Sending to MeraOTP:`, gatewayPayload);

    const gatewayResponse = await fetch("https://meraotp.in/api/sendSMS", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gatewayPayload),
    });

    const result = await gatewayResponse.json();
    console.log(`${logContext} Gateway Response:`, result);

    const isSuccess = 
      result.status === "success" || 
      result.status === "ok" || 
      result.statusCode === 200 || 
      result.code === 200 ||
      result.code === 0 ||
      (result.message && result.message.toLowerCase().includes('success'));
    
    if (isSuccess) {
      // Return exactly what the APK expects
      return jsonResponse("Send Success");
    } else {
      console.warn(`${logContext} Gateway Failure`);
      return errorResponse(result.message || "Gateway Error", 502, 502);
    }
  } catch (e: any) {
    console.error(`${logContext} CRITICAL ERROR:`, e);
    return errorResponse("Internal SMS Service Error", 500, 500);
  }
}
