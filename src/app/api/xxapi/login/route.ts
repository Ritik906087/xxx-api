import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Robust Login handler for APK compatibility.
 * Behaves like the old server by automatically resolving identity if missing.
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await getSafeBody(request);
    
    // 1. Try to get mobile number from body or query params
    let mobileNo = 
      body.mobileNo || 
      body.phone || 
      body.mobile || 
      body.user || 
      body.username ||
      searchParams.get('mobileNo') || 
      searchParams.get('phone');

    const db = await getDb();

    // 2. LEGACY RESOLUTION: If identity is missing from payload, check INDIATOKEN header
    if (!mobileNo) {
      const headerToken = request.headers.get('INDIATOKEN') || request.headers.get('token');
      if (headerToken) {
        const cleanToken = headerToken.replace(/['"]+/g, '').trim();
        const userByToken = await db.collection('users').findOne({ token: cleanToken });
        if (userByToken) {
          mobileNo = userByToken.mobileNo;
          console.log(`[LOGIN] Identity resolved via Token: ${mobileNo}`);
        }
      }
    }

    if (!mobileNo) {
      // Return 200 with code 400 to match old server "Stealth" behavior
      return jsonResponse({
        code: 400,
        msg: "Identity required for login"
      });
    }

    const cleanMobile = String(mobileNo).replace(/\D/g, '').slice(-10);
    
    // 3. Generate session token (maintain existing token if possible or create new)
    const token = "v_tk_" + Math.random().toString(36).substr(2, 20);

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

    // Return the token exactly how the old server did
    return jsonResponse(token);

  } catch (e: any) {
    console.error('[LOGIN CRITICAL ERROR]:', e);
    return jsonResponse({ code: 500, msg: "Internal Login Failure" });
  }
}
