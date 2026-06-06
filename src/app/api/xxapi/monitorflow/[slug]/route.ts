
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Proxy for UPI Linking / MonitorFlow sub-routes
 * Handles 403 errors by mimicking a real browser and forwarding headers
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const forwardHeaders = new Headers();
    request.headers.forEach((value, key) => {
      // Exclude host to let fetch set the correct target host
      if (key.toLowerCase() !== 'host') {
        forwardHeaders.set(key, value);
      }
    });

    // Ensure a realistic User-Agent if not provided
    if (!forwardHeaders.has('user-agent')) {
      forwardHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    const response = await fetch(`${OLD_SERVER_BASE}/monitorflow/${slug}`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("MonitorFlow Proxy Error", 502, error.message);
  }
}
