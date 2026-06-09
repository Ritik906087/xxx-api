import { jsonResponse, errorResponse } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    const db = await getDb();
    
    const filter = query ? {
      $or: [
        { mobileNo: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ]
    } : {};

    const users = await db.collection('users')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('users').countDocuments(filter);

    return jsonResponse({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e: any) {
    return errorResponse('Users Fetch Failed', 500);
  }
}
