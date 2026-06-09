import { jsonResponse, handleOptions } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Robust User Info handler for APK compatibility.
 * Fetches real-time data from MongoDB Atlas.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Capture mobile number from search params or headers
    const mobileNo = searchParams.get('mobileNo') || 
                     searchParams.get('mobile') || 
                     request.headers.get('phone') || 
                     request.headers.get('INDIAMOBILE');

    if (!mobileNo) {
      return jsonResponse({ status: 0, msg: "Missing Identity" }, 400);
    }

    // Clean number to match DB format (last 10 digits)
    const cleanMobile = String(mobileNo).replace(/\D/g, '').slice(-10);
    
    const db = await getDb();
    const user = await db.collection('users').findOne({ mobileNo: cleanMobile });

    if (!user) {
      // Return a basic structure even if user not fully registered to prevent app crash
      return jsonResponse({
        username: cleanMobile,
        mobile: cleanMobile,
        status: 1,
        itoken: 0,
        totalProfit: 0,
        level: 1
      });
    }

    // Return the exact nested data structure from legacy logs but with REAL DB values
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
    return jsonResponse({ status: 0, msg: "Internal Error" });
  }
}
