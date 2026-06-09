import { jsonResponse, errorResponse } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    const user = await db.collection('users').findOne({ 
      $or: [
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
        { mobileNo: id }
      ]
    });

    if (!user) return errorResponse('User not found', 404);

    const transactions = await db.collection('orders')
      .find({ mobileNo: user.mobileNo })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return jsonResponse({ user, transactions });
  } catch (e: any) {
    return errorResponse('Fetch failed', 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, amount, status } = body;
    
    const db = await getDb();
    const filter = { $or: [
      { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
      { mobileNo: id }
    ]};

    let update = {};

    if (action === 'balance') {
      const numAmount = parseFloat(amount);
      update = { $inc: { itoken: numAmount } };
      
      // Log balance change
      await db.collection('admin_logs').insertOne({
        action: 'balance_change',
        targetUser: id,
        amount: numAmount,
        timestamp: new Date().toISOString()
      });
    } else if (action === 'status') {
      update = { $set: { status: parseInt(status) } };
    } else if (action === 'edit') {
      update = { $set: { ...body.data } };
    }

    const result = await db.collection('users').updateOne(filter, update);

    if (result.matchedCount === 0) return errorResponse('User not found', 404);

    return jsonResponse({ success: true, msg: 'Update successful' });
  } catch (e: any) {
    return errorResponse('Update failed', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.collection('users').deleteOne({
      $or: [
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
        { mobileNo: id }
      ]
    });

    if (result.deletedCount === 0) return errorResponse('User not found', 404);
    return jsonResponse({ success: true, msg: 'User deleted' });
  } catch (e: any) {
    return errorResponse('Delete failed', 500);
  }
}
