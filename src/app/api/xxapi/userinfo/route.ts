
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * LOCAL: Fetches user info and balance from local MongoDB
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobileNo = searchParams.get('mobileNo');

    if (!mobileNo) return errorResponse("mobileNo param required", 400);

    const db = await getDb();
    const user = await db.collection('users').findOne({ mobileNo });
    
    if (!user) return errorResponse("User not found in local DB", 404);

    // Fetch local wallet balance
    const wallet = await db.collection('wallets').findOne({ userId: user._id.toString() });

    return jsonResponse({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        mobileNo: user.mobileNo,
        role: user.role || "user",
        wallet: {
          balance: wallet?.balance || 0,
          currency: wallet?.currency || "INR"
        },
        status: "active",
        source: "local_database"
      }
    });
  } catch (e: any) {
    return errorResponse("Failed to fetch local user info", 500, e.message);
  }
}
