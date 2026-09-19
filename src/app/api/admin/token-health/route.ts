
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

const DT_TOKEN_POOL = [
  "92577e85d3e64dae94939ea23e229fa0",
  "8c04304e5bcc498dbf1a24e71542ac7f",
  "8c6f643e9804479db035b14b9c978dad",
  "1fd198a728534bec88af2bfe8a5238a7",
  "06c121d451774f489dc3d6e709feeb38",
  "c77dd20bf8f74e77b0d1f26111f19105",
  "282ed000eaee4a0bbb36aad00a406126",
  "3a03a6378fba45219e240ecc0b05b1ad",
  "5de8234504e643cdba794b17017e363a",
  "11e16fb100e2411aacd3146c118eb7df"
];

export async function GET() {
  try {
    const db = await getDb();
    const healthData = [];

    for (const token of DT_TOKEN_POOL) {
      const usageCount = await db.collection('dt_token_mappings').countDocuments({ token });
      const lastSession = await db.collection('automation_sessions').findOne({ token }, { sort: { createdAt: -1 } });
      
      healthData.push({
        id: token.substring(0, 8) + '...',
        usage: usageCount,
        lastUsed: lastSession?.createdAt || 'Never',
        status: 'Healthy', // In a real scenario, this would check against recent 403s
        engine: 'DTPay'
      });
    }

    return jsonResponse({
      tokens: healthData,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return errorResponse('Health Fetch Failed', 500);
  }
}
