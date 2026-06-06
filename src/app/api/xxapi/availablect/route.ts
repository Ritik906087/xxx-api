
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Proxy for Available Collection Tools
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const response = await fetch(`${OLD_SERVER_BASE}/availablect${url.search}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("AvailableCT Proxy Error", 502);
  }
}
