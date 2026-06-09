import { jsonResponse, errorResponse } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb();
    
    const totalUsers = await db.collection('users').countDocuments();
    const activeUsers = await db.collection('users').countDocuments({ status: 1 });
    
    // Aggregate total balance
    const balanceStats = await db.collection('users').aggregate([
      { $group: { _id: null, totalBalance: { $sum: "$itoken" } } }
    ]).toArray();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const newUsersToday = await db.collection('users').countDocuments({
      createdAt: { $gte: todayStart.toISOString() }
    });

    const recentUsers = await db.collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return jsonResponse({
      stats: {
        totalUsers,
        activeUsers,
        totalBalance: balanceStats[0]?.totalBalance || 0,
        newUsersToday
      },
      recentUsers
    });
  } catch (e: any) {
    return errorResponse('Dashboard Fetch Failed', 500);
  }
}
