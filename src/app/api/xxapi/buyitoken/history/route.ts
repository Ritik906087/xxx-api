
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const orders = await db.collection('orders')
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    return jsonResponse({
      success: true,
      count: orders.length,
      history: orders
    });
  } catch (e: any) {
    return errorResponse("Failed to fetch history", 500);
  }
}
