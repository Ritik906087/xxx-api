import { jsonResponse, errorResponse } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

// Full 12 Token Pool as requested
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
  "11e16fb100e2411aacd3146c118eb7df",
  "b7adb3c145f04b2eb630cc3e3424c667",
  "acebce0aa2f64ddd945b5bcb6bc9c089"
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkToken = searchParams.get('checkToken');

    // Live Individual Token Validation Mode
    if (checkToken) {
      try {
        // Test with a lightweight request to verify status
        const testUrl = `https://dtpay.app/runner-api/runner/api/v1/upi/list?account=9955557336&ctType=1`;
        const testRes = await fetch(testUrl, {
          method: 'GET',
          headers: {
            "Accept": "application/json, text/plain, */*",
            "X-Runner-Token": checkToken,
            "X-App-Version": "1.1.17",
            "X-App-Version-Code": "21",
            "X-App-Platform": "android"
          }
        });

        const data = await testRes.json().catch(() => null);
        
        // Logical check for 200 OK vs 404/Error
        const isHealthy = data && (data.code === 0 || data.ok === true) && testRes.status === 200;
        
        return jsonResponse({ 
          status: isHealthy ? "200 OK" : "404 Error", 
          token: checkToken 
        });
      } catch (e) {
        return jsonResponse({ status: "404 Error", token: checkToken });
      }
    }

    // Default Token Pool Status Summary Mode
    const db = await getDb();
    const healthData = [];

    for (const token of DT_TOKEN_POOL) {
      const usageCount = await db.collection('dt_token_mappings').countDocuments({ token });
      
      let engineLabel = "DTPay Pool";
      if (token === "b7adb3c145f04b2eb630cc3e3424c667") engineLabel = "Special (9955557336)";
      if (token === "acebce0aa2f64ddd945b5bcb6bc9c089") engineLabel = "Legacy Static";

      healthData.push({
        id: token,
        shortId: token.substring(0, 8) + '...',
        usage: usageCount,
        status: 'Unchecked',
        engine: engineLabel
      });
    }

    return jsonResponse({
      tokens: healthData,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return errorResponse('Health Registry Fault', 500);
  }
}
