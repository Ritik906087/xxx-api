
import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  try {
    const body = await getSafeBody(request);
    const { mobileNo, otp } = body;
    
    console.log('[LOGIN ATTEMPT]:', { mobileNo, otpLength: otp?.length });

    if (otp && otp.length !== 4) {
      return errorResponse("Invalid OTP format. Expected 4 digits.", 401);
    }

    const db = await getDb();
    const users = db.collection('users');
    const user = await users.findOne({ mobileNo });

    if (!user) {
      return errorResponse("User not found. Please register first.", 404);
    }

    return jsonResponse({
      success: true,
      message: "Login successful",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_supabase_token",
      user: {
        id: user._id,
        mobileNo: user.mobileNo,
        fullName: user.fullName,
        role: user.role || "user"
      }
    });
  } catch (e: any) {
    console.error('[LOGIN CRITICAL ERROR]:', e);
    return errorResponse("Internal Login Failure", 500, e.message);
  }
}
