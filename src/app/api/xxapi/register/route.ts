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
 * Purpose: Registers a new user based on mobile number and returns the exact legacy success format.
 * Matches: {"code":0,"msg":"success"}
 */
export async function POST(request: Request) {
  try {
    // getSafeBody is used to capture phone numbers from Body, URL, or Headers automatically
    const body = await getSafeBody(request);
    
    // Support all common field names for mobile number as per old server logic
    const mobileNo = 
      body.mobileNo || 
      body.phone || 
      body.mobile || 
      body.mobile_no || 
      body.username ||
      body.extractedPhone;

    if (!mobileNo) {
      console.warn('[REGISTER] Missing mobile identity in request');
      return errorResponse("mobileNo is required", 400);
    }

    const cleanMobile = String(mobileNo).replace(/\D/g, '').slice(-10);

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ mobileNo: cleanMobile });

    if (!existingUser) {
      // Create a basic profile in MongoDB for the user
      await usersCollection.insertOne({
        mobileNo: cleanMobile,
        username: cleanMobile,
        role: 'user',
        status: 1,
        createdAt: new Date().toISOString(),
        itoken: 0,
        totalProfit: 0
      });
      console.log(`[REGISTER] New user record created for: ${cleanMobile}`);
    } else {
      console.log(`[REGISTER] User ${cleanMobile} already exists, returning success`);
    }

    // Return the exact success format expected by the legacy frontend/APK
    return jsonResponse({
      code: 0,
      msg: "success"
    });

  } catch (error: any) {
    console.error('[REGISTER CRITICAL ERROR]:', error);
    // Even on error, we try to maintain the code-based response format
    return errorResponse("Internal Server Error", 500);
  }
}
