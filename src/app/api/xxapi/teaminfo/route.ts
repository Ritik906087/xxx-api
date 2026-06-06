import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

const OLD_SERVER_BASE = "https://apitez.xyz/xxapi";

export async function GET(request: Request) {
  try {
    const { search } = new URL(request.url);
    const response = await fetch(`${OLD_SERVER_BASE}/teaminfo${search}`, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36' },
    });
    const data = await response.json();
    return jsonResponse(data, response.status);
  } catch (error: any) {
    return errorResponse("Proxy Error", 502);
  }
}

export async function OPTIONS() { return handleOptions(); }
