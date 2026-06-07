import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Exact response for buyitoken/waitconfirm
 */
export async function GET() {
  return jsonResponse({
    waitconfirm: [],
    sysOpenPay: "1"
  });
}
