import { jsonResponse, errorResponse } from '@/lib/api-response';

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
  "b7adb3c145f04b2eb630cc3e3424c667", // Special Token for 9955557336
  "acebce0aa2f64ddd945b5bcb6bc9c089"  // Legacy Static Token
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkToken = searchParams.get('checkToken');

    if (checkToken) {
      try {
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
        const isHealthy = data && (data.code === 0 || data.ok === true) && testRes.status === 200;
        
        return jsonResponse({ 
          status: isHealthy ? "200 OK" : "404 Error", 
          token: checkToken 
        });
      } catch (e) {
        return jsonResponse({ status: "404 Error", token: checkToken });
      }
    }

    const healthData = DT_TOKEN_POOL.map((token, index) => {
      let label = `Pool Token ${index + 1}`;
      if (token === "b7adb3c145f04b2eb630cc3e3424c667") label = "Special (9955557336)";
      if (token === "acebce0aa2f64ddd945b5bcb6bc9c089") label = "Legacy Static";

      return {
        id: token,
        shortId: token.substring(0, 8) + '...',
        status: 'Unchecked',
        engine: label,
        usage: Math.floor(Math.random() * 50) // Mock usage for UI
      };
    });

    return jsonResponse({
      tokens: healthData,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return errorResponse('Health Fault', 500);
  }
}
