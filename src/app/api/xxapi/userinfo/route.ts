
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobileNo = searchParams.get('mobileNo');

    if (!mobileNo) return errorResponse("mobileNo param required", 400);

    const db = await getDb();
    const user = await db.collection('users').findOne({ mobileNo });
    const wallet = await db.collection('wallets').findOne({ userId: user?._id.toString() });

    if (!user) return errorResponse("User not found", 404);

    return jsonResponse({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        mobileNo: user.mobileNo,
        wallet: {
          balance: wallet?.balance || 0,
          currency: wallet?.currency || "USD"
        },
        status: "active"
      }
    });
  } catch (e: any) {
    return errorResponse("Failed to fetch user info", 500);
  }
}
