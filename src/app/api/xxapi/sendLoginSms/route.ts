import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

const STEALTH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://apitez.xyz',
  'Referer': 'https://apitez.xyz/',
  'X-Requested-With': 'XMLHttpRequest',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${OLD_SERVER_BASE}/sendLoginSms`, {
      method: 'POST',
      headers: { ...STEALTH_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("Proxy Error", 502);
  }
}

export async function OPTIONS() { return handleOptions(); }
