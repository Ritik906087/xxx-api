import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

/**
 * Stealth Headers for KYC proxy to bypass bot detection on the old server.
 */
const STEALTH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
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

export async function GET(request: Request) {
  try {
    const { search } = new URL(request.url);
    const targetUrl = `${OLD_SERVER_BASE}/linkKyc${search}`;

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
            return errorResponse("Upstream KYC Error", response.status, { raw: errorData });
        }
    }

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("KYC Proxy Connection Failed", 502, { message: error.message });
  }
}

export async function OPTIONS() {
  return handleOptions();
}
