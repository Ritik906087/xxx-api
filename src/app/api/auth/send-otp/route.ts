
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // MeraOTP Integration
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

    if (result.status === "success" || result.statusCode === 200) {
      return jsonResponse({
        success: true,
        message: "OTP sent successfully",
        // Only return otp in dev/testing mode
        ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
      });
    } else {
      return errorResponse(result.message || "Failed to send SMS", 502);
    }

  } catch (error: any) {
    return errorResponse("Internal Server Error", 500, error.message);
  }
}

// Ensure other methods return 405
export async function GET() { return errorResponse("Method Not Allowed", 405); }
