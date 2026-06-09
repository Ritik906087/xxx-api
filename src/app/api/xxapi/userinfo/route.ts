import { jsonResponse, handleOptions } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Robust User Info handler for APK compatibility.
 * Resolves identity using INDIATOKEN or mobile identity.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const db = await getDb();
    
    // 1. Try to identify by INDIATOKEN header (Primary)
    const indiaToken = request.headers.get('INDIATOKEN');
    let user = null;

    if (indiaToken) {
      console.log(`[USERINFO] Searching by INDIATOKEN: ${indiaToken}`);
      user = await db.collection('users').findOne({ token: indiaToken });
    }

    // 2. Fallback to mobile identity parameters
    if (!user) {
      const mobileNo = searchParams.get('mobileNo') || 
                       searchParams.get('mobile') || 
                       request.headers.get('phone') || 
                       request.headers.get('INDIAMOBILE');
      
      if (mobileNo) {
        const cleanMobile = String(mobileNo).replace(/\D/g, '').slice(-10);
        console.log(`[USERINFO] Fallback: Searching by Mobile: ${cleanMobile}`);
        user = await db.collection('users').findOne({ mobileNo: cleanMobile });
      }
    }

    if (!user) {
      console.warn('[USERINFO] Missing Identity: No user found for token or mobile');
      return jsonResponse({ 
        status: 0, 
        msg: "Missing Identity",
        hint: "Please re-login to establish session token" 
      }, 200); // Return 200 with error structure to prevent APK crash
    }

    // 3. Return exact nested structure with real MongoDB values
    const responseData = {
      username: user.username || user.mobileNo,
      userType: user.role === 'admin' ? 1 : 3,
      realName: user.fullName || user.mobileNo,
      gender: 2,
      mobile: user.mobileNo,
      status: user.status ?? 1,
      crtDate: user.createdAt ? new Date(user.createdAt).getTime() / 1000 : 0,
      level: user.level || 1,
      itoken: user.itoken || 0,
      frozenItoken: user.frozenItoken || 0,
      totalProfit: user.totalProfit || 0,
      todayProfit: 0,
      inviteCode: user.inviteCode || "VANTAGE",
      safety_code: "1",
      chargeFlag: 1,
      chargeAmt: "500,1000,2000,5000,10000",
      activityOpens: {
        today_buy_inr_reward: "1",
        newbie_reward: "1"
      }
    };

    return jsonResponse(responseData);
  } catch (e: any) {
    console.error('[USERINFO ERROR]:', e);
    return jsonResponse({ status: 0, msg: "Internal Server Error" });
  }
}
