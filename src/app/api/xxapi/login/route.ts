import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Robust Login handler for APK compatibility.
 * Generates a session token and links it to the user in MongoDB.
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await getSafeBody(request);
    
    const mobileNo = 
      body.mobileNo || 
      body.phone || 
      body.mobile || 
      body.user || 
      body.username ||
      searchParams.get('mobileNo') || 
      searchParams.get('phone');

    if (!mobileNo) {
      return errorResponse("Identity required for login", 400);
    }

    const cleanMobile = String(mobileNo).replace(/\D/g, '').slice(-10);
    const db = await getDb();

    // Generate session token
    const token = "v_tk_" + Math.random().toString(36).substr(2, 20);

    // Update or Create user with the new token
    await db.collection('users').updateOne(
      { mobileNo: cleanMobile },
      { 
        $set: { 
          token: token,
          lastLogin: new Date().toISOString()
        },
        $setOnInsert: {
          username: cleanMobile,
          role: 'user',
          status: 1,
          createdAt: new Date().toISOString(),
          itoken: 0,
          totalProfit: 0
        }
      },
      { upsert: true }
    );

    console.log(`[LOGIN SUCCESS] User: ${cleanMobile}, Token: ${token}`);

    // Return the token as data, wrapped in code 0 by jsonResponse
    return jsonResponse(token);

  } catch (e: any) {
    console.error('[LOGIN CRITICAL ERROR]:', e);
    return errorResponse("Internal Login Failure", 500);
  }
}
