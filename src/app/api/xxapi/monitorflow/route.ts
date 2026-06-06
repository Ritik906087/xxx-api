
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Proxy function to forward UPI Linking requests to the old server
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/monitorflow/');
    const subPath = pathSegments[1]; // one, two, three, check, etc.
    
    const body = await request.json();

    // Forwarding to Old Server
    const response = await fetch(`${OLD_SERVER_BASE}/monitorflow/${subPath}`, {
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
    return errorResponse("MonitorFlow Proxy Error", 502, error.message);
  }
}
