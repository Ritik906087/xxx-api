import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  try {
    const body = await getSafeBody(request);
    const mobileNo = body.mobileNo || body.phone;
    const otp = body.otp;
    
    console.log('[LOGIN ATTEMPT]:', { mobileNo, otp });

    // Prototype Logic: In a real app, verify OTP against DB/Redis
    // For the login endpoint, based on logs, success returns a data token
    const mockToken = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

    return jsonResponse(mockToken);

  } catch (e: any) {
    console.error('[LOGIN CRITICAL ERROR]:', e);
    return errorResponse("Internal Login Failure", 500);
  }
}
