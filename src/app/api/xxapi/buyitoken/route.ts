
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Proxy for Payment/Buy Flow Detection
 * Redirects all /buyitoken/* calls to the old server
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const subPath = url.pathname.split('/buyitoken/')[1];
    const searchParams = url.search;

    const response = await fetch(`${OLD_SERVER_BASE}/buyitoken/${subPath}${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("Buy Flow Proxy Error", 502, error.message);
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const subPath = url.pathname.split('/buyitoken/')[1];
    const body = await request.json();

    const response = await fetch(`${OLD_SERVER_BASE}/buyitoken/${subPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("Buy Flow Post Proxy Error", 502, error.message);
  }
}
