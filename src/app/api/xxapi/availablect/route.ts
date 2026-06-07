import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Mocked locally to prevent 403 Forbidden from old server.
 */
export async function GET() {
  const mockData = [
    { id: 16, name: "USDT-TRC20", type: 16, status: 1 },
    { id: 1, name: "UPI-FAST", type: 1, status: 1 }
  ];
  return jsonResponse(mockData);
}
