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

    if (result.status === "success" || result.statusCode === 200) {
      return jsonResponse({
        success: true,
        message: "OTP sent successfully (Monexo)",
        ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
      });
    } else {
      return errorResponse(result.message || "Failed to send SMS via gateway", 502);
    }

  } catch (error: any) {
    return errorResponse("Internal Server Error", 500, error.message);
  }
}

export async function GET() { return errorResponse("Method Not Allowed", 405); }
