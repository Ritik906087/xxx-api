
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Stealth Proxy for UPI Linking / MonitorFlow sub-routes
 * Mimics a real browser to bypass 403 Forbidden
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const targetUrl = `${OLD_SERVER_BASE}/monitorflow/${slug}`;

    const headers = new Headers();
    // Essential stealth headers
    headers.set('Content-Type', 'application/json');
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    headers.set('Accept', 'application/json, text/plain, */*');
    headers.set('Accept-Language', 'en-US,en;q=0.9');
    headers.set('Origin', 'https://apitez.xyz');
    headers.set('Referer', 'https://apitez.xyz/');
    headers.set('Sec-Ch-Ua', '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"');
    headers.set('Sec-Ch-Ua-Mobile', '?0');
    headers.set('Sec-Ch-Ua-Platform', '"Windows"');
    headers.set('Sec-Fetch-Dest', 'empty');
    headers.set('Sec-Fetch-Mode', 'cors');
    headers.set('Sec-Fetch-Site', 'same-origin');

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("MonitorFlow Proxy Connection Failed", 502, error.message);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { search } = new URL(request.url);
    const targetUrl = `${OLD_SERVER_BASE}/monitorflow/${slug}${search}`;

    const headers = new Headers();
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    headers.set('Accept', 'application/json, text/plain, */*');
    headers.set('Referer', 'https://apitez.xyz/');

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
      cache: 'no-store'
    });

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("MonitorFlow GET Proxy Failed", 502, error.message);
  }
}
