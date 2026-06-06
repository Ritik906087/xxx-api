
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  try {
    const { mobileNo, otp, password } = await request.json();
    
    // Validate OTP (Prototype: length check)
    if (otp && otp.length !== 6) {
      return errorResponse("Invalid OTP format", 401);
    }

    const db = await getDb();
    const users = db.collection('users');
    const user = await users.findOne({ mobileNo });

    if (!user) {
      return errorResponse("User not found. Please register.", 404);
    }

    return jsonResponse({
      success: true,
      message: "Login successful",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_supabase_token",
      user: {
        id: user._id,
        mobileNo: user.mobileNo,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (e: any) {
    return errorResponse("Login failed", 500);
  }
}
