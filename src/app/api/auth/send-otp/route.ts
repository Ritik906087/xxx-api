import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobileNo } = body;

    if (!mobileNo) {
      return errorResponse("mobileNo is required", 400);
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // MeraOTP Integration
    const apiKey = "4ef8fe7a7412390737d7a6e591";
    const url = "https://meraotp.in/api/sendSMS";

    const payload = {
      apiKey: apiKey,
      mobileNo: mobileNo,
      messageType: "AUTH_OTP",
      brandName: "Monexo",
      otp: otp,
      senderId: "MRAOTP"
    };

    console.log('[AUTH SEND OTP REQUEST]:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('[AUTH SEND OTP RESPONSE]:', result);

    const isSuccess = result.status === "success" || result.statusCode === 200 || result.status === "ok";

    if (isSuccess) {
      return jsonResponse({
        success: true,
        message: "OTP sent successfully (Monexo)",
        ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
      });
    } else {
      return errorResponse(result.message || "Failed to send SMS via gateway", 502);
    }

  } catch (error: any) {
    console.error('[AUTH SEND OTP CRITICAL ERROR]:', error);
    return errorResponse("Internal Server Error", 500, error.message);
  }
}

export async function GET() { return errorResponse("Method Not Allowed", 405); }
