
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  try {
    const { mobileNo, token } = await request.json();
    if (!mobileNo) return errorResponse("mobileNo required", 400);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const apiKey = "4ef8fe7a7412390737d7a6e591";
    
    const response = await fetch("https://meraotp.in/api/sendSMS", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        mobileNo,
        messageType: "AUTH_OTP",
        brandName: "Vantage",
        otp,
        senderId: "MRAOTP"
      }),
    });

    const result = await response.json();
    return jsonResponse({
      success: result.status === "success",
      message: "SMS Request Processed",
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
