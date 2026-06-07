import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

/**
 * Standard SMS sending route using MeraOTP with Monexo Branding.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobileNo } = body;

    if (!mobileNo) return errorResponse("mobileNo required", 400);

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const apiKey = "951f7f09d99653a52a387d9afb";
    
    const response = await fetch("https://meraotp.in/api/sendSMS", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        mobileNo,
        messageType: "AUTH_OTP",
        brandName: "Monexo",
        otp,
        senderId: "MRAOTP"
      }),
    });

    const result = await response.json();
    
    return jsonResponse({
      status: "ok",
      success: result.status === "success" || result.statusCode === 200,
      message: "SMS Request Dispatched (Monexo)",
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
    });
  } catch (e: any) {
    return errorResponse("Internal SMS Error", 500, e.message);
  }
}

export async function OPTIONS() {
  return handleOptions();
}
