
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST() {
  // Generates a temporary token for SMS requests
  const token = "vantage_tk_" + Math.random().toString(36).substr(2, 16);
  return jsonResponse({
    success: true,
    token: token,
    expires_in: 300
  });
}
