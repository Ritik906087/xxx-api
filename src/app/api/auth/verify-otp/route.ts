
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobileNo, otp } = body;

    if (!mobileNo || !otp) {
      return errorResponse("mobileNo and otp are required", 400);
    }

    // Prototype Logic: Accept '123456' or any 6-digit code for now
    // In production, you would verify against MongoDB/Redis
    if (otp.length === 6) {
      return jsonResponse({
        success: true,
        message: "Session authorized",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Mock JWT
        user: {
          id: "usr_mock",
          phone: mobileNo,
          role: "user"
        }
      });
    }

    return errorResponse("Invalid OTP", 401);

  } catch (error: any) {
    return errorResponse("Internal Server Error", 500, error.message);
  }
}

export async function GET() { return errorResponse("Method Not Allowed", 405); }
