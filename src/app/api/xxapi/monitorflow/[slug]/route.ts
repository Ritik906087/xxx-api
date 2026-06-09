import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Ultimate Stealth Headers to bypass bot detection on the old server
 */
const STEALTH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
  'Origin': 'https://apitez.xyz',
  'Referer': 'https://apitez.xyz/',
  'Sec-Ch-Ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Connection': 'keep-alive',
  'X-Requested-With': 'XMLHttpRequest',
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const logContext = `[MONITORFLOW_SLUG_POST_${Date.now()}]`;
  try {
    const { slug } = await params;
    const body = await request.json();
    const token = request.headers.get('INDIATOKEN') || "";
    const targetUrl = `${OLD_SERVER_BASE}/monitorflow/${slug}`;

    console.log(`${logContext} Path: ${slug}`);
    console.log(`${logContext} Token: ${token}`);
    console.log(`${logContext} Body:`, body);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        ...STEALTH_HEADERS,
        'Content-Type': 'application/json',
        'INDIATOKEN': token
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const text = await response.text();
    console.log(`${logContext} Upstream Status: ${response.status}`);
    console.log(`${logContext} Upstream Body:`, text);

    if (!text || !text.trim()) {
      return jsonResponse({ success: false, msg: "Empty upstream response" });
    }

    try {
      const data = JSON.parse(text);
      return jsonResponse(data, response.status);
    } catch (e) {
      console.error(`${logContext} JSON Parse Error:`, e);
      return jsonResponse({ success: false, msg: "Invalid JSON from upstream", raw: text });
    }
  } catch (error: any) {
    console.error(`${logContext} Critical Error:`, error);
    return errorResponse("MonitorFlow Proxy Connection Failed", 502, { message: error.message });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const logContext = `[MONITORFLOW_SLUG_GET_${Date.now()}]`;
  try {
    const { slug } = await params;
    const { search } = new URL(request.url);
    const token = request.headers.get('INDIATOKEN') || "";
    const targetUrl = `${OLD_SERVER_BASE}/monitorflow/${slug}${search}`;

    console.log(`${logContext} Path: ${slug}`);
    console.log(`${logContext} Token: ${token}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        ...STEALTH_HEADERS,
        'INDIATOKEN': token
      },
      cache: 'no-store'
    });

    const text = await response.text();
    console.log(`${logContext} Upstream Status: ${response.status}`);

    if (!text || !text.trim()) {
      return jsonResponse({ code: 0, msg: "success", data: [] });
    }

    try {
      const data = JSON.parse(text);
      return jsonResponse(data, response.status);
    } catch (e) {
      return jsonResponse({ code: 0, msg: "success", data: [], raw: text });
    }
  } catch (error: any) {
    return errorResponse("MonitorFlow GET Proxy Failed", 502, { message: error.message });
  }
}
