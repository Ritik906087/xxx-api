
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Proxy for Collection Tooling
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${OLD_SERVER_BASE}/collectiontool`, {
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
    return errorResponse("Collection Tool Proxy Error", 502);
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const endpoint = url.pathname.split('/').pop(); // collectiontoollist, availablect
    
    const response = await fetch(`${OLD_SERVER_BASE}/${endpoint}${url.search}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("Collection List Proxy Error", 502);
  }
}
