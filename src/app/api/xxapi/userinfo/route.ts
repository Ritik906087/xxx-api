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
    
    // 1. Get token from all possible sources (Headers or Query Params)
    let indiaToken = request.headers.get('INDIATOKEN') || 
                     request.headers.get('token') || 
                     searchParams.get('token') ||
                     searchParams.get('INDIATOKEN');

    // Clean token (remove quotes or whitespace that APK might send)
    if (indiaToken) {
      indiaToken = indiaToken.replace(/['"]+/g, '').trim();
    }

    let user = null;

    // 2. Primary Identity Check: Search by Session Token
    if (indiaToken && indiaToken !== 'null' && indiaToken !== 'undefined') {
      console.log(`[USERINFO] Searching by Token: ${indiaToken}`);
      user = await db.collection('users').findOne({ token: indiaToken });
    }

    // 3. Secondary Identity Check: Fallback to Mobile Identity
    if (!user) {
      const mobileNo = searchParams.get('mobileNo') || 
                       searchParams.get('mobile') || 
                       request.headers.get('phone') || 
                       request.headers.get('INDIAMOBILE');
      
      if (mobileNo) {
        const cleanMobile = String(mobileNo).replace(/\D/g, '').slice(-10);
        console.log(`[USERINFO] Fallback lookup for Mobile: ${cleanMobile}`);
        user = await db.collection('users').findOne({ mobileNo: cleanMobile });
      }
    }

    // 4. If identity still missing, return structured error for APK
    if (!user) {
      console.warn('[USERINFO] Missing Identity: Identity link failed.');
      return jsonResponse({ 
        status: 0, 
        msg: "Missing Identity",
        hint: "Please re-login to establish identity" 
      }, 200);
    }

    // 5. Return complete profile including userId and balance
    const responseData = {
      userId: user._id.toString(),
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
    console.error('[USERINFO CRITICAL ERROR]:', e);
    return jsonResponse({ status: 0, msg: "Internal Server Error" });
  }
}
