
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
    const { search } = new URL(request.url);
    const response = await fetch(`${OLD_SERVER_BASE}/availablect${search}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return errorResponse(`Target Server Error: ${response.status}`, response.status, errorText);
    }

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("AvailableCT Proxy Error", 502);
  }
}
