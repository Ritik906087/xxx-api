import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

/**
 * Handles OPTIONS preflight requests for CORS.
 */
export async function OPTIONS() {
  return handleOptions();
}

/**
 * Endpoint: POST /xxapi/register
 * Purpose: Registers a new user and ensures identity mapping is ready.
 * Now captures and stores passwords for secure login.
 */
export async function POST(request: Request) {
  try {
    const body = await getSafeBody(request);
    
    const mobileNo = 
      body.mobileNo || 
      body.phone || 
      body.mobile || 
      body.mobile_no || 
      body.username ||
      body.extractedPhone;

    if (!mobileNo) {
      return errorResponse("mobileNo is required", 400);
    }

    const cleanMobile = String(mobileNo).replace(/\D/g, '').slice(-10);
    const password = body.password || body.identity || body.pwd; // Capture password from various possible fields

    const db = await getDb();
    const usersCollection = db.collection('users');

    // 1. Check if user already exists (Prevent duplicate registrations)
    const existingUser = await usersCollection.findOne({ mobileNo: cleanMobile });

    if (!existingUser) {
      // Generate initial token even on register for immediate session readiness
      const initialToken = "v_tk_reg_" + Math.random().toString(36).substr(2, 15);
      
      await usersCollection.insertOne({
        mobileNo: cleanMobile,
        username: cleanMobile,
        password: password || null, // Store password for future login validation
        role: 'user',
        status: 1,
        createdAt: new Date().toISOString(),
        itoken: 0,
        totalProfit: 0,
        token: initialToken
      });
      console.log(`[REGISTER] New user record created for: ${cleanMobile}`);
    } else {
      console.log(`[REGISTER] User ${cleanMobile} already exists, returning success (Idempotent)`);
      // Optionally update password if identity mapping is being re-established, 
      // but usually we keep the old one for security.
    }

    // Exact success format expected by legacy frontend/APK
    return jsonResponse({
      code: 0,
      msg: "success"
    });

  } catch (error: any) {
    console.error('[REGISTER CRITICAL ERROR]:', error);
    return errorResponse("Internal Server Error", 500);
  }
}
