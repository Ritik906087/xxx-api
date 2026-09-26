import { jsonResponse, errorResponse } from '@/lib/api-response';

const DT_TOKEN_POOL = [
  "0ca74cf0bdb047bd9b1c7308dda13462", // Updated Active Primary Token
  "b3c8acfef00440e78a5dca12844fa0ba",
  "648ade53f9ff434e9c264f8a050440aa",
  "5ca04d9e066a4dc1a1ac31d7bb087f1d",
  "e742d569dd214f59afd9998fc7e4ee8b",
  "2aeb9075afac4746a5ae1f8c27b36dbc",
  "4b1ff16ad2db4a3fb98747c1e3d82fea",
  "2f6c1e99f15a4d95aec594b042528f5e",
  "eca3ff6cfa134e72b172eb8e2f4dee65",
  "2ff3d739fd8f4e5d809d06cb4de22474",
  "1e467fbaba784d6ba0f30a1b043d400f",
  "e6de0d33814f4349b62ef25d100af9ea", // Updated Special Token
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
      let label = `Active Node ${index + 1}`;
      if (token === "e6de0d33814f4349b62ef25d100af9ea") label = "Special (9955557336)";
      if (token === "acebce0aa2f64ddd945b5bcb6bc9c089") label = "Legacy Node";
      if (token === "0ca74cf0bdb047bd9b1c7308dda13462") label = "Primary Node";

      return {
        id: token,
        shortId: token.substring(0, 8) + '...',
        status: 'Unchecked',
        engine: label,
        usage: Math.floor(Math.random() * 30)
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
