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
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { search } = new URL(request.url);
    const targetUrl = `${OLD_SERVER_BASE}/buyitoken/${slug}${search}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: STEALTH_HEADERS,
      cache: 'no-store'
    });

    if (!response.ok) {
        const errorData = await response.text();
        try {
            return jsonResponse(JSON.parse(errorData), response.status);
        } catch (e) {
            return errorResponse("Upstream Buy Flow Error", response.status, errorData);
        }
    }

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("Buy Flow Proxy Connection Failed", 502, error.message);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const targetUrl = `${OLD_SERVER_BASE}/buyitoken/${slug}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        ...STEALTH_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!response.ok) {
        const errorData = await response.text();
        try {
            return jsonResponse(JSON.parse(errorData), response.status);
        } catch (e) {
            return errorResponse("Upstream Buy Flow POST Error", response.status, errorData);
        }
    }

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("Buy Flow POST Proxy Failed", 502, error.message);
  }
}
