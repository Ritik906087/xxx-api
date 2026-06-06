
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Proxy for Available Collection Tools
 * Cleaned headers to bypass security blocks
 */
export async function GET(request: Request) {
  try {
    const { search } = new URL(request.url);
    const targetUrl = `${OLD_SERVER_BASE}/availablect${search}`;

    const headers = new Headers();
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    headers.set('Accept', 'application/json, text/plain, */*');
    headers.set('Accept-Language', 'en-US,en;q=0.9');

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
      cache: 'no-store'
    });

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("AvailableCT Proxy Connection Failed", 502, error.message);
  }
}
