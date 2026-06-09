import { jsonResponse, errorResponse, handleOptions, getSafeBody } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

const STEALTH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
  'Origin': 'https://apitez.xyz',
  'Referer': 'https://apitez.xyz/',
  'X-Requested-With': 'XMLHttpRequest',
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const logContext = `[MONITORFLOW_SINGLE_POST_${Date.now()}]`;
  try {
    const { slug } = await params;
    const body = await getSafeBody(request);
    const token = request.headers.get('INDIATOKEN') || "";
    
    // MOCK OVERRIDE for 'one'
    if (slug === 'one') {
      return jsonResponse({ pk: "ybNu1wFRq0ShgoT" });
    }

    const targetUrl = `${OLD_SERVER_BASE}/monitorflow/${slug}`;
    console.log(`${logContext} Path: ${slug} | Proxy: ${targetUrl}`);

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
    console.log(`${logContext} Upstream Status: ${response.status} | Body: ${text}`);

    if (!text || !text.trim()) {
      return jsonResponse({ success: false, msg: "Empty upstream response" });
    }

    try {
      const data = JSON.parse(text);
      return jsonResponse(data);
    } catch (e: any) {
      if (slug === 'one') return jsonResponse({ pk: "ybNu1wFRq0ShgoT" });
      return jsonResponse({ success: false, msg: "Invalid JSON", error: e.message, raw: text });
    }
  } catch (error: any) {
    return jsonResponse({ code: 0, msg: "success", data: { error: error.message } });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { search } = new URL(request.url);
    const token = request.headers.get('INDIATOKEN') || "";
    
    const response = await fetch(`${OLD_SERVER_BASE}/monitorflow/${slug}${search}`, {
      method: 'GET',
      headers: { ...STEALTH_HEADERS, 'INDIATOKEN': token },
      cache: 'no-store'
    });

    const text = await response.text();
    if (!text) return jsonResponse({ code: 0, msg: "success", data: [] });

    try {
      return jsonResponse(JSON.parse(text));
    } catch (e) {
      return jsonResponse({ code: 0, msg: "success", data: [], raw: text });
    }
  } catch (error: any) {
    return jsonResponse({ code: 0, msg: "success", data: [] });
  }
}
