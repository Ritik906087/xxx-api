import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Proxy function to forward UPI Linking requests to the old server
 */
export async function POST(request: Request) {
  const logContext = `[MONITORFLOW_BASE_POST_${Date.now()}]`;
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/monitorflow/');
    const subPath = pathSegments[1] || ""; 
    
    const body = await getSafeBody(request);
    const token = request.headers.get('INDIATOKEN') || request.headers.get('token') || "";

    console.log(`${logContext} SubPath: ${subPath}`);
    console.log(`${logContext} Token: ${token}`);

    // Forwarding to Old Server
    const response = await fetch(`${OLD_SERVER_BASE}/monitorflow/${subPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'INDIATOKEN': token,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    console.log(`${logContext} Upstream Status: ${response.status}`);
    console.log(`${logContext} Upstream Body:`, text);

    if (!text || !text.trim()) {
      return jsonResponse({ success: false, msg: "Upstream response empty" });
    }

    try {
      const data = JSON.parse(text);
      return jsonResponse(data, response.status);
    } catch (e) {
      return jsonResponse({ success: false, msg: "Upstream invalid JSON", raw: text });
    }
  } catch (error: any) {
    console.error(`${logContext} Critical Error:`, error);
    return errorResponse("MonitorFlow Proxy Error", 502, error.message);
  }
}
