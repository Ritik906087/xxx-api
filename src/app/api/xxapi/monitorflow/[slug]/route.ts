
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Enhanced Proxy for UPI Linking / MonitorFlow sub-routes
 * Properly mimics browser headers to avoid 403/502 errors
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
    headers.set('Content-Type', 'application/json');
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    headers.set('Origin', 'https://apitez.xyz');
    headers.set('Referer', 'https://apitez.xyz/');

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
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
    });

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("MonitorFlow GET Proxy Failed", 502, error.message);
  }
}
